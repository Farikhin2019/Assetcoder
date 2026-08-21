import { useMemo, useState } from "react";
import { activeStage, canDecideStage, lineState, prTotal, useApp } from "../lib/store";
import { BtnGhost, BtnPrimary, BtnSm, Card, Chip, EmptyState, Input, Label, Modal, Select, StatusChip, Tabs, TextArea } from "../components/ui";
import { fmtDate, fmtIDR, fmtIDRCompact } from "../lib/types";
import { Check, Pencil, Send, Truck, X } from "lucide-react";

const STAGE_LABELS = ["IT / Umum", "Keuangan", "COO"];

export default function Procurement() {
  const { s, prDecide, prDecideAll, prRevise, createPo, receivePo, deliver, unitReceive } = useApp();
  const [tab, setTab] = useState("pr");
  const [decision, setDecision] = useState<{ prId: string; lineId: string; ok: boolean } | null>(null);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [revise, setRevise] = useState<{ prId: string; lineId: string } | null>(null);
  const [reviseQty, setReviseQty] = useState("");
  const [poFor, setPoFor] = useState<string | null>(null);
  const [supplier, setSupplier] = useState("S-03");

  const decLine = decision ? s.purchaseRequests.find((p) => p.id === decision.prId)?.lines.find((l) => l.id === decision.lineId) : null;
  const stageIdx = decLine ? activeStage(decLine) : -1;

  const submitDecision = () => {
    if (!decision) return;
    if (!decision.ok && note.trim().length < 4) return setErr("Catatan/saran wajib diisi saat menolak.");
    prDecide(decision.prId, decision.lineId, decision.ok, note.trim());
    setDecision(null); setNote(""); setErr("");
  };

  const submitRevise = () => {
    if (!revise) return;
    if (!(Number(reviseQty) > 0)) return setErr("Qty revisi wajib > 0.");
    prRevise(revise.prId, revise.lineId, Number(reviseQty));
    setRevise(null); setReviseQty(""); setErr("");
  };

  const isApprover = useMemo(() => [0, 1, 2].some((i) => canDecideStage(s.role, i)), [s.role]);

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Procurement</h1>
          <p className="text-xs text-mute">Purchase Request → Persetujuan 3 tahap (IT/Umum → Keuangan → COO) → PO → GRN → Distribusi ke unit peminta</p>
        </div>
        <Chip tone={isApprover ? "ok" : "neutral"} dot>{isApprover ? `Anda approver tahap ${STAGE_LABELS[[0, 1, 2].find((i) => canDecideStage(s.role, i))!]}` : `Role ${s.role} — bukan approver`}</Chip>
      </div>

      <Card className="p-4">
        <Tabs active={tab} onChange={setTab}
          tabs={[{ id: "pr", label: "Purchase Request" }, { id: "po", label: "Purchase Order" }, { id: "dist", label: "Distribusi ke Unit" }]}
          counts={{ pr: s.purchaseRequests.length, po: s.purchaseOrders.length, dist: s.deliveries.filter((d) => d.status !== "RECEIVED").length }} />
        <div className="pt-4">
          {tab === "pr" && (
            <div className="space-y-4">
              {s.purchaseRequests.map((pr) => (
                <div key={pr.id} className="rounded-lg border border-line bg-paper p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-mono text-[13.5px] font-bold text-ink">{pr.code}</p>
                        <StatusChip status={pr.status} />
                        <Chip tone="neutral">{pr.unit}</Chip>
                      </div>
                      <p className="mt-0.5 font-mono text-[10px] text-mute">peminta: {pr.requester} · {fmtDate(pr.date)} · need by {fmtDate(pr.needBy)} · total <b className="text-ink">{fmtIDRCompact(prTotal(pr))}</b></p>
                    </div>
                    {pr.status === "APPROVED" && (
                      <BtnSm onClick={() => { setPoFor(pr.id); setSupplier("S-03"); }} className="!border-pine-500/60 !text-pine-700"><Send size={12} /> Buat PO</BtnSm>
                    )}
                  </div>

                  <div className="mt-3 space-y-2.5">
                    {pr.lines.map((l) => {
                      const ls = lineState(l);
                      const idx = activeStage(l);
                      const canAct = idx >= 0 && canDecideStage(s.role, idx) && pr.status !== "PO_CREATED";
                      return (
                        <div key={l.id} className="rounded-md border border-line bg-card p-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <Chip tone={l.kind === "ASSET" ? "pine" : "neutral"} className="!text-[9px]">{l.kind}</Chip>
                                <p className="text-[12.5px] font-bold text-ink">{l.name}</p>
                                {l.sku && <span className="font-mono text-[9.5px] text-mute">{l.sku}</span>}
                              </div>
                              <p className="mt-0.5 font-mono text-[10px] text-mute">{l.qty} × {fmtIDR(l.unitCost)} = <b className="text-ink">{fmtIDRCompact(l.qty * l.unitCost)}</b></p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {ls === "REJECTED" && (
                                <BtnSm onClick={() => { setRevise({ prId: pr.id, lineId: l.id }); setReviseQty(String(l.qty)); setErr(""); }} className="!border-warn/60 !text-warn"><Pencil size={11} /> Revisi</BtnSm>
                              )}
                              {canAct && (
                                <>
                                  <BtnSm onClick={() => { setDecision({ prId: pr.id, lineId: l.id, ok: true }); setNote(""); setErr(""); }} className="!border-ok/60 !text-ok"><Check size={11} /> Setujui</BtnSm>
                                  <BtnSm onClick={() => { setDecision({ prId: pr.id, lineId: l.id, ok: false }); setNote(""); setErr(""); }} className="!border-danger/60 !text-danger"><X size={11} /> Tolak</BtnSm>
                                </>
                              )}
                            </div>
                          </div>
                          {/* tracker 3 tahap */}
                          <div className="mt-2.5 flex items-center gap-1.5">
                            {l.stages.map((st, i) => (
                              <div key={i} className="flex flex-1 items-center gap-1.5">
                                <div className={`flex flex-1 flex-col rounded-md border px-2 py-1.5 ${st.status === "APPROVED" ? "border-ok/40 bg-okbg" : st.status === "REJECTED" ? "border-danger/40 bg-dangerbg" : i === idx ? "border-warn/60 bg-warnbg" : "border-line bg-canvas"}`}>
                                  <span className={`font-mono text-[8.5px] font-bold uppercase tracking-wide ${st.status === "APPROVED" ? "text-ok" : st.status === "REJECTED" ? "text-danger" : i === idx ? "text-warn" : "text-mute"}`}>
                                    {i + 1}. {STAGE_LABELS[i]} {st.status === "APPROVED" ? "✓" : st.status === "REJECTED" ? "✕" : i === idx ? "· aktif" : ""}
                                  </span>
                                  <span className="truncate font-mono text-[8.5px] text-mute">{st.approver ? `${st.approver}${st.note ? ": " + st.note : ""}` : "menunggu"}</span>
                                </div>
                                {i < 2 && <span className="text-[10px] text-line2">→</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "po" && (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {s.purchaseOrders.map((p) => {
                const sup = s.suppliers.find((x) => x.id === p.supplierId);
                return (
                  <div key={p.id} className="rounded-lg border border-line bg-paper p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-mono text-[13.5px] font-bold text-ink">{p.code}</p>
                        <p className="font-mono text-[10px] text-mute">{sup?.name} · dari {p.prRef} · ETA {fmtDate(p.eta)}</p>
                      </div>
                      <StatusChip status={p.status} />
                    </div>
                    <div className="mt-2.5 space-y-1">
                      {p.items.map((it, ii) => (
                        <div key={ii} className="flex items-center justify-between gap-2 rounded-md border border-line bg-canvas/50 px-2.5 py-1.5">
                          <span className="flex min-w-0 items-center gap-1.5 text-[12px] font-semibold text-ink">
                            <Chip tone={it.kind === "ASSET" ? "pine" : "neutral"} className="!text-[8px]">{it.kind}</Chip>
                            <span className="truncate">{it.name}</span> <span className="shrink-0 font-mono text-[10px] text-mute">×{it.qty}</span>
                          </span>
                          <span className="num shrink-0 font-mono text-[10.5px] text-ink2">{fmtIDR(it.qty * it.price)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2.5 flex items-center justify-between border-t border-line pt-2.5">
                      <span className="num font-mono text-[12px] font-bold text-ink">{fmtIDR(p.total)}</span>
                      {p.status === "SENT" ? (
                        <BtnSm onClick={() => receivePo(p.id)} className="!border-ok/50 !text-ok"><Truck size={12} /> {p.items.some((it) => it.kind === "ASSET") ? "Terima & Daftarkan Aset" : "Terima (GRN)"}</BtnSm>
                      ) : <span className="font-mono text-[10px] font-bold text-ok">diterima ✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "dist" && (
            <div className="space-y-3">
              {s.deliveries.length === 0 && <EmptyState title="Belum ada pengiriman" sub="Terima PO (GRN) untuk membuat pengiriman ke unit peminta." />}
              {s.deliveries.map((dl) => {
                const isMine = s.userUnit === dl.unit;
                const stepIdx = dl.status === "PENDING" ? 0 : dl.status === "DELIVERED" ? 1 : 2;
                return (
                  <div key={dl.id} className={`rounded-lg border p-4 ${isMine && dl.status !== "RECEIVED" ? "border-pine-500/50 bg-pine-50/40" : "border-line bg-paper"}`}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-mono text-[13px] font-bold text-ink">{dl.code}</p>
                          <Chip tone={isMine ? "pine" : "neutral"}>UNIT: {dl.unit}{isMine ? " · Anda" : ""}</Chip>
                          <StatusChip status={dl.status} />
                        </div>
                        <p className="mt-0.5 font-mono text-[10px] text-mute">dari {dl.poRef} · {fmtDate(dl.date)}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {["Picking", "Dikirim", "Diterima"].map((st, j) => (
                          <span key={st} className="flex items-center gap-1.5">
                            <span className={`rounded border px-2 py-0.5 font-mono text-[9px] font-bold ${j < stepIdx || (j === stepIdx && dl.status === "RECEIVED") ? "border-ok/40 bg-okbg text-ok" : j === stepIdx ? "border-warn/60 bg-warnbg text-warn" : "border-line bg-canvas text-mute"}`}>{st}</span>
                            {j < 2 && <span className="text-[10px] text-line2">→</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-2.5 space-y-1">
                      {dl.items.map((it, ii) => (
                        <div key={ii} className="flex items-center justify-between rounded-md border border-line bg-canvas/50 px-2.5 py-1.5">
                          <span className="text-[12px] font-semibold text-ink">{it.name} <span className="font-mono text-[10px] text-mute">×{it.qty}</span></span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2.5">
                      <span className="font-mono text-[10px] text-mute">
                        {dl.status === "DELIVERED" && dl.courier ? <>kurir: <b>{dl.courier}</b></> : dl.status === "RECEIVED" && dl.receivedBy ? <>diterima: <b>{dl.receivedBy}</b></> : "menunggu dikirim gudang"}
                      </span>
                      {dl.status === "PENDING" && <BtnSm onClick={() => deliver(dl.id)} className="!border-info/50 !text-info"><Truck size={12} /> Kirim ke Unit</BtnSm>}
                      {dl.status === "DELIVERED" && (isMine || s.role === "Pengelola Aset" || s.role === "Pengelola Inventory") ? (
                        <BtnSm onClick={() => unitReceive(dl.id)} className="!border-ok/60 !text-ok"><Check size={12} /> Konfirmasi Terima</BtnSm>
                      ) : dl.status === "DELIVERED" ? (
                        <span className="font-mono text-[9.5px] text-mute">masuk sebagai user unit <b className="text-pine-700">{dl.unit}</b> untuk konfirmasi</span>
                      ) : null}
                      {dl.status === "RECEIVED" && <span className="font-mono text-[10px] font-bold text-ok">alur selesai ✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* modal keputusan */}
      <Modal open={!!decision} onClose={() => setDecision(null)} kicker={`Tahap ${stageIdx + 1} — ${STAGE_LABELS[stageIdx]}`} title={decLine ? `${decision?.ok ? "Setujui" : "Tolak"}: ${decLine.name}` : ""}
        footer={<><BtnGhost onClick={() => setDecision(null)}>Batal</BtnGhost>
          {decision?.ok ? <BtnPrimary onClick={submitDecision}><Check size={13} /> Setujui</BtnPrimary> : <button onClick={submitDecision} className="inline-flex items-center gap-1.5 rounded-md bg-danger px-3.5 py-2 font-display text-[12.5px] font-bold text-white hover:bg-[#a03023]"><X size={13} /> Tolak</button>}</>}>
        <div className="space-y-3">
          <p className="rounded-md border border-line bg-canvas/60 px-3 py-2 text-[12px] text-ink2">
            {decLine?.name} · {decLine?.qty} × {fmtIDR(decLine?.unitCost ?? 0)} = <b>{fmtIDRCompact((decLine?.qty ?? 0) * (decLine?.unitCost ?? 0))}</b>
          </p>
          <div>
            <Label>Catatan {decision?.ok ? "(opsional)" : "/ saran revisi (wajib)"}</Label>
            <TextArea value={note} onChange={(e) => setNote(e.target.value)} placeholder={decision?.ok ? "cth: sesuai budget…" : "cth: qty terlalu banyak, cukup 6 unit…"} />
          </div>
          {err && <p className="rounded-md bg-dangerbg px-3 py-2 text-xs font-semibold text-danger">{err}</p>}
        </div>
      </Modal>

      {/* modal revisi */}
      <Modal open={!!revise} onClose={() => setRevise(null)} kicker="Revisi sesuai saran approver" title="Ubah qty & kirim ulang"
        footer={<><BtnGhost onClick={() => setRevise(null)}>Batal</BtnGhost><BtnPrimary onClick={submitRevise}><Pencil size={13} /> Kirim ulang (tahap 1)</BtnPrimary></>}>
        <div className="space-y-3">
          <p className="rounded-md bg-infobg px-3 py-2 text-xs font-semibold text-info">Persetujuan diulang dari tahap 1 setelah revisi. Nomor revisi tercatat di audit.</p>
          <div><Label>Qty baru *</Label><Input type="number" value={reviseQty} onChange={(e) => setReviseQty(e.target.value)} /></div>
          {err && <p className="rounded-md bg-dangerbg px-3 py-2 text-xs font-semibold text-danger">{err}</p>}
        </div>
      </Modal>

      {/* modal buat PO */}
      <Modal open={!!poFor} onClose={() => setPoFor(null)} kicker="Buat Purchase Order" title="Pilih supplier"
        footer={<><BtnGhost onClick={() => setPoFor(null)}>Batal</BtnGhost><BtnPrimary onClick={() => { if (poFor) createPo(poFor, supplier); setPoFor(null); }}><Send size={13} /> Terbitkan PO</BtnPrimary></>}>
        <div className="space-y-3">
          <Label>Supplier</Label>
          <Select value={supplier} onChange={(e) => setSupplier(e.target.value)}>
            {s.suppliers.map((sp) => <option key={sp.id} value={sp.id}>{sp.name} — {sp.service}</option>)}
          </Select>
          <p className="rounded-md border border-line bg-canvas/60 px-3 py-2 text-[12px] text-ink2">PO dibuat dari baris yang sudah disetujui 3 tahap.</p>
        </div>
      </Modal>

      <p className="font-mono text-[10.5px] text-mute">Persetujuan per-barang tercatat di audit trail · GRN BHP posting ledger (BR-003) · GRN aset daftarkan equipment tertelusur ke PO (BR-001/002).</p>
    </div>
  );
}
