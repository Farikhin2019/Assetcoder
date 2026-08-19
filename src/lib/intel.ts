/* SIMASET Intelligence — rule-based models over live state (no network, deterministic) */
import type { AppState } from "./store";
import { DAY, daysUntil, fmtIDRCompact, lifeYears, monthlyDep } from "./types";

export const utilOf = (series: Record<string, number[]>, id: string, fallback: number): number => {
  const arr = series[id];
  if (!arr || arr.length === 0) return fallback;
  const last4 = arr.slice(-4);
  return Math.min(99, Math.round((last4.reduce((x, y) => x + y, 0) / last4.length / 168) * 100));
};

/* ── demand forecasting ── */
const cutoff60 = () => Date.now() - 60 * DAY;

export const weeklyConsumption = (s: AppState, sku: string, weeks = 8): number[] => {
  const out = Array.from({ length: weeks }, () => 0);
  const nowT = Date.now();
  for (const l of s.ledger) {
    if (l.sku !== sku) continue;
    if (l.type !== "ISSUE" && l.type !== "CONSUMPTION") continue;
    const t = new Date(l.date).getTime();
    if (t < nowT - weeks * 7 * DAY) continue;
    const idx = weeks - 1 - Math.floor((nowT - t) / (7 * DAY));
    if (idx >= 0 && idx < weeks) out[idx] += Math.abs(l.qty);
  }
  return out;
};

export interface SkuStats { sku: string; name: string; used60: number; perDay: number; sigma: number; coverage: number; }
export const skuStats = (s: AppState, sku: string): SkuStats => {
  const item = s.items.find((i) => i.sku === sku)!;
  const used60 = s.ledger
    .filter((l) => l.sku === sku && (l.type === "ISSUE" || l.type === "CONSUMPTION") && new Date(l.date).getTime() >= cutoff60())
    .reduce((a, l) => a + Math.abs(l.qty), 0);
  const perDay = used60 / 60;
  const wk = weeklyConsumption(s, sku, 8);
  const mean = wk.reduce((a, b) => a + b, 0) / 8;
  const sigma = Math.sqrt(wk.reduce((a, b) => a + (b - mean) ** 2, 0) / 8) / 7; // σ harian
  const coverage = perDay > 0 ? Math.floor(item.stock / perDay) : 999;
  return { sku, name: item.name, used60, perDay, sigma, coverage };
};

export interface Forecast { hist: number[]; fc: { mean: number; lo: number; hi: number }[]; }
export const forecastSku = (s: AppState, sku: string, weeks = 6): Forecast => {
  const hist = weeklyConsumption(s, sku, 8);
  const mean = hist.reduce((a, b) => a + b, 0) / hist.length || 1;
  const trend = (hist[hist.length - 1] - hist[0]) / (hist.length - 1) / 2;
  const { sigma } = skuStats(s, sku);
  const fc = Array.from({ length: weeks }, (_, i) => {
    const m = Math.max(0, mean + trend * (i + 1) * 7 * 0.35);
    const band = 1.28 * sigma * 7 * Math.sqrt(i + 1); // ±80% CI, melebar seiring horizon
    return { mean: Math.round(m), lo: Math.max(0, Math.round(m - band)), hi: Math.round(m + band) };
  });
  return { hist, fc };
};

/* ── inventory optimization (ABC + safety stock + ROP + EOQ) ── */
export const LEAD_DAYS = 7;
const HOLDING_RATE = 0.2;
const Z = 1.65; // service level ~95%

export interface OptRec {
  sku: string; name: string; abc: "A" | "B" | "C"; stock: number; unitCost: number;
  ss: number; rop: number; eoq: number; min: number; max: number;
  curMin: number; curRop: number; curMax: number; deltaRop: number;
}
export const inventoryOptimize = (s: AppState): OptRec[] => {
  const stats = s.items.map((i) => ({ i, st: skuStats(s, i.sku) }));
  const annualValue = stats.map(({ i, st }) => st.perDay * 365 * i.unitCost);
  const total = annualValue.reduce((a, b) => a + b, 0) || 1;
  const order = stats.map((_, idx) => idx).sort((a, b) => annualValue[b] - annualValue[a]);
  const abc: ("A" | "B" | "C")[] = Array(stats.length).fill("C");
  let acc = 0;
  order.forEach((idx) => { acc += annualValue[idx] / total; abc[idx] = acc <= 0.7 ? "A" : acc <= 0.9 ? "B" : "C"; });

  return stats.map(({ i, st }, idx) => {
    const ss = Math.max(1, Math.ceil(Z * st.sigma * Math.sqrt(LEAD_DAYS)));
    const rop = Math.max(1, Math.ceil(st.perDay * LEAD_DAYS + ss));
    const D = Math.max(1, st.perDay * 365);
    const eoq = Math.max(1, Math.round(Math.sqrt((2 * D * 250_000) / (HOLDING_RATE * i.unitCost || 1)))); // biaya pesan Rp 250rb
    return {
      sku: i.sku, name: i.name, abc: abc[idx], stock: i.stock, unitCost: i.unitCost,
      ss, rop, eoq, min: Math.max(1, Math.ceil(ss * 1.2)), max: Math.max(rop * 2, Math.ceil(eoq * 1.5)),
      curMin: i.min, curRop: i.reorder, curMax: i.max, deltaRop: rop - i.reorder,
    };
  }).sort((a, b) => (a.abc < b.abc ? -1 : a.abc > b.abc ? 1 : Math.abs(b.deltaRop) - Math.abs(a.deltaRop)));
};

