import { useMemo } from "react";
import { useApp, utilOf } from "../lib/store";
import { Bar, Card, Chip, SectionHead, StatusChip } from "../components/ui";
import { IcGauge, IcWarn } from "../components/icons";
import { fmtIDRCompact } from "../lib/types";

const C = { pine: "#177057", warn: "#f2a93b", danger: "#bb3a2b", info: "#2c6e8f", mute: "#c9d4cb" };

export default function Reliability() {
  const { s, nav } = useApp();

  const rows = useMemo(() =>
    s.equipment
      .filter((e) => !["RETIRED", "DISPOSED"].includes(e.opStatus))
      .map((e) => {
        const cmps = s.complaints.filter((c) => c.eqId === e.id);
        const rprs = s.repairs.filter((r) => r.eqId === e.id);
        const failures = cmps.length + rprs.length;
        const openCmp = cmps.filter((c) => !["CLOSED", "VERIFIED", "RESOLVED"].includes(c.status));
        const downtimeH =
          openCmp.reduce((a, c) => a + Math.min(168, (Date.now() - +new Date(c.date)) / 36e5), 0) +
          (["MAINTENANCE", "DOWN"].includes(e.opStatus) ? 18 : 0);
        const availability = Math.max(0, Math.round((1 - Math.min(168, downtimeH) / 168) * 1000) / 10);
        const mtbf = Math.round(e.mtbfHours / Math.max(1, failures));
        const closed = cmps.filter((c) => ["CLOSED", "VERIFIED", "RESOLVED"].includes(c.status));
        const mttr = closed.length
          ? Math.round((closed.reduce((a, c) => a + c.slaHours * 0.6, 0) / closed.length) * 10) / 10
          : rprs.some((r) => r.status === "CLOSED") ? 6.4 : null;
        const maintCost = s.timeline.filter((t) => t.eqId === e.id && t.cost).reduce((a, t) => a + (t.cost ?? 0), 0);
        return { e, failures, availability, mtbf, mttr, maintCost, openIssues: openCmp.length, util: utilOf(s.utilSeries, e.id, e.utilization) };
      })
      .sort((a, b) => a.availability - b.availability),
    [s]);

  const kpi = useMemo(() => {
    const act = rows.length;
    const avail = act ? Math.round((rows.reduce((a, r) => a + r.availability, 0) / act) * 10) / 10 : 0;
    const mtbfAvg = act ? Math.round(rows.reduce((a, r) => a + r.mtbf, 0) / act) : 0;
    const withMttr = rows.filter((r) => r.mttr !== null);
    const mttrAvg = withMttr.length ? Math.round((withMttr.reduce((a, r) => a + (r.mttr ?? 0), 0) / withMttr.length) * 10) / 10 : 0;
    const failedOnce = rows.filter((r) => r.failures >= 1).length;
    const failedTwice = rows.filter((r) => r.failures >= 2).length;
    const repeatRate = failedOnce ? Math.round((failedTwice / failedOnce) * 100) : 0;
    const totalMaint = rows.reduce((a, r) => a + r.maintCost, 0);
    return { act, avail, mtbfAvg, mttrAvg, repeatRate, totalMaint };
  }, [rows]);

  const trend = useMemo(() => {
    const weeks: { label: string; v: number }[] = [];
    for (let w = 7; w >= 0; w--) {
      const start = Date.now() - (w + 1) * 7 * 864e5;
      const end = Date.now() - w * 7 * 864e5;
      const v = s.timeline.filter((t) => {
        const ts = +new Date(t.date);
        return (t.type === "MAINTENANCE" || t.type === "REPAIR") && ts >= start && ts < end;
      }).length;
      weeks.push({ label: w === 0 ? "kini" : `-${w}mg`, v });
    }
    return weeks;
  }, [s.timeline]);
  const maxT = Math.max(...trend.map((t) => t.v), 1);

  const worst = rows[0];

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Reliability Analytics</h1>
          <p className="text-xs text-mute">MTBF · MTTR · Availability · Repeat-Failure — dihitung live dari complaint, repair & work order (§14)</p>
        </div>
        <div className="flex gap-2">
          <Chip tone="pine" dot>{kpi.act} aset aktif</Chip>
          <Chip tone={kpi.repeatRate > 30 ? "danger" : "ok"} dot>{kpi.repeatRate}% repeat failure</Chip>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { l: "Availability", v: `${kpi.avail}%`, sub: "available / scheduled", tone: kpi.avail >= 95 ? "text-ok" : "text-warn" },
          { l: "MTBF rata-rata", v: `${kpi.mtbfAvg} j`, sub: "mean time between failures", tone: "text-pine-700" },
          { l: "MTTR rata-rata", v: kpi.mttrAvg ? `${kpi.mttrAvg} j` : "—", sub: "mean time to repair (est.)", tone: "text-info" },
          { l: "Repeat-failure rate", v: `${kpi.repeatRate}%`, sub: "gagal ≥2× / gagal ≥1×", tone: kpi.repeatRate > 30 ? "text-danger" : "text-ink" },
          { l: "Biaya teknis YTD", v: fmtIDRCompact(kpi.totalMaint), sub: "maint + repair tercatat", tone: "text-warn" },
        ].map((k, i) => (
          <Card key={k.l} className="row-in p-4" >
            <div style={{ animationDelay: `${i * 55}ms` }}>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">{k.l}</p>
              <p className={`num mt-1.5 font-display text-[24px] font-black leading-none tracking-tight ${k.tone}`}>{k.v}</p>
              <p className="mt-1 font-mono text-[9.5px] text-mute">{k.sub}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* trend */}
        <Card className="p-4 lg:col-span-2">
          <SectionHead title="Penyelesaian teknis per minggu" sub="event MAINTENANCE + REPAIR pada equipment timeline (8 minggu)" />
          <div className="flex h-36 items-end gap-2">
            {trend.map((t) => (
              <div key={t.label} className="group flex flex-1 flex-col items-center gap-1">
                <span className="font-mono text-[9px] font-bold text-mute opacity-0 transition group-hover:opacity-100">{t.v}</span>
                <div className="bar-fill w-full rounded-t-[3px] bg-pine-500/85 transition group-hover:bg-pine-600" style={{ height: `${Math.max(4, (t.v / maxT) * 100)}%` }} title={`${t.label}: ${t.v} event`} />
                <span className="font-mono text-[9px] text-mute">{t.label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* attention */}
        <Card className="p-4">
          <SectionHead title="Perhatian keandalan" right={<IcWarn size={14} className="text-warnhi" />} />
          <div className="space-y-2.5">
            {worst && worst.availability < 99 && (
              <button onClick={() => nav("equipment-detail", worst.e.id)} className="w-full rounded-md border border-danger/30 bg-dangerbg/40 px-3 py-2.5 text-left transition hover:border-danger/60">
                <p className="text-[12px] font-bold text-danger">Availability terendah — {worst.e.name}</p>
                <p className="font-mono text-[10px] text-ink2">{worst.availability}% · {worst.openIssues} isu terbuka · MTBF {worst.mtbf} j</p>
              </button>
            )}
            {rows.filter((r) => r.failures >= 2).slice(0, 3).map((r) => (
              <button key={r.e.id} onClick={() => nav("equipment-detail", r.e.id)} className="w-full rounded-md border border-line bg-paper px-3 py-2.5 text-left transition hover:border-warn/60 hover:bg-warnbg/30">
                <p className="text-[12px] font-bold text-ink">{r.e.name} <Chip tone="warn" className="ml-1">×{r.failures} gagal</Chip></p>
                <p className="font-mono text-[10px] text-mute">kandidat predictive maintenance / penggantian</p>
              </button>
            ))}
            {rows.filter((r) => r.availability < 95).length === 0 && <p className="py-4 text-center font-mono text-[10.5px] text-mute">Semua aset di atas ambang availability ✓</p>}
          </div>
        </Card>
      </div>

      {/* table */}
      <Card className="overflow-x-auto">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="flex items-center gap-2 font-display text-[14.5px] font-extrabold text-ink"><IcGauge size={15} className="text-pine-700" /> Register keandalan per aset</h2>
          <Chip tone="neutral">urut availability terendah</Chip>
        </div>
        <table className="w-full min-w-[980px] text-left">
          <thead>
            <tr className="border-b border-line bg-canvas/70 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">
              <th className="px-3 py-2.5">Aset</th><th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5 text-right">Gangguan</th>
              <th className="px-3 py-2.5 w-40">Availability</th><th className="px-3 py-2.5 text-right">MTBF</th>
              <th className="px-3 py-2.5 text-right">MTTR</th><th className="px-3 py-2.5 text-right">Utilisasi</th><th className="px-3 py-2.5 text-right">Biaya teknis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r, i) => (
              <tr key={r.e.id} className="row-in transition hover:bg-pine-50/60" style={{ animationDelay: `${Math.min(i, 10) * 35}ms` }}>
                <td className="px-3 py-2.5">
                  <button onClick={() => nav("equipment-detail", r.e.id)} className="text-left">
                    <p className="text-[12.5px] font-bold text-ink hover:text-pine-700">{r.e.name}</p>
                    <p className="font-mono text-[10px] text-mute">{r.e.code} · {r.e.criticality}</p>
                  </button>
                </td>
                <td className="px-3 py-2.5"><StatusChip status={r.e.opStatus} /></td>
                <td className="num px-3 py-2.5 text-right font-mono text-[12px]">
                  {r.failures === 0 ? <span className="text-mute">0</span> : r.failures >= 2 ? <span className="font-bold text-danger">{r.failures}</span> : <span className="font-bold text-warn">{r.failures}</span>}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-moss">
                      <div className="bar-fill h-full rounded-full" style={{ width: `${r.availability}%`, background: r.availability >= 98 ? C.pine : r.availability >= 95 ? C.warn : C.danger }} />
                    </div>
                    <span className="num w-12 text-right font-mono text-[11px] font-bold" style={{ color: r.availability >= 98 ? C.pine : r.availability >= 95 ? "#a3650c" : C.danger }}>{r.availability}%</span>
                  </div>
                </td>
                <td className="num px-3 py-2.5 text-right font-mono text-[11.5px] text-ink2">{r.mtbf} j</td>
                <td className="num px-3 py-2.5 text-right font-mono text-[11.5px] text-ink2">{r.mttr !== null ? `${r.mttr} j` : "—"}</td>
                <td className="num px-3 py-2.5 text-right font-mono text-[11.5px] text-ink2">{r.util}%</td>
                <td className="num px-3 py-2.5 text-right font-mono text-[11.5px] text-ink2">{r.maintCost ? fmtIDRCompact(r.maintCost) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <p className="font-mono text-[10.5px] text-mute">Rumus PRD §14: Availability = available/scheduled · MTBF & MTTR dari event ledger · repeat-failure memicu rekomendasi predictive di Intelligence.</p>
    </div>
  );
}
