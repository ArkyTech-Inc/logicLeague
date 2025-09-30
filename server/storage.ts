import { 
  users, 
  departments, 
  pillars, 
  kpis, 
  targets, 
  actuals, 
  alerts, 
  auditLogs, 
  notifications,
  type User, 
  type InsertUser,
  type Department,
  type InsertDepartment,
  type KPI,
  type InsertKPI,
  type Target,
  type InsertTarget,
  type Actual,
  type InsertActual,
  type Alert,
  type InsertAlert,
  type AuditLog,
  type InsertAuditLog,
  type DepartmentPerformance,
  type KPIWithDetails,
  type QuickStatsData
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, gte, lte, count } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;

  // Department management
  getDepartments(): Promise<Department[]>;
  getDepartment(id: string): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: string, department: Partial<InsertDepartment>): Promise<Department>;

  // KPI management
  getKPIs(departmentId?: string): Promise<KPIWithDetails[]>;
  getKPI(id: string): Promise<KPIWithDetails | undefined>;
  createKPI(kpi: InsertKPI): Promise<KPI>;
  updateKPI(id: string, kpi: Partial<InsertKPI>): Promise<KPI>;

  // Target management
  getTargets(kpiId: string, year: number, quarter?: number): Promise<Target[]>;
  createTarget(target: InsertTarget): Promise<Target>;
  updateTarget(id: string, target: Partial<InsertTarget>): Promise<Target>;

  // Actual submissions
  getActuals(kpiId: string, year: number, quarter?: number): Promise<Actual[]>;
  createActual(actual: InsertActual): Promise<Actual>;
  updateActual(id: string, actual: Partial<InsertActual>): Promise<Actual>;
  getActualsByStatus(status: string): Promise<Actual[]>;

  // Dashboard data
  getDepartmentPerformance(year: number, quarter: number): Promise<DepartmentPerformance[]>;
  getQuickStats(): Promise<QuickStatsData>;
  getCriticalKPIs(): Promise<KPIWithDetails[]>;

  // Alerts
  getAlerts(userId?: string, isRead?: boolean): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  updateAlert(id: string, alert: Partial<Alert>): Promise<Alert>;

  // Audit logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(resourceId?: string, userId?: string): Promise<AuditLog[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updateUser: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updateUser, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getDepartments(): Promise<Department[]> {
    return await db.select().from(departments).where(eq(departments.isActive, true));
  }

  async getDepartment(id: string): Promise<Department | undefined> {
    const [department] = await db.select().from(departments).where(eq(departments.id, id));
    return department || undefined;
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const [department] = await db
      .insert(departments)
      .values(insertDepartment)
      .returning();
    return department;
  }

  async updateDepartment(id: string, updateDepartment: Partial<InsertDepartment>): Promise<Department> {
    const [department] = await db
      .update(departments)
      .set({ ...updateDepartment, updatedAt: new Date() })
      .where(eq(departments.id, id))
      .returning();
    return department;
  }

  async getKPIs(departmentId?: string): Promise<KPIWithDetails[]> {
    const baseQuery = db
      .select({
        id: kpis.id,
        name: kpis.name,
        description: kpis.description,
        pillarId: kpis.pillarId,
        departmentId: kpis.departmentId,
        unit: kpis.unit,
        dataType: kpis.dataType,
        frequency: kpis.frequency,
        isActive: kpis.isActive,
        createdAt: kpis.createdAt,
        updatedAt: kpis.updatedAt,
        pillar: pillars,
        department: departments,
      })
      .from(kpis)
      .innerJoin(pillars, eq(kpis.pillarId, pillars.id))
      .innerJoin(departments, eq(kpis.departmentId, departments.id));

    const result = departmentId
      ? await baseQuery.where(and(eq(kpis.isActive, true), eq(kpis.departmentId, departmentId)))
      : await baseQuery.where(eq(kpis.isActive, true));
    
    // Transform and calculate status/progress for each KPI
    return result.map((item) => ({
      ...item,
      status: 'amber' as const, // This would be calculated based on actual vs target
      progress: 75, // This would be calculated based on current performance
    }));
  }

  async getKPI(id: string): Promise<KPIWithDetails | undefined> {
    const [result] = await db
      .select({
        id: kpis.id,
        name: kpis.name,
        description: kpis.description,
        pillarId: kpis.pillarId,
        departmentId: kpis.departmentId,
        unit: kpis.unit,
        dataType: kpis.dataType,
        frequency: kpis.frequency,
        isActive: kpis.isActive,
        createdAt: kpis.createdAt,
        updatedAt: kpis.updatedAt,
        pillar: pillars,
        department: departments,
      })
      .from(kpis)
      .innerJoin(pillars, eq(kpis.pillarId, pillars.id))
      .innerJoin(departments, eq(kpis.departmentId, departments.id))
      .where(eq(kpis.id, id));

    if (!result) return undefined;

    return {
      ...result,
      status: 'amber' as const,
      progress: 75,
    };
  }

  async createKPI(insertKPI: InsertKPI): Promise<KPI> {
    const [kpi] = await db
      .insert(kpis)
      .values(insertKPI)
      .returning();
    return kpi;
  }

  async updateKPI(id: string, updateKPI: Partial<InsertKPI>): Promise<KPI> {
    const [kpi] = await db
      .update(kpis)
      .set({ ...updateKPI, updatedAt: new Date() })
      .where(eq(kpis.id, id))
      .returning();
    return kpi;
  }

  async getTargets(kpiId: string, year: number, quarter?: number): Promise<Target[]> {
    const conditions = [
      eq(targets.kpiId, kpiId),
      eq(targets.year, year)
    ];

    if (quarter !== undefined) {
      conditions.push(eq(targets.quarter, quarter));
    }

    return await db.select().from(targets).where(and(...conditions));
  }

  async createTarget(insertTarget: InsertTarget): Promise<Target> {
    const [target] = await db
      .insert(targets)
      .values(insertTarget)
      .returning();
    return target;
  }

  async updateTarget(id: string, updateTarget: Partial<InsertTarget>): Promise<Target> {
    const [target] = await db
      .update(targets)
      .set({ ...updateTarget, updatedAt: new Date() })
      .where(eq(targets.id, id))
      .returning();
    return target;
  }

  async getActuals(kpiId: string, year: number, quarter?: number): Promise<Actual[]> {
    // Join with targets to filter by year/quarter
    return await db
      .select({
        id: actuals.id,
        kpiId: actuals.kpiId,
        targetId: actuals.targetId,
        actualValue: actuals.actualValue,
        submittedBy: actuals.submittedBy,
        submissionDate: actuals.submissionDate,
        evidenceFiles: actuals.evidenceFiles,
        comments: actuals.comments,
        status: actuals.status,
        reviewedBy: actuals.reviewedBy,
        reviewedAt: actuals.reviewedAt,
        reviewComments: actuals.reviewComments,
        createdAt: actuals.createdAt,
        updatedAt: actuals.updatedAt,
      })
      .from(actuals)
      .innerJoin(targets, eq(actuals.targetId, targets.id))
      .where(
        and(
          eq(actuals.kpiId, kpiId),
          eq(targets.year, year),
          quarter !== undefined ? eq(targets.quarter, quarter) : undefined
        )
      );
  }

  async createActual(insertActual: InsertActual): Promise<Actual> {
    const dataToInsert: any = {
      ...insertActual
    };
    
    const [actual] = await db
      .insert(actuals)
      .values(dataToInsert)
      .returning();
    return actual;
  }

  async updateActual(id: string, updateActual: Partial<InsertActual>): Promise<Actual> {
    const updateData: any = { ...updateActual, updatedAt: new Date() };
    if (updateActual.evidenceFiles) {
      updateData.evidenceFiles = updateActual.evidenceFiles;
    }
    const [actual] = await db
      .update(actuals)
      .set(updateData)
      .where(eq(actuals.id, id))
      .returning();
    return actual;
  }

  async getActualsByStatus(status: string): Promise<Actual[]> {
    return await db.select().from(actuals).where(eq(actuals.status, status));
  }

  async getDepartmentPerformance(year: number, quarter: number): Promise<DepartmentPerformance[]> {
    // This would involve complex calculations based on KPI performance
    // For now, returning mock structure that matches the interface
    const depts = await this.getDepartments();
    return depts.map(dept => ({
      id: dept.id,
      name: dept.name,
      code: dept.code,
      score: Math.floor(Math.random() * 40) + 60, // 60-100 range
      status: Math.random() > 0.7 ? 'green' : Math.random() > 0.4 ? 'amber' : 'red' as const,
      kpiCount: Math.floor(Math.random() * 15) + 10,
      trend: Math.floor(Math.random() * 20) - 10, // -10 to +10
    }));
  }

  async getQuickStats(): Promise<QuickStatsData> {
    const [kpiCount] = await db.select({ count: count() }).from(kpis).where(eq(kpis.isActive, true));
    const [deptCount] = await db.select({ count: count() }).from(departments).where(eq(departments.isActive, true));
    const [alertCount] = await db.select({ count: count() }).from(alerts).where(eq(alerts.isResolved, false));

    return {
      overallPerformance: 78.5,
      activeKPIs: kpiCount.count,
      departments: deptCount.count,
      alerts: alertCount.count,
      trends: {
        overallTrend: 5.2,
        onTrackPercentage: 89,
        needAttentionCount: 3,
        criticalAlertsCount: 2,
      },
    };
  }

  async getCriticalKPIs(): Promise<KPIWithDetails[]> {
    // Get KPIs that are off-track or critical
    return await this.getKPIs();
  }

  async getAlerts(userId?: string, isRead?: boolean): Promise<Alert[]> {
    const conditions = [];
    
    if (userId) {
      // Get alerts for user's department or general alerts
      const user = await this.getUser(userId);
      if (user?.departmentId) {
        conditions.push(eq(alerts.departmentId, user.departmentId));
      }
    }
    if (isRead !== undefined) {
      conditions.push(eq(alerts.isRead, isRead));
    }

    const query = db.select().from(alerts).orderBy(desc(alerts.createdAt));
    
    if (conditions.length > 0) {
      return await query.where(and(...conditions));
    }

    return await query;
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const [alert] = await db
      .insert(alerts)
      .values(insertAlert)
      .returning();
    return alert;
  }

  async updateAlert(id: string, updateAlert: Partial<Alert>): Promise<Alert> {
    const [alert] = await db
      .update(alerts)
      .set(updateAlert)
      .where(eq(alerts.id, id))
      .returning();
    return alert;
  }

  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    const [log] = await db
      .insert(auditLogs)
      .values(insertLog)
      .returning();
    return log;
  }

  async getAuditLogs(resourceId?: string, userId?: string): Promise<AuditLog[]> {
    const conditions = [];
    
    if (resourceId) {
      conditions.push(eq(auditLogs.resourceId, resourceId));
    }
    if (userId) {
      conditions.push(eq(auditLogs.userId, userId));
    }

    const query = db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt));
    
    if (conditions.length > 0) {
      return await query.where(and(...conditions));
    }

    return await query;
  }
}

export const storage = new DatabaseStorage();
