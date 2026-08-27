import { useMemo, useState } from "react";
import { useApp, utilOf } from "../lib/store";
import { BtnPrimary, BtnSm, Bar, Card, Chip, Input, Label, Modal, StatusChip, Bar as PBar } from "../components/ui";
import { IcBolt, IcClock, IcLayers, IcSend } from "../components/icons";
import { fmtIDRCompact, idleStatusOf, fmtDate } from "../lib/types";

const canLog = (role: string) => ["Teknisi", "Kepala Unit", "Petugas Gudang", "Kepala Teknisi", "Pengelola Aset", "Direksi"].includes(role);

function WeekBars({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[3px]" title={`8 minggu · ${data.join(", ")} jam`}>
      {data.map((v, i) => (
        <div key={i} className="group relative flex h-9 w-[9px] flex-col justify-end">
          <div
            className={`w-full rounded-[2px] transition-all duration-300 ${i === data.length - 1 ? "bg-warnhi group-hover:bg-warn" : "bg-pine-500/75 group-hover:bg-pine-600"}`}
            style={{ height: `${Math.max(6, (v / max) * 100)}%` }}
          />
          <span className="pointer-events-none absolute -top-6 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-pine-900 px-1.5 py-0.5 font-mono text-[9px] font-bold text-pine-50 opacity-0 shadow-lg transition group-hover:opacity-100">{v}j</span>
        </div>
      ))}
    </div>
  );
}

