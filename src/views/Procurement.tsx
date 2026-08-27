import { useState } from "react";
import { useApp } from "../lib/store";
import { BtnGhost, BtnPrimary, BtnSm, Card, Chip, EmptyState, Input, Label, Modal, Select, StatusChip, Tabs, TextArea } from "../components/ui";
import { fmtDate, fmtIDR, fmtIDRCompact, HandoverCondition, HandoverLine, Role } from "../lib/types";
import { ArrowRight, Check, ClipboardCheck, FilePlus2, PackageCheck, Pencil, Send, Truck, UserCheck, Wallet, X } from "lucide-react";

const STAGE_LABELS = ["IT / Umum", "Keuangan", "COO"];

/* ── tanggung jawab per peran ── */
const canCreatePr = (r: Role) => ["Kepala Unit", "Direksi", "Pengelola Inventory"].includes(r);
const canPo = (r: Role) => ["Umum", "Pengelola Inventory", "Kepala Gudang"].includes(r);
const canGrn = (r: Role) => ["Kepala Gudang", "Petugas Gudang", "Umum"].includes(r);
const canDeliver = (r: Role) => ["Kepala Gudang", "Petugas Gudang", "Umum", "Pengelola Inventory"].includes(r);
const canReturnSend = (r: Role) => ["Kepala Gudang", "Petugas Gudang", "Umum"].includes(r);
const canReturnResolve = (r: Role) => ["Umum", "Kepala Gudang", "Finance", "Pengelola Inventory"].includes(r);
const canReturnClose = (r: Role) => ["Umum", "Kepala Gudang", "Pengelola Inventory"].includes(r);

const FLOW = [
  { label: "Ajukan PR", who: "Unit peminta", icon: <FilePlus2 size={13} /> },
  { label: "Persetujuan 3 tahap", who: "IT/Umum → Keuangan → COO", icon: <ClipboardCheck size={13} /> },
  { label: "Buat PO", who: "Umum / Inventori", icon: <Send size={13} /> },
  { label: "Terima GRN", who: "Gudang + BAST", icon: <PackageCheck size={13} /> },
  { label: "Kirim ke unit", who: "Gudang", icon: <Truck size={13} /> },
  { label: "Serah terima", who: "Unit + BAST", icon: <UserCheck size={13} /> },
];

