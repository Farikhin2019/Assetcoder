import { useState } from "react";
import { useApp } from "../lib/store";
import { BtnDanger, BtnGhost, BtnPrimary, Card, Chip, EmptyState, Label, Modal, MonoTag, StatusChip, TextArea } from "../components/ui";
import { IcCheck, IcShield, IcStamp, IcX } from "../components/icons";
import { fmtDateTime, fmtIDR, fmtIDRCompact, relTime } from "../lib/types";

export default function Approvals() {
  const { s, decide, nav } = useApp();
  const [act, setAct] = useState<{ id: string; ok: boolean } | null>(null);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");

  const canDecide = ["Direksi", "Pengelola Aset", "Kepala Gudang", "Pengelola Inventory", "Kepala Teknisi"].includes(s.role);
  const pending = s.approvals.filter((a) => a.status === "PENDING");
  const history = s.approvals.filter((a) => a.status !== "PENDING");
  const target = s.approvals.find((a) => a.id === act?.id);

  const submit = () => {
    if (!act) return;
    if (!act.ok && note.trim().length < 5) return setErr("Catatan wajib untuk penolakan (jejak audit).");
    decide(act.id, act.ok, note.trim());
    setAct(null); setNote(""); setErr("");
  };

  const toneFor = (t: string) => t === "REPAIR" ? "danger" : t === "ADJUSTMENT" ? "info" : t === "TRANSFER" ? "warn" : "pine";

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Approval Engine</h1>
          <p className="text-xs text-mute">Matrix configurable: organisasi · tipe transaksi · nilai · risk · kategori aset (BR-005/006/007)</p>
        </div>
        <div className="flex items-center gap-2">
          {!canDecide && <Chip tone="warn" dot>READ-ONLY — role {s.role}</Chip>}
          <Chip tone="warn" dot pulse={pending.length > 0}>{pending.length} PENDING</Chip>
        </div>
      </div>

      <div className="space-y-3">
        {pending.length === 0 && <Card><EmptyState title="Antrian bersih" sub="Tidak ada persetujuan menunggu." /></Card>}
        {pending.map((a, i) => (
          <Card key={a.id} className="row-in p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${a.type === "TRANSFER" ? "bg-warnbg text-warn" : a.type === "ADJUSTMENT" ? "bg-infobg text-info" : a.type === "REPAIR" ? "bg-dangerbg text-danger" : "bg-pine-100 text-pine-700"}`}>
                  <IcStamp size={18} />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip tone={toneFor(a.type) as never}>{a.type}</Chip>
                    <MonoTag>{a.ref}</MonoTag>
                    <span className="font-mono text-[10.5px] text-mute">{relTime(a.date)} · {a.requester}</span>
                  </div>
                  <p className="mt-1 text-[13.5px] font-bold text-ink">{a.summary}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-y-1">
                    {a.matrix.map((mth, j) => (
                      <span key={j} className="flex items-center">
                        <span className={`rounded border px-1.5 py-0.5 font-mono text-[9.5px] font-bold ${j === 0 ? "border-pine-500/50 bg-pine-50 text-pine-700" : "border-line bg-paper text-mute"}`}>{mth}</span>
                        {j < a.matrix.length - 1 && <span className="mx-1 font-mono text-[10px] text-line2">→</span>}
                      </span>
                    ))}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10.5px] text-mute">
                    {a.value > 0 && <span>nilai <b className="text-ink">{fmtIDR(a.value)}</b></span>}
                    <span>risk <b className={a.risk === "HIGH" ? "text-danger" : a.risk === "MEDIUM" ? "text-warn" : ""}>{a.risk}</b></span>
                    {a.type === "TRANSFER" && a.meta?.eqId && <button className="font-bold text-pine-700 hover:underline" onClick={() => nav("equipment-detail", String(a.meta!.eqId))}>lihat equipment →</button>}
                    {a.type === "PURCHASE" && <button className="font-bold text-pine-700 hover:underline" onClick={() => nav("procurement")}>buka procurement →</button>}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 gap-2 lg:flex-col xl:flex-row">
                <BtnPrimary disabled={!canDecide} title={!canDecide ? "Butuh role approver" : undefined} onClick={() => { setAct({ id: a.id, ok: true }); setNote(""); setErr(""); }}>
                  <IcCheck size={13} /> Approve
                </BtnPrimary>
                <BtnDanger disabled={!canDecide} title={!canDecide ? "Butuh role approver" : undefined} onClick={() => { setAct({ id: a.id, ok: false }); setNote(""); setErr(""); }}>
                  <IcX size={13} /> Reject
                </BtnDanger>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-[15px] font-extrabold text-ink">Decision history</h2>
          <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-mute"><IcShield size={12} /> keputusan tercatat imutabel di audit trail</span>
        </div>
        <div className="divide-y divide-line">
          {history.length === 0 && <p className="py-6 text-center text-xs text-mute">Belum ada keputusan.</p>}
          {history.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center gap-3 py-2.5">
              <StatusChip status={a.status} />
              <MonoTag>{a.ref}</MonoTag>
              <p className="min-w-0 flex-1 truncate text-[12.5px] text-ink2">{a.summary}</p>
              <span className="font-mono text-[10.5px] text-mute">{fmtDateTime(a.date)}</span>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={!!act} onClose={() => setAct(null)} kicker={act?.ok ? "Approve transaction" : "Reject transaction"} title={target ? `${target.ref} — ${target.type.toLowerCase()}` : ""}
        footer={
          <>
            <BtnGhost onClick={() => setAct(null)}>Batal</BtnGhost>
            {act?.ok ? <BtnPrimary onClick={submit}><IcCheck size={13} /> Setujui{target && target.value > 0 ? ` · ${fmtIDRCompact(target.value)}` : ""}</BtnPrimary>
              : <BtnDanger onClick={submit}><IcX size={13} /> Tolak</BtnDanger>}
          </>
        }>
        <div className="space-y-3">
          <p className="rounded-md border border-line bg-canvas/60 px-3 py-2 text-[12px] text-ink2">{target?.summary}</p>
          <div>
            <Label>Catatan keputusan {act?.ok ? "(opsional)" : "(wajib)"}</Label>
            <TextArea placeholder={act?.ok ? "cth: disetujui sesuai budget Q3…" : "cth: nilai melebihi budget unit, ajukan revisi…"} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          {act?.ok && target?.type === "TRANSFER" && <p className="rounded-md bg-infobg px-3 py-2 text-xs font-semibold text-info">On approve: lokasi aset dipindah, serah terima digital & event timeline dicatat.</p>}
          {act?.ok && target?.type === "ADJUSTMENT" && <p className="rounded-md bg-infobg px-3 py-2 text-xs font-semibold text-info">On approve: adjustment diposting ke ledger inventory dengan alasan tercatat.</p>}
          {act?.ok && target?.type === "PURCHASE" && <p className="rounded-md bg-infobg px-3 py-2 text-xs font-semibold text-info">On approve: PR berstatus APPROVED — lanjutkan pembuatan PO di modul Procurement.</p>}
          {err && <p className="rounded-md bg-dangerbg px-3 py-2 text-xs font-semibold text-danger">{err}</p>}
        </div>
      </Modal>
    </div>
  );
}
