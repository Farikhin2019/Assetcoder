import { useMemo, useState } from "react";
import { useApp } from "../lib/store";
import { BtnGhost, BtnPrimary, BtnSm, Card, Chip, Input, Label, Modal, MonoTag, SectionHead, Select, StatusChip, TextArea, EmptyState } from "../components/ui";
import { IcSend, IcTag, IcWarn } from "../components/icons";
import { DEPR_SALVAGE, LIFECYCLE_STAGES, fmtDate, fmtIDR, fmtIDRCompact, lifeYears, monthlyDep } from "../lib/types";
import type { DisposalRecord, Equipment } from "../lib/types";

const METHODS: DisposalRecord["method"][] = ["LELANG", "HIBAH", "PEMUSNAHAN", "PENJUALAN"];

export default function Disposal() {
  const { s, nav, retireRequest, confirmDisposal } = useApp();
  const [retireEq, setRetireEq] = useState<Equipment | null>(null);
  const [disposeEq, setDisposeEq] = useState<Equipment | null>(null);
  const [reason, setReason] = useState("");
  const [method, setMethod] = useState<DisposalRecord["method"]>("LELANG");
  const [residual, setResidual] = useState("0");
  const [proceeds, setProceeds] = useState("0");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");

  const canManage = ["Pengelola Aset", "Direksi", "Kepala Unit"].includes(s.role);

  const bookValue = (e: Equipment) => {
    const monthly = monthlyDep(e.acqCost, e.category);
    const posted = (s.deprPosted[e.id] ?? []).length;
    const accum = Math.min(e.acqCost * (1 - DEPR_SALVAGE), posted * monthly);
    return { nbv: e.acqCost - accum, accum, fullyDep: posted >= lifeYears(e.category) * 12 };
  };
  const ageYears = (e: Equipment) => (Date.now() - new Date(e.acqDate).getTime()) / (365.25 * 864e5);

  const pendingRetire = s.approvals.filter((a) => a.type === "DISPOSAL" && a.status === "PENDING").map((a) => String((a.meta ?? {}).eqId));

  const candidates = useMemo(() => s.equipment.filter((e) =>
    !["RETIRED", "DISPOSED"].includes(e.opStatus) && !pendingRetire.includes(e.id) &&
    (e.condition === "POOR" || bookValue(e).fullyDep || ageYears(e) > lifeYears(e.category))
  ), [s.equipment, s.deprPosted, pendingRetire]);

  const retiredAwaiting = s.equipment.filter((e) => e.opStatus === "RETIRED" && !s.disposals.some((d) => d.eqId === e.id));
  const disposedEq = s.equipment.filter((e) => e.opStatus === "DISPOSED");
  const totalProceeds = s.disposals.reduce((a, d) => a + d.proceeds, 0);
  const showcase = disposedEq[0];

  const openRetire = (e: Equipment) => { setRetireEq(e); setReason(""); setMethod("LELANG"); setResidual(String(Math.round(bookValue(e).nbv * 0.4))); setErr(""); };
  const openDispose = (e: Equipment) => { setDisposeEq(e); setMethod("LELANG"); setProceeds("0"); setNote(""); setErr(""); };

  const submitRetire = () => {
    if (!retireEq) return;
    if (reason.trim().length < 10) return setErr("Alasan pensiun wajib diisi (min. 10 karakter) — jejak audit.");
    retireRequest(retireEq.id, reason.trim(), method, Number(residual) || 0);
    setRetireEq(null);
  };
  const submitDispose = () => {
    if (!disposeEq) return;
    if (note.trim().length < 5) return setErr("Catatan pelepasan wajib diisi.");
    confirmDisposal(disposeEq.id, method, Number(proceeds) || 0, note.trim());
    setDisposeEq(null);
  };

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Retirement & Disposal</h1>
          <p className="text-xs text-mute">Pensiun → approval (BR-007) → RETIRED → eksekusi pelepasan → DISPOSED · lifecycle history imutabel (BR-009)</p>
        </div>
        {!canManage && <Chip tone="warn" dot>READ-ONLY — role {s.role}</Chip>}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: "Aset aktif", v: s.equipment.filter((e) => !["RETIRED", "DISPOSED"].includes(e.opStatus)).length, c: "text-ink" },
          { l: "Menunggu pelepasan", v: retiredAwaiting.length, c: "text-warn" },
          { l: "Disposed", v: disposedEq.length, c: "text-mute" },
          { l: "Hasil pelepasan", v: fmtIDRCompact(totalProceeds), c: "text-ok" },
        ].map((k, i) => (
          <Card key={k.l} className="row-in p-4" >
            <div style={{ animationDelay: `${i * 50}ms` }}>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">{k.l}</p>
              <p className={`num mt-1.5 font-display text-[24px] font-black leading-none tracking-tight ${k.c}`}>{k.v}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* candidates */}
      <Card className="p-4">
        <SectionHead title="Kandidat pensiun" sub="Kondisi POOR, fully-depreciated, atau melewati umur ekonomis" />
        {candidates.length === 0 ? <EmptyState title="Tidak ada kandidat pensiun" sub="Semua aset masih dalam masa layanan." /> : (
          <div className="overflow-x-auto rounded-md border border-line">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-line bg-canvas/70 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">
                  <th className="px-3 py-2.5">Aset</th><th className="px-3 py-2.5">Umur</th><th className="px-3 py-2.5">Kondisi</th>
                  <th className="px-3 py-2.5 text-right">Nilai buku</th><th className="px-3 py-2.5">Pemicu</th><th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {candidates.map((e) => {
                  const bv = bookValue(e);
                  const triggers = [
                    e.condition === "POOR" ? "kondisi POOR" : null,
                    bv.fullyDep ? "fully depreciated" : null,
                    ageYears(e) > lifeYears(e.category) ? "lewat umur ekonomis" : null,
                  ].filter(Boolean) as string[];
                  return (
                    <tr key={e.id} className="transition hover:bg-pine-50/60">
                      <td className="px-3 py-2.5">
                        <button onClick={() => nav("equipment-detail", e.id)} className="text-left">
                          <p className="text-[12.5px] font-bold text-ink hover:text-pine-700">{e.name}</p>
                          <p className="font-mono text-[10px] text-mute">{e.code} · peroleh {fmtDate(e.acqDate)}</p>
                        </button>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-ink2">{ageYears(e).toFixed(1)} th / {lifeYears(e.category)} th</td>
                      <td className="px-3 py-2.5"><StatusChip status={e.condition} /></td>
                      <td className="num px-3 py-2.5 text-right font-mono text-[12px] font-bold text-pine-700">{fmtIDRCompact(bv.nbv)}</td>
                      <td className="px-3 py-2.5"><div className="flex flex-wrap gap-1">{triggers.map((t) => <Chip key={t} tone="warn">{t}</Chip>)}</div></td>
                      <td className="px-3 py-2.5"><BtnSm disabled={!canManage} onClick={() => openRetire(e)} className="!border-danger/50 !text-danger">Ajukan Pensiun</BtnSm></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* retired awaiting disposal */}
      <Card className="p-4">
        <SectionHead title="Retired — eksekusi pelepasan" sub="Aset sudah disetujui pensiun, siap dilepaskan" />
        {retiredAwaiting.length === 0 ? <EmptyState title="Tidak ada aset retired menunggu" sub="Ajukan pensiun dari tabel kandidat di atas." /> : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {retiredAwaiting.map((e) => (
              <div key={e.id} className="row-in flex items-center justify-between gap-3 rounded-lg border border-warn/40 bg-warnbg/25 p-4">
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-ink">{e.name}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-mute">{e.code} · {e.room}</p>
                  <div className="mt-1.5"><StatusChip status={e.opStatus} /></div>
                </div>
                <BtnPrimary disabled={!canManage} onClick={() => openDispose(e)}><IcSend size={13} /> Eksekusi</BtnPrimary>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* register + lifecycle */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="p-4">
          <SectionHead title="Register pelepasan" sub={`${s.disposals.length} tercatat`} />
          <div className="space-y-2">
            {s.disposals.map((drec) => {
              const eq = s.equipment.find((e) => e.id === drec.eqId);
              return (
                <div key={drec.id} className="rounded-md border border-line bg-paper p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12.5px] font-bold text-ink">{eq?.name ?? drec.eqId}</p>
                    <div className="flex gap-1.5"><StatusChip status={drec.method} /><MonoTag>{drec.code}</MonoTag></div>
                  </div>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-mute">{drec.note}</p>
                  <p className="mt-1.5 font-mono text-[10px] text-mute">
                    {fmtDate(drec.date)} · approver {drec.approver} · hasil <b className="text-ok">{fmtIDR(drec.proceeds)}</b>
                  </p>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-4">
          <SectionHead title="Lifecycle penuh" sub={showcase ? `${showcase.name} — sampai DISPOSED` : "Belum ada aset disposed"} />
          {showcase ? (
            <div>
              <div className="flex flex-wrap items-center gap-y-2">
                {LIFECYCLE_STAGES.map((st, i) => {
                  const done = i <= (showcase.lifecycle ?? 0);
                  const last = i === (showcase.lifecycle ?? 0);
                  return (
                    <span key={st} className="flex items-center">
                      <span className={`rounded border px-1.5 py-1 font-mono text-[8.5px] font-bold transition ${last ? "border-danger bg-danger text-white shadow" : done ? "border-pine-500/50 bg-pine-50 text-pine-700" : "border-line bg-card text-mute"}`}>{st}</span>
                      {i < LIFECYCLE_STAGES.length - 1 && <span className={`mx-1 font-mono text-[10px] ${done && i < (showcase.lifecycle ?? 0) ? "text-pine-500" : "text-line2"}`}>→</span>}
                    </span>
                  );
                })}
              </div>
              <p className="mt-3 rounded-md bg-canvas/60 px-3 py-2 text-[11.5px] leading-relaxed text-ink2">
                <IcTag size={12} className="mr-1 inline text-pine-600" />
                Asset ID <MonoTag>{showcase.code}</MonoTag> tidak pernah berubah sepanjang lifecycle (BR-002) — dari PLANNED hingga DISPOSED.
              </p>
            </div>
          ) : <EmptyState title="Belum ada aset mencapai DISPOSED" />}
        </Card>
      </div>

      {/* retire modal */}
      <Modal open={!!retireEq} onClose={() => setRetireEq(null)} kicker="Retirement request · BR-007" title={`Pensiun — ${retireEq?.name ?? ""}`}
        footer={<><BtnGhost onClick={() => setRetireEq(null)}>Batal</BtnGhost><BtnPrimary onClick={submitRetire}><IcWarn size={13} /> Ajukan ke approval</BtnPrimary></>}>
        <div className="space-y-3.5">
          <div><Label>Alasan pensiun *</Label><TextArea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="cth: rusak berat, biaya perbaikan > nilai buku, obsolete…" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Metode pelepasan</Label><Select value={method} onChange={(e) => setMethod(e.target.value as DisposalRecord["method"])}>{METHODS.map((m) => <option key={m}>{m}</option>)}</Select></div>
            <div><Label>Estimasi nilai residu (IDR)</Label><Input type="number" value={residual} onChange={(e) => setResidual(e.target.value)} /></div>
          </div>
          <p className="rounded-md bg-infobg px-3 py-2 text-xs font-semibold text-info">Pelepasan aset WAJIB persetujuan (BR-007). Matriks: Kepala Unit → Pengelola Aset → Direksi.</p>
          {err && <p className="rounded-md bg-dangerbg px-3 py-2 text-xs font-semibold text-danger">{err}</p>}
        </div>
      </Modal>

      {/* dispose modal */}
      <Modal open={!!disposeEq} onClose={() => setDisposeEq(null)} kicker="Asset disposal" title={`Eksekusi pelepasan — ${disposeEq?.name ?? ""}`}
        footer={<><BtnGhost onClick={() => setDisposeEq(null)}>Batal</BtnGhost><BtnPrimary onClick={submitDispose}><IcSend size={13} /> Lepas aset</BtnPrimary></>}>
        <div className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Metode</Label><Select value={method} onChange={(e) => setMethod(e.target.value as DisposalRecord["method"])}>{METHODS.map((m) => <option key={m}>{m}</option>)}</Select></div>
            <div><Label>Hasil / proceeds (IDR)</Label><Input type="number" value={proceeds} onChange={(e) => setProceeds(e.target.value)} /></div>
          </div>
          <div><Label>Catatan / BA pelepasan *</Label><TextArea value={note} onChange={(e) => setNote(e.target.value)} placeholder="cth: BA lelang no…, pemenang…, disaksikan auditor…" /></div>
          <p className="rounded-md bg-moss px-3 py-2 text-xs text-ink2">Status aset → <b>DISPOSED</b> (lifecycle final). Proceeds diposting ke Finance/Accounting & tercatat di audit trail.</p>
          {err && <p className="rounded-md bg-dangerbg px-3 py-2 text-xs font-semibold text-danger">{err}</p>}
        </div>
      </Modal>
    </div>
  );
}
