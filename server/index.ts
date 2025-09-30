import 'dotenv/config';
import http from "http";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// add: disable auth shortcut for local dev
if (process.env.DISABLE_AUTH === 'true') {
  app.use((req: any, _res, next) => {
    console.log('[DEV AUTH] injecting dummy user for', req.method, req.path);
    req.user = { id: 'dev-user', email: 'dev@local', roles: ['admin'] };
    next();
  });
}

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // create the HTTP server but do NOT call listen yet
  const server = http.createServer(app);

  const PORT = Number(process.env.PORT) || 5000;
  const HOST = process.env.HOST || undefined; // leave undefined to let Node pick

  server.on('listening', () => {
    const addr = server.address();
    console.log('Server listening ->', addr);
  });

  server.on('error', (err: any) => {
    console.error('Server failed to start. details:', {
      code: err?.code,
      errno: err?.errno,
      syscall: err?.syscall,
      address: err?.address,
      port: err?.port,
      stack: err?.stack,
    });
    process.exit(1);
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  const host = "127.0.0.1";

  if (process.platform === 'win32') {
    // reusePort is not supported on Windows -> avoid ENOTSUP
    server.listen(port, host, () => {
      log(`serving on port ${port}`);
    });
  } else {
    server.listen({
      port,
      host,
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
    });
  }
})();
