import { useEffect, useMemo, useState } from "react";
import { useApp, utilOf } from "../lib/store";
import { DEPR_SALVAGE, fmtIDRCompact, monthlyDep } from "../lib/types";
import { BRANCHES } from "../lib/data";
import { IcPulse, IcWarn, IcBolt, IcClock } from "../components/icons";

/* dark control-room palette */
const C = {
  bg: "#0b1a15", panel: "#10251e", line: "#1e3a30", line2: "#2b4d40",
  text: "#e8f2ec", mute: "#7fa093", dim: "#4c6a5e",
  pine: "#35c79a", amber: "#f2a93b", red: "#ff7a66", blue: "#5ec8e5",
};

const Panel = ({ className = "", children }: { className?: string; children: React.ReactNode }) => (
  <div className={`rounded-lg border p-4 ${className}`} style={{ background: C.panel, borderColor: C.line }}>{children}</div>
);
const PLabel = ({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) => (
  <div className="mb-3 flex items-center justify-between">
    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: C.mute }}>{children}</p>
    {right}
  </div>
);

function Ticker({ items }: { items: string[] }) {
  return (
    <div className="overflow-hidden rounded-md border py-2" style={{ borderColor: C.line, background: "rgba(53,199,154,0.04)" }}>
      <div className="ticker-track flex w-max gap-10 whitespace-nowrap font-mono text-[11px]" style={{ color: C.mute }}>
        {[...items, ...items].map((t, i) => (
          <span key={i} className="flex items-center gap-2"><span style={{ color: C.pine }}>▮</span>{t}</span>
        ))}
      </div>
    </div>
  );
}