/* ── predictive maintenance risk ── */
export interface PmRisk { id: string; name: string; code: string; category: string; score: number; prob30: number; overdueDays: number; pct: number; drivers: string[]; mtbf: number; mttr: number; }
export const pmRisks = (s: AppState): PmRisk[] => s.equipment
  .filter((e) => e.opStatus !== "RETIRED")
  .map((e) => {
    const overdueDays = Math.max(0, -daysUntil(e.nextMaint));
    const pct = utilOf(s.utilSeries, e.id, e.utilization);
    const calBad = e.calStatus === "EXPIRED" || e.calStatus === "FAILED";
    const drivers: string[] = [];
    let score = 0;
    if (e.risk === "HIGH") { score += 30; drivers.push("risk HIGH +30"); } else if (e.risk === "MEDIUM") { score += 15; drivers.push("risk MEDIUM +15"); } else { score += 5; drivers.push("risk LOW +5"); }
    if (e.criticality === "CRITICAL") { score += 20; drivers.push("critical +20"); } else if (e.criticality === "HIGH") { score += 10; drivers.push("kritikalitas HIGH +10"); }
    if (overdueDays > 0) { score += overdueDays * 3; drivers.push(`PM overdue ${overdueDays}h +${overdueDays * 3}`); }
    if (pct > 85) { score += 15; drivers.push(`beban tinggi (${pct}%) +15`); }
    if (calBad) { score += 25; drivers.push(`kalibrasi ${e.calStatus} +25`); }
    const openCmp = s.complaints.filter((c) => c.eqId === e.id && !["CLOSED", "VERIFIED", "RESOLVED"].includes(c.status)).length;
    if (openCmp > 0) { score += 12; drivers.push(`${openCmp} keluhan terbuka +12`); }
    const prob30 = Math.min(94, Math.max(3, Math.round(score * 0.85)));
    const mttr = e.category === "Imaging" ? 14 : e.category === "Life Support" ? 6 : 9;
    return { id: e.id, name: e.name, code: e.code, category: e.category, score, prob30, overdueDays, pct, drivers, mtbf: e.mtbfHours, mttr };
  })
  .sort((a, b) => b.score - a.score);

