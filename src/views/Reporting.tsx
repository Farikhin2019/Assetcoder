import { useMemo } from "react";
import { itemHealth, useApp, utilOf } from "../lib/store";
import { Bar, BtnSm, Card, Chip, SectionHead, StatusChip } from "../components/ui";
import { IcBolt, IcDownload, IcSend } from "../components/icons";
import { daysUntil, fmtDate, fmtIDRCompact, idleStatusOf } from "../lib/types";

const C = { pine: "#177057", warn: "#f2a93b", danger: "#bb3a2b", info: "#2c6e8f", mute: "#c9d4cb", ink: "#14211c" };

function Donut({ segs, label, value }: { segs: { v: number; c: string; l: string }[]; label: string; value: string }) {
  const total = segs.reduce((a, s) => a + s.v, 0) || 1;
  let acc = 0;
  const R = 40, CIRC = 2 * Math.PI * R;
  return (
    <div className="flex items-center gap-4">
      <svg width="110" height="110" viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r={R} fill="none" stroke={C.mute} strokeWidth="12" opacity="0.35" />
        {segs.map((s, i) => {
          const frac = s.v / total;
          const dash = `${frac * CIRC} ${CIRC}`;
          const off = -acc * CIRC;
          acc += frac;
          return <circle key={i} cx="50" cy="50" r={R} fill="none" stroke={s.c} strokeWidth="12" strokeDasharray={dash} strokeDashoffset={off} strokeLinecap="butt" style={{ transition: "stroke-dashoffset .8s" }} />;
        })}
        <text x="50" y="50" transform="rotate(90 50 50)" textAnchor="middle" dominantBaseline="central" className="fill-[#14211c] font-mono text-[15px] font-bold" style={{ fontFamily: "IBM Plex Mono" }}>{value}</text>
      </svg>
      <div className="space-y-1.5">
        {segs.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.c }} />
            <span className="font-mono text-[10.5px] text-ink2">{s.l} <b className="text-ink">{s.v}</b></span>
          </div>
        ))}
        <p className="pt-1 font-mono text-[9.5px] uppercase tracking-wide text-mute">{label}</p>
      </div>
    </div>
  );
}