export default function Command() {
  const { s, nav } = useApp();
  const [clock, setClock] = useState(new Date());
  useEffect(() => {
    const h = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(h);
  }, []);

  const fin = useMemo(() => {
    const acq = s.equipment.reduce((a, e) => a + e.acqCost, 0);
    const nbv = s.equipment.reduce((a, e) => a + (e.acqCost - Math.min(e.acqCost * (1 - DEPR_SALVAGE), (s.deprPosted[e.id] ?? []).length * monthlyDep(e.acqCost, e.category))), 0);
    const runRate = s.equipment.reduce((a, e) => a + monthlyDep(e.acqCost, e.category), 0);
    const invValue = s.items.reduce((a, i) => a + i.stock * i.unitCost, 0);
    const maintYtd = s.timeline.filter((t) => t.cost).reduce((a, t) => a + (t.cost ?? 0), 0);
    return { acq, nbv, runRate, invValue, maintYtd };
  }, [s]);

  const ops = useMemo(() => ({
    openWo: s.workOrders.filter((w) => w.status !== "CLOSED").length,
    openCmp: s.complaints.filter((x) => !["CLOSED", "VERIFIED", "RESOLVED"].includes(x.status)).length,
    calAction: s.equipment.filter((e) => ["DUE_SOON", "EXPIRED", "FAILED"].includes(e.calStatus)).length,
    pending: s.approvals.filter((a) => a.status === "PENDING").length,
  }), [s]);

  const branches = useMemo(() => BRANCHES.map((b) => b.id === "BR-01" ? { ...b, assets: s.equipment.length, openIssues: ops.openCmp + ops.calAction } : b), [s.equipment.length, ops]);

  const tickerItems = useMemo(() => [
    `${s.equipment.length} aset medis terdaftar`,
    `${ops.openWo} work order berjalan`,
    `${ops.openCmp} keluhan terbuka`,
    `${ops.calAction} kalibrasi butuh aksi`,
    `${ops.pending} persetujuan menunggu`,
    `Nilai buku portofolio ${fmtIDRCompact(fin.nbv)}`,
    `Run-rate depresiasi ${fmtIDRCompact(fin.runRate)}/bln`,
    `Stok inventory ${fmtIDRCompact(fin.invValue)}`,
  ], [s.equipment.length, ops, fin]);

  /* risk heatmap: 8 x N grid of equipment, colored by risk x status */
  const heat = (e: (typeof s.equipment)[0]) => {
    if (e.opStatus === "DOWN" || e.calStatus === "EXPIRED" || e.calStatus === "FAILED") return C.red;
    if (e.risk === "HIGH") return e.opStatus === "IN_SERVICE" ? "#2a8f6e" : C.amber;
    if (e.risk === "MEDIUM") return "#2a8f6e";
    return "#1e5c47";
  };

  const kpis = [
    { l: "Nilai Perolehan", v: fmtIDRCompact(fin.acq), sub: "seluruh cabang", c: C.pine, icon: <IcBolt size={15} /> },
    { l: "Nilai Buku (NBV)", v: fmtIDRCompact(fin.nbv), sub: `${Math.round((fin.nbv / fin.acq) * 100)}% dari perolehan`, c: C.blue, icon: <IcPulse size={15} /> },
    { l: "Depresiasi / Bulan", v: fmtIDRCompact(fin.runRate), sub: "run-rate aktif", c: C.amber, icon: <IcClock size={15} /> },
    { l: "Belanja Pemeliharaan", v: fmtIDRCompact(fin.maintYtd), sub: "tercatat di timeline", c: "#c792ea", icon: <IcWarn size={15} /> },
  ];

  return (
    <div className="view-in space-y-4" style={{ color: C.text }}>
      {/* header strip */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: C.pine }}>Executive Command Center</p>
          <h1 className="font-display text-[24px] font-black tracking-tight" style={{ color: C.text }}>
            {s.config.orgName}
          </h1>
          <p className="text-xs" style={{ color: C.mute }}>{branches.filter((b) => b.status === "ACTIVE").length} cabang aktif · konsolidasi multi-branch · data live</p>
        </div>
        <div className="text-right">
          <p className="num font-mono text-[26px] font-bold leading-none" style={{ color: C.pine }}>
            {clock.toLocaleTimeString("id-ID")}
          </p>
          <p className="font-mono text-[10px]" style={{ color: C.mute }}>{clock.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · WIB</p>
        </div>
      </div>

      <Ticker items={tickerItems} />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k, i) => (
          <Panel key={k.l} className="row-in relative overflow-hidden" >
            <div style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-wide" style={{ color: C.mute }}>{k.l}</p>
                <span style={{ color: k.c }}>{k.icon}</span>
              </div>
              <p className="num mt-2 font-display text-[24px] font-black leading-none" style={{ color: C.text }}>{k.v}</p>
              <p className="mt-1 font-mono text-[10px]" style={{ color: C.dim }}>{k.sub}</p>
              <div className="absolute inset-x-0 bottom-0 h-[2px]" style={{ background: k.c, opacity: 0.6 }} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* branch consolidation */}
        <Panel className="lg:col-span-2">
          <PLabel right={<button onClick={() => nav("assetledger")} className="font-mono text-[10px] underline transition hover:opacity-70" style={{ color: C.pine }}>buku aset →</button>}>Konsolidasi Cabang</PLabel>
          <div className="space-y-2.5">
            {branches.map((b, i) => {
              const maxV = Math.max(...branches.map((x) => x.value), 1);
              return (
                <div key={b.id} className="row-in" style={{ animationDelay: `${i * 70}ms` }}>
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded px-1.5 py-0.5 font-mono text-[9px] font-bold" style={{ background: b.status === "ACTIVE" ? "rgba(53,199,154,0.15)" : "rgba(242,169,59,0.15)", color: b.status === "ACTIVE" ? C.pine : C.amber }}>{b.code}</span>
                      <span className="text-[12.5px] font-bold">{b.name}</span>
                    </div>
                    <span className="num font-mono text-[11.5px] font-bold" style={{ color: C.text }}>{b.status === "SETUP" ? "dalam setup" : fmtIDRCompact(b.value)}</span>
                  </div>
                  {b.status === "ACTIVE" && (
                    <div className="mt-1.5 flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: C.line }}>
                        <div className="bar-fill h-full rounded-full" style={{ width: `${(b.value / maxV) * 100}%`, background: `linear-gradient(90deg, ${C.pine}, ${C.blue})` }} />
                      </div>
                      <div className="flex w-44 shrink-0 gap-3 font-mono text-[9.5px]" style={{ color: C.mute }}>
                        <span>{b.assets} aset</span>
                        <span>util {b.util}%</span>
                        <span style={{ color: b.openIssues > 4 ? C.red : C.mute }}>{b.openIssues} isu</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Panel>

        {/* operational pulse */}
        <Panel>
          <PLabel>Denyut Operasional</PLabel>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { l: "Work Order", v: ops.openWo, c: C.blue, go: () => nav("technical") },
              { l: "Keluhan", v: ops.openCmp, c: C.red, go: () => nav("complaints") },
              { l: "Kalibrasi", v: ops.calAction, c: C.amber, go: () => nav("technical") },
              { l: "Approval", v: ops.pending, c: C.pine, go: () => nav("approvals") },
            ].map((o) => (
              <button key={o.l} onClick={o.go} className="group rounded-md border p-3 text-left transition hover:-translate-y-0.5" style={{ borderColor: C.line, background: "rgba(255,255,255,0.02)" }}>
                <p className="num font-display text-[24px] font-black leading-none" style={{ color: o.c }}>{o.v}</p>
                <p className="mt-1 font-mono text-[9.5px] uppercase tracking-wide" style={{ color: C.mute }}>{o.l}</p>
                <p className="mt-0.5 font-mono text-[9px] opacity-0 transition group-hover:opacity-100" style={{ color: o.c }}>buka →</p>
              </button>
            ))}
          </div>
          <div className="mt-3 rounded-md border p-2.5" style={{ borderColor: C.line, background: "rgba(53,199,154,0.05)" }}>
            <p className="font-mono text-[9.5px]" style={{ color: C.mute }}>Ketersediaan sistem <b style={{ color: C.pine }}>99,94%</b> · API p95 <b style={{ color: C.pine }}>&lt; 500ms</b> · target SLA terpenuhi</p>
          </div>
        </Panel>
      </div>

      {/* risk heatmap */}
      <Panel>
        <PLabel right={
          <div className="flex items-center gap-3 font-mono text-[9px]" style={{ color: C.mute }}>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: "#1e5c47" }} />risiko rendah</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: "#2a8f6e" }} />normal</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: C.amber }} />perhatian</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: C.red }} />kritis</span>
          </div>
        }>Peta Risiko Portofolio Aset</PLabel>
        <div className="flex flex-wrap gap-1.5">
          {s.equipment.map((e) => (
            <button key={e.id} onClick={() => nav("equipment-detail", e.id)} title={`${e.name} · ${e.risk} · ${e.opStatus}`}
              className="group relative h-9 rounded transition hover:scale-110 hover:ring-2"
              style={{ background: heat(e), width: `${Math.max(28, utilOf(s.utilSeries, e.id, e.utilization) * 0.9)}px`, ["--tw-ring-color" as string]: C.pine }}>
              <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded px-1.5 py-0.5 font-mono text-[9px] opacity-0 transition group-hover:opacity-100" style={{ background: C.bg, color: C.text, border: `1px solid ${C.line2}` }}>{e.name}</span>
            </button>
          ))}
        </div>
        <p className="mt-3 font-mono text-[9.5px]" style={{ color: C.dim }}>Lebar sel = utilisasi · warna = risiko × status operasional · klik untuk membuka Equipment 360°</p>
      </Panel>

      <p className="font-mono text-[10px]" style={{ color: C.dim }}>Command Center merangkum Phase 1–6: nilai buku dari depresiasi, denyut operasional dari WO/keluhan/kalibrasi/approval, dan peta risiko dari equipment registry — seluruhnya dihitung live.</p>
    </div>
  );
}