/* ── anomaly detection (live rules) ── */
export interface Anomaly { id: string; sev: "danger" | "warn"; label: string; detail: string; view: "complaints" | "technical" | "inventory" | "master" | "equipment-detail"; refId?: string; }
export const anomalies = (s: AppState): Anomaly[] => {
  const out: Anomaly[] = [];
  s.complaints
    .filter((c) => !["CLOSED", "VERIFIED", "RESOLVED"].includes(c.status) && Date.now() - new Date(c.date).getTime() > c.slaHours * 36e5)
    .forEach((c) => {
      const hrs = Math.round((Date.now() - new Date(c.date).getTime()) / 36e5 - c.slaHours);
      out.push({ id: "AN-SLA-" + c.id, sev: "danger", label: `SLA breach ${c.code}`, detail: `Melewati SLA ${c.slaHours} jam sebesar ${hrs} jam — eskalasi ke kepala unit.`, view: "complaints" });
    });
  s.equipment.filter((e) => ["EXPIRED", "FAILED"].includes(e.calStatus))
    .forEach((e) => out.push({ id: "AN-CAL-" + e.id, sev: "danger", label: `Kalibrasi ${e.calStatus} — ${e.name}`, detail: e.calStatus === "EXPIRED" ? `Sertifikat kedaluwarsa ${Math.abs(daysUntil(e.calDue ?? new Date().toISOString()))} hari — layanan berisiko dihentikan auditor.` : "Gagal kalibrasi — unit wajib ditahan hingga tindakan korektif.", view: "equipment-detail", refId: e.id }));
  s.inspections.filter((i) => i.result === "FAIL")
    .forEach((i) => out.push({ id: "AN-INS-" + i.id, sev: "danger", label: `Inspeksi FAIL ${i.code}`, detail: i.note, view: "technical" }));
  s.workOrders.filter((w) => w.status !== "CLOSED" && daysUntil(w.scheduled) < 0)
    .forEach((w) => out.push({ id: "AN-WO-" + w.id, sev: "warn", label: `WO ${w.wo} overdue`, detail: `PM melewati jadwal ${Math.abs(daysUntil(w.scheduled))} hari — PM compliance terdampak.`, view: "technical" }));
  s.items.filter((i) => i.stock <= i.min)
    .forEach((i) => out.push({ id: "AN-STK-" + i.sku, sev: "warn", label: `Stok ≤ minimum — ${i.name}`, detail: `${i.stock} ${i.uom} ≤ min ${i.min}; coverage ${skuStats(s, i.sku).coverage} hari.`, view: "inventory" }));
  s.suppliers.filter((sp) => daysUntil(sp.contractUntil) < 0)
    .forEach((sp) => out.push({ id: "AN-SUP-" + sp.id, sev: "warn", label: `Kontrak supplier expired — ${sp.name}`, detail: `Berakhir ${Math.abs(daysUntil(sp.contractUntil))} hari lalu — kontinuitas pasokan berisiko.`, view: "master" }));
  return out.sort((a, b) => (a.sev === b.sev ? 0 : a.sev === "danger" ? -1 : 1));
};

/* ── automated procurement recommendation ── */
export interface ProcRec { sku: string; name: string; uom: string; stock: number; coverage: number; qty: number; estCost: number; reason: string; }
export const procurementRecs = (s: AppState): ProcRec[] => s.items
  .map((i) => {
    const st = skuStats(s, i.sku);
    return { i, st };
  })
  .filter(({ i, st }) => st.coverage < 30 || i.stock <= i.reorder)
  .map(({ i, st }) => {
    const target = st.perDay * 45 + Math.max(1, Math.ceil(Z * st.sigma * Math.sqrt(LEAD_DAYS))); // cover 45 hari + SS
    const qty = Math.max(1, Math.ceil(target - i.stock));
    return { sku: i.sku, name: i.name, uom: i.uom, stock: i.stock, coverage: st.coverage, qty, estCost: i.unitCost, reason: st.coverage < 30 ? `coverage ${st.coverage} hari (< 30)` : `stok ${i.stock} ≤ ROP ${i.reorder}` };
  })
  .sort((a, b) => a.coverage - b.coverage);

/* ── utilization recommendations & finance rollups ── */
export const idleAssets = (s: AppState) => s.equipment
  .filter((e) => e.opStatus === "IN_SERVICE")
  .map((e) => ({ e, pct: utilOf(s.utilSeries, e.id, e.utilization) }))
  .filter((x) => x.pct < 40)
  .sort((a, b) => a.pct - b.pct);

export const nbvOf = (e: { acqCost: number; category: string }, posted: number) => {
  const m = monthlyDep(e.acqCost, e.category);
  const cap = e.acqCost * 0.9;
  return { nbv: e.acqCost - Math.min(cap, posted * m), monthly: m };
};

export const portfolioNbv = (s: AppState) => s.equipment.reduce((a, e) => a + nbvOf(e, (s.deprPosted[e.id] ?? []).length).nbv, 0);

export const execSummary = (s: AppState) => {
  const calBad = s.equipment.filter((e) => ["EXPIRED", "FAILED"].includes(e.calStatus)).length;
  const breaches = s.complaints.filter((c) => !["CLOSED", "VERIFIED", "RESOLVED"].includes(c.status) && Date.now() - new Date(c.date).getTime() > c.slaHours * 36e5).length;
  const low = s.items.filter((i) => i.stock <= i.reorder).length;
  return {
    assets: s.equipment.length,
    inService: s.equipment.filter((e) => e.opStatus === "IN_SERVICE").length,
    calBad, breaches, low,
    pending: s.approvals.filter((a) => a.status === "PENDING").length,
    idle: idleAssets(s).length,
    nbv: portfolioNbv(s),
    anomalies: anomalies(s).length,
    proc: procurementRecs(s).length,
  };
};

export const templateFor = (category: string) =>
  category === "Imaging" ? "FT-PM-IMG" : category === "Life Support" ? "FT-PM-VNT" : "FT-INS-GEN";