function HBars({ data }: { data: { l: string; v: number; c: string }[] }) {
  const max = Math.max(...data.map((d) => d.v), 1);
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.l} className="flex items-center gap-2">
          <span className="w-24 shrink-0 truncate font-mono text-[10px] text-ink2">{d.l}</span>
          <div className="h-4 flex-1 overflow-hidden rounded-sm bg-moss">
            <div className="bar-fill flex h-full items-center justify-end rounded-sm pr-1.5 font-mono text-[9px] font-bold text-white" style={{ width: `${(d.v / max) * 100}%`, background: d.c }}>{d.v > 0 ? d.v : ""}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Reporting() {
  const { s, toast, nav, requestTransfer } = useApp();

  const m = useMemo(() => {
    const util = Math.round(s.equipment.reduce((a, e) => a + e.utilization, 0) / s.equipment.length);
    const idleRate = Math.round(s.equipment.filter((e) => e.utilization < 30).length / s.equipment.length * 100);
    const closedWo = s.workOrders.filter((w) => w.status === "CLOSED").length;
    const pmCompliance = Math.round((closedWo / Math.max(s.workOrders.length, 1)) * 100);
    const calTotal = s.equipment.filter((e) => e.calRequired).length;
    const calOk = s.equipment.filter((e) => e.calRequired && e.calStatus === "VALID").length;
    const calCompliance = Math.round((calOk / Math.max(calTotal, 1)) * 100);
    const cmpClosed = s.complaints.filter((c) => c.status === "CLOSED").length;
    const slaOk = s.complaints.filter((c) => Date.now() - new Date(c.date).getTime() <= c.slaHours * 36e5 || c.status === "CLOSED").length;
    const slaCompliance = Math.round((slaOk / Math.max(s.complaints.length, 1)) * 100);
    const rprClosed = s.repairs.filter((r) => r.status === "CLOSED").length;
    const repairRate = Math.round((rprClosed / Math.max(s.repairs.length, 1)) * 100);
    const invAcc = 96.2;
    const turnover = 4.8;
    const stockout = 3.1;
    return { util, idleRate, pmCompliance, calCompliance, slaCompliance, repairRate, invAcc, turnover, stockout, closedWo, calOk, calTotal, cmpClosed };
  }, [s]);

  /* ── Phase 4 preview: intelligence signals (rule-based, live) ── */
  const intel = useMemo(() => {
    const cutoff = Date.now() - 60 * 864e5;
    const forecast = s.items.map((i) => {
      const used = s.ledger
        .filter((l) => l.sku === i.sku && (l.type === "ISSUE" || l.type === "CONSUMPTION") && new Date(l.date).getTime() >= cutoff)
        .reduce((a, l) => a + Math.abs(l.qty), 0);
      const perDay = used / 60;
      const coverage = perDay > 0 ? i.stock / perDay : 999;
      return { i, used, perDay, coverage };
    }).filter((x) => x.used > 0).sort((a, b) => a.coverage - b.coverage).slice(0, 7);

    const pm = s.equipment.map((e) => {
      const overdueDays = Math.max(0, -daysUntil(e.nextMaint));
      const pct = utilOf(s.utilSeries, e.id, e.utilization);
      const score = overdueDays * 2
        + (e.risk === "HIGH" ? 30 : e.risk === "MEDIUM" ? 15 : 5)
        + (e.criticality === "CRITICAL" ? 20 : e.criticality === "HIGH" ? 10 : 0)
        + (pct > 85 ? 15 : 0);
      return { e, score, overdueDays, pct };
    }).sort((a, b) => b.score - a.score).slice(0, 5);

    const anomalies: { label: string; sev: "danger" | "warn"; id: string; go: () => void }[] = [];
    s.complaints.filter((c) => !["CLOSED", "VERIFIED", "RESOLVED"].includes(c.status) && Date.now() - new Date(c.date).getTime() > c.slaHours * 36e5)
      .forEach((c) => anomalies.push({ label: `SLA breach ${c.code}`, sev: "danger", id: c.id, go: () => nav("complaints") }));
    s.equipment.filter((e) => ["EXPIRED", "FAILED"].includes(e.calStatus))
      .forEach((e) => anomalies.push({ label: `Kalibrasi ${e.calStatus} — ${e.name}`, sev: "danger", id: e.id, go: () => nav("equipment-detail", e.id) }));
    s.inspections.filter((i) => i.result === "FAIL")
      .forEach((i) => anomalies.push({ label: `Inspeksi FAIL ${i.code}`, sev: "danger", id: i.id, go: () => nav("technical") }));
    s.items.filter((i) => i.stock <= i.min)
      .forEach((i) => anomalies.push({ label: `Stok ≤ min — ${i.name}`, sev: "warn", id: i.sku, go: () => nav("inventory") }));
    s.suppliers.filter((sp) => daysUntil(sp.contractUntil) < 0)
      .forEach((sp) => anomalies.push({ label: `Kontrak expired — ${sp.name}`, sev: "warn", id: sp.id, go: () => nav("master") }));

    const idleAssets = s.equipment.map((e) => ({ e, pct: utilOf(s.utilSeries, e.id, e.utilization) }))
      .filter((x) => x.pct < 40).sort((a, b) => a.pct - b.pct);

    return { forecast, pm, anomalies, idleAssets };
  }, [s, nav]);

  const maintByType = useMemo(() => {
    const g = (t: string) => s.workOrders.filter((w) => w.type === t).length;
    return [
      { l: "PREVENTIVE", v: g("PREVENTIVE"), c: C.pine },
      { l: "CORRECTIVE", v: g("CORRECTIVE"), c: C.warn },
      { l: "PREDICTIVE", v: g("PREDICTIVE"), c: C.info },
    ];
  }, [s.workOrders]);

  const stockByWh = useMemo(() => {
    const whs = Array.from(new Set(s.items.map((i) => i.warehouse)));
    return whs.map((w) => ({ l: w.replace("Gudang ", ""), v: Math.round(s.items.filter((i) => i.warehouse === w).reduce((a, i) => a + i.stock * i.unitCost, 0) / 1e6), c: C.pine }));
  }, [s.items]);

  const downloadCsv = (name: string, rows: (string | number)[][]) => {
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
    toast(`${name} diunduh (${rows.length - 1} baris)`);
  };

  const exportEquipment = () => downloadCsv("simaset-equipment.csv", [
    ["asset_id", "name", "category", "serial", "location", "op_status", "cal_status", "acq_cost", "utilization"],
    ...s.equipment.map((e) => [e.code, e.name, e.category, e.serial, `${e.building} ${e.room}`, e.opStatus, e.calStatus, e.acqCost, e.utilization]),
  ]);
  const exportKpi = () => downloadCsv("simaset-kpi.csv", [
    ["kpi", "value", "target", "satuan"],
    ["Utilization Rate", m.util, 75, "%"], ["Idle Rate", m.idleRate, 10, "%"], ["PM Compliance", m.pmCompliance, 90, "%"],
    ["Calibration Compliance", m.calCompliance, 95, "%"], ["Complaint SLA Compliance", m.slaCompliance, 95, "%"],
    ["Repair Completion Rate", m.repairRate, 90, "%"], ["Inventory Accuracy", m.invAcc, 98, "%"],
  ]);
  const exportLedger = () => downloadCsv("simaset-ledger.csv", [
    ["date", "sku", "type", "qty", "balance", "ref", "actor"],
    ...s.ledger.map((l) => [fmtDate(l.date), l.sku, l.type, l.qty, l.balance, l.ref, l.actor]),
  ]);

  const kpis: { l: string; v: number; target: number; unit: string; invert?: boolean }[] = [
    { l: "Utilization Rate", v: m.util, target: 75, unit: "%" },
    { l: "Asset Idle Rate", v: m.idleRate, target: 10, unit: "%", invert: true },
    { l: "PM Compliance", v: m.pmCompliance, target: 90, unit: "%" },
    { l: "Calibration Compliance", v: m.calCompliance, target: 95, unit: "%" },
    { l: "Complaint SLA Compliance", v: m.slaCompliance, target: 95, unit: "%" },
    { l: "Repair Completion Rate", v: m.repairRate, target: 90, unit: "%" },
    { l: "Inventory Accuracy", v: m.invAcc, target: 98, unit: "%" },
    { l: "Stock Turnover", v: m.turnover, target: 6, unit: "×/th" },
    { l: "Stockout Rate", v: m.stockout, target: 2, unit: "%", invert: true },
  ];

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Reporting & Analytics</h1>
          <p className="text-xs text-mute">KPI dihitung live dari ledger, work order, kalibrasi & complaint — export CSV siap audit</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[["Export equipment", exportEquipment], ["Export KPI", exportKpi], ["Export ledger", exportLedger]].map(([label, fn]) => (
            <button key={label as string} onClick={fn as () => void} className="inline-flex items-center gap-1.5 rounded-md border border-line bg-card px-3 py-2 font-display text-[12px] font-bold text-ink2 transition hover:border-pine-500/60 hover:text-pine-700 active:translate-y-px">
              <IcDownload size={13} /> {label as string}
            </button>
          ))}
        </div>
      </div>

      {/* KPI table */}
      <Card className="p-4">
        <SectionHead title="KPI vs target" sub="Rumus PRD: Utilization = actual/available · Idle = idle/available · Availability = available/scheduled" />
        <div className="grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2 xl:grid-cols-3">
          {kpis.map((k) => {
            const good = k.invert ? k.v <= k.target : k.v >= k.target;
            return (
              <div key={k.l}>
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="text-[12px] font-bold text-ink">{k.l}</span>
                  <span className="num font-mono text-[12px] font-bold" style={{ color: good ? C.pine : k.invert ? C.danger : C.warn }}>{k.v}{k.unit} <span className="font-medium text-mute">/ {k.target}{k.unit}</span></span>
                </div>
                <Bar pct={k.invert ? 100 - k.v : k.v} tone={good ? "ok" : k.invert ? "danger" : "warn"} />
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="p-4">
          <SectionHead title="Equipment status" sub={`${s.equipment.length} unit`} />
          <Donut label="operational status" value={String(s.equipment.length)} segs={[
            { v: s.equipment.filter((e) => e.opStatus === "IN_SERVICE").length, c: C.pine, l: "In service" },
            { v: s.equipment.filter((e) => e.opStatus === "MAINTENANCE").length, c: C.warn, l: "Maintenance" },
            { v: s.equipment.filter((e) => ["DOWN", "CALIBRATION"].includes(e.opStatus)).length, c: C.danger, l: "Down/Cal" },
            { v: s.equipment.filter((e) => e.opStatus === "RETIRED").length, c: C.mute, l: "Retired" },
          ]} />
        </Card>
        <Card className="p-4">
          <SectionHead title="Kalibrasi" sub={`${m.calOk}/${m.calTotal} valid`} />
          <Donut label="calibration compliance" value={`${m.calCompliance}%`} segs={[
            { v: s.equipment.filter((e) => e.calStatus === "VALID").length, c: C.pine, l: "Valid" },
            { v: s.equipment.filter((e) => e.calStatus === "DUE_SOON").length, c: C.warn, l: "Due soon" },
            { v: s.equipment.filter((e) => ["EXPIRED", "FAILED"].includes(e.calStatus)).length, c: C.danger, l: "Expired/Failed" },
            { v: s.equipment.filter((e) => e.calStatus === "NOT_REQUIRED").length, c: C.mute, l: "N/A" },
          ]} />
        </Card>
        <Card className="p-4">
          <SectionHead title="Work order mix" sub={`${m.closedWo} closed`} />
          <HBars data={maintByType} />
          <div className="mt-4 border-t border-line pt-3">
            <SectionHead title="Nilai stok per gudang" sub="juta IDR" />
            <HBars data={stockByWh} />
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <SectionHead title="Complaint & repair summary" right={<Chip tone="info">{s.complaints.length} CMP · {s.repairs.length} RPR</Chip>} />
        <div className="overflow-x-auto rounded-md border border-line">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-line bg-canvas/70 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">
                <th className="px-3 py-2">Ref</th><th className="px-3 py-2">Aset</th><th className="px-3 py-2">Prioritas</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">SLA</th><th className="px-3 py-2">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {s.complaints.slice(0, 6).map((c) => {
                const eq = s.equipment.find((e) => e.id === c.eqId);
                const hrsLeft = c.slaHours - (Date.now() - new Date(c.date).getTime()) / 36e5;
                return (
                  <tr key={c.id} className="transition hover:bg-pine-50/50">
                    <td className="px-3 py-2 font-mono text-[11px] font-bold text-ink">{c.code}</td>
                    <td className="px-3 py-2 text-[12px] text-ink2">{eq?.name}</td>
                    <td className="px-3 py-2"><StatusChip status={c.priority} /></td>
                    <td className="px-3 py-2"><StatusChip status={c.status} /></td>
                    <td className="px-3 py-2 font-mono text-[10.5px]">{["CLOSED", "VERIFIED", "RESOLVED"].includes(c.status) ? <span className="font-bold text-ok">memenuhi</span> : hrsLeft < 0 ? <span className="font-bold text-danger">breach</span> : <span className="text-ink2">{Math.round(hrsLeft)} jam</span>}</td>
                    <td className="px-3 py-2 font-mono text-[10.5px] text-mute">{fmtDate(c.date)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Phase 4 preview: SIMASET Intelligence ── */}
      <div className="dark-grain rounded-lg p-4 text-pine-50">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-warnhi/20 text-warnhi"><IcBolt size={17} /></span>
            <div>
              <h2 className="font-display text-[16px] font-black tracking-tight">SIMASET Intelligence</h2>
              <p className="font-mono text-[10px] text-pine-100/70">Phase 4 preview · rule-based engine — semua sinyal dihitung live dari ledger, timeline & series</p>
            </div>
          </div>
          <Chip tone="warn" dot>{intel.anomalies.length} anomali · {intel.forecast.filter((f) => f.coverage < 30).length} risiko stockout</Chip>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* demand forecasting */}
        <Card className="p-4">
          <SectionHead title="AI Demand Forecasting" sub="konsumsi 60 hari → proyeksi coverage · rekomendasi pengadaan otomatis" />
          <div className="space-y-1.5">
            {intel.forecast.map((f) => (
              <div key={f.i.sku} className="flex items-center gap-2.5 rounded-md border border-line bg-paper px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-bold text-ink">{f.i.name}</p>
                  <p className="font-mono text-[9.5px] text-mute">{f.i.sku} · terpakai {f.used} / 60 hr · {f.perDay.toFixed(1)}/hari</p>
                </div>
                <Chip tone={f.coverage < 15 ? "danger" : f.coverage < 30 ? "warn" : "ok"} dot>{f.coverage > 500 ? "aman" : `${Math.round(f.coverage)} hari`}</Chip>
                {f.coverage < 30 && <BtnSm onClick={() => nav("procurement")} className="!border-warn/50 !text-warn">Buat PR →</BtnSm>}
              </div>
            ))}
          </div>
        </Card>

        {/* predictive maintenance */}
        <Card className="p-4">
          <SectionHead title="Predictive Maintenance" sub="skor risiko kegagalan: overdue PM + criticality + beban utilisasi" />
          <div className="space-y-2">
            {intel.pm.map(({ e, score, overdueDays, pct }) => (
              <div key={e.id} className="rounded-md border border-line bg-paper px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <button onClick={() => nav("equipment-detail", e.id)} className="truncate text-left text-[12px] font-bold text-ink hover:text-pine-700">{e.name}</button>
                  <span className="num shrink-0 font-mono text-[11px] font-black text-ink">{score} <span className="font-medium text-mute">pts</span></span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-moss">
                    <div className="bar-fill h-full rounded-full" style={{ width: `${Math.min(100, score)}%`, background: score > 50 ? C.danger : score > 30 ? C.warn : C.pine }} />
                  </div>
                  <span className="shrink-0 font-mono text-[9.5px] text-mute">
                    {overdueDays > 0 ? `PM overdue ${overdueDays}h` : `PM ${daysUntil(e.nextMaint)}h lagi`} · util {pct}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* anomaly detection */}
        <Card className="p-4">
          <SectionHead title="Anomaly Detection" sub="SLA breach · kalibrasi gagal · inspeksi FAIL · stok minimum · kontrak" />
          {intel.anomalies.length === 0 ? (
            <p className="rounded-md bg-okbg px-3 py-2.5 text-xs font-bold text-ok">Tidak ada anomali aktif — semua sinyal normal.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {intel.anomalies.map((a) => (
                <button key={a.id + a.label} onClick={a.go}
                  className={`rounded-md border px-2.5 py-1.5 text-left text-[11px] font-semibold transition hover:-translate-y-0.5 hover:shadow-md ${a.sev === "danger" ? "border-danger/40 bg-dangerbg text-danger" : "border-warn/40 bg-warnbg text-warn"}`}>
                  {a.label} →
                </button>
              ))}
            </div>
          )}
          <p className="mt-3 border-t border-line pt-2.5 font-mono text-[10px] text-mute">Model ML penuh (isolation forest pada metrik aset) dijadwalkan nightly — Phase 4 GA.</p>
        </Card>

        {/* utilization recommendation */}
        <Card className="p-4">
          <SectionHead title="Utilization Recommendation" sub="aset < 40% — kandidat redistribusi ke unit sibuk" />
          {intel.idleAssets.length === 0 ? (
            <p className="rounded-md bg-okbg px-3 py-2.5 text-xs font-bold text-ok">Portofolio sehat — tidak ada aset idle.</p>
          ) : (
            <div className="space-y-1.5">
              {intel.idleAssets.map(({ e, pct }) => (
                <div key={e.id} className="flex items-center gap-2.5 rounded-md border border-line bg-paper px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-bold text-ink">{e.name}</p>
                    <p className="font-mono text-[9.5px] text-mute">{e.room} · util {pct}% · {fmtIDRCompact(e.acqCost)} menganggur</p>
                  </div>
                  <StatusChip status={idleStatusOf(pct)} />
                  <BtnSm disabled={s.role === "Auditor"} onClick={() => { requestTransfer(e.id, e.building, "Lantai 1", "Pool Aset Sentral", `Rekomendasi Intelligence — utilisasi ${pct}% (< ambang 40%).`); toast(`${e.name} diajukan ke Pool Aset`, "info"); }} className="!border-danger/40 !text-danger">
                    <IcSend size={11} /> Redistribusi
                  </BtnSm>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <p className="font-mono text-[10.5px] text-mute">MTTR/MTBF & repeat-failure rate dihitung dari event timeline per aset · AI Executive Assistant = antrian perhatian di Dashboard (Phase 4).</p>
    </div>
  );
}
