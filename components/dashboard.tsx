"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight, ArrowUpRight, BriefcaseBusiness, Calculator, Car, Check,
  CircleDollarSign, Clock3, Cloud, CloudOff, Coffee, Edit3, Home, PiggyBank,
  Plus, RefreshCw, Save, Settings2, Sparkles, Target, Trash2, TrendingUp,
  WalletCards, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Progress } from "@/components/ui/progress";

type Kind = "income" | "fixed" | "flexible";
type Entry = {
  id: number; amountCents: number; kind: Kind; category: string; note: string;
  occurredAt: string; createdAt: string; updatedAt: string;
};
type Settings = {
  monthlyNetSalaryCents: number; salaryMonths: number; workDaysPerMonth: number;
  onsiteHoursPerDay: number; commuteMinutesPerDay: number;
  overtimeHoursPerMonth: number; workCostCentsPerDay: number;
  startingSavingsCents: number; freedomGoalCents: number; safetyMonths: number;
  raisePercent: number; commuteReductionMinutes: number; overtimeChangeHours: number;
};

const defaults: Settings = {
  monthlyNetSalaryCents: 1200000, salaryMonths: 12, workDaysPerMonth: 21,
  onsiteHoursPerDay: 9, commuteMinutesPerDay: 90, overtimeHoursPerMonth: 12,
  workCostCentsPerDay: 3500, startingSavingsCents: 3000000,
  freedomGoalCents: 20000000, safetyMonths: 6, raisePercent: 10,
  commuteReductionMinutes: 30, overtimeChangeHours: -8,
};
const categories: Record<Kind, string[]> = {
  income: ["工资", "奖金", "副业", "报销", "其他收入"],
  fixed: ["房租/房贷", "水电网", "保险", "订阅", "还款"],
  flexible: ["餐饮", "通勤", "购物", "娱乐", "学习", "健康", "其他支出"],
};
const kindMeta = {
  income: { label: "收入", color: "#2e9a78", icon: ArrowUpRight },
  fixed: { label: "固定支出", color: "#ef8a73", icon: ArrowDownRight },
  flexible: { label: "弹性支出", color: "#e5a942", icon: Coffee },
};

