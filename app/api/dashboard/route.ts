import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { ledgerEntries, userSettings } from "@/db/schema";

export const dynamic = "force-dynamic";

const defaultSettings = {
  monthlyNetSalaryCents: 1200000,
  salaryMonths: 12,
  workDaysPerMonth: 21,
  onsiteHoursPerDay: 9,
  commuteMinutesPerDay: 90,
  overtimeHoursPerMonth: 12,
  workCostCentsPerDay: 3500,
  startingSavingsCents: 3000000,
  freedomGoalCents: 20000000,
  safetyMonths: 6,
  raisePercent: 10,
  commuteReductionMinutes: 30,
  overtimeChangeHours: -8,
};

function owner(request: Request) {
  return request.headers.get("oai-authenticated-user-id") || "private-owner";
}

function errorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "未知错误";
  if (message.includes("no such table")) return "在线数据表尚未就绪，请稍后重试。";
  if (message.includes("binding `DB`")) return "在线存储暂时不可用，请稍后重试。";
  return "读取在线数据失败，请重试。";
}

export async function GET(request: Request) {
  try {
    const db = getDb();
    const ownerId = owner(request);
    const [entries, settingsRows] = await Promise.all([
      db.select().from(ledgerEntries).where(eq(ledgerEntries.ownerId, ownerId)).orderBy(desc(ledgerEntries.occurredAt), desc(ledgerEntries.id)),
      db.select().from(userSettings).where(eq(userSettings.ownerId, ownerId)).limit(1),
    ]);
    return Response.json({ entries, settings: settingsRows[0] ?? { ownerId, ...defaultSettings } });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { amount?: number; kind?: string; category?: string; note?: string; occurredAt?: string };
    if (!Number.isFinite(body.amount) || Number(body.amount) <= 0) return Response.json({ error: "请输入有效金额。" }, { status: 400 });
    if (!body.category?.trim()) return Response.json({ error: "请选择分类。" }, { status: 400 });
    if (!["income", "fixed", "flexible"].includes(body.kind ?? "")) return Response.json({ error: "收支类型无效。" }, { status: 400 });
    const db = getDb();
    const [entry] = await db.insert(ledgerEntries).values({
      ownerId: owner(request),
      amountCents: Math.round(Number(body.amount) * 100),
      kind: body.kind as "income" | "fixed" | "flexible",
      category: body.category.trim().slice(0, 30),
      note: (body.note ?? "").trim().slice(0, 120),
      occurredAt: body.occurredAt || new Date().toISOString(),
    }).returning();
    return Response.json({ entry }, { status: 201 });
  } catch {
    return Response.json({ error: "保存失败，这笔记录尚未写入。请重试。" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json() as { id?: number; amount?: number; kind?: string; category?: string; note?: string; occurredAt?: string };
    if (!body.id || !Number.isFinite(body.amount) || Number(body.amount) <= 0 || !body.category?.trim()) return Response.json({ error: "记录内容不完整。" }, { status: 400 });
    if (!["income", "fixed", "flexible"].includes(body.kind ?? "")) return Response.json({ error: "收支类型无效。" }, { status: 400 });
    const db = getDb();
    const [entry] = await db.update(ledgerEntries).set({
      amountCents: Math.round(Number(body.amount) * 100),
      kind: body.kind as "income" | "fixed" | "flexible",
      category: body.category.trim().slice(0, 30),
      note: (body.note ?? "").trim().slice(0, 120),
      occurredAt: body.occurredAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).where(and(eq(ledgerEntries.id, body.id), eq(ledgerEntries.ownerId, owner(request)))).returning();
    if (!entry) return Response.json({ error: "没有找到这笔记录。" }, { status: 404 });
    return Response.json({ entry });
  } catch {
    return Response.json({ error: "修改失败，原记录已保留。请重试。" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const id = Number(new URL(request.url).searchParams.get("id"));
    if (!id) return Response.json({ error: "缺少记录编号。" }, { status: 400 });
    const db = getDb();
    const [entry] = await db.delete(ledgerEntries).where(and(eq(ledgerEntries.id, id), eq(ledgerEntries.ownerId, owner(request)))).returning();
    if (!entry) return Response.json({ error: "没有找到这笔记录。" }, { status: 404 });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "删除失败，记录仍然保留。请重试。" }, { status: 500 });
  }
}
