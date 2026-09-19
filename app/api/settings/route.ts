import { getDb } from "@/db";
import { userSettings } from "@/db/schema";

export const dynamic = "force-dynamic";

function n(value: unknown, fallback: number, min = 0, max = 100000000) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.round(parsed))) : fallback;
}

export async function PUT(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const ownerId = request.headers.get("oai-authenticated-user-id") || "private-owner";
    const values = {
      ownerId,
      monthlyNetSalaryCents: n(Number(body.monthlyNetSalary) * 100, 1200000),
      salaryMonths: n(body.salaryMonths, 12, 1, 24),
      workDaysPerMonth: n(body.workDaysPerMonth, 21, 1, 31),
      onsiteHoursPerDay: n(body.onsiteHoursPerDay, 9, 1, 24),
      commuteMinutesPerDay: n(body.commuteMinutesPerDay, 90, 0, 600),
      overtimeHoursPerMonth: n(body.overtimeHoursPerMonth, 12, 0, 300),
      workCostCentsPerDay: n(Number(body.workCostPerDay) * 100, 3500),
      startingSavingsCents: n(Number(body.startingSavings) * 100, 3000000),
      freedomGoalCents: n(Number(body.freedomGoal) * 100, 20000000),
      safetyMonths: n(body.safetyMonths, 6, 1, 36),
      raisePercent: n(body.raisePercent, 10, 0, 100),
      commuteReductionMinutes: n(body.commuteReductionMinutes, 30, 0, 600),
      overtimeChangeHours: n(body.overtimeChangeHours, -8, -300, 300),
      updatedAt: new Date().toISOString(),
    };
    const db = getDb();
    const [settings] = await db.insert(userSettings).values(values).onConflictDoUpdate({ target: userSettings.ownerId, set: values }).returning();
    return Response.json({ settings });
  } catch {
    return Response.json({ error: "设置保存失败，线上数据没有被覆盖。请重试。" }, { status: 500 });
  }
}