function money(cents: number, compact = false) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency", currency: "CNY", maximumFractionDigits: compact ? 0 : 2,
    notation: compact ? "compact" : "standard",
  }).format(cents / 100);
}
function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
function localDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function hoursLabel(hours: number) {
  if (!Number.isFinite(hours)) return "—";
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} 分钟`;
  return `${hours.toFixed(hours < 10 ? 1 : 0)} 小时`;
}
function computeHourly(s: Settings, salaryMultiplier = 1, commuteDelta = 0, overtimeDelta = 0) {
  const annualIncome = s.monthlyNetSalaryCents * s.salaryMonths * salaryMultiplier;
  const annualCost = s.workCostCentsPerDay * s.workDaysPerMonth * 12;
  const annualHours =
    s.workDaysPerMonth * 12 *
      (s.onsiteHoursPerDay + Math.max(0, s.commuteMinutesPerDay + commuteDelta) / 60) +
    Math.max(0, s.overtimeHoursPerMonth + overtimeDelta) * 12;
  return { annualIncome, annualCost, annualHours, hourlyCents: annualHours ? (annualIncome - annualCost) / annualHours : 0 };
}
function draftFromSettings(settings: Settings) {
  return {
    monthlyNetSalary: String(settings.monthlyNetSalaryCents / 100),
    salaryMonths: String(settings.salaryMonths),
    workDaysPerMonth: String(settings.workDaysPerMonth),
    onsiteHoursPerDay: String(settings.onsiteHoursPerDay),
    commuteMinutesPerDay: String(settings.commuteMinutesPerDay),
    overtimeHoursPerMonth: String(settings.overtimeHoursPerMonth),
    workCostPerDay: String(settings.workCostCentsPerDay / 100),
    startingSavings: String(settings.startingSavingsCents / 100),
    freedomGoal: String(settings.freedomGoalCents / 100),
    safetyMonths: String(settings.safetyMonths),
    raisePercent: String(settings.raisePercent),
    commuteReductionMinutes: String(settings.commuteReductionMinutes),
    overtimeChangeHours: String(settings.overtimeChangeHours),
  };
}

function PigArt() {
  return <div className="pig-art" aria-hidden="true">
    <div className="coin">¥</div><PiggyBank strokeWidth={1.7} />
    <span className="spark s1">✦</span><span className="spark s2">✦</span>
  </div>;
}

function MiniChart({ points }: { points: { label: string; value: number }[] }) {
  const width = 680, height = 210, px = 16, py = 24;
  const values = points.map((p) => p.value);
  const min = Math.min(...values, 0), max = Math.max(...values, 1), span = max - min || 1;
  const xy = points.map((p, i) => ({
    ...p, x: px + i * ((width - px * 2) / Math.max(1, points.length - 1)),
    y: py + (max - p.value) / span * (height - py * 2),
  }));
  const line = xy.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ");
  const area = `${line} L${xy.at(-1)?.x ?? px},${height - py} L${px},${height - py} Z`;
  return <div className="chart-wrap">
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="近十二个月存款曲线">
      <defs><linearGradient id="mintArea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#82ccb1" stopOpacity=".42" />
        <stop offset="1" stopColor="#82ccb1" stopOpacity=".03" />
      </linearGradient></defs>
      <path d={area} fill="url(#mintArea)" />
      <path d={line} fill="none" stroke="#4fa886" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      {xy.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4.5" fill="#fff" stroke="#4fa886" strokeWidth="3" />)}
    </svg>
    <div className="chart-labels"><span>{points[0]?.label}</span><span>{points[Math.floor(points.length / 2)]?.label}</span><span>{points.at(-1)?.label}</span></div>
  </div>;
}

export function Dashboard() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [settings, setSettings] = useState<Settings>(defaults);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    amount: "", kind: "flexible" as Kind, category: "餐饮", note: "",
    occurredAt: localDateTime(new Date().toISOString()),
  });
  const [editing, setEditing] = useState<Entry | null>(null);
  const [showFormula, setShowFormula] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState<Record<string, string>>(() => draftFromSettings(defaults));

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setLoadError("");
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEntries(data.entries);
      setSettings(data.settings);
      setSettingsDraft(draftFromSettings(data.settings));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "读取在线数据失败，请重试。");
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
    const onFocus = () => load(true);
    window.addEventListener("focus", onFocus);
    const timer = window.setInterval(() => load(true), 30000);
    return () => { window.removeEventListener("focus", onFocus); window.clearInterval(timer); };
  }, [load]);

  const calc = useMemo(() => computeHourly(settings), [settings]);
  const currentMonth = monthKey(new Date());
  const monthEntries = entries.filter((e) => monthKey(new Date(e.occurredAt)) === currentMonth);
  const totals = {
    income: monthEntries.filter((e) => e.kind === "income").reduce((a, e) => a + e.amountCents, 0),
    fixed: monthEntries.filter((e) => e.kind === "fixed").reduce((a, e) => a + e.amountCents, 0),
    flexible: monthEntries.filter((e) => e.kind === "flexible").reduce((a, e) => a + e.amountCents, 0),
  };
  const cashFlow = entries.reduce((a, e) => a + (e.kind === "income" ? e.amountCents : -e.amountCents), 0);
  const savings = settings.startingSavingsCents + cashFlow;
  const freedomProgress = Math.max(0, Math.min(100, savings / Math.max(1, settings.freedomGoalCents) * 100));
  const monthlySpend = totals.fixed + totals.flexible || Math.max(1, settings.monthlyNetSalaryCents * .55);
  const safetyTarget = monthlySpend * settings.safetyMonths;
  const chartPoints = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 12 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - 11 + i, 1));
    let running = settings.startingSavingsCents;
    return months.map((d) => {
      const key = monthKey(d);
      entries.filter((e) => monthKey(new Date(e.occurredAt)) === key)
        .forEach((e) => running += e.kind === "income" ? e.amountCents : -e.amountCents);
      return { label: `${d.getMonth() + 1}月`, value: running };
    });
  }, [entries, settings.startingSavingsCents]);

  async function mutate(url: string, options: RequestInit, success: string) {
    setSaving(true); setNotice("");
    try {
      const res = await fetch(url, options);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await load(true); setNotice(success); return true;
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "操作失败，请重试。"); return false;
    } finally {
      setSaving(false); window.setTimeout(() => setNotice(""), 4500);
    }
  }
  async function addEntry(e: React.FormEvent) {
    e.preventDefault();
    const ok = await mutate("/api/dashboard", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: Number(form.amount), occurredAt: new Date(form.occurredAt).toISOString() }),
    }, `已存入线上 · 相当于 ${hoursLabel(Number(form.amount) * 100 / calc.hourlyCents)}`);
    if (ok) setForm((v) => ({ ...v, amount: "", note: "" }));
  }
  async function saveEdit(e: React.FormEvent) {
    e.preventDefault(); if (!editing) return;
    const ok = await mutate("/api/dashboard", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editing, amount: editing.amountCents / 100 }),
    }, "修改已同步到线上");
    if (ok) setEditing(null);
  }
  async function remove(id: number) {
    if (!window.confirm("确定删除这笔记录吗？删除后会立即同步。")) return;
    await mutate(`/api/dashboard?id=${id}`, { method: "DELETE" }, "记录已从线上删除");
  }
  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    await mutate("/api/settings", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settingsDraft),
    }, "个人设置已同步到线上");
  }
  function jump(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  const nav = [
    { id: "home", label: "首页", Icon: Home },
    { id: "ledger", label: "记账", Icon: WalletCards },
    { id: "fund", label: "自由基金", Icon: Target },
    { id: "scenario", label: "情景模拟", Icon: TrendingUp },
    { id: "settings", label: "设置", Icon: Settings2 },
  ];

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark"><PiggyBank /></span><div><b>打工人小账本</b><small>认真赚钱，也要好好生活</small></div></div>
      <nav>{nav.map(({ id, label, Icon }, i) => <button key={id} className={i === 0 ? "active" : ""} onClick={() => jump(id)}><Icon /><span>{label}</span></button>)}</nav>
      <div className="cloud-card"><Cloud /><div><b>数据已在线保存</b><span>换设备打开也还在</span></div></div>
    </aside>

    <main>
      <section id="home" className="topbar">
        <div><p className="eyebrow">{new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "long" }).format(new Date())}</p><h1>早上好，今天也要赚得明白 <Sparkles /></h1></div>
        <div className={`sync-pill ${loadError ? "bad" : ""}`}>{loadError ? <CloudOff /> : <Cloud />}<span>{loadError ? "同步异常" : loading ? "正在同步" : "已同步到线上"}</span>{!loading && <Button variant="ghost" size="icon-xs" onClick={() => load()} aria-label="刷新"><RefreshCw /></Button>}</div>
      </section>
      {loadError && <div className="error-banner" role="alert"><div><CloudOff /><span>{loadError}</span></div><Button onClick={() => load()}><RefreshCw />重试</Button></div>}

      <section className="hero-grid">
        <article className="card hourly-card">
          <div className="card-title"><span className="icon-bubble mint"><Clock3 /></span><div><p>你的真实时薪</p><small>把通勤、加班与工作成本都算进去</small></div></div>
          {loading ? <div className="skeleton big" /> : <>
            <div className="hourly-value"><span>{money(calc.hourlyCents)}</span><small>/ 小时</small></div>
            <div className="hourly-stats">
              <div><span>账面时薪</span><b>{money(settings.monthlyNetSalaryCents / (settings.workDaysPerMonth * settings.onsiteHoursPerDay))}</b></div>
              <div><span>每月在岗</span><b>{settings.workDaysPerMonth * settings.onsiteHoursPerDay}h</b></div>
              <div><span>隐形时间</span><b>{Math.round(settings.workDaysPerMonth * settings.commuteMinutesPerDay / 60 + settings.overtimeHoursPerMonth)}h</b></div>
            </div>
            <button className="formula-toggle" onClick={() => setShowFormula((v) => !v)}><Calculator />{showFormula ? "收起计算公式" : "展开计算公式"}</button>
            {showFormula && <div className="formula">
              <p><b>真实时薪</b> =（年到手收入 − 年工作成本）÷ 年工作时间</p>
              <code>（{money(calc.annualIncome, true)} − {money(calc.annualCost, true)}）÷ {Math.round(calc.annualHours)} 小时 = {money(calc.hourlyCents)}</code>
              <small>年工作时间 = 工作日 ×（在场时间 + 通勤时间）+ 加班时间</small>
            </div>}
          </>}
        </article>

        <article className="card quick-card" id="ledger">
          <div className="card-title"><span className="icon-bubble peach"><Plus /></span><div><p>10 秒记一笔</p><small>保存后自动换算为工作时间</small></div></div>
          <form onSubmit={addEntry}>
            <label className="amount-field"><span>¥</span><Input inputMode="decimal" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></label>
            <div className="kind-tabs">{(["income", "fixed", "flexible"] as Kind[]).map((k) => <button type="button" key={k} className={form.kind === k ? "selected" : ""} onClick={() => setForm({ ...form, kind: k, category: categories[k][0] })}>{kindMeta[k].label}</button>)}</div>
            <div className="form-row">
              <NativeSelect aria-label="分类" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories[form.kind].map((c) => <NativeSelectOption key={c}>{c}</NativeSelectOption>)}</NativeSelect>
              <Input placeholder="备注（可选）" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
            <Button className="save-entry" disabled={saving || !form.amount}><Save />{saving ? "正在写入线上…" : "保存这笔"}</Button>
            {form.amount && <p className="work-time"><Clock3 />大约要工作 <b>{hoursLabel(Number(form.amount) * 100 / calc.hourlyCents)}</b></p>}
          </form>
        </article>
      </section>

      <section className="summary-grid">
        <Summary icon={<ArrowUpRight />} tone="mint" label="本月收入" value={money(totals.income, true)} />
        <Summary icon={<BriefcaseBusiness />} tone="peach" label="固定支出" value={money(totals.fixed, true)} />
        <Summary icon={<Coffee />} tone="yellow" label="弹性支出" value={money(totals.flexible, true)} />
        <Summary icon={<CircleDollarSign />} tone="lilac" label="本月结余" value={money(totals.income - totals.fixed - totals.flexible, true)} />
      </section>

      <section className="content-grid">
        <article className="card recent">
          <div className="section-head"><div><h2>最近记录</h2><p>每一笔都实时写回线上</p></div><span>{entries.length} 笔</span></div>
          {loading ? <div className="loading-list">{[1, 2, 3, 4].map((i) => <div key={i} className="skeleton row" />)}</div>
          : entries.length === 0 ? <div className="empty"><PiggyBank /><b>还没有记录</b><span>从上面的「10 秒记一笔」开始吧</span></div>
          : <div className="entry-list">{entries.slice(0, 4).map((entry) => <EntryRow key={entry.id} entry={entry} hourly={calc.hourlyCents} edit={() => setEditing(entry)} remove={() => remove(entry.id)} />)}</div>}
        </article>
        <article className="card month-card">
          <div className="section-head"><div><h2>本月收支</h2><p>收入与支出结构</p></div><span>{new Date().getMonth() + 1}月</span></div>
          <div className="donut" style={{ background: `conic-gradient(#65b896 0 ${totals.income ? Math.min(100, (totals.fixed + totals.flexible) / totals.income * 100) : 0}%,#e5f3ec 0)` }}><div><b>{totals.income ? Math.round((totals.fixed + totals.flexible) / totals.income * 100) : 0}%</b><span>支出率</span></div></div>
          <div className="legend"><p><i className="fixed" />固定支出 <b>{money(totals.fixed, true)}</b></p><p><i className="flex" />弹性支出 <b>{money(totals.flexible, true)}</b></p></div>
        </article>
      </section>

      <section id="fund" className="fund-grid">
        <article className="card fund-card">
          <div className="section-head"><div><h2>自由基金</h2><p>攒够选择生活的底气</p></div><Target /></div>
          <div className="fund-main"><PigArt /><div><b>{money(savings, true)}</b><span>目标 {money(settings.freedomGoalCents, true)}</span></div></div>
          <Progress value={freedomProgress} /><div className="progress-label"><span>已完成 {freedomProgress.toFixed(1)}%</span><span>还差 {money(Math.max(0, settings.freedomGoalCents - savings), true)}</span></div>
        </article>
        <article className="card safety-card">
          <div className="section-head"><div><h2>安全垫</h2><p>{settings.safetyMonths} 个月生活费</p></div><span className="icon-bubble yellow"><PiggyBank /></span></div>
          <div className="safety-number"><b>{money(safetyTarget, true)}</b><span>建议储备</span></div><p>按本月支出估算，覆盖空窗期和突发情况。</p>
        </article>
      </section>

      <section className="card savings-chart">
        <div className="section-head"><div><h2>存款曲线</h2><p>起始存款加全部线上流水</p></div><b>{money(savings, true)}</b></div>
        <MiniChart points={chartPoints} />
      </section>

      <section id="scenario" className="scenario-section">
        <div className="section-head standalone"><div><h2>如果工作有一点变化</h2><p>通勤、加班和涨薪，哪个最值得争取？</p></div></div>
        <div className="scenario-grid">
          <Scenario icon={<Car />} title={`通勤每天少 ${settings.commuteReductionMinutes} 分钟`} current={calc.hourlyCents} next={computeHourly(settings, 1, -settings.commuteReductionMinutes, 0).hourlyCents} />
          <Scenario icon={<Clock3 />} title={`每月加班 ${settings.overtimeChangeHours >= 0 ? "+" : ""}${settings.overtimeChangeHours} 小时`} current={calc.hourlyCents} next={computeHourly(settings, 1, 0, settings.overtimeChangeHours).hourlyCents} />
          <Scenario icon={<TrendingUp />} title={`到手工资涨 ${settings.raisePercent}%`} current={calc.hourlyCents} next={computeHourly(settings, 1 + settings.raisePercent / 100, 0, 0).hourlyCents} />
        </div>
      </section>

      <section id="settings" className="card settings-card">
        <div className="section-head"><div><h2>个人设置</h2><p>这里的参数会存入独立的线上设置表</p></div><Settings2 /></div>
        <form onSubmit={saveSettings}>
          <div className="settings-grid">
            {[
              { k: "monthlyNetSalary", l: "到手月薪", u: "元" }, { k: "salaryMonths", l: "全年发薪", u: "个月" },
              { k: "workDaysPerMonth", l: "每月工作日", u: "天" }, { k: "onsiteHoursPerDay", l: "每天在场", u: "小时" },
              { k: "commuteMinutesPerDay", l: "每日往返通勤", u: "分钟" }, { k: "overtimeHoursPerMonth", l: "每月加班", u: "小时" },
              { k: "workCostPerDay", l: "每日工作成本", u: "元" }, { k: "startingSavings", l: "起始存款", u: "元" },
              { k: "freedomGoal", l: "自由基金目标", u: "元" }, { k: "safetyMonths", l: "安全垫", u: "个月" },
            ].map((field) => <label key={field.k}><span>{field.l}</span><div><Input type="number" value={settingsDraft[field.k] ?? ""} onChange={(e) => setSettingsDraft({ ...settingsDraft, [field.k]: e.target.value })} /><i>{field.u}</i></div></label>)}
          </div>
          <div className="scenario-settings">
            <DraftField label="涨薪模拟" unit="%" name="raisePercent" draft={settingsDraft} setDraft={setSettingsDraft} />
            <DraftField label="通勤减少" unit="分钟" name="commuteReductionMinutes" draft={settingsDraft} setDraft={setSettingsDraft} />
            <DraftField label="加班变化" unit="小时" name="overtimeChangeHours" draft={settingsDraft} setDraft={setSettingsDraft} />
          </div>
          <Button className="settings-save" disabled={saving}><Cloud />{saving ? "正在同步…" : "保存并同步到线上"}</Button>
        </form>
      </section>
      <footer><PiggyBank />赚得清楚，花得开心，存得踏实。</footer>
    </main>

    <nav className="bottom-nav">{nav.map(({ id, label, Icon }) => <button key={id} onClick={() => jump(id)}><Icon /><span>{label}</span></button>)}</nav>
    {editing && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="编辑记录">
      <form className="edit-modal" onSubmit={saveEdit}>
        <div className="section-head"><div><h2>编辑这笔记录</h2><p>保存后会立即同步</p></div><Button type="button" variant="ghost" size="icon" onClick={() => setEditing(null)}><X /></Button></div>
        <label>金额<Input type="number" step="0.01" value={editing.amountCents / 100} onChange={(e) => setEditing({ ...editing, amountCents: Math.round(Number(e.target.value) * 100) })} /></label>
        <label>类型<NativeSelect value={editing.kind} onChange={(e) => { const kind = e.target.value as Kind; setEditing({ ...editing, kind, category: categories[kind][0] }); }}>{(["income", "fixed", "flexible"] as Kind[]).map((k) => <NativeSelectOption key={k} value={k}>{kindMeta[k].label}</NativeSelectOption>)}</NativeSelect></label>
        <label>分类<NativeSelect value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>{categories[editing.kind].map((c) => <NativeSelectOption key={c}>{c}</NativeSelectOption>)}</NativeSelect></label>
        <label>备注<Input value={editing.note} onChange={(e) => setEditing({ ...editing, note: e.target.value })} /></label>
        <div className="modal-actions"><Button type="button" variant="outline" onClick={() => setEditing(null)}>取消</Button><Button disabled={saving}><Save />保存修改</Button></div>
      </form>
    </div>}
    {notice && <div className={`toast ${notice.includes("失败") || notice.includes("没有") ? "bad" : ""}`} role="status">{notice.includes("失败") ? <CloudOff /> : <Check />}{notice}</div>}
  </div>;
}

