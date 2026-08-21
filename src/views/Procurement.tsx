import { useMemo, useState } from "react";
import { activeStage, canDecideStage, lineState, prTotal, useApp } from "../lib/store";
import { BtnGhost, BtnPrimary, BtnSm, Card, Chip, EmptyState, Input, Label, Modal, Select, StatusChip, Tabs, TextArea } from "../components/ui";
import { fmtDate, fmtIDR, fmtIDRCompact, HandoverCondition, HandoverRecord, Role } from "../lib/types";
import { ArrowRight, Check, ClipboardCheck, FilePlus2, PackageCheck, Pencil, Send, Truck, UserCheck, Wallet, X } from "lucide-react";

const STAGE_LABELS = ["IT / Umum", "Keuangan", "COO"];

/* ── tanggung jawab per peran (sesuai alur PRD) ── */
const canCreatePr = (r: Role) => ["Kepala Unit", "Direksi", "Pengelola Inventory"].includes(r);
const canPo = (r: Role) => ["Umum", "Pengelola Inventory", "Kepala Gudang"].includes(r);
const canGrn = (r: Role) => ["Kepala Gudang", "Petugas Gudang", "Umum"].includes(r);
const canDeliver = (r: Role) => ["Kepala Gudang", "Petugas Gudang", "Umum", "Pengelola Inventory"].includes(r);
const canUnitReceive = (r: Role) => ["Kepala Unit", "Pengelola Aset", "Pengelola Inventory"].includes(r);

const FLOW = [
  { label: "Ajukan PR", who: "Unit peminta", icon: <FilePlus2 size={13} /> },
  { label: "Persetujuan 3 tahap", who: "IT/Umum → Keuangan → COO", icon: <ClipboardCheck size={13} /> },
  { label: "Buat PO", who: "Umum / Inventory", icon: <Send size={13} /> },
  { label: "Terima GRN", who: "Gudang", icon: <PackageCheck size={13} /> },
  { label: "Kirim ke unit", who: "Gudang", icon: <Truck size={13} /> },
  { label: "Unit terima", who: "Kepala Unit", icon: <UserCheck size={13} /> },
];