export default function Procurement() {
  const { s, createPr, prDecide, prDecideAll, prRevise, createPo, receivePo, deliver, unitReceive, returnSend, returnResolve, returnClose } = useApp();
  const [tab, setTab] = useState("pr");
  const [decision, setDecision] = useState<{ prId: string; lineId: string; ok: boolean } | null>(null);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [revise, setRevise] = useState<{ prId: string; lineId: string } | null>(null);
  const [reviseQty, setReviseQty] = useState("");
  const [poFor, setPoFor] = useState<string | null>(null);
  const [supplier, setSupplier] = useState("S-03");
  const [newPr, setNewPr] = useState(false);
  /* GRN (terima dari vendor) */
  const [grnFor, setGrnFor] = useState<string | null>(null);
  const [grnLines, setGrnLines] = useState<{ qty: number; condition: HandoverCondition }[]>([]);
  const [grnNote, setGrnNote] = useState("");
  /* serah terima ke unit */
  const [recvFor, setRecvFor] = useState<string | null>(null);
  const [recvLines, setRecvLines] = useState<{ qty: number; condition: HandoverCondition }[]>([]);
  const [recvNote, setRecvNote] = useState("");
  const [bastView, setBastView] = useState<string | null>(null);
  /* retur */
  const [resolveFor, setResolveFor] = useState<{ id: string; mode: "DIGANTI" | "REFUND" } | null>(null);
  const [resolveNote, setResolveNote] = useState("");
  const [resolveErr, setResolveErr] = useState("");

  const stageIdx = (lineStages: { status: string }[]) => lineStages.findIndex((x) => x.status === "PENDING");
  const myStageRole = (idx: number) =>
    idx === 0 ? ["Umum", "IT Administrator", "Pengelola Aset"].includes(s.role)
    : idx === 1 ? s.role === "Finance"
    : s.role === "COO";

  const submitDecision = () => {
    if (!decision) return;
    if (!decision.ok && note.trim().length < 4) { setErr("Catatan/saran wajib diisi saat menolak."); return; }
    prDecide(decision.prId, decision.lineId, decision.ok, note.trim());
    setDecision(null); setNote(""); setErr("");
  };
  const submitRevise = () => {
    if (!revise) return;
    if (!(Number(reviseQty) > 0)) { setErr("Qty revisi wajib > 0."); return; }
    prRevise(revise.prId, revise.lineId, Number(reviseQty));
    setRevise(null); setReviseQty(""); setErr("");
  };

  const grnPo = s.purchaseOrders.find((p) => p.id === grnFor);
  const openGrn = (poId: string) => {
    const po = s.purchaseOrders.find((p) => p.id === poId)!;
    setGrnLines(po.items.map((it) => ({ qty: it.qty, condition: "BAIK" as HandoverCondition })));
    setGrnNote(""); setGrnFor(poId);
  };
  const submitGrn = () => {
    if (!grnFor) return;
    const lines: HandoverLine[] = grnPo!.items.map((it, i) => ({ name: it.name, qty: grnLines[i].qty, condition: grnLines[i].condition }));
    receivePo(grnFor, lines, grnNote.trim());
    setGrnFor(null);
  };

  const recvDl = s.deliveries.find((d) => d.id === recvFor);
  const openRecv = (dlId: string) => {
    const dl = s.deliveries.find((d) => d.id === dlId)!;
    setRecvLines(dl.items.map((it) => ({ qty: it.qty, condition: "BAIK" as HandoverCondition })));
    setRecvNote(""); setRecvFor(dlId);
  };
  const submitRecv = () => {
    if (!recvFor) return;
    const lines: HandoverLine[] = recvDl!.items.map((it, i) => ({ name: it.name, qty: recvLines[i].qty, condition: recvLines[i].condition }));
    unitReceive(recvFor, lines, recvNote.trim());
    setRecvFor(null);
  };

  const bastDetail = s.handovers.find((h) => h.id === bastView);
  const handoverForRef = (ref: string) => s.handovers.find((h) => h.ref === ref);

  const caps: string[] = [];
  if (canCreatePr(s.role)) caps.push("Ajukan PR");
  if ([0, 1, 2].some((i) => myStageRole(i))) caps.push("Setujui PR (tahap Anda)");
  if (canPo(s.role)) caps.push("Buat PO");
  if (canGrn(s.role)) caps.push("Terima GRN (BAST vendor)");
  if (canDeliver(s.role)) caps.push("Kirim ke unit");

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Pengadaan Barang</h1>
          <p className="text-xs text-mute">Permintaan → Persetujuan 3 tahap → Pesanan (PO) → Terima Barang → Kirim ke unit → Serah terima</p>
        </div>
        {caps.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[9px] font-bold uppercase text-mute">Anda bisa:</span>
            {caps.map((c) => <Chip key={c} tone="pine">{c}</Chip>)}
          </div>
        )}
      </div>

      {/* strip alur */}
      <Card className="p-3.5">
        <div className="flex flex-wrap items-center gap-2">
          {FLOW.map((f, i) => (
            <div key={f.label} className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-md border border-line bg-paper px-2.5 py-1.5">
                <span className="text-pine-600">{f.icon}</span>
                <span>
                  <span className="block font-display text-[11px] font-extrabold leading-tight text-ink">{f.label}</span>
                  <span className="block font-mono text-[8.5px] text-mute">{f.who}</span>
                </span>
              </div>
              {i < FLOW.length - 1 && <ArrowRight size={13} className="shrink-0 text-line2" />}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <Tabs active={tab} onChange={setTab}
          tabs={[{ id: "pr", label: "Permintaan (PR)" }, { id: "po", label: "Pesanan (PO)" }, { id: "dist", label: "Distribusi ke Unit" }, { id: "bast", label: "Serah Terima (BAST)" }, { id: "retur", label: "Retur Vendor" }]}
          counts={{ pr: s.purchaseRequests.length, po: s.purchaseOrders.length, dist: s.deliveries.filter((d) => d.status !== "RECEIVED").length, bast: s.handovers.length, retur: s.vendorReturns.filter((r) => r.status !== "DITUTUP").length }} />
        <div className="pt-4">
          {tab === "pr" && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <BtnPrimary disabled={!canCreatePr(s.role)} title={!canCreatePr(s.role) ? "Hanya Kepala Unit / Inventori / Direksi" : undefined} onClick={() => setNewPr(true)}>
                  <FilePlus2 size={14} /> Ajukan Permintaan (PR)
                </BtnPrimary>
              </div>
              {s.purchaseRequests.map((pr) => (
                <div key={pr.id} className="rounded-lg border border-line bg-paper p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-mono text-[13.5px] font-bold text-ink">{pr.code} <span className="font-sans text-[10.5px] font-medium text-mute">· {pr.unit} · butuh {fmtDate(pr.needBy)}</span></p>
                      <p className="font-mono text-[10px] text-mute">diajukan {pr.requester} · {fmtDate(pr.date)} · total <b className="text-ink">{fmtIDRCompact(prTotal(pr))}</b></p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusChip status={pr.status} />
                      {pr.status === "APPROVED" && (
                        <BtnSm disabled={!canPo(s.role)} title={!canPo(s.role) ? "Hanya Umum / Inventori / Kepala Gudang" : undefined} onClick={() => { setPoFor(pr.id); setSupplier("S-03"); }} className="!border-pine-500/60 !text-pine-700"><Send size={12} /> Buat PO</BtnSm>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    {pr.lines.map((l) => {
                      const idx = stageIdx(l.stages);
                      const ls = lineStatus(l);
                      const myTurn = idx >= 0 && myStageRole(idx) && pr.status === "IN_APPROVAL";
                      return (
                        <div key={l.id} className={`rounded-md border p-3 ${myTurn ? "border-pine-500/60 bg-pine-50/50" : "border-line bg-card"}`}>
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <Chip tone={l.kind === "ASSET" ? "pine" : "neutral"} className="!text-[9px]">{l.kind === "ASSET" ? "ASET" : "BHP"}</Chip>
                                <p className="text-[12.5px] font-bold text-ink">{l.name}</p>
                                {myTurn && <Chip tone="warn" dot>giliran Anda</Chip>}
                              </div>
                              <p className="mt-0.5 font-mono text-[10px] text-mute">{l.qty} × {fmtIDR(l.unitCost)} = <b className="text-ink">{fmtIDRCompact(l.qty * l.unitCost)}</b></p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {ls === "REJECTED" && canCreatePr(s.role) && (
                                <BtnSm onClick={() => { setRevise({ prId: pr.id, lineId: l.id }); setReviseQty(String(l.qty)); setErr(""); }} className="!border-warn/60 !text-warn"><Pencil size={11} /> Revisi</BtnSm>
                              )}
                              {myTurn ? (
                                <>
                                  <BtnSm onClick={() => { setDecision({ prId: pr.id, lineId: l.id, ok: true }); setNote(""); setErr(""); }} className="!border-ok/60 !text-ok"><Check size={11} /> Setujui</BtnSm>
                                  <BtnSm onClick={() => { setDecision({ prId: pr.id, lineId: l.id, ok: false }); setNote(""); setErr(""); }} className="!border-danger/60 !text-danger"><X size={11} /> Tolak</BtnSm>
                                </>
                              ) : idx >= 0 ? (
                                <span className="font-mono text-[9px] text-mute">menunggu {STAGE_LABELS[idx]}</span>
                              ) : null}
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
                    {pr.status === "IN_APPROVAL" && pr.lines.some((l) => { const i = stageIdx(l.stages); return i >= 0 && myStageRole(i); }) && (
                      <div className="flex justify-end">
                        <BtnSm onClick={() => prDecideAll(pr.id, true, "disetujui (batch)")} className="!border-ok/50 !text-ok" title="Setujui semua baris pada tahap Anda"><Check size={12} /> Setujui semua (tahap Anda)</BtnSm>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "po" && (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {s.purchaseOrders.length === 0 && <EmptyState title="Belum ada PO" sub="Setujui PR lalu buat PO." />}
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
                            <Chip tone={it.kind === "ASSET" ? "pine" : "neutral"} className="!text-[8px]">{it.kind === "ASSET" ? "ASET" : "BHP"}</Chip>
                            <span className="truncate">{it.name}</span> <span className="shrink-0 font-mono text-[10px] text-mute">×{it.qty}</span>
                          </span>
                          <span className="num shrink-0 font-mono text-[10.5px] text-ink2">{fmtIDR(it.qty * it.price)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2.5 flex items-center justify-between border-t border-line pt-2.5">
                      <span className="num font-mono text-[12px] font-bold text-ink">{fmtIDR(p.total)}</span>
                      {p.status === "SENT" ? (
                        <BtnSm disabled={!canGrn(s.role)} title={!canGrn(s.role) ? "Hanya Gudang / Umum" : undefined} onClick={() => openGrn(p.id)} className="!border-ok/50 !text-ok"><PackageCheck size={12} /> Terima & Buat BAST</BtnSm>
                      ) : (
                        <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-ok">
                          diterima ✓
                          {handoverForRef(p.code) && (
                            <button onClick={() => setBastView(handoverForRef(p.code)!.id)} className="rounded border border-ok/40 bg-okbg px-1.5 py-0.5 text-[9px] text-ok transition hover:bg-ok/20">{handoverForRef(p.code)!.code}</button>
                          )}
                        </span>
                      )}
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
                return (
                  <div key={dl.id} className={`rounded-lg border p-4 ${isMine && dl.status === "DELIVERED" ? "border-pine-500/50 bg-pine-50/40" : "border-line bg-paper"}`}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-mono text-[13px] font-bold text-ink">{dl.code}</p>
                          <Chip tone={isMine ? "pine" : "neutral"}>unit: {dl.unit}{isMine ? " · Anda" : ""}</Chip>
                          <StatusChip status={dl.status} />
                        </div>
                        <p className="mt-0.5 font-mono text-[10px] text-mute">dari {dl.poRef} · {fmtDate(dl.date)}{dl.courier ? ` · kurir ${dl.courier}` : ""}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {dl.status === "PENDING" && (
                          <BtnSm disabled={!canDeliver(s.role)} title={!canDeliver(s.role) ? "Hanya Gudang / Umum / Inventori" : undefined} onClick={() => deliver(dl.id)} className="!border-info/50 !text-info"><Truck size={12} /> Kirim ke Unit</BtnSm>
                        )}
                        {dl.status === "DELIVERED" && (isMine || s.role === "Pengelola Aset") && (
                          <BtnSm onClick={() => openRecv(dl.id)} className="!border-ok/60 !text-ok"><UserCheck size={12} /> Serah Terima & Tanda Tangan</BtnSm>
                        )}
                        {dl.status === "RECEIVED" && <span className="font-mono text-[10px] font-bold text-ok">diterima {dl.receivedBy} ✓</span>}
                      </div>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {dl.items.map((it, ii) => <Chip key={ii} tone="neutral">{it.name} ×{it.qty}</Chip>)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "bast" && (
            <div className="space-y-3">
              {s.handovers.length === 0 && <EmptyState title="Belum ada berita acara" sub="BAST dibuat otomatis saat Terima GRN (dari vendor) dan Serah Terima ke unit." />}
              {s.handovers.map((h) => (
                <button key={h.id} onClick={() => setBastView(h.id)} className="row-in flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-paper p-4 text-left transition hover:border-pine-500/50 hover:shadow-md">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-[13px] font-bold text-ink">{h.code}</p>
                      <Chip tone={h.kind === "VENDOR" ? "info" : "pine"}>{h.kind === "VENDOR" ? "Vendor → Gudang" : "Gudang → Unit"}</Chip>
                    </div>
                    <p className="mt-0.5 font-mono text-[10px] text-mute">ref {h.ref} · {fmtDate(h.date)} · {h.items.length} item · diterima {h.receivedBy}</p>
                  </div>
                  <ArrowRight size={14} className="text-mute" />
                </button>
              ))}
            </div>
          )}

          {tab === "retur" && (
            <div className="space-y-3">
              {s.vendorReturns.length === 0 && <EmptyState title="Belum ada retur" sub="Retur dibuat otomatis saat Terima GRN jika ada baris KURANG atau RUSAK." />}
              {s.vendorReturns.map((rt) => {
                const sup = s.suppliers.find((x) => x.id === rt.supplierId)?.name ?? "Vendor";
                const totalVal = rt.lines.reduce((a, l) => a + l.qty * l.unitCost, 0);
                const stepIdx = ["DIAJUKAN", "DIKIRIM", "DIGANTI", "REFUND", "DITUTUP"].indexOf(rt.status);
                return (
                  <div key={rt.id} className="rounded-lg border border-line bg-paper p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-mono text-[13.5px] font-bold text-ink">{rt.code}</p>
                          <StatusChip status={rt.status} />
                          <Chip tone="neutral">{sup}</Chip>
                        </div>
                        <p className="mt-0.5 font-mono text-[10px] text-mute">dari {rt.poRef} · {fmtDate(rt.date)} · nilai <b className="text-warn">{fmtIDRCompact(totalVal)}</b></p>
                        {rt.note && <p className="mt-1 text-[11.5px] italic text-ink2">“{rt.note}”</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        {["Diajukan", "Dikirim", "Selesai", "Ditutup"].map((stLabel, j) => {
                          const done = (rt.status === "DITUTUP") || (j === 0) || (j === 1 && stepIdx >= 1) || (j === 2 && (stepIdx === 2 || stepIdx === 3)) || (j === 3 && stepIdx === 4);
                          return (
                            <span key={stLabel} className="flex items-center gap-1">
                              <span className={`rounded border px-2 py-0.5 font-mono text-[9px] font-bold ${done ? "border-ok/40 bg-okbg text-ok" : "border-line bg-canvas text-mute"}`}>{stLabel}</span>
                              {j < 3 && <span className="text-[10px] text-line2">→</span>}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <div className="mt-2.5 space-y-1">
                      {rt.lines.map((ln, li) => (
                        <div key={li} className="flex items-center justify-between gap-2 rounded-md border border-line bg-canvas/50 px-2.5 py-1.5">
                          <span className="flex min-w-0 items-center gap-1.5 text-[12px] font-semibold text-ink">
                            <Chip tone={ln.reason === "KURANG" ? "warn" : "danger"} className="!text-[8px]">{ln.reason}</Chip>
                            <span className="truncate">{ln.name}</span>
                          </span>
                          <span className="num shrink-0 font-mono text-[10.5px] text-warn">×{ln.qty} · {fmtIDRCompact(ln.qty * ln.unitCost)}</span>
                        </div>
                      ))}
                    </div>
                    {rt.resolution && <p className="mt-2 rounded-md bg-okbg px-2.5 py-1.5 text-[11px] font-semibold text-ok">Penyelesaian: {rt.resolution}</p>}
                    <div className="mt-2.5 flex flex-wrap items-center justify-end gap-2 border-t border-line pt-2.5">
                      {rt.status === "DIAJUKAN" && (
                        <BtnSm disabled={!canReturnSend(s.role)} title={!canReturnSend(s.role) ? "Hanya Gudang / Umum" : undefined} onClick={() => returnSend(rt.id)} className="!border-info/50 !text-info"><Send size={12} /> Kirim ke Vendor</BtnSm>
                      )}
                      {rt.status === "DIKIRIM" && (
                        <>
                          <BtnSm disabled={!canReturnResolve(s.role)} title={!canReturnResolve(s.role) ? "Hanya Umum / Gudang / Finance" : undefined} onClick={() => { setResolveFor({ id: rt.id, mode: "DIGANTI" }); setResolveNote(""); setResolveErr(""); }} className="!border-ok/50 !text-ok"><PackageCheck size={12} /> Tandai Diganti</BtnSm>
                          <BtnSm disabled={!canReturnResolve(s.role)} title={!canReturnResolve(s.role) ? "Hanya Umum / Gudang / Finance" : undefined} onClick={() => { setResolveFor({ id: rt.id, mode: "REFUND" }); setResolveNote(""); setResolveErr(""); }} className="!border-warn/60 !text-warn"><Wallet size={12} /> Tandai Refund</BtnSm>
                        </>
                      )}
                      {(rt.status === "DIGANTI" || rt.status === "REFUND") && (
                        <BtnSm disabled={!canReturnClose(s.role)} title={!canReturnClose(s.role) ? "Hanya Umum / Gudang" : undefined} onClick={() => returnClose(rt.id)} className="!border-line !text-ink2"><Check size={12} /> Tutup Retur</BtnSm>
                      )}
                      {rt.status === "DITUTUP" && <span className="font-mono text-[10px] font-bold text-ok">retur selesai ✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* modal keputusan PR */}
      <Modal open={!!decision} onClose={() => setDecision(null)} kicker={decision ? `Tahap ${(() => { const pr = s.purchaseRequests.find((p) => p.id === decision.prId); const l = pr?.lines.find((x) => x.id === decision.lineId); const i = l ? stageIdx(l.stages) : 0; return i + 1; })()} — ${STAGE_LABELS[(() => { const pr = s.purchaseRequests.find((p) => p.id === decision.prId); const l = pr?.lines.find((x) => x.id === decision.lineId); return l ? Math.max(stageIdx(l.stages), 0) : 0; })()]}` : ""} title={decision ? (decision.ok ? "Setujui baris" : "Tolak baris") : ""}
        footer={<><BtnGhost onClick={() => setDecision(null)}>Batal</BtnGhost>
          {decision?.ok ? <BtnPrimary onClick={submitDecision}><Check size={13} /> Setujui</BtnPrimary> : <button onClick={submitDecision} className="inline-flex items-center gap-1.5 rounded-md bg-danger px-3.5 py-2 font-display text-[12.5px] font-bold text-white hover:bg-[#a03023]"><X size={13} /> Tolak</button>}</>}>
        <div className="space-y-3">
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
          <p className="rounded-md bg-infobg px-3 py-2 text-xs font-semibold text-info">Persetujuan diulang dari tahap 1 setelah revisi.</p>
          <div><Label>Qty baru *</Label><Input type="number" value={reviseQty} onChange={(e) => setReviseQty(e.target.value)} /></div>
          {err && <p className="rounded-md bg-dangerbg px-3 py-2 text-xs font-semibold text-danger">{err}</p>}
        </div>
      </Modal>

      {/* modal buat PO */}
      <Modal open={!!poFor} onClose={() => setPoFor(null)} kicker="Buat Purchase Order" title="Pilih pemasok"
        footer={<><BtnGhost onClick={() => setPoFor(null)}>Batal</BtnGhost>
          <BtnPrimary onClick={() => { if (poFor) { createPo(poFor, supplier); setPoFor(null); } }}><Send size={13} /> Terbitkan PO</BtnPrimary></>}>
        <div className="space-y-3">
          <div><Label>Pemasok</Label>
            <Select value={supplier} onChange={(e) => setSupplier(e.target.value)}>
              {s.suppliers.map((sp) => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
            </Select>
          </div>
          <p className="rounded-md bg-canvas/60 px-3 py-2 text-[11px] text-ink2">PO dibuat dari baris PR yang sudah disetujui 3 tahap.</p>
        </div>
      </Modal>

      {/* modal GRN — terima dari vendor + BAST */}
      <Modal open={!!grnFor} onClose={() => setGrnFor(null)} wide kicker={`GRN · ${grnPo?.code ?? ""}`} title="Terima barang & buat BAST vendor"
        footer={<><BtnGhost onClick={() => setGrnFor(null)}>Batal</BtnGhost><BtnPrimary onClick={submitGrn}><PackageCheck size={13} /> Terima & Terbitkan BAST</BtnPrimary></>}>
        <div className="space-y-3">
          <p className="rounded-md bg-infobg px-3 py-2 text-xs font-semibold text-info">
            Periksa fisik barang terhadap PO. Qty diterima & kondisi per baris akan dicetak di <b>BAST</b> dan tercatat di audit. Barang kurang/rusak otomatis dibuatkan retur ke vendor.
          </p>
          {grnPo?.items.map((it, i) => (
            <div key={i} className="rounded-md border border-line bg-canvas/50 p-3">
              <div className="flex items-center justify-between">
                <p className="text-[12.5px] font-bold text-ink">{it.name} <span className="font-mono text-[10px] text-mute">· PO {it.qty}</span></p>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div><Label>Qty diterima</Label><Input type="number" value={grnLines[i]?.qty ?? it.qty} onChange={(e) => setGrnLines(grnLines.map((g, j) => (j === i ? { ...g, qty: Number(e.target.value) } : g)))} /></div>
                <div><Label>Kondisi</Label>
                  <Select value={grnLines[i]?.condition ?? "BAIK"} onChange={(e) => setGrnLines(grnLines.map((g, j) => (j === i ? { ...g, condition: e.target.value as HandoverCondition } : g)))}>
                    {["BAIK", "KURANG", "RUSAK"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </Select>
                </div>
              </div>
            </div>
          ))}
          <div><Label>Catatan penerimaan</Label><TextArea value={grnNote} onChange={(e) => setGrnNote(e.target.value)} placeholder="cth: diterima lengkap, segel utuh…" /></div>
        </div>
      </Modal>

      {/* modal serah terima ke unit + BAST */}
      <Modal open={!!recvFor} onClose={() => setRecvFor(null)} wide kicker={`Serah terima · ${recvDl?.code ?? ""}`} title="Verifikasi & tanda tangani"
        footer={<><BtnGhost onClick={() => setRecvFor(null)}>Batal</BtnGhost><BtnPrimary onClick={submitRecv}><UserCheck size={13} /> Tanda Tangani & Terima</BtnPrimary></>}>
        <div className="space-y-3">
          <p className="rounded-md bg-okbg px-3 py-2 text-xs font-semibold text-ok">
            Sebagai <b>unit {recvDl?.unit}</b>, periksa kondisi barang dari kurir sebelum menandatangani. BAST gudang→unit akan diterbitkan.
          </p>
          {recvDl?.items.map((it, i) => (
            <div key={i} className="rounded-md border border-line bg-canvas/50 p-3">
              <p className="text-[12.5px] font-bold text-ink">{it.name} <span className="font-mono text-[10px] text-mute">· kirim {it.qty}</span></p>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div><Label>Qty diterima</Label><Input type="number" value={recvLines[i]?.qty ?? it.qty} onChange={(e) => setRecvLines(recvLines.map((g, j) => (j === i ? { ...g, qty: Number(e.target.value) } : g)))} /></div>
                <div><Label>Kondisi</Label>
                  <Select value={recvLines[i]?.condition ?? "BAIK"} onChange={(e) => setRecvLines(recvLines.map((g, j) => (j === i ? { ...g, condition: e.target.value as HandoverCondition } : g)))}>
                    {["BAIK", "KURANG", "RUSAK"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </Select>
                </div>
              </div>
            </div>
          ))}
          <div><Label>Catatan</Label><TextArea value={recvNote} onChange={(e) => setRecvNote(e.target.value)} placeholder="cth: lengkap & baik…" /></div>
        </div>
      </Modal>

      {/* modal detail BAST */}
      <Modal open={!!bastDetail} onClose={() => setBastView(null)} wide kicker="Dokumen serah terima" title={bastDetail?.code ?? ""}
        footer={<BtnPrimary onClick={() => setBastView(null)}>Tutup</BtnPrimary>}>
        {bastDetail && (
          <div className="rounded-lg border-2 border-pine-700/40 bg-card p-4">
            <p className="text-center font-display text-[15px] font-black uppercase tracking-wide text-ink">Berita Acara Serah Terima</p>
            <p className="mt-0.5 text-center font-mono text-[10px] text-mute">Nomor: {bastDetail.code} · Ref {bastDetail.ref} · {fmtDate(bastDetail.date)}</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-md bg-canvas/60 p-2.5">
                <p className="font-mono text-[9px] font-bold uppercase tracking-wide text-mute">Pihak Pertama (menyerahkan)</p>
                <p className="mt-1 text-[12px] font-bold text-ink">{bastDetail.from}</p>
                <p className="font-mono text-[10px] text-mute">{bastDetail.handedBy ?? "—"}</p>
              </div>
              <div className="rounded-md bg-canvas/60 p-2.5">
                <p className="font-mono text-[9px] font-bold uppercase tracking-wide text-mute">Pihak Kedua (menerima)</p>
                <p className="mt-1 text-[12px] font-bold text-ink">{bastDetail.to}</p>
                <p className="font-mono text-[10px] text-mute">{bastDetail.receivedBy}</p>
              </div>
            </div>
            <div className="mt-3 overflow-hidden rounded-md border border-line">
              <table className="w-full text-left">
                <thead><tr className="border-b border-line bg-canvas/70 font-mono text-[9px] font-bold uppercase text-mute"><th className="px-2.5 py-1.5">Barang</th><th className="px-2.5 py-1.5 text-right">Qty</th><th className="px-2.5 py-1.5">Kondisi</th></tr></thead>
                <tbody className="divide-y divide-line">
                  {bastDetail.items.map((it, i) => (
                    <tr key={i}><td className="px-2.5 py-1.5 text-[11.5px] font-semibold text-ink">{it.name}</td><td className="num px-2.5 py-1.5 text-right font-mono text-[11px]">{it.qty}</td><td className="px-2.5 py-1.5"><StatusChip status={it.condition} /></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            {bastDetail.note && <p className="mt-2.5 text-[11.5px] italic text-ink2">Catatan: {bastDetail.note}</p>}
            <div className="mt-3 flex items-center justify-between border-t border-dashed border-line pt-2.5">
              <span className="font-mono text-[9px] text-mute">checksum: {bastDetail.checksum}</span>
              <span className="flex items-center gap-1.5 font-mono text-[9px] font-bold text-ok"><Check size={11} /> tercatat di riwayat audit</span>
            </div>
          </div>
        )}
      </Modal>

      {/* modal penyelesaian retur */}
      <Modal open={!!resolveFor} onClose={() => setResolveFor(null)} kicker={`Penyelesaian retur · ${resolveFor?.mode === "DIGANTI" ? "barang pengganti" : "pengembalian dana"}`} title="Catat penyelesaian"
        footer={<><BtnGhost onClick={() => setResolveFor(null)}>Batal</BtnGhost>
          <BtnPrimary onClick={() => {
            if (!resolveFor) return;
            if (resolveNote.trim().length < 4) { setResolveErr("Catatan penyelesaian wajib diisi (min. 4 karakter)."); return; }
            returnResolve(resolveFor.id, resolveFor.mode, resolveNote.trim());
            setResolveFor(null); setResolveNote(""); setResolveErr("");
          }}><Check size={13} /> Simpan Penyelesaian</BtnPrimary></>}>
        <div className="space-y-3">
          <p className={`rounded-md px-3 py-2 text-xs font-semibold ${resolveFor?.mode === "DIGANTI" ? "bg-okbg text-ok" : "bg-warnbg text-warn"}`}>
            {resolveFor?.mode === "DIGANTI"
              ? "Barang pengganti akan diterima kembali: stok bertambah (buku besar) atau aset pengganti terdaftar."
              : "Refund akan dicatat sebagai pengembalian dana dari vendor (tidak mengubah stok)."}
          </p>
          <div>
            <Label>Catatan penyelesaian *</Label>
            <TextArea value={resolveNote} onChange={(e) => setResolveNote(e.target.value)} placeholder={resolveFor?.mode === "DIGANTI" ? "cth: vendor kirim pengganti, sudah dicek baik…" : "cth: refund via transfer, bukti kas diterima…"} />
          </div>
          {resolveErr && <p className="rounded-md bg-dangerbg px-3 py-2 text-xs font-semibold text-danger">{resolveErr}</p>}
        </div>
      </Modal>

      {newPr && <NewPrModal open={newPr} onClose={() => setNewPr(false)} onSubmit={(lines, needBy) => { createPr(lines, needBy); setNewPr(false); }} />}

      <p className="font-mono text-[10.5px] text-mute">Persetujuan per-barang tercatat di audit · GRN BHP posting buku besar (BR-003) · GRN aset daftarkan equipment tertelusur ke PO (BR-001/002) · setiap serah terima menerbitkan BAST · baris KURANG/RUSAK otomatis jadi retur vendor.</p>
    </div>
  );
}

const prTotal = (pr: { lines: { qty: number; unitCost: number }[] }) => pr.lines.reduce((a, l) => a + l.qty * l.unitCost, 0);
const lineStatus = (l: { stages: { status: string }[] }) => {
  if (l.stages.some((x) => x.status === "REJECTED")) return "REJECTED";
  if (l.stages.every((x) => x.status === "APPROVED")) return "APPROVED";
  return "IN_APPROVAL";
};

/* ── form ajukan PR (unit peminta) ── */
function NewPrModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (lines: { kind: "ITEM" | "ASSET"; sku?: string; name: string; category?: string; qty: number; unitCost: number }[], needBy: string) => void }) {
  const { s } = useApp();
  const [kind, setKind] = useState<"ITEM" | "ASSET">("ITEM");
  const [sku, setSku] = useState(s.items[0]?.sku ?? "");
  const [assetName, setAssetName] = useState("");
  const [assetCat, setAssetCat] = useState("Monitoring");
  const [assetCost, setAssetCost] = useState("");
  const [qty, setQty] = useState("1");
  const [lines, setLines] = useState<{ kind: "ITEM" | "ASSET"; sku?: string; name: string; category?: string; qty: number; unitCost: number }[]>([]);
  const [needBy, setNeedBy] = useState(new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10));
  const [err, setErr] = useState("");

  const addItem = () => {
    if (kind === "ITEM") {
      const it = s.items.find((i) => i.sku === sku);
      if (!it) { setErr("Pilih barang."); return; }
      setLines([...lines, { kind: "ITEM", sku: it.sku, name: it.name, qty: Number(qty) || 1, unitCost: it.unitCost }]);
    } else {
      if (!assetName.trim()) { setErr("Nama aset wajib diisi."); return; }
      setLines([...lines, { kind: "ASSET", name: assetName.trim(), category: assetCat, qty: Number(qty) || 1, unitCost: Number(assetCost) || 0 }]);
      setAssetName(""); setAssetCost("");
    }
    setQty("1"); setErr("");
  };
  const total = lines.reduce((a, l) => a + l.qty * l.unitCost, 0);

  return (
    <Modal open={open} onClose={onClose} wide kicker={`Ajukan PR · unit ${s.userUnit ?? "—"}`} title="Permintaan Pembelian Baru"
      footer={<><BtnGhost onClick={onClose}>Batal</BtnGhost><BtnPrimary onClick={() => { if (lines.length === 0) { setErr("Tambahkan minimal satu baris permintaan."); return; } onSubmit(lines, needBy); }} disabled={lines.length === 0}><Wallet size={13} /> Ajukan ({fmtIDRCompact(total)})</BtnPrimary></>}>
      <div className="space-y-3.5">
        <div className="grid grid-cols-2 gap-2">
          {(["ITEM", "ASSET"] as const).map((k) => (
            <button key={k} onClick={() => setKind(k)} className={`rounded-md border px-3 py-2 font-display text-[12px] font-bold transition ${kind === k ? "border-pine-600 bg-pine-50 text-pine-700" : "border-line bg-card text-mute hover:border-line2"}`}>
              {k === "ITEM" ? "Barang habis pakai (BHP)" : "Aset / alat (CAPEX)"}
            </button>
          ))}
        </div>
        {kind === "ITEM" ? (
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><Label>Barang (dari inventori)</Label>
              <Select value={sku} onChange={(e) => setSku(e.target.value)}>
                {s.items.map((i) => <option key={i.sku} value={i.sku}>{i.name} · {fmtIDR(i.unitCost)}/{i.uom}</option>)}
              </Select>
            </div>
            <div><Label>Qty</Label><Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} /></div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Nama aset *</Label><Input value={assetName} onChange={(e) => setAssetName(e.target.value)} placeholder="cth: Ventilator Transport" /></div>
            <div><Label>Kategori</Label>
              <Select value={assetCat} onChange={(e) => setAssetCat(e.target.value)}>
                {["Life Support", "Imaging", "Monitoring", "Sterilisasi", "Laboratorium"].map((c) => <option key={c}>{c}</option>)}
              </Select>
            </div>
            <div><Label>Estimasi biaya</Label><Input type="number" value={assetCost} onChange={(e) => setAssetCost(e.target.value)} placeholder="445000000" /></div>
          </div>
        )}
        <div className="flex items-end"><BtnSm onClick={addItem} className="w-full !py-2">+ Tambah baris</BtnSm></div>
        {lines.length > 0 && (
          <div className="space-y-1.5">
            {lines.map((l, i) => (
              <div key={i} className="flex items-center justify-between gap-2 rounded-md border border-line bg-canvas/50 px-2.5 py-1.5">
                <span className="flex min-w-0 items-center gap-1.5 text-[12px] font-semibold text-ink">
                  <Chip tone={l.kind === "ASSET" ? "pine" : "neutral"} className="!text-[8px]">{l.kind === "ASSET" ? "ASET" : "BHP"}</Chip>
                  <span className="truncate">{l.name}</span> <span className="font-mono text-[10px] text-mute">×{l.qty}</span>
                </span>
                <span className="num shrink-0 font-mono text-[10.5px] text-ink2">{fmtIDRCompact(l.qty * l.unitCost)}</span>
              </div>
            ))}
          </div>
        )}
        <div><Label>Butuh sebelum</Label><Input type="date" value={needBy} onChange={(e) => setNeedBy(e.target.value)} /></div>
        {err && <p className="rounded-md bg-dangerbg px-3 py-2 text-xs font-semibold text-danger">{err}</p>}
      </div>
    </Modal>
  );
}