function Summary({ icon, tone, label, value }: { icon: React.ReactNode; tone: string; label: string; value: string }) {
  return <article className="mini-card"><span className={`icon-bubble ${tone}`}>{icon}</span><div><small>{label}</small><b>{value}</b></div></article>;
}
function EntryRow({ entry, hourly, edit, remove }: { entry: Entry; hourly: number; edit: () => void; remove: () => void }) {
  const Icon = kindMeta[entry.kind].icon;
  return <div className="entry">
    <span className="entry-icon" style={{ color: kindMeta[entry.kind].color }}><Icon /></span>
    <div className="entry-copy"><b>{entry.category}</b><span>{entry.note || kindMeta[entry.kind].label} · {new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(entry.occurredAt))}</span></div>
    <div className="entry-amount"><b className={entry.kind === "income" ? "positive" : ""}>{entry.kind === "income" ? "+" : "-"}{money(entry.amountCents)}</b><span>{hoursLabel(entry.amountCents / hourly)}</span></div>
    <div className="entry-actions"><Button variant="ghost" size="icon-sm" onClick={edit} aria-label="编辑"><Edit3 /></Button><Button variant="ghost" size="icon-sm" onClick={remove} aria-label="删除"><Trash2 /></Button></div>
  </div>;
}
function Scenario({ icon, title, current, next }: { icon: React.ReactNode; title: string; current: number; next: number }) {
  const pct = current ? ((next / current - 1) * 100) : 0;
  return <article className="card scenario-card"><span className="icon-bubble mint">{icon}</span><h3>{title}</h3><div><span>真实时薪</span><b>{money(next)}</b></div><p className={pct >= 0 ? "up" : "down"}>{pct >= 0 ? "↑" : "↓"} {Math.abs(pct).toFixed(1)}%</p></article>;
}
function DraftField({ label, unit, name, draft, setDraft }: { label: string; unit: string; name: string; draft: Record<string, string>; setDraft: React.Dispatch<React.SetStateAction<Record<string, string>>> }) {
  return <label>{label}<Input type="number" value={draft[name] ?? ""} onChange={(e) => setDraft({ ...draft, [name]: e.target.value })} /><span>{unit}</span></label>;
}
