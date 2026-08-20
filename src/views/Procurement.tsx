import { useState } from "react";
import { useApp } from "../lib/store";
import { BtnSm, Card, Chip, Input, Label, Modal, Select, StatusChip, Tabs, BtnGhost, BtnPrimary, TextArea } from "../components/ui";
import { IcCart, IcCheck, IcChevD, IcClose, IcPlus, IcTruck, IcWrench } from "../components/icons";
import { daysUntil, fmtDate, fmtIDR, fmtIDRCompact, lineActiveStage, lineState, lineTotal, prStageLabels, prStageRole, prState, prTotal, PRLine } from "../lib/types";

const canPlan = (r: string) => ["Pengelola Inventory", "Kepala Gudang", "Pengelola Aset", "Direksi"].includes(r);
const canOps = (r: string) => ["Pengelola Inventory", "Kepala Gudang", "Direksi"].includes(r);
const canRevise = (r: string) => ["Pengelola Inventory", "Kepala Gudang", "Pengelola Aset", "Kepala Unit", "Direksi"].includes(r);

function StageTracker({ line }: { line: PRLine }) {
  const active = lineActiveStage(line);
  return (
    <div className="flex items-center gap-1">
      {line.stages.map((st, i) => {
        const label = prStageLabels(line.isIT)[i];
        const role = prStageRole(line.isIT, i);
        const isActive = i === active;
        const cls =
          st.status === "APPROVED" ? "border-ok/40 bg-okbg text-ok"
          : st.status === "REJECTED" ? "border-danger/40 bg-dangerbg text-danger"
          : isActive ? "border-warn/60 bg-warnbg text-warn ring-1 ring-warn/40"
          : "border-line bg-canvas text-mute";
        return (
          <span key={i} className="flex items-center gap-1">
            <span title={`Approver: ${role}`} className={`flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold whitespace-nowrap ${cls}`}>
              {i + 1}·{label}
              {st.status === "APPROVED" && <IcCheck size={9} />}
              {st.status === "REJECTED" && <IcClose size={9} />}
            </span>
            {i < line.stages.length - 1 && <span className="text-[10px] text-line2">→</span>}
          </span>
        );
      })}
    </div>
  );
}