export default function Procurement() {
  const { s, createPr, prDecide, prDecideAll, prRevise, createPo, receivePo, deliver, unitReceive } = useApp();
  const [tab, setTab] = useState("pr");
  const [decision, setDecision] = useState<{ prId: string; lineId: string; ok: boolean } | null>(null);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [revise, setRevise] = useState<{ prId: string; lineId: string } | null>(null);
  const [reviseQty, setReviseQty] = useState("");
  const [poFor, setPoFor] = useState<string | null>(null);
  const [supplier, setSupplier] = useState("S-03");
  const [newPr, setNewPr] = useState(false);
  /* serah terima (GRN dari vendor & serah terima ke unit) */
  const [grnFor, setGrnFor] = useState<string | null>(null);
  const [grnLines, setGrnLines] = useState<{ qty: number; condition: HandoverCondition }[]>([]);
  const [grnNote, setGrnNote] = useState("");
  const [recvFor, setRecvFor] = useState<string | null>(null);
  const [recvLines, setRecvLines] = useState<{ qty: number; condition: HandoverCondition }[]>([]);
  const [recvNote, setRecvNote] = useState("");
  const [bastView, setBastView] = useState<string | null>(null);

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
  const myStage = [0, 1, 2].find((i) => canDecideStage(s.role, i));

  /* ringkasan tanggung jawab role aktif */
  const roleCaps = useMemo(() => {
    const caps: string[] = [];
    if (canCreatePr(s.role)) caps.push("Ajukan PR");
    if (myStage !== undefined) caps.push(`Setujui tahap ${STAGE_LABELS[myStage]}`);
    if (canPo(s.role)) caps.push("Buat PO");
    if (canGrn(s.role)) caps.push("Terima GRN (BAST vendor)");
    if (canDeliver(s.role)) caps.push("Kirim ke unit");
    if (canUnitReceive(s.role)) caps.push("Serah terima ke unit");
    return caps;
  }, [s.role, myStage]);

  /* ── serah terima: GRN dari vendor ── */
  const grnPo = grnFor ? s.purchaseOrders.find((p) => p.id === grnFor) : null;
  const openGrn = (poId: string) => {
    const po = s.purchaseOrders.find((p) => p.id === poId);
    if (!po) return;
    setGrnFor(poId);
    setGrnLines(po.items.map((it) => ({ qty: it.qty, condition: "BAIK" })));
    setGrnNote(""); setErr("");
  };
  const submitGrn = () => {
    if (!grnPo) return;
    if (grnLines.some((l) => l.qty < 0)) return setErr("Qty diterima tidak boleh negatif.");
    const lines = grnPo.items.map((it, i) => ({ name: it.name, qty: grnLines[i].qty, condition: grnLines[i].condition }));
    receivePo(grnPo.id, lines, grnNote.trim());
    setGrnFor(null); setErr("");
  };

  /* ── serah terima: gudang → unit ── */
  const recvDl = recvFor ? s.deliveries.find((d) => d.id === recvFor) : null;
  const openRecv = (dlId: string) => {
    const dl = s.deliveries.find((d) => d.id === dlId);
    if (!dl) return;
    setRecvFor(dlId);
    setRecvLines(dl.items.map((it) => ({ qty: it.qty, condition: "BAIK" })));
    setRecvNote(""); setErr("");
  };
  const submitRecv = () => {
    if (!recvDl) return;
    const lines = recvDl.items.map((it, i) => ({ name: it.name, qty: recvLines[i].qty, condition: recvLines[i].condition }));
    unitReceive(recvDl.id, lines, recvNote.trim());
    setRecvFor(null); setErr("");
  };

  const condTone = (c: HandoverCondition): "ok" | "warn" | "danger" => (c === "BAIK" ? "ok" : c === "KURANG" ? "warn" : "danger");
  const bastDetail = bastView ? s.handovers.find((h) => h.id === bastView) : null;
  const handoverForRef = (ref: string) => s.handovers.find((h) => h.ref === ref);

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Procurement</h1>
          <p className="text-xs text-mute">Purchase Request → Persetujuan 3 tahap → PO → GRN → Distribusi → unit terima</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Chip tone={roleCaps.length > 0 ? "ok" : "neutral"} dot>
            {roleCaps.length > 0 ? `Peran Anda: ${roleCaps.join(" · ")}` : `Role ${s.role} — tidak ada aksi di alur ini`}
          </Chip>
          {isApprover && myStage !== undefined && (
            <span className="font-mono text-[10px] text-mute">Anda approver tahap <b className="text-pine-700">{myStage + 1} ({STAGE_LABELS[myStage]})</b></span>
          )}
        </div>
      </div>

      {/* ── alur 6 tahap ── */}
      <Card className="p-3.5">
        <div className="flex flex-wrap items-center gap-y-2">
          {FLOW.map((f, i) => (
            <div key={f.label} className="flex items-center">
              <div className="flex items-center gap-2 rounded-md border border-line bg-canvas/60 px-2.5 py-1.5">
                <span className="text-pine-600">{f.icon}</span>
                <span>
                  <span className="block font-mono text-[10px] font-bold uppercase tracking-wide text-ink2">{i + 1}. {f.label}</span>
                  <span className="block font-mono text-[8.5px] text-mute">{f.who}</span>
                </span>
              </div>
              {i < FLOW.length - 1 && <ArrowRight size={13} className="mx-1.5 shrink-0 text-line2" />}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <Tabs active={tab} onChange={setTab}
          tabs={[{ id: "pr", label: "Purchase Request" }, { id: "po", label: "Purchase Order" }, { id: "dist", label: "Distribusi ke Unit" }, { id: "bast", label: "Serah Terima (BAST)" }]}
          counts={{ pr: s.purchaseRequests.length, po: s.purchaseOrders.length, dist: s.deliveries.filter((d) => d.status !== "RECEIVED").length, bast: s.handovers.length }} />
        <div className="pt-4">
          {tab === "pr" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <BtnPrimary disabled={!canCreatePr(s.role)} title={!canCreatePr(s.role) ? "Hanya Kepala Unit / Pengelola Inventory / Direksi" : undefined} onClick={() => setNewPr(true)}>
                  <FilePlus2 size={14} /> Ajukan Purchase Request
                </BtnPrimary>
              </div>

              {s.purchaseRequests.map((pr) => (
                <div key={pr.id} className="rounded-lg border border-line bg-paper p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-mono text-[13.5px] font-bold text-ink">{pr.code}</p>
                        <StatusChip status={pr.status} />
                        <Chip tone="neutral">unit: {pr.unit}</Chip>
                      </div>
                      <p className="mt-0.5 font-mono text-[10px] text-mute">peminta: {pr.requester} · {fmtDate(pr.date)} · need by {fmtDate(pr.needBy)} · total <b className="text-ink">{fmtIDRCompact(prTotal(pr))}</b></p>
                    </div>
                    <div className="flex items-center gap-2">
                      {pr.status === "APPROVED" && (
                        <BtnSm disabled={!canPo(s.role)} title={!canPo(s.role) ? "Hanya Umum / Inventory / Kepala Gudang" : undefined} onClick={() => { setPoFor(pr.id); setSupplier("S-03"); }} className="!border-pine-500/60 !text-pine-700"><Send size={12} /> Buat PO</BtnSm>
                      )}
                      {isApprover && myStage !== undefined && pr.lines.some((l) => activeStage(l) === myStage && lineState(l) === "IN_APPROVAL") && (
                        <BtnSm onClick={() => { prDecideAll(pr.id, true, "disetujui (batch)"); }} className="!border-ok/50 !text-ok" title="Setujui semua baris pada tahap Anda"><Check size={12} /> Setujui semua (tahap Anda)</BtnSm>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 space-y-2.5">
                    {pr.lines.map((l) => {
                      const ls = lineState(l);
                      const idx = activeStage(l);
                      const canAct = idx >= 0 && canDecideStage(s.role, idx) && pr.status !== "PO_CREATED";
                      const myTurn = idx >= 0 && idx === myStage;
                      return (
                        <div key={l.id} className={`rounded-md border p-3 ${myTurn ? "border-pine-500/60 bg-pine-50/50" : "border-line bg-card"}`}>
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <Chip tone={l.kind === "ASSET" ? "pine" : "neutral"} className="!text-[9px]">{l.kind}</Chip>
                                <p className="text-[12.5px] font-bold text-ink">{l.name}</p>
                                {l.sku && <span className="font-mono text-[9.5px] text-mute">{l.sku}</span>}
                                {myTurn && <Chip tone="warn" dot>giliran Anda</Chip>}
                              </div>
                              <p className="mt-0.5 font-mono text-[10px] text-mute">{l.qty} × {fmtIDR(l.unitCost)} = <b className="text-ink">{fmtIDRCompact(l.qty * l.unitCost)}</b></p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {ls === "REJECTED" && canCreatePr(s.role) && (
                                <BtnSm onClick={() => { setRevise({ prId: pr.id, lineId: l.id }); setReviseQty(String(l.qty)); setErr(""); }} className="!border-warn/60 !text-warn"><Pencil size={11} /> Revisi</BtnSm>
                              )}
                              {canAct ? (
                                <>
                                  <BtnSm onClick={() => { setDecision({ prId: pr.id, lineId: l.id, ok: true }); setNote(""); setErr(""); }} className="!border-ok/60 !text-ok"><Check size={11} /> Setujui</BtnSm>
                                  <BtnSm onClick={() => { setDecision({ prId: pr.id, lineId: l.id, ok: false }); setNote(""); setErr(""); }} className="!border-danger/60 !text-danger"><X size={11} /> Tolak</BtnSm>
                                </>
                              ) : idx >= 0 && !myTurn ? (
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
                      {dl.status === "PENDING" && (
                        <BtnSm disabled={!canDeliver(s.role)} title={!canDeliver(s.role) ? "Hanya Gudang / Umum / Inventory" : undefined} onClick={() => deliver(dl.id)} className="!border-info/50 !text-info"><Truck size={12} /> Kirim ke Unit</BtnSm>
                      )}
                      {dl.status === "DELIVERED" && (
                        (isMine && s.role === "Kepala Unit") || canUnitReceive(s.role) ? (
                          <BtnSm onClick={() => openRecv(dl.id)} className="!border-ok/60 !text-ok"><UserCheck size={12} /> Serah Terima & Tanda Tangan</BtnSm>
                        ) : (
                          <span className="font-mono text-[9.5px] text-mute">masuk sebagai Kepala Unit <b className="text-pine-700">{dl.unit}</b> untuk konfirmasi</span>
                        )
                      )}
                      {dl.status === "RECEIVED" && (
                        <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-ok">
                          alur selesai ✓
                          {handoverForRef(dl.code) && (
                            <button onClick={() => setBastView(handoverForRef(dl.code)!.id)} className="rounded border border-ok/40 bg-okbg px-1.5 py-0.5 text-[9px] text-ok transition hover:bg-ok/20">{handoverForRef(dl.code)!.code}</button>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "bast" && (
            <div className="space-y-3">
              {s.handovers.length === 0 && <EmptyState title="Belum ada berita acara" sub="BAST dibuat otomatis saat Terima GRN (dari vendor) dan Serah Terima ke unit." />}
              {s.handovers.map((h, i) => {
                const short = h.items.filter((x) => x.condition !== "BAIK").length;
                return (
                  <button key={h.id} onClick={() => setBastView(h.id)} style={{ animationDelay: `${i * 45}ms` }}
                    className="row-in flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-paper p-4 text-left transition hover:-translate-y-0.5 hover:border-pine-500/50 hover:shadow-lg">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-10 w-10 items-center justify-center rounded-md ${h.kind === "VENDOR" ? "bg-infobg text-info" : "bg-pine-100 text-pine-700"}`}>
                        {h.kind === "VENDOR" ? <PackageCheck size={18} /> : <UserCheck size={18} />}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-mono text-[13px] font-bold text-ink">{h.code}</p>
                          <Chip tone={h.kind === "VENDOR" ? "info" : "pine"}>{h.kind === "VENDOR" ? "VENDOR → GUDANG" : "GUDANG → UNIT"}</Chip>
                          {short > 0 && <Chip tone="warn" dot>{short} catatan kondisi</Chip>}
                        </div>
                        <p className="mt-0.5 font-mono text-[10px] text-mute">{h.from} → {h.to} · ref {h.ref} · {fmtDate(h.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10.5px] text-mute">{h.items.length} item · penerima <b className="text-ink2">{h.receivedBy}</b></span>
                      <ArrowRight size={15} className="text-line2" />
                    </div>
                  </button>
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

      {/* modal ajukan PR */}
      <NewPrModal open={newPr} onClose={() => setNewPr(false)} onSubmit={(lines, needBy) => { createPr(lines, needBy); setNewPr(false); }} />

      {/* ── modal GRN: verifikasi serah terima dari vendor + terbitkan BAST ── */}
      <Modal open={!!grnPo} onClose={() => setGrnFor(null)} wide kicker={`GRN · ${grnPo?.code ?? ""}`} title="Terima barang & buat BAST vendor"
        footer={<><BtnGhost onClick={() => setGrnFor(null)}>Batal</BtnGhost><BtnPrimary onClick={submitGrn}><PackageCheck size={13} /> Terima & Terbitkan BAST</BtnPrimary></>}>
        {grnPo && (
          <div className="space-y-3.5">
            <p className="rounded-md bg-infobg px-3 py-2 text-[11.5px] leading-relaxed text-info">
              Periksa fisik barang terhadap PO. Qty diterima & kondisi per baris akan dicetak di <b>BAST (Berita Acara Serah Terima)</b> dan tercatat di audit trail. Barang kurang/rusak otomatis diberi catatan tindak-lanjut ke vendor.
            </p>
            <div className="space-y-2">
              {grnPo.items.map((it, i) => (
                <div key={i} className="rounded-md border border-line bg-canvas/50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-[12px] font-semibold text-ink">
                      <Chip tone={it.kind === "ASSET" ? "pine" : "neutral"} className="!text-[8px]">{it.kind}</Chip>
                      {it.name} <span className="font-mono text-[10px] text-mute">PO ×{it.qty}</span>
                    </span>
                    <Chip tone={condTone(grnLines[i]?.condition ?? "BAIK")}>{grnLines[i]?.condition ?? "BAIK"}</Chip>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Label>Qty diterima</Label>
                    <Input type="number" className="!w-24" value={grnLines[i]?.qty ?? 0}
                      onChange={(e) => setGrnLines(grnLines.map((l, j) => (j === i ? { ...l, qty: Number(e.target.value) } : l)))} />
                    <div className="flex gap-1.5">
                      {(["BAIK", "KURANG", "RUSAK"] as HandoverCondition[]).map((c) => (
                        <button key={c} onClick={() => setGrnLines(grnLines.map((l, j) => (j === i ? { ...l, condition: c } : l)))}
                          className={`rounded border px-2 py-1 font-mono text-[10px] font-bold transition ${(grnLines[i]?.condition ?? "BAIK") === c
                            ? c === "BAIK" ? "border-ok/50 bg-okbg text-ok" : c === "KURANG" ? "border-warn/50 bg-warnbg text-warn" : "border-danger/50 bg-dangerbg text-danger"
                            : "border-line bg-card text-mute hover:border-line2"}`}>{c}</button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div><Label>Catatan serah terima (opsional)</Label>
              <TextArea value={grnNote} onChange={(e) => setGrnNote(e.target.value)} placeholder="cth: segel utuh, dokumen lengkap…" /></div>
            {err && <p className="rounded-md bg-dangerbg px-3 py-2 text-xs font-semibold text-danger">{err}</p>}
          </div>
        )}
      </Modal>

      {/* ── modal serah terima: gudang → unit + tanda tangan ── */}
      <Modal open={!!recvDl} onClose={() => setRecvFor(null)} wide kicker={`Serah terima · ${recvDl?.code ?? ""}`} title={`Serah terima ke unit ${recvDl?.unit ?? ""}`}
        footer={<><BtnGhost onClick={() => setRecvFor(null)}>Batal</BtnGhost><BtnPrimary onClick={submitRecv}><UserCheck size={13} /> Tanda Tangani & Terima</BtnPrimary></>}>
        {recvDl && (
          <div className="space-y-3.5">
            <p className="rounded-md bg-okbg px-3 py-2 text-[11.5px] leading-relaxed text-ok">
              Unit <b>{recvDl.unit}</b> memverifikasi barang dari <b>{recvDl.courier ?? "gudang"}</b>. Setelah ditandatangani, BAST diterbitkan dan pengadaan dinyatakan selesai untuk unit ini.
            </p>
            <div className="space-y-2">
              {recvDl.items.map((it, i) => (
                <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-canvas/50 px-3 py-2.5">
                  <span className="text-[12px] font-semibold text-ink">{it.name} <span className="font-mono text-[10px] text-mute">×{it.qty}</span></span>
                  <div className="flex gap-1.5">
                    {(["BAIK", "KURANG", "RUSAK"] as HandoverCondition[]).map((c) => (
                      <button key={c} onClick={() => setRecvLines(recvLines.map((l, j) => (j === i ? { ...l, condition: c } : l)))}
                        className={`rounded border px-2 py-1 font-mono text-[10px] font-bold transition ${(recvLines[i]?.condition ?? "BAIK") === c
                          ? c === "BAIK" ? "border-ok/50 bg-okbg text-ok" : c === "KURANG" ? "border-warn/50 bg-warnbg text-warn" : "border-danger/50 bg-dangerbg text-danger"
                          : "border-line bg-card text-mute hover:border-line2"}`}>{c}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div><Label>Catatan unit penerima (opsional)</Label>
              <TextArea value={recvNote} onChange={(e) => setRecvNote(e.target.value)} placeholder="cth: diterima lengkap, siap digunakan…" /></div>
            {err && <p className="rounded-md bg-dangerbg px-3 py-2 text-xs font-semibold text-danger">{err}</p>}
          </div>
        )}
      </Modal>

      {/* ── modal detail BAST (dokumen resmi) ── */}
      <Modal open={!!bastDetail} onClose={() => setBastView(null)} wide kicker="Dokumen serah terima" title={bastDetail?.code ?? ""}
        footer={<BtnPrimary onClick={() => setBastView(null)}>Tutup</BtnPrimary>}>
        {bastDetail && (
          <div className="space-y-3.5">
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
                  <thead><tr className="border-b border-line bg-canvas/70 font-mono text-[9px] font-bold uppercase tracking-wide text-mute">
                    <th className="px-2.5 py-1.5">Barang</th><th className="px-2.5 py-1.5 text-right">Qty</th><th className="px-2.5 py-1.5">Kondisi</th></tr></thead>
                  <tbody className="divide-y divide-line">
                    {bastDetail.items.map((it, i) => (
                      <tr key={i}>
                        <td className="px-2.5 py-1.5 text-[11.5px] font-semibold text-ink2">{it.name}</td>
                        <td className="num px-2.5 py-1.5 text-right font-mono text-[11px]">{it.qty}</td>
                        <td className="px-2.5 py-1.5"><Chip tone={condTone(it.condition)}>{it.condition}</Chip></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {bastDetail.note && <p className="mt-2.5 rounded-md bg-warnbg/60 px-2.5 py-1.5 text-[11px] italic text-ink2">“{bastDetail.note}”</p>}
              <div className="mt-3 flex items-center justify-between border-t border-dashed border-line pt-2.5">
                <span className="font-mono text-[9px] text-mute">checksum: {bastDetail.checksum}</span>
                <span className="flex items-center gap-1.5 font-mono text-[9px] font-bold text-ok"><Check size={11} /> tercatat di audit trail</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <p className="font-mono text-[10.5px] text-mute">Persetujuan per-barang tercatat di audit trail · GRN BHP posting ledger (BR-003) · GRN aset daftarkan equipment tertelusur ke PO (BR-001/002) · setiap serah terima menerbitkan BAST (pencatatan).</p>
    </div>
  );
}

/* ── form ajukan PR (unit peminta) ── */
function NewPrModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (lines: { kind: "ITEM" | "ASSET"; sku?: string; name: string; category?: string; qty: number; unitCost: number }[], needBy: string) => void }) {
  const { s } = useApp();
  const [kind, setKind] = useState<"ITEM" | "ASSET">("ITEM");
  const [sku, setSku] = useState(s.items[0]?.sku ?? "");
  const [assetName, setAssetName] = useState("");
  const [assetCat, setAssetCat] = useState("Monitoring");
  const [qty, setQty] = useState("1");
  const [cost, setCost] = useState("");
  const [needBy, setNeedBy] = useState(() => new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10));
  const [lines, setLines] = useState<{ kind: "ITEM" | "ASSET"; sku?: string; name: string; category?: string; qty: number; unitCost: number }[]>([]);
  const [err, setErr] = useState("");

  const selItem = s.items.find((i) => i.sku === sku);
  const unitCost = kind === "ITEM" ? (selItem?.unitCost ?? 0) : Number(cost) || 0;
  const name = kind === "ITEM" ? (selItem?.name ?? "") : assetName.trim();

  const addLine = () => {
    if (kind === "ASSET" && !name) return setErr("Nama aset wajib diisi.");
    if (!(Number(qty) > 0)) return setErr("Qty wajib > 0.");
    if (unitCost <= 0) return setErr(kind === "ASSET" ? "Estimasi biaya wajib > 0." : "Item tidak ditemukan.");
    setLines([...lines, { kind, sku: kind === "ITEM" ? sku : undefined, name, category: kind === "ASSET" ? assetCat : undefined, qty: Number(qty), unitCost }]);
    setErr(""); setQty("1"); setAssetName(""); setCost("");
  };

  const submit = () => {
    if (lines.length === 0) return setErr("Tambahkan minimal satu baris permintaan.");
    onSubmit(lines, needBy);
    setLines([]); setErr("");
  };

  const total = lines.reduce((a, l) => a + l.qty * l.unitCost, 0);

  return (
    <Modal open={open} onClose={onClose} wide kicker={`Ajukan PR · unit ${s.userUnit ?? "—"}`} title="Purchase Request baru"
      footer={<><BtnGhost onClick={onClose}>Batal</BtnGhost><BtnPrimary onClick={submit} disabled={lines.length === 0}><Wallet size={13} /> Ajukan ({fmtIDRCompact(total)})</BtnPrimary></>}>
      <div className="space-y-3.5">
        <div>
          <Label>Jenis permintaan</Label>
          <div className="grid grid-cols-2 gap-2">
            {(["ITEM", "ASSET"] as const).map((k) => (
              <button key={k} onClick={() => { setKind(k); setErr(""); }}
                className={`rounded-md border px-3 py-2 font-mono text-[11.5px] font-bold transition ${kind === k ? (k === "ASSET" ? "border-pine-600 bg-pine-50 text-pine-700" : "border-pine-600 bg-pine-50 text-pine-700") : "border-line bg-card text-mute hover:border-line2"}`}>
                {k === "ITEM" ? "Barang habis pakai (BHP)" : "Aset / alat (CAPEX)"}
              </button>
            ))}
          </div>
        </div>

        {kind === "ITEM" ? (
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Item (dari inventory)</Label>
              <Select value={sku} onChange={(e) => setSku(e.target.value)}>
                {s.items.map((i) => <option key={i.sku} value={i.sku}>{i.name} — {i.sku}</option>)}
              </Select>
            </div>
            <div><Label>Harga satuan</Label><Input value={fmtIDR(selItem?.unitCost ?? 0)} readOnly className="bg-canvas/60" /></div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><Label>Nama aset *</Label><Input value={assetName} onChange={(e) => setAssetName(e.target.value)} placeholder="cth: Patient Monitor MX550" /></div>
            <div><Label>Kategori</Label><Select value={assetCat} onChange={(e) => setAssetCat(e.target.value)}>{["Imaging", "Life Support", "Monitoring", "Laboratorium", "Sterilisasi", "Infusion"].map((c) => <option key={c}>{c}</option>)}</Select></div>
            <div className="col-span-3"><Label>Estimasi biaya satuan (IDR) *</Label><Input type="number" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="250000000" /></div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div><Label>Qty *</Label><Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} /></div>
          <div className="flex items-end"><BtnSm onClick={addLine} className="w-full !py-2">+ Tambah baris</BtnSm></div>
        </div>

        {lines.length > 0 && (
          <div className="space-y-1.5">
            <Label>Baris permintaan</Label>
            {lines.map((l, i) => (
              <div key={i} className="flex items-center justify-between gap-2 rounded-md border border-line bg-canvas/50 px-2.5 py-1.5">
                <span className="flex min-w-0 items-center gap-1.5 text-[12px] font-semibold text-ink">
                  <Chip tone={l.kind === "ASSET" ? "pine" : "neutral"} className="!text-[8px]">{l.kind}</Chip>
                  <span className="truncate">{l.name}</span><span className="font-mono text-[10px] text-mute">×{l.qty}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="num font-mono text-[10.5px] text-ink2">{fmtIDRCompact(l.qty * l.unitCost)}</span>
                  <button onClick={() => setLines(lines.filter((_, j) => j !== i))} className="text-danger hover:underline"><X size={12} /></button>
                </span>
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
