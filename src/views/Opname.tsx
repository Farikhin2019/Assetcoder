import { useState } from "react";
import { useApp } from "../lib/store";
import { BtnGhost, BtnPrimary, BtnSm, Bar, Card, Chip, Input, Modal, MonoTag } from "../components/ui";
import { IcCheck, IcLayers, IcPlus } from "../components/icons";
import { fmtDateTime, fmtIDRCompact } from "../lib/types";

const canOp = (role: string) => ["Kepala Gudang", "Petugas Gudang", "Pengelola Inventory", "Auditor", "Direksi"].includes(role);
const canFinalize = (role: string) => ["Kepala Gudang", "Pengelola Inventory", "Direksi"].includes(role);

export default function Opname() {
  const { s, createOpname, countOpname, finalizeOpname } = useApp();
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const allowed = canOp(s.role);
  const session = s.opnames.find((o) => o.id === openId);

  const threshold = s.config.adjThreshold;
  const counted = session?.items.filter((i) => i.counted !== null) ?? [];
  const diffs = counted.filter((i) => i.counted !== i.system);
  const accuracy = counted.length ? Math.round(((counted.length - diffs.length) / counted.length) * 1000) / 10 : 100;
  const overThreshold = session ? diffs.filter((df) => {
    const it = s.items.find((x) => x.sku === df.sku);
    return it ? Math.abs(df.counted! - df.system) * it.unitCost > threshold : false;
  }) : [];

  const doFinalize = () => {
    if (!session) return;
    finalizeOpname(session.id);
    setConfirm(false);
    setOpenId(null);
  };

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Stock Opname</h1>
          <p className="text-xs text-mute">Create → Snapshot/Freeze → Physical Count → Compare → Variance → Verify → Adjustment (ledger)</p>
        </div>
        <BtnPrimary disabled={!allowed} title={!allowed ? "Butuh role gudang / inventory" : undefined} onClick={createOpname}>
          <IcPlus size={13} /> Sesi baru (snapshot semua SKU)
        </BtnPrimary>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {s.opnames.map((o, i) => {
          const c = o.items.filter((x) => x.counted !== null).length;
          const v = o.items.filter((x) => x.counted !== null && x.counted !== x.system).length;
          return (
            <div key={o.id} className={`row-in rounded-lg border p-4 transition hover:shadow-md ${o.status === "COUNTING" ? "border-warn/40 bg-warnbg/20" : "border-line bg-paper"}`} style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-md ${o.status === "COUNTING" ? "bg-warnbg text-warn" : "bg-pine-100 text-pine-700"}`}><IcLayers size={17} /></span>
                  <div>
                    <p className="font-mono text-[14px] font-bold text-ink">{o.code}</p>
                    <p className="font-mono text-[10px] text-mute">{fmtDateTime(o.date)} · {o.by}</p>
                  </div>
                </div>
                {o.status === "COUNTING" ? <Chip tone="warn" dot pulse>COUNTING</Chip> : <Chip tone="ok" dot>CLOSED</Chip>}
              </div>
              <div className="mt-3">
                <div className="mb-1 flex justify-between font-mono text-[10.5px] text-mute">
                  <span>progres hitung {c}/{o.items.length}</span>
                  <span className={v > 0 ? "font-bold text-warn" : ""}>{v} selisih</span>
                </div>
                <Bar pct={(c / o.items.length) * 100} tone={c === o.items.length ? "pine" : "warn"} />
              </div>
              <div className="mt-3 flex gap-2">
                <BtnSm onClick={() => { setOpenId(o.id); setConfirm(false); }}>{o.status === "COUNTING" ? "Lanjut hitung" : "Lihat hasil"}</BtnSm>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={!!session} onClose={() => { setOpenId(null); setConfirm(false); }} wide
        kicker={`Stock opname · ${session?.status === "COUNTING" ? "physical counting" : "hasil akhir"}`}
        title={session ? `${session.code} — ${session.items.length} SKU` : ""}
        footer={
          session && session.status === "COUNTING" ? (
            <>
              <BtnGhost onClick={() => { setOpenId(null); setConfirm(false); }}>Simpan progres</BtnGhost>
              <BtnPrimary disabled={counted.length < session.items.length || !canFinalize(s.role) || confirm}
                title={!canFinalize(s.role) ? "Butuh Kepala Gudang / Pengelola Inventory" : counted.length < session.items.length ? "Selesaikan hitung semua SKU dulu" : undefined}
                onClick={() => setConfirm(true)}>
                <IcCheck size={13} /> Verifikasi & posting
              </BtnPrimary>
            </>
          ) : <BtnGhost onClick={() => setOpenId(null)}>Tutup</BtnGhost>
        }>
        {session && (
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-md border border-line">
              <table className="w-full min-w-[560px] text-left">
                <thead>
                  <tr className="border-b border-line bg-canvas/70 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">
                    <th className="px-3 py-2">Item</th><th className="px-3 py-2 text-right">Sistem</th><th className="px-3 py-2 text-right">Fisik</th><th className="px-3 py-2 text-right">Selisih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {session.items.map((it) => {
                    const v = it.counted === null ? null : it.counted - it.system;
                    const itRef = s.items.find((x) => x.sku === it.sku);
                    const val = itRef && v ? Math.abs(v) * itRef.unitCost : 0;
                    return (
                      <tr key={it.sku} className="transition hover:bg-pine-50/50">
                        <td className="px-3 py-2"><p className="text-[12px] font-bold text-ink">{it.name}</p><MonoTag>{it.sku}</MonoTag></td>
                        <td className="num px-3 py-2 text-right font-mono text-[12px] text-ink2">{it.system} {it.uom}</td>
                        <td className="px-3 py-2 text-right">
                          {session.status === "COUNTING" ? (
                            <Input type="number" className="!w-24 !py-1 text-right font-mono" value={it.counted ?? ""} placeholder="—"
                              onChange={(e) => countOpname(session.id, it.sku, e.target.value === "" ? 0 : Number(e.target.value))} />
                          ) : <span className="num font-mono text-[12px] font-bold text-ink">{it.counted ?? "—"}</span>}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {v === null ? <span className="font-mono text-[11px] text-mute">belum</span>
                            : v === 0 ? <Chip tone="ok">SAMA</Chip>
                            : <span className="inline-flex flex-col items-end">
                              <Chip tone={val > threshold ? "danger" : "warn"} dot>{v > 0 ? `+${v}` : v}</Chip>
                              {val > threshold && <span className="mt-0.5 font-mono text-[9px] font-bold text-danger">{fmtIDRCompact(val)} → approval</span>}
                            </span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-canvas/50 px-3 py-2.5">
              <div className="flex items-center gap-3 font-mono text-[11px] text-ink2">
                <span>terhitung <b>{counted.length}/{session.items.length}</b></span>
                <span>selisih <b className={diffs.length ? "text-warn" : "text-ok"}>{diffs.length}</b></span>
                {overThreshold.length > 0 && <span className="font-bold text-danger">{overThreshold.length} di atas threshold approval</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wide text-mute">Akurasi stok</span>
                <span className={`num font-display text-[18px] font-black ${accuracy >= 98 ? "text-ok" : accuracy >= 90 ? "text-warn" : "text-danger"}`}>{accuracy}%</span>
              </div>
            </div>

            {confirm && (
              <div className="rounded-md border border-warn/40 bg-warnbg px-3.5 py-3">
                <p className="text-[12.5px] font-bold text-warn">Konfirmasi posting {diffs.length} selisih ke ledger?</p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-ink2">
                  Selisih diposting sebagai transaksi STOCK_OPNAME (append-only, BR-008). Selisih bernilai di atas {fmtIDRCompact(threshold)} dirutekan ke approval matrix dulu (BR-005) — saat ini {overThreshold.length} item.
                </p>
                <div className="mt-2.5 flex gap-2">
                  <BtnPrimary onClick={doFinalize}><IcCheck size={13} /> Ya, posting & tutup sesi</BtnPrimary>
                  <BtnGhost onClick={() => setConfirm(false)}>Batal</BtnGhost>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <p className="font-mono text-[10.5px] text-mute">Alur: Create Session → Freeze/Snapshot → Physical Counting → System Comparison → Variance → Verification → Approval → Adjustment.</p>
    </div>
  );
}