export default function Procurement() {
  const { s, submitDemand, reviewDemand, consolidateDemand, createPo, receivePo, prDecide, prDecideAll, prRevise } = useApp();
  const [tab, setTab] = useState("pr");

  const [decision, setDecision] = useState<{ prId: string; lineId: string; ok: boolean } | null>(null);
  const [note, setNote] = useState("");
  const [decideAll, setDecideAll] = useState<{ prId: string; ok: boolean } | null>(null);
  const [allNote, setAllNote] = useState("");
  const [revise, setRevise] = useState<{ prId: string; lineId: string } | null>(null);
  const [reviseQty, setReviseQty] = useState("");
  const [poFor, setPoFor] = useState<string | null>(null);
  const [supplierId, setSupplierId] = useState("S-03");
  const [eta, setEta] = useState(() => new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10));
  const [dpOpen, setDpOpen] = useState(false);
  const [f, setF] = useState({ kind: "BHP" as "BHP" | "ASET", item: "Handscoon Nitrile M", category: "Monitoring", brand: "", model: "", qty: "100", uom: "box", estCost: "6800000", unit: "Seluruh Unit", needBy: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10) });
  const [err, setErr] = useState("");

  const itemOpts = [...s.items.map((i) => i.name), ...s.spareParts.map((p) => p.name)];
  const poPr = s.purchaseRequests.find((p) => p.id === poFor);
  const decLine = decision ? s.purchaseRequests.find((p) => p.id === decision.prId)?.lines.find((l) => l.id === decision.lineId) : undefined;
  const revLine = revise ? s.purchaseRequests.find((p) => p.id === revise.prId)?.lines.find((l) => l.id === revise.lineId) : undefined;

  const submitDp = () => {
    if (!(Number(f.qty) > 0)) return setErr("Qty wajib > 0.");
    if (!(Number(f.estCost) > 0)) return setErr("Estimasi biaya wajib > 0.");
    if (f.kind === "ASET" && !f.item.trim()) return setErr("Nama aset wajib diisi.");
    if (f.kind === "ASET" && !f.brand.trim()) return setErr("Merek aset wajib diisi.");
    submitDemand({
      kind: f.kind,
      item: f.kind === "ASET" ? f.item.trim() : f.item,
      category: f.kind === "ASET" ? f.category : undefined,
      brand: f.kind === "ASET" ? f.brand.trim() || undefined : undefined,
      model: f.kind === "ASET" ? f.model.trim() || undefined : undefined,
      qty: Number(f.qty), uom: f.kind === "ASET" ? "unit" : f.uom,
      estCost: Number(f.estCost), unit: f.unit, needBy: new Date(f.needBy + "T09:00:00").toISOString(),
    });
    setDpOpen(false); setErr("");
  };

  const myLines = (pr: typeof s.purchaseRequests[0]) =>
    pr.lines.filter((l) => { const idx = lineActiveStage(l); return idx >= 0 && prStageRole(l.isIT, idx) === s.role; });

  const submitDecision = () => {
    if (!decision) return;
    if (!decision.ok && note.trim().length < 4) return setErr("Catatan/saran wajib diisi saat menolak.");
    prDecide(decision.prId, decision.lineId, decision.ok, note.trim());
    setDecision(null); setNote(""); setErr("");
  };
  const submitAll = () => {
    if (!decideAll) return;
    prDecideAll(decideAll.prId, decideAll.ok, allNote.trim());
    setDecideAll(null); setAllNote("");
  };
  const submitRevise = () => {
    if (!revise) return;
    if (!(Number(reviseQty) > 0)) return setErr("Qty revisi wajib > 0.");
    prRevise(revise.prId, revise.lineId, Number(reviseQty));
    setRevise(null); setReviseQty(""); setErr("");
  };

  const pipeline = [
    { label: "Demand", n: s.demandPlans.length, tone: "text-ink" },
    { label: "PR", n: s.purchaseRequests.length, tone: "text-info" },
    { label: "Menunggu Saya", n: s.purchaseRequests.reduce((a, p) => a + myLines(p).length, 0), tone: "text-warn" },
    { label: "PO", n: s.purchaseOrders.length, tone: "text-pine-700" },
    { label: "GRN", n: s.purchaseOrders.filter((p) => p.status === "RECEIVED").length, tone: "text-ok" },
  ];

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Procurement</h1>
          <p className="text-xs text-mute">Semua barang: BHP (→ ledger) & aset/CAPEX (→ registrasi equipment) · Demand → PR → 3 tahap → PO → GRN</p>
        </div>
        <BtnPrimary disabled={!canPlan(s.role)} title={!canPlan(s.role) ? "Butuh role Pengelola Inventory / Kepala Gudang" : undefined} onClick={() => setDpOpen(true)}>
          <IcPlus size={13} /> Demand plan baru
        </BtnPrimary>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
          {pipeline.map((p, i) => (
            <span key={p.label} className="flex items-center gap-2">
              <span className="flex items-center gap-2 rounded-md border border-line bg-paper px-3 py-1.5">
                <span className={`num font-display text-[17px] font-black ${p.tone}`}>{p.n}</span>
                <span className="font-mono text-[9.5px] font-bold uppercase tracking-wide text-mute">{p.label}</span>
              </span>
              {i < pipeline.length - 1 && <IcChevD size={12} className="-rotate-90 text-line2" />}
            </span>
          ))}
          <span className="ml-auto font-mono text-[10.5px] text-mute">Tahap 1: <b className="text-info">IT</b> (barang IT) / <b className="text-pine-700">UMUM</b> · Tahap 2: <b className="text-warn">Keuangan</b> · Tahap 3: <b className="text-danger">COO</b></span>
        </div>
      </Card>

      <Card className="p-4">
        <Tabs active={tab} onChange={setTab}
          tabs={[{ id: "pr", label: "Purchase Request & Persetujuan" }, { id: "dp", label: "Demand Planning" }, { id: "po", label: "Purchase Order" }]}
          counts={{ pr: s.purchaseRequests.length, dp: s.demandPlans.length, po: s.purchaseOrders.length }} />
        <div className="pt-4">

          {tab === "pr" && (
            <div className="space-y-3">
              {s.purchaseRequests.map((pr, i) => {
                const state = prState(pr);
                const mine = myLines(pr);
                return (
                  <div key={pr.id} className="row-in rounded-lg border border-line bg-paper p-4 transition hover:shadow-md" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-mono text-[13px] font-bold text-ink">{pr.code}</p>
                        <p className="font-mono text-[10px] text-mute">{fmtDate(pr.date)} · {pr.requester} · unit {pr.unit} · perlu {fmtDate(pr.needBy)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusChip status={state} />
                        <span className="num font-mono text-[12px] font-bold text-ink">{fmtIDRCompact(prTotal(pr))}</span>
                      </div>
                    </div>

                    <div className="mt-2.5 space-y-2">
                      {pr.lines.map((l) => {
                        const ls = lineState(l);
                        const activeIdx = lineActiveStage(l);
                        const activeRole = activeIdx >= 0 ? prStageRole(l.isIT, activeIdx) : null;
                        const canAct = activeRole === s.role;
                        const rejNotes = l.stages.filter((st) => st.status === "REJECTED" && st.note);
                        return (
                          <div key={l.id} className={`rounded-md border p-2.5 ${ls === "REJECTED" ? "border-danger/40 bg-dangerbg/30" : ls === "APPROVED" ? "border-ok/30 bg-okbg/25" : "border-line bg-canvas/50"}`}>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex min-w-0 flex-wrap items-center gap-2">
                                <span className="text-[12.5px] font-bold text-ink">{l.name}</span>
                                {l.kind === "ASSET"
                                  ? <Chip tone="pine" className="!text-[8.5px]">ASET · CAPEX</Chip>
                                  : l.isIT ? <Chip tone="info" className="!text-[8.5px]">IT</Chip> : <Chip tone="neutral" className="!text-[8.5px]">BHP</Chip>}
                                <span className="font-mono text-[10px] text-mute">{l.sku ?? l.category ?? ""}{l.sku || l.category ? " · " : ""}×{l.qty}{l.revision > 0 ? ` · rev-${l.revision}` : ""}</span>
                              </div>
                              <span className="num font-mono text-[11px] font-bold text-ink2">{fmtIDR(lineTotal(l))}</span>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                              <StageTracker line={l} />
                              <div className="flex items-center gap-1.5">
                                {ls === "REJECTED" && canRevise(s.role) && (
                                  <BtnSm onClick={() => { setRevise({ prId: pr.id, lineId: l.id }); setReviseQty(String(l.qty)); setErr(""); }} className="!border-warn/60 !text-warn"><IcWrench size={11} /> Revisi</BtnSm>
                                )}
                                {ls === "IN_APPROVAL" && (
                                  canAct ? (
                                    <>
                                      <BtnSm onClick={() => { setDecision({ prId: pr.id, lineId: l.id, ok: true }); setNote(""); setErr(""); }} className="!border-ok/60 !text-ok"><IcCheck size={11} /> Setujui</BtnSm>
                                      <BtnSm onClick={() => { setDecision({ prId: pr.id, lineId: l.id, ok: false }); setNote(""); setErr(""); }} className="!border-danger/60 !text-danger"><IcClose size={11} /> Tolak</BtnSm>
                                    </>
                                  ) : (
                                    <span className="font-mono text-[9.5px] text-mute">menunggu <b className="text-warn">{activeRole}</b></span>
                                  )
                                )}
                                {ls === "APPROVED" && <span className="font-mono text-[9.5px] font-bold text-ok">siap PO ✓</span>}
                              </div>
                            </div>
                            {rejNotes.length > 0 && (
                              <div className="mt-1.5 space-y-1">
                                {rejNotes.map((st, j) => (
                                  <p key={j} className="rounded bg-card px-2 py-1 text-[10.5px] text-danger"><b>{st.approver}:</b> {st.note}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2.5">
                      {mine.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-mute">{mine.length} baris di tahap Anda:</span>
                          <BtnSm onClick={() => { setDecideAll({ prId: pr.id, ok: true }); setAllNote(""); }} className="!border-ok/60 !text-ok"><IcCheck size={11} /> Setujui Semua</BtnSm>
                          <BtnSm onClick={() => { setDecideAll({ prId: pr.id, ok: false }); setAllNote(""); }} className="!border-danger/60 !text-danger"><IcClose size={11} /> Tolak Semua</BtnSm>
                        </div>
                      ) : <span className="font-mono text-[10px] text-mute">tidak ada baris menunggu di tahap {s.role}</span>}
                      {state === "APPROVED" && (
                        <BtnSm disabled={!canOps(s.role)} onClick={() => { setPoFor(pr.id); setSupplierId("S-03"); }} className="!border-pine-500/60 !text-pine-700"><IcCart size={11} /> Buat PO</BtnSm>
                      )}
                      {state === "PO_CREATED" && <span className="font-mono text-[10px] font-bold text-pine-600">PO terkirim ✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "dp" && (
            <div className="overflow-x-auto rounded-md border border-line">
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="border-b border-line bg-canvas/70 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">
                    <th className="px-3 py-2.5">Plan</th><th className="px-3 py-2.5">Jenis</th><th className="px-3 py-2.5">Item</th><th className="px-3 py-2.5 text-right">Qty</th>
                    <th className="px-3 py-2.5 text-right">Est. biaya</th><th className="px-3 py-2.5">Unit peminta</th><th className="px-3 py-2.5">Need by</th>
                    <th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {s.demandPlans.map((dp) => (
                    <tr key={dp.id} className="transition hover:bg-pine-50/60">
                      <td className="px-3 py-2.5"><p className="font-mono text-[11.5px] font-bold text-pine-700">{dp.code}</p><p className="font-mono text-[9.5px] text-mute">oleh {dp.by}</p></td>
                      <td className="px-3 py-2.5">{dp.kind === "ASET" ? <Chip tone="pine" className="!text-[8.5px]">ASET</Chip> : <Chip tone="neutral" className="!text-[8.5px]">BHP</Chip>}</td>
                      <td className="px-3 py-2.5">
                        <p className="text-[12.5px] font-bold text-ink">{dp.item}</p>
                        {dp.kind === "ASET" && dp.brand && <p className="font-mono text-[9.5px] text-mute">{dp.category} · {dp.brand} {dp.model ?? ""}</p>}
                      </td>
                      <td className="num px-3 py-2.5 text-right font-mono text-[12px] text-ink2">{dp.qty} {dp.uom}</td>
                      <td className="num px-3 py-2.5 text-right font-mono text-[11px] text-ink2">{fmtIDRCompact(dp.estCost)}</td>
                      <td className="px-3 py-2.5 text-[11.5px] text-ink2">{dp.unit}</td>
                      <td className={`px-3 py-2.5 font-mono text-[11px] ${daysUntil(dp.needBy) < 7 ? "font-bold text-warn" : "text-ink2"}`}>{fmtDate(dp.needBy)}</td>
                      <td className="px-3 py-2.5"><StatusChip status={dp.status} /></td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1.5">
                          {dp.status === "SUBMITTED" && <BtnSm disabled={!canPlan(s.role)} onClick={() => reviewDemand(dp.id)}>Review</BtnSm>}
                          {dp.status === "REVIEWED" && <BtnSm disabled={!canPlan(s.role)} onClick={() => consolidateDemand(dp.id)} className="!border-pine-500/60 !text-pine-700">→ buat PR</BtnSm>}
                          {dp.status === "CONSOLIDATED" && <span className="font-mono text-[9.5px] font-bold text-pine-600">di PR ✓</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "po" && (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {s.purchaseOrders.map((p, i) => {
                const sup = s.suppliers.find((x) => x.id === p.supplierId);
                const etaD = daysUntil(p.eta);
                return (
                  <div key={p.id} className="row-in rounded-lg border border-line bg-paper p-4 transition hover:shadow-md" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`flex h-9 w-9 items-center justify-center rounded-md ${p.status === "RECEIVED" ? "bg-okbg text-ok" : "bg-pine-100 text-pine-700"}`}><IcTruck size={16} /></span>
                        <div><p className="font-mono text-[13px] font-bold text-ink">{p.code}</p><p className="font-mono text-[10px] text-mute">{sup?.name} · ref {p.prRef}</p></div>
                      </div>
                      <StatusChip status={p.status} />
                    </div>
                    <div className="mt-2.5 space-y-1">
                      {p.items.map((it, ii) => (
                        <div key={it.sku ?? ii} className="flex items-center justify-between gap-2 rounded-md border border-line bg-canvas/50 px-2.5 py-1.5">
                          <span className="flex min-w-0 items-center gap-1.5 text-[12px] font-semibold text-ink">
                            {it.kind === "ASSET" ? <Chip tone="pine" className="!text-[8px]">ASET</Chip> : <Chip tone="neutral" className="!text-[8px]">BHP</Chip>}
                            <span className="truncate">{it.name}</span> <span className="shrink-0 font-mono text-[10px] text-mute">×{it.qty}</span>
                          </span>
                          <span className="num shrink-0 font-mono text-[10.5px] text-ink2">{fmtIDR(it.qty * it.price)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2.5 flex items-center justify-between border-t border-line pt-2.5">
                      <span className="num font-mono text-[12px] font-bold text-ink">{fmtIDR(p.total)}</span>
                      {p.status === "SENT" ? (
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-[10px] ${etaD < 3 ? "font-bold text-warn" : "text-mute"}`}>ETA {fmtDate(p.eta)}</span>
                          <BtnSm disabled={!canOps(s.role)} title={!canOps(s.role) ? "Butuh role gudang/inventory" : undefined} onClick={() => receivePo(p.id)} className="!border-ok/50 !text-ok">
                            <IcTruck size={12} /> {p.items.some((it) => it.kind === "ASSET") ? "Terima & Daftarkan Aset" : "Terima (GRN)"}
                          </BtnSm>
                        </div>
                      ) : <span className="font-mono text-[10px] font-bold text-ok">diterima ✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      <p className="font-mono text-[10.5px] text-mute">Persetujuan dicatat per-barang di audit trail · GRN BHP memposting RECEIPT ke ledger (BR-003) · GRN aset mendaftarkan equipment tertelusur ke PO (BR-001/002).</p>

      {/* decision modal (approve / reject single line) */}
      <Modal open={!!decision} onClose={() => setDecision(null)} kicker={decision?.ok ? "Approve baris" : "Tolak baris (beri saran)"} title={decLine?.name ?? ""}
        footer={<><BtnGhost onClick={() => setDecision(null)}>Batal</BtnGhost>
          <BtnPrimary onClick={submitDecision} className={decision && !decision.ok ? "!bg-danger hover:!bg-[#a03023]" : ""}>{decision?.ok ? <><IcCheck size={13} /> Setujui</> : <><IcClose size={13} /> Tolak</>}</BtnPrimary></>}>
        <div className="space-y-3.5">
          {decLine && <p className="rounded-md border border-line bg-canvas/60 px-3 py-2 font-mono text-[11px] text-ink2">{decLine.kind === "ASSET" ? `ASET · ${decLine.category ?? ""}` : decLine.sku} · ×{decLine.qty} = <b>{fmtIDR(lineTotal(decLine))}</b></p>}
          <div>
            <Label>Catatan {decision?.ok ? "(opsional)" : "/ saran revisi (wajib)"}</Label>
            <TextArea value={note} onChange={(e) => setNote(e.target.value)} placeholder={decision?.ok ? "cth: sesuai kebutuhan" : "cth: qty terlalu banyak — cukup 6 unit"} />
          </div>
          {err && <p className="rounded-md bg-dangerbg px-3 py-2 text-xs font-semibold text-danger">{err}</p>}
        </div>
      </Modal>

      {/* decide-all modal */}
      <Modal open={!!decideAll} onClose={() => setDecideAll(null)} kicker={decideAll?.ok ? "Approve semua baris di tahap Anda" : "Tolak semua baris di tahap Anda"} title="Keputusan massal"
        footer={<><BtnGhost onClick={() => setDecideAll(null)}>Batal</BtnGhost>
          <BtnPrimary onClick={submitAll} className={decideAll && !decideAll.ok ? "!bg-danger hover:!bg-[#a03023]" : ""}>{decideAll?.ok ? <><IcCheck size={13} /> Setujui Semua</> : <><IcClose size={13} /> Tolak Semua</>}</BtnPrimary></>}>
        <div className="space-y-3.5">
          <p className="rounded-md bg-infobg px-3 py-2 text-xs font-semibold text-info">Hanya baris yang sedang menunggu di tahap <b>{s.role}</b> yang akan diproses.</p>
          <div><Label>Catatan (opsional)</Label><TextArea value={allNote} onChange={(e) => setAllNote(e.target.value)} placeholder="Catatan untuk semua baris…" /></div>
        </div>
      </Modal>

      {/* revise modal */}
      <Modal open={!!revise} onClose={() => setRevise(null)} kicker="Revisi permintaan (kembali ke tahap 1)" title={revLine?.name ?? ""}
        footer={<><BtnGhost onClick={() => setRevise(null)}>Batal</BtnGhost><BtnPrimary onClick={submitRevise}><IcWrench size={13} /> Simpan & ajukan ulang</BtnPrimary></>}>
        <div className="space-y-3.5">
          {revLine && revLine.stages.filter((st) => st.status === "REJECTED" && st.note).map((st, j) => (
            <p key={j} className="rounded-md bg-warnbg px-3 py-2 text-xs text-warn"><b>Saran {st.approver}:</b> {st.note}</p>
          ))}
          <div><Label>Qty baru *</Label><Input type="number" value={reviseQty} onChange={(e) => setReviseQty(e.target.value)} /></div>
          <p className="rounded-md bg-infobg px-3 py-2 text-xs font-semibold text-info">Setelah direvisi, seluruh tahap persetujuan diulang dari tahap 1.</p>
          {err && <p className="rounded-md bg-dangerbg px-3 py-2 text-xs font-semibold text-danger">{err}</p>}
        </div>
      </Modal>

      {/* demand plan modal */}
      <Modal open={dpOpen} onClose={() => setDpOpen(false)} kicker="Demand planning" title="Rencana kebutuhan baru"
        footer={<><BtnGhost onClick={() => setDpOpen(false)}>Batal</BtnGhost><BtnPrimary onClick={submitDp}><IcPlus size={13} /> Ajukan demand</BtnPrimary></>}>
        <div className="space-y-3.5">
          <div>
            <Label>Jenis pengadaan</Label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setF({ ...f, kind: "BHP" })}
                className={`rounded-md border px-2 py-2 text-left transition ${f.kind === "BHP" ? "border-pine-600 bg-pine-50" : "border-line bg-card hover:border-line2"}`}>
                <p className={`font-display text-[12px] font-bold ${f.kind === "BHP" ? "text-pine-700" : "text-ink2"}`}>BHP / Inventori</p>
                <p className="font-mono text-[9px] text-mute">barang habis pakai → ledger</p>
              </button>
              <button onClick={() => setF({ ...f, kind: "ASET", uom: "unit" })}
                className={`rounded-md border px-2 py-2 text-left transition ${f.kind === "ASET" ? "border-pine-600 bg-pine-50" : "border-line bg-card hover:border-line2"}`}>
                <p className={`font-display text-[12px] font-bold ${f.kind === "ASET" ? "text-pine-700" : "text-ink2"}`}>Aset / CAPEX</p>
                <p className="font-mono text-[9px] text-mute">alkes & alat → registrasi aset</p>
              </button>
            </div>
          </div>
          {f.kind === "BHP" ? (
            <div><Label>Item</Label><Select value={f.item} onChange={(e) => setF({ ...f, item: e.target.value })}>{itemOpts.map((i) => <option key={i}>{i}</option>)}</Select></div>
          ) : (
            <>
              <div><Label>Nama aset *</Label><Input value={f.item} onChange={(e) => setF({ ...f, item: e.target.value })} placeholder="cth: Ventilator Transport" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Kategori</Label><Select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{["Monitoring", "Life Support", "Imaging", "Laboratorium", "Sterilisasi", "Infusion", "Poliklinik", "IT & Komputer"].map((c) => <option key={c}>{c}</option>)}</Select></div>
                <div><Label>Merek *</Label><Input value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })} placeholder="Dräger" /></div>
                <div><Label>Model</Label><Input value={f.model} onChange={(e) => setF({ ...f, model: e.target.value })} placeholder="Oxylog 3000" /></div>
              </div>
            </>
          )}
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Qty *</Label><Input type="number" value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} /></div>
            <div><Label>UoM</Label>{f.kind === "ASET" ? <Input value="unit" disabled /> : <Select value={f.uom} onChange={(e) => setF({ ...f, uom: e.target.value })}>{["box", "pcs", "set", "pack", "flabot", "roll", "unit"].map((u) => <option key={u}>{u}</option>)}</Select>}</div>
            <div><Label>Est. biaya *</Label><Input type="number" value={f.estCost} onChange={(e) => setF({ ...f, estCost: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Unit peminta</Label><Input value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} /></div>
            <div><Label>Need by</Label><Input type="date" value={f.needBy} onChange={(e) => setF({ ...f, needBy: e.target.value })} /></div>
          </div>
          {f.kind === "ASET" && <p className="rounded-md bg-infobg px-3 py-2 text-xs font-semibold text-info">Aset yang disetujui & diterima (GRN) akan <b>otomatis terdaftar</b> di Equipment Registry dengan nomor aset baru.</p>}
          {err && <p className="rounded-md bg-dangerbg px-3 py-2 text-xs font-semibold text-danger">{err}</p>}
        </div>
      </Modal>

      {/* PO modal */}
      <Modal open={!!poFor} onClose={() => setPoFor(null)} kicker="Purchase order" title={`PO untuk ${poPr?.code ?? ""}`}
        footer={<><BtnGhost onClick={() => setPoFor(null)}>Batal</BtnGhost><BtnPrimary onClick={() => { if (poFor) createPo(poFor, supplierId, new Date(eta + "T09:00:00").toISOString()); setPoFor(null); }}><IcCart size={13} /> Kirim PO ke supplier</BtnPrimary></>}>
        <div className="space-y-3.5">
          <div><Label>Supplier</Label><Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>{s.suppliers.map((sp) => <option key={sp.id} value={sp.id}>{sp.name} — {sp.service}</option>)}</Select></div>
          <div><Label>ETA pengiriman</Label><Input type="date" value={eta} onChange={(e) => setEta(e.target.value)} /></div>
          {poPr && <p className="rounded-md border border-line bg-canvas/60 px-3 py-2 font-mono text-[11px] text-ink2">{poPr.lines.filter((l) => lineState(l) === "APPROVED").map((l) => `${l.name} ×${l.qty}`).join(" · ")} = <b>{fmtIDR(poPr.lines.filter((l) => lineState(l) === "APPROVED").reduce((x, l) => x + lineTotal(l), 0))}</b></p>}
          <p className="rounded-md bg-infobg px-3 py-2 text-xs font-semibold text-info">Hanya baris yang disetujui penuh (3 tahap) yang masuk PO.</p>
        </div>
      </Modal>
    </div>
  );
}
