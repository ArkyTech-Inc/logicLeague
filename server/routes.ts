import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authMiddleware, requireRole } from "./middleware/auth";
import { insertUserSchema, insertKpiSchema, insertTargetSchema, insertActualSchema } from "@shared/schema";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { emailService } from "./services/emailService";
import { analyticsService } from "./services/analyticsService";

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'uploads');
      try {
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
      } catch (error: any) {
        cb(error, uploadDir);
      }
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null as any, true);
    } else {
      cb(new Error('Invalid file type') as any);
    }
  }
});

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      username: string;
      email: string;
      role: string;
      departmentId?: string;
    };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const JWT_SECRET = process.env.SESSION_SECRET || 'nitda-srap-secret-key';

  // Auth routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username, 
          email: user.email,
          role: user.role,
          departmentId: user.departmentId 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Log the login
      await storage.createAuditLog({
        userId: user.id,
        action: 'login',
        resourceType: 'user',
        resourceId: user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || '',
      });

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          departmentId: user.departmentId,
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/register", requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);

      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });

      // Log the user creation
      await storage.createAuditLog({
        userId: req.user!.id,
        action: 'create',
        resourceType: 'user',
        resourceId: user.id,
        newValues: { username: user.username, email: user.email, role: user.role },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || '',
      });

      res.status(201).json({
        message: "User created successfully",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          departmentId: user.departmentId,
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.get("/api/auth/me", authMiddleware, async (req: Request, res: Response) => {
    res.json({ user: req.user });
  });

  // Dashboard routes
  app.get("/api/dashboard/stats", authMiddleware, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getQuickStats();
      res.json(stats);
    } catch (error) {
      console.error('Stats error:', error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/departments/:year/:quarter", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { year, quarter } = req.params;
      const performance = await storage.getDepartmentPerformance(parseInt(year), parseInt(quarter));
      res.json(performance);
    } catch (error) {
      console.error('Department performance error:', error);
      res.status(500).json({ message: "Failed to fetch department performance" });
    }
  });

  app.get("/api/dashboard/critical-kpis", authMiddleware, async (req: Request, res: Response) => {
    try {
      const criticalKPIs = await storage.getCriticalKPIs();
      res.json(criticalKPIs);
    } catch (error) {
      console.error('Critical KPIs error:', error);
      res.status(500).json({ message: "Failed to fetch critical KPIs" });
    }
  });

  // Department routes
  app.get("/api/departments", authMiddleware, async (req: Request, res: Response) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error) {
      console.error('Departments error:', error);
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });

  // KPI routes
  app.get("/api/kpis", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { departmentId } = req.query;
      const kpis = await storage.getKPIs(departmentId as string);
      res.json(kpis);
    } catch (error) {
      console.error('KPIs error:', error);
      res.status(500).json({ message: "Failed to fetch KPIs" });
    }
  });

  app.post("/api/kpis", authMiddleware, requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const validatedData = insertKpiSchema.parse(req.body);
      const kpi = await storage.createKPI(validatedData);

      await storage.createAuditLog({
        userId: req.user!.id,
        action: 'create',
        resourceType: 'kpi',
        resourceId: kpi.id,
        newValues: validatedData,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || '',
      });

      res.status(201).json(kpi);
    } catch (error) {
      console.error('Create KPI error:', error);
      res.status(400).json({ message: "Invalid KPI data" });
    }
  });

  // Target routes
  app.post("/api/targets", authMiddleware, requireRole(['admin', 'department_owner']), async (req: Request, res: Response) => {
    try {
      const validatedData = insertTargetSchema.parse(req.body);
      const target = await storage.createTarget(validatedData);

      await storage.createAuditLog({
        userId: req.user!.id,
        action: 'create',
        resourceType: 'target',
        resourceId: target.id,
        newValues: validatedData,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || '',
      });

      res.status(201).json(target);
    } catch (error) {
      console.error('Create target error:', error);
      res.status(400).json({ message: "Invalid target data" });
    }
  });

  // Actual submission routes
  app.post("/api/actuals", authMiddleware, upload.array('evidenceFiles', 5), async (req: Request, res: Response) => {
    try {
      const actualData = {
        ...req.body,
        submittedBy: req.user!.id,
        evidenceFiles: req.files ? (req.files as Express.Multer.File[]).map(file => file.filename) : [],
      };

      const validatedData = insertActualSchema.parse(actualData);
      const actual = await storage.createActual(validatedData);

      // Check if this submission triggers any alerts
      await analyticsService.checkThresholds(actual.kpiId, parseFloat(actual.actualValue));

      await storage.createAuditLog({
        userId: req.user!.id,
        action: 'submit',
        resourceType: 'actual',
        resourceId: actual.id,
        newValues: validatedData,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || '',
      });

      res.status(201).json(actual);
    } catch (error) {
      console.error('Submit actual error:', error);
      res.status(400).json({ message: "Invalid submission data" });
    }
  });

  app.get("/api/actuals/:kpiId/:year/:quarter?", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { kpiId, year, quarter } = req.params;
      const actuals = await storage.getActuals(kpiId, parseInt(year), quarter ? parseInt(quarter) : undefined);
      res.json(actuals);
    } catch (error) {
      console.error('Get actuals error:', error);
      res.status(500).json({ message: "Failed to fetch actuals" });
    }
  });

  app.patch("/api/actuals/:id/review", authMiddleware, requireRole(['admin', 'department_owner']), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, reviewComments } = req.body;

      const actual = await storage.updateActual(id, {
        status,
        reviewComments,
        reviewedBy: req.user!.id,
        reviewedAt: new Date(),
      });

      await storage.createAuditLog({
        userId: req.user!.id,
        action: 'review',
        resourceType: 'actual',
        resourceId: id,
        newValues: { status, reviewComments },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || '',
      });

      res.json(actual);
    } catch (error) {
      console.error('Review actual error:', error);
      res.status(500).json({ message: "Failed to review submission" });
    }
  });

  // Alert routes
  app.get("/api/alerts", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { isRead } = req.query;
      const alerts = await storage.getAlerts(
        req.user!.id, 
        isRead !== undefined ? isRead === 'true' : undefined
      );
      res.json(alerts);
    } catch (error) {
      console.error('Alerts error:', error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  app.patch("/api/alerts/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { isRead, isResolved } = req.body;

      const updates: any = {};
      if (isRead !== undefined) updates.isRead = isRead;
      if (isResolved !== undefined) {
        updates.isResolved = isResolved;
        updates.resolvedBy = req.user!.id;
        updates.resolvedAt = new Date();
      }

      const alert = await storage.updateAlert(id, updates);
      res.json(alert);
    } catch (error) {
      console.error('Update alert error:', error);
      res.status(500).json({ message: "Failed to update alert" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/forecast/:kpiId", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { kpiId } = req.params;
      const forecast = await analyticsService.generateForecast(kpiId);
      res.json(forecast);
    } catch (error) {
      console.error('Forecast error:', error);
      res.status(500).json({ message: "Failed to generate forecast" });
    }
  });

  app.post("/api/analytics/scenario", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { kpiId, scenarioData } = req.body;
      const results = await analyticsService.runScenarioTest(kpiId, scenarioData);
      res.json(results);
    } catch (error) {
      console.error('Scenario test error:', error);
      res.status(500).json({ message: "Failed to run scenario test" });
    }
  });

  // Audit log routes
  app.get("/api/audit-logs", authMiddleware, requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const { resourceId, userId } = req.query;
      const logs = await storage.getAuditLogs(resourceId as string, userId as string);
      res.json(logs);
    } catch (error) {
      console.error('Audit logs error:', error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // File download route
  app.get("/api/files/:filename", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { filename } = req.params;
      const filePath = path.join(process.cwd(), 'uploads', filename);
      
      try {
        await fs.access(filePath);
        res.download(filePath);
      } catch {
        res.status(404).json({ message: "File not found" });
      }
    } catch (error) {
      console.error('File download error:', error);
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
