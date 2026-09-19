import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const ledgerEntries = sqliteTable("ledger_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerId: text("owner_id").notNull(),
  amountCents: integer("amount_cents").notNull(),
  kind: text("kind", { enum: ["income", "fixed", "flexible"] }).notNull(),
  category: text("category").notNull(),
  note: text("note").notNull().default(""),
  occurredAt: text("occurred_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const userSettings = sqliteTable("user_settings", {
  ownerId: text("owner_id").primaryKey(),
  monthlyNetSalaryCents: integer("monthly_net_salary_cents").notNull().default(1200000),
  salaryMonths: integer("salary_months").notNull().default(12),
  workDaysPerMonth: integer("work_days_per_month").notNull().default(21),
  onsiteHoursPerDay: integer("onsite_hours_per_day").notNull().default(9),
  commuteMinutesPerDay: integer("commute_minutes_per_day").notNull().default(90),
  overtimeHoursPerMonth: integer("overtime_hours_per_month").notNull().default(12),
  workCostCentsPerDay: integer("work_cost_cents_per_day").notNull().default(3500),
  startingSavingsCents: integer("starting_savings_cents").notNull().default(3000000),
  freedomGoalCents: integer("freedom_goal_cents").notNull().default(20000000),
  safetyMonths: integer("safety_months").notNull().default(6),
  raisePercent: integer("raise_percent").notNull().default(10),
  commuteReductionMinutes: integer("commute_reduction_minutes").notNull().default(30),
  overtimeChangeHours: integer("overtime_change_hours").notNull().default(-8),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
