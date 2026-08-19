import { useMemo, useState } from "react";
import { useApp } from "../lib/store";
import { BtnGhost, BtnPrimary, BtnSm, Card, Chip, Modal, StatusChip } from "../components/ui";
import { IcLedger } from "../components/icons";
import { DEPR_SALVAGE, fmtDate, fmtIDR, fmtIDRCompact, lifeYears, monthlyDep, periodKey } from "../lib/types";

export default function Depreciation() {
  const { s, nav, postDepreciation } = useApp();
  const [confirm, setConfirm] = useState(false);
  const canPost = ["Pengelola Aset", "Direksi", "Pengelola Inventory", "IT Administrator"].includes(s.role);
  const period = periodKey(new Date());

  const rows = useMemo(() => s.equipment.map((e) => {
    const monthly = monthlyDep(e.acqCost, e.category);
    const lifeM = lifeYears(e.category) * 12;
    const posted = (s.deprPosted[e.id] ?? []).length;
    const done = posted >= lifeM;
    const accum = Math.min(e.acqCost * (1 - DEPR_SALVAGE), posted * monthly);
    const nbv = e.acqCost - accum;
    return { e, monthly, lifeM, posted, accum, nbv, done, current: !(s.deprPosted[e.id] ?? []).includes(period) };
  }), [s.equipment, s.deprPosted, period]);

  const totAcq = rows.reduce((a, r) => a + r.e.acqCost, 0);
  const totAccum = rows.reduce((a, r) => a + r.accum, 0);
  const totNbv = totAcq - totAccum;
  const runRate = rows.filter((r) => !r.done).reduce((a, r) => a + r.monthly, 0);
  const pendingCount = rows.filter((r) => r.current && !r.done).length;

  /* chart: beban bulanan 12 bulan terakhir (aproksimasi portofolio aktif) */
  const months = useMemo(() => {
    const out: { key: string; label: string; v: number }[] = [];
    const nowD = new Date();
    for (let i = 11; i >= 0; i--) {
      const dt = new Date(nowD.getFullYear(), nowD.getMonth() - i, 1);
      const key = periodKey(dt);
      const postedThen = s.equipment.reduce((a, e) => a + ((s.deprPosted[e.id] ?? []).includes(key) ? monthlyDep(e.acqCost, e.category) : 0), 0);
      out.push({ key, label: `${dt.toLocaleString("id-ID", { month: "short" })}`, v: Math.round(postedThen / 1e6) });
    }
    return out;
  }, [s.deprPosted, s.equipment]);
  const maxV = Math.max(...months.map((m) => m.v), 1);

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Depreciation</h1>
          <p className="text-xs text-mute">Garis lurus · nilai residu {DEPR_SALVAGE * 100}% · umur ekonomis per kelas aset · posting bulanan idempoten per periode</p>
        </div>
        <BtnPrimary disabled={!canPost || pendingCount === 0} title={!canPost ? "Butuh Pengelola Aset / Direksi" : pendingCount === 0 ? `Periode ${period} sudah diposting` : undefined} onClick={() => setConfirm(true)}>
          <IcLedger size={13} /> Posting depresiasi {period}
        </BtnPrimary>
      </div>

      {/* summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: "Nilai perolehan", v: fmtIDRCompact(totAcq), sub: `${s.equipment.length} aset`, cls: "text-ink" },
          { l: "Akumulasi depresiasi", v: fmtIDRCompact(totAccum), sub: `${Math.round((totAccum / (totAcq * (1 - DEPR_SALVAGE))) * 100)}% dari nilai dapat-disusutkan`, cls: "text-warn" },
          { l: "Nilai buku (NBV)", v: fmtIDRCompact(totNbv), sub: "perolehan − akumulasi", cls: "text-pine-700" },
          { l: "Run-rate bulanan", v: fmtIDRCompact(runRate), sub: "beban per bulan berjalan", cls: "text-info" },
        ].map((k, i) => (
          <Card key={k.l} className="row-in p-4">
            <div style={{ animationDelay: `${i * 60}ms` }}>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">{k.l}</p>
              <p className={`num mt-1.5 font-display text-[24px] font-black leading-none tracking-tight ${k.cls}`}>{k.v}</p>
              <p className="mt-1 font-mono text-[10px] text-mute">{k.sub}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* chart */}
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-[14.5px] font-extrabold text-ink">Beban depresiasi bulanan (12 bulan, juta IDR)</h2>
          <Chip tone="neutral">job terjadwal · idempoten per periode</Chip>
        </div>
        <div className="flex h-32 items-end gap-1.5">
          {months.map((m) => (
            <div key={m.key} className="group flex flex-1 flex-col items-center gap-1">
              <span className="font-mono text-[8.5px] font-bold text-mute opacity-0 transition group-hover:opacity-100">{m.v}</span>
              <div className={`bar-fill w-full rounded-t-[3px] ${m.key === period && !(rows.every((r) => !r.current)) ? "bg-warnhi" : "bg-pine-500/80 group-hover:bg-pine-600"} transition`} style={{ height: `${Math.max(3, (m.v / maxV) * 100)}%` }} title={`${m.key}: Rp ${m.v} jt`} />
              <span className="font-mono text-[8.5px] text-mute">{m.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* register */}
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[1060px] text-left">
          <thead>
            <tr className="border-b border-line bg-canvas/70 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">
              <th className="px-3 py-2.5">Aset</th><th className="px-3 py-2.5">Kelas / umur</th><th className="px-3 py-2.5 text-right">Perolehan</th>
              <th className="px-3 py-2.5 text-right">Bulanan</th><th className="px-3 py-2.5 w-40">Progres umur</th><th className="px-3 py-2.5 text-right">Akumulasi</th>
              <th className="px-3 py-2.5 text-right">Nilai buku</th><th className="px-3 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map(({ e, monthly, lifeM, posted, accum, nbv, done, current }, i) => (
              <tr key={e.id} className="row-in transition hover:bg-pine-50/60" style={{ animationDelay: `${Math.min(i, 10) * 35}ms` }}>
                <td className="px-3 py-2.5">
                  <button onClick={() => nav("equipment-detail", e.id)} className="text-left">
                    <p className="text-[12.5px] font-bold text-ink hover:text-pine-700">{e.name}</p>
                    <p className="font-mono text-[10px] text-mute">{e.code} · {e.category} · peroleh {fmtDate(e.acqDate)}</p>
                  </button>
                </td>
                <td className="px-3 py-2.5 font-mono text-[10.5px] text-ink2">{lifeYears(e.category)} th · {lifeM} bln</td>
                <td className="num px-3 py-2.5 text-right font-mono text-[11.5px] text-ink2">{fmtIDRCompact(e.acqCost)}</td>
                <td className="num px-3 py-2.5 text-right font-mono text-[11.5px] font-bold text-ink">{fmtIDRCompact(monthly)}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-moss">
                      <div className="bar-fill h-full rounded-full bg-pine-500" style={{ width: `${Math.min(100, (posted / lifeM) * 100)}%` }} />
                    </div>
                    <span className="num font-mono text-[9.5px] text-mute">{posted}/{lifeM}</span>
                  </div>
                </td>
                <td className="num px-3 py-2.5 text-right font-mono text-[11.5px] text-warn">{fmtIDRCompact(accum)}</td>
                <td className="num px-3 py-2.5 text-right font-mono text-[12px] font-black text-pine-700">{fmtIDRCompact(nbv)}</td>
                <td className="px-3 py-2.5">{done ? <Chip tone="neutral" dot>FULLY DEPRECIATED</Chip> : current ? <Chip tone="warn" dot>PERIODE {period} BELUM</Chip> : <Chip tone="ok" dot>UP-TO-DATE</Chip>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* confirm posting */}
      <Modal open={confirm} onClose={() => setConfirm(false)} kicker={`Depreciation run · ${period}`} title={`Posting ${pendingCount} aset`}
        footer={<><BtnGhost onClick={() => setConfirm(false)}>Batal</BtnGhost>
          <BtnPrimary onClick={() => { postDepreciation(); setConfirm(false); }}><IcLedger size={13} /> Posting {fmtIDRCompact(rows.filter((r) => r.current && !r.done).reduce((a, r) => a + Math.min(r.monthly, Math.max(0, r.e.acqCost * (1 - DEPR_SALVAGE) - r.accum)), 0))}</BtnPrimary></>}>
        <div className="space-y-3">
          <p className="rounded-md bg-infobg px-3 py-2 text-xs font-semibold text-info">Posting bersifat idempoten per periode ({period}) dan tercatat sebagai depreciation_transactions + audit (BR-010). Event muncul di timeline tiap aset (FINANCE).</p>
          <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-line p-2">
            {rows.filter((r) => r.current && !r.done).map((r) => (
              <div key={r.e.id} className="flex items-center justify-between rounded px-2 py-1 font-mono text-[10.5px] text-ink2">
                <span className="truncate">{r.e.name} <span className="text-mute">· bulan {r.posted + 1}/{r.lifeM}</span></span>
                <span className="num font-bold text-ink">{fmtIDR(Math.min(r.monthly, Math.max(0, r.e.acqCost * (1 - DEPR_SALVAGE) - r.accum)))}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-line pt-2">
            <BtnSm onClick={() => nav("audit")} className="!py-1.5">Lihat audit trail →</BtnSm>
            <span className="font-mono text-[10.5px] text-mute">status: {rows.some((r) => r.done) ? "ada aset fully depreciated (residu 10%)" : "semua aset aktif menyusut"}</span>
          </div>
        </div>
      </Modal>

      <p className="font-mono text-[10.5px] text-mute">depreciation_schedules + depreciation_transactions · sinkron ke Finance/Accounting (integration) · revaluasi & disposal di Phase lanjutan.</p>
    </div>
  );
}