export default function Utilization() {
  const { s, nav, logUsage, requestTransfer, toast } = useApp();
  const [logEq, setLogEq] = useState<string | null>(null);
  const [hours, setHours] = useState("8");
  const [err, setErr] = useState("");

  const rows = useMemo(() => s.equipment
    .map((e) => {
      const pct = utilOf(s.utilSeries, e.id, e.utilization);
      return { e, pct, idle: idleStatusOf(pct), hours4: (s.utilSeries[e.id] ?? []).slice(-4).reduce((a, b) => a + b, 0) };
    })
    .sort((a, b) => a.pct - b.pct), [s.equipment, s.utilSeries]);

  const avg = Math.round(rows.reduce((a, r) => a + r.pct, 0) / Math.max(rows.length, 1));
  const idleCount = rows.filter((r) => r.idle === "IDLE" || r.idle === "UNUSED").length;
  const idleRate = Math.round((idleCount / Math.max(rows.length, 1)) * 100);
  const available = Math.round((s.equipment.filter((e) => e.opStatus === "IN_SERVICE").length / Math.max(s.equipment.length, 1)) * 100);
  const idleValue = rows.filter((r) => r.idle === "IDLE" || r.idle === "UNUSED").reduce((a, r) => a + r.e.acqCost, 0);

  const submitLog = () => {
    if (!logEq) return;
    const h = Number(hours);
    if (!(h > 0) || h > 168) return setErr("Jam pemakaian harus 1–168.");
    logUsage(logEq, h);
    setLogEq(null); setErr("");
  };

  const redistribute = (eqId: string, pct: number) => {
    const eq = s.equipment.find((e) => e.id === eqId)!;
    requestTransfer(eqId, eq.building, "Lantai 1", "Pool Aset Sentral", `Idle detection — utilisasi ${pct}% (ambang 15%). Kandidat redistribusi ke unit dengan utilisasi >85% atau pengembalian ke pengadaan.`);
    toast(`${eq.name} diajukan ke Pool Aset untuk redistribusi`, "info");
  };

  const logEqObj = s.equipment.find((e) => e.id === logEq);

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Asset Utilization</h1>
          <p className="text-xs text-mute">Utilization Rate = actual usage / available time · deteksi idle otomatis (ACTIVE / LOW_USAGE / IDLE / UNUSED)</p>
        </div>
        <Chip tone="danger" dot pulse={idleCount > 0}>{idleCount} IDLE · {fmtIDRCompact(idleValue)} menganggur</Chip>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: "Utilization Rate", v: `${avg}%`, sub: "rata-rata portofolio · target ≥75%", tone: avg >= 75 ? "text-ok" : "text-warn", icon: <IcBolt size={15} /> },
          { l: "Idle Rate", v: `${idleRate}%`, sub: `${idleCount} aset < 40% pemakaian`, tone: idleRate > 10 ? "text-danger" : "text-ok", icon: <IcLayers size={15} /> },
          { l: "Availability", v: `${available}%`, sub: "IN_SERVICE / total aset", tone: "text-info", icon: <IcClock size={15} /> },
          { l: "Nilai aset idle", v: fmtIDRCompact(idleValue), sub: "kandidat redistribusi / disposal", tone: "text-warn", icon: <IcSend size={15} /> },
        ].map((k, i) => (
          <Card key={k.l} className="row-in p-4" >
            <div className="flex items-start justify-between" style={{ animationDelay: `${i * 60}ms` }}>
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">{k.l}</p>
                <p className={`num mt-1.5 font-display text-[26px] font-black leading-none tracking-tight ${k.tone}`}>{k.v}</p>
                <p className="mt-1 font-mono text-[10px] text-mute">{k.sub}</p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-pine-100 text-pine-700">{k.icon}</span>
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[1020px] text-left">
          <thead>
            <tr className="border-b border-line bg-canvas/70 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">
              <th className="px-3 py-2.5">Aset</th>
              <th className="px-3 py-2.5">Jam / minggu (8 mgg)</th>
              <th className="px-3 py-2.5 text-right">4 mgg terakhir</th>
              <th className="px-3 py-2.5 w-44">Utilization</th>
              <th className="px-3 py-2.5">Status idle</th>
              <th className="px-3 py-2.5">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map(({ e, pct, idle, hours4 }, i) => (
              <tr key={e.id} className={`row-in transition hover:bg-pine-50/60 ${(idle === "IDLE" || idle === "UNUSED") ? "bg-warnbg/20" : ""}`} style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}>
                <td className="px-3 py-2.5">
                  <button onClick={() => nav("equipment-detail", e.id)} className="text-left">
                    <p className="text-[12.5px] font-bold text-ink hover:text-pine-700">{e.name}</p>
                    <p className="font-mono text-[10px] text-mute">{e.code} · {e.room}</p>
                  </button>
                </td>
                <td className="px-3 py-2.5"><WeekBars data={s.utilSeries[e.id] ?? []} /></td>
                <td className="num px-3 py-2.5 text-right font-mono text-[11.5px] font-bold text-ink">{hours4} <span className="text-[9.5px] font-medium text-mute">jam</span></td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <PBar pct={pct} tone={idle === "IDLE" || idle === "UNUSED" ? "danger" : idle === "LOW_USAGE" ? "warn" : "pine"} className="flex-1" />
                    <span className="num w-9 text-right font-mono text-[11px] font-bold text-ink">{pct}%</span>
                  </div>
                </td>
                <td className="px-3 py-2.5"><StatusChip status={idle} pulse={idle === "UNUSED"} /></td>
                <td className="px-3 py-2.5">
                  <div className="flex gap-1.5">
                    <BtnSm disabled={!canLog(s.role)} title={!canLog(s.role) ? "Butuh role unit/teknis" : undefined} onClick={() => { setLogEq(e.id); setHours("8"); setErr(""); }}>
                      <IcClock size={11} /> Catat jam
                    </BtnSm>
                    {(idle === "IDLE" || idle === "UNUSED") && (
                      <BtnSm disabled={s.role === "Auditor"} onClick={() => redistribute(e.id, pct)} className="!border-danger/40 !text-danger" title="Ajukan ke Pool Aset untuk redistribusi">
                        <IcSend size={11} /> Redistribusi
                      </BtnSm>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-[10.5px] text-mute">
        <span>≥65% <StatusChip status="ACTIVE" /></span>
        <span>40–64% <StatusChip status="LOW_USAGE" /></span>
        <span>15–39% <StatusChip status="IDLE" /></span>
        <span>&lt;15% <StatusChip status="UNUSED" /></span>
        <span className="self-center">· ambang configurable · event ASSET_IDLE → notifikasi</span>
      </div>

      <Modal open={!!logEq} onClose={() => setLogEq(null)} kicker="Usage logging · mobile/PWA sync" title={`Catat pemakaian — ${logEqObj?.name ?? ""}`}
        footer={<><BtnSm onClick={() => setLogEq(null)} className="!py-2">Batal</BtnSm>
          <BtnPrimary onClick={submitLog}><IcClock size={13} /> Catat ke minggu berjalan</BtnPrimary></>}
      >
        <div className="space-y-3.5">
          <p className="rounded-md bg-infobg px-3 py-2 text-xs font-semibold text-info">Input dari lapangan (scan QR → log pemakaian) disinkron dari offline queue dan menambah jam pada minggu berjalan.</p>
          <div><Label>Jam pemakaian (minggu ini) *</Label><Input type="number" value={hours} onChange={(e) => setHours(e.target.value)} /></div>
          <p className="font-mono text-[10.5px] text-mute">Tersedia 168 jam/minggu · {logEqObj ? `utilization saat ini ${utilOf(s.utilSeries, logEqObj.id, logEqObj.utilization)}%` : ""} · terakhir diperbarui {fmtDate(new Date().toISOString())}</p>
          {err && <p className="rounded-md bg-dangerbg px-3 py-2 text-xs font-semibold text-danger">{err}</p>}
        </div>
      </Modal>
    </div>
  );
}
