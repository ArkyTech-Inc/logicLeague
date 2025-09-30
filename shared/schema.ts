import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  role: varchar("role", { length: 50 }).notNull().default("user"), // admin, department_owner, executive, user
  departmentId: uuid("department_id"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const departments = pgTable("departments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 10 }).notNull().unique(), // DLCB, DEID, DGCS, DEGS
  description: text("description"),
  headUserId: uuid("head_user_id"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const pillars = pgTable("pillars", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const kpis = pgTable("kpis", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  pillarId: uuid("pillar_id").notNull(),
  departmentId: uuid("department_id").notNull(),
  unit: varchar("unit", { length: 50 }).notNull(), // percentage, count, ratio
  dataType: varchar("data_type", { length: 20 }).notNull(), // numeric, boolean
  frequency: varchar("frequency", { length: 20 }).notNull(), // monthly, quarterly, yearly
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const targets = pgTable("targets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  kpiId: uuid("kpi_id").notNull(),
  year: integer("year").notNull(),
  quarter: integer("quarter"), // nullable for yearly targets
  targetValue: decimal("target_value", { precision: 10, scale: 2 }).notNull(),
  threshold: jsonb("threshold").$type<{
    green: number;
    amber: number;
    red: number;
  }>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const actuals = pgTable("actuals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  kpiId: uuid("kpi_id").notNull(),
  targetId: uuid("target_id").notNull(),
  actualValue: decimal("actual_value", { precision: 10, scale: 2 }).notNull(),
  submittedBy: uuid("submitted_by").notNull(),
  submissionDate: timestamp("submission_date").defaultNow().notNull(),
  evidenceFiles: jsonb("evidence_files").$type<string[]>().default([]),
  comments: text("comments"),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, approved, rejected
  reviewedBy: uuid("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  reviewComments: text("review_comments"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const milestones = pgTable("milestones", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  kpiId: uuid("kpi_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  targetDate: timestamp("target_date").notNull(),
  actualDate: timestamp("actual_date"),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, completed, overdue
  progress: integer("progress").default(0), // 0-100
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const alerts = pgTable("alerts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type", { length: 50 }).notNull(), // threshold_breach, overdue_submission, target_exceeded
  severity: varchar("severity", { length: 20 }).notNull(), // low, medium, high, critical
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  kpiId: uuid("kpi_id"),
  departmentId: uuid("department_id"),
  triggeredBy: uuid("triggered_by"),
  isRead: boolean("is_read").notNull().default(false),
  isResolved: boolean("is_resolved").notNull().default(false),
  resolvedBy: uuid("resolved_by"),
  resolvedAt: timestamp("resolved_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull(),
  action: varchar("action", { length: 100 }).notNull(), // create, update, delete, submit, approve, reject
  resourceType: varchar("resource_type", { length: 50 }).notNull(), // kpi, target, actual, user
  resourceId: uuid("resource_id").notNull(),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // email, teams, slack, in_app
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  alertId: uuid("alert_id"),
  isRead: boolean("is_read").notNull().default(false),
  sentAt: timestamp("sent_at"),
  deliveryStatus: varchar("delivery_status", { length: 20 }).default("pending"), // pending, sent, failed
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
  }),
  submittedActuals: many(actuals, {
    relationName: "submitted_actuals"
  }),
  reviewedActuals: many(actuals, {
    relationName: "reviewed_actuals"
  }),
  auditLogs: many(auditLogs),
  notifications: many(notifications),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  head: one(users, {
    fields: [departments.headUserId],
    references: [users.id],
  }),
  users: many(users),
  kpis: many(kpis),
  alerts: many(alerts),
}));

export const pillarsRelations = relations(pillars, ({ many }) => ({
  kpis: many(kpis),
}));

export const kpisRelations = relations(kpis, ({ one, many }) => ({
  pillar: one(pillars, {
    fields: [kpis.pillarId],
    references: [pillars.id],
  }),
  department: one(departments, {
    fields: [kpis.departmentId],
    references: [departments.id],
  }),
  targets: many(targets),
  actuals: many(actuals),
  milestones: many(milestones),
  alerts: many(alerts),
}));

export const targetsRelations = relations(targets, ({ one, many }) => ({
  kpi: one(kpis, {
    fields: [targets.kpiId],
    references: [kpis.id],
  }),
  actuals: many(actuals),
}));

export const actualsRelations = relations(actuals, ({ one }) => ({
  kpi: one(kpis, {
    fields: [actuals.kpiId],
    references: [kpis.id],
  }),
  target: one(targets, {
    fields: [actuals.targetId],
    references: [targets.id],
  }),
  submittedByUser: one(users, {
    fields: [actuals.submittedBy],
    references: [users.id],
    relationName: "submitted_actuals"
  }),
  reviewedByUser: one(users, {
    fields: [actuals.reviewedBy],
    references: [users.id],
    relationName: "reviewed_actuals"
  }),
}));

export const milestonesRelations = relations(milestones, ({ one }) => ({
  kpi: one(kpis, {
    fields: [milestones.kpiId],
    references: [kpis.id],
  }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  kpi: one(kpis, {
    fields: [alerts.kpiId],
    references: [kpis.id],
  }),
  department: one(departments, {
    fields: [alerts.departmentId],
    references: [departments.id],
  }),
  triggeredByUser: one(users, {
    fields: [alerts.triggeredBy],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  alert: one(alerts, {
    fields: [notifications.alertId],
    references: [alerts.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertKpiSchema = createInsertSchema(kpis).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTargetSchema = createInsertSchema(targets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertActualSchema = createInsertSchema(actuals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  submissionDate: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Pillar = typeof pillars.$inferSelect;
export type KPI = typeof kpis.$inferSelect;
export type InsertKPI = z.infer<typeof insertKpiSchema>;
export type Target = typeof targets.$inferSelect;
export type InsertTarget = z.infer<typeof insertTargetSchema>;
export type Actual = typeof actuals.$inferSelect;
export type InsertActual = z.infer<typeof insertActualSchema>;
export type Milestone = typeof milestones.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type Notification = typeof notifications.$inferSelect;

// Dashboard data types
export type DepartmentPerformance = {
  id: string;
  name: string;
  code: string;
  score: number;
  status: 'green' | 'amber' | 'red';
  kpiCount: number;
  trend: number;
};

export type KPIWithDetails = KPI & {
  pillar: Pillar;
  department: Department;
  currentTarget?: Target;
  currentActual?: Actual;
  status: 'green' | 'amber' | 'red';
  progress: number;
};

export type QuickStatsData = {
  overallPerformance: number;
  activeKPIs: number;
  departments: number;
  alerts: number;
  trends: {
    overallTrend: number;
    onTrackPercentage: number;
    needAttentionCount: number;
    criticalAlertsCount: number;
  };
};
