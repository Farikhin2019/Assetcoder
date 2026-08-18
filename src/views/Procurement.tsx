import { useState } from "react";
import { useApp } from "../lib/store";
import { BtnSm, Card, Chip, Input, Label, Modal, Select, StatusChip, Tabs, BtnGhost, BtnPrimary, Bar } from "../components/ui";
import { IcCart, IcChevD, IcPlus, IcTruck } from "../components/icons";
import { daysUntil, fmtDate, fmtIDR, fmtIDRCompact } from "../lib/types";

const canPlan = (r: string) => ["Pengelola Inventory", "Kepala Gudang", "Pengelola Aset", "Direksi"].includes(r);
const canOps = (r: string) => ["Pengelola Inventory", "Kepala Gudang", "Direksi"].includes(r);

export default function Procurement() {
  const { s, submitDemand, reviewDemand, consolidateDemand, createPo, receivePo, nav } = useApp();
  const [tab, setTab] = useState("dp");
  const [dpOpen, setDpOpen] = useState(false);
  const [poFor, setPoFor] = useState<string | null>(null);
  const [supplierId, setSupplierId] = useState("S-03");
  const [eta, setEta] = useState(() => new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10));

  const [f, setF] = useState({ item: "Handscoon Nitrile M", qty: "100", uom: "box", estCost: "6800000", unit: "Seluruh Unit", needBy: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10) });
  const [err, setErr] = useState("");

  const itemOpts = [...s.items.map((i) => i.name), ...s.spareParts.map((p) => p.name)];
  const pr = s.purchaseRequests.find((p) => p.id === poFor);

  const submitDp = () => {
    if (!(Number(f.qty) > 0)) return setErr("Qty wajib > 0.");
    if (!(Number(f.estCost) > 0)) return setErr("Estimasi biaya wajib > 0.");
    submitDemand(f.item, Number(f.qty), f.uom, Number(f.estCost), f.unit, new Date(f.needBy + "T09:00:00").toISOString());
    setDpOpen(false); setErr("");
  };

  const pipeline = [
    { label: "Demand", n: s.demandPlans.length, tone: "text-ink" },
    { label: "Reviewed", n: s.demandPlans.filter((d) => d.status === "REVIEWED" || d.status === "CONSOLIDATED").length, tone: "text-warn" },
    { label: "PR", n: s.purchaseRequests.length, tone: "text-info" },
    { label: "PO", n: s.purchaseOrders.length, tone: "text-pine-700" },
    { label: "GRN", n: s.purchaseOrders.filter((p) => p.status === "RECEIVED").length + s.receipts.filter((r) => r.poRef?.startsWith("PO-2607")).length, tone: "text-ok" },
  ];

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Procurement</h1>
          <p className="text-xs text-mute">Demand Planning → Purchase Request → Approval → PO → Supplier → Goods Receipt (ledger)</p>
        </div>
        <BtnPrimary disabled={!canPlan(s.role)} title={!canPlan(s.role) ? "Butuh role Pengelola Inventory / Kepala Gudang" : undefined} onClick={() => setDpOpen(true)}>
          <IcPlus size={13} /> Demand plan baru
        </BtnPrimary>
      </div>

      {/* pipeline */}
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
          <span className="ml-auto font-mono text-[10.5px] text-mute">approval matrix: Kepala Gudang → UPBJ → Manajemen</span>
        </div>
      </Card>

      <Card className="p-4">
        <Tabs active={tab} onChange={setTab}
          tabs={[{ id: "dp", label: "Demand Planning" }, { id: "pr", label: "Purchase Request" }, { id: "po", label: "Purchase Order" }]}
          counts={{ dp: s.demandPlans.length, pr: s.purchaseRequests.length, po: s.purchaseOrders.length }} />
        <div className="pt-4">
          {tab === "dp" && (
            <div className="overflow-x-auto rounded-md border border-line">
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="border-b border-line bg-canvas/70 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">
                    <th className="px-3 py-2.5">Plan</th><th className="px-3 py-2.5">Item</th><th className="px-3 py-2.5 text-right">Qty</th>
                    <th className="px-3 py-2.5 text-right">Est. biaya</th><th className="px-3 py-2.5">Unit peminta</th><th className="px-3 py-2.5">Need by</th>
                    <th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {s.demandPlans.map((dp) => (
                    <tr key={dp.id} className="transition hover:bg-pine-50/60">
                      <td className="px-3 py-2.5">
                        <p className="font-mono text-[11.5px] font-bold text-pine-700">{dp.code}</p>
                        <p className="font-mono text-[9.5px] text-mute">oleh {dp.by}</p>
                      </td>
                      <td className="px-3 py-2.5 text-[12.5px] font-bold text-ink">{dp.item}</td>
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

          {tab === "pr" && (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {s.purchaseRequests.map((p, i) => (
                <div key={p.id} className="row-in rounded-lg border border-line bg-paper p-4 transition hover:shadow-md" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-[13px] font-bold text-ink">{p.code}</p>
                      <p className="font-mono text-[10px] text-mute">{fmtDate(p.date)} · {p.requester}</p>
                    </div>
                    <StatusChip status={p.status} />
                  </div>
                  <div className="mt-2.5 space-y-1">
                    {p.items.map((it) => (
                      <div key={it.sku} className="flex items-center justify-between rounded-md border border-line bg-canvas/50 px-2.5 py-1.5">
                        <span className="text-[12px] font-semibold text-ink">{it.name} <span className="font-mono text-[10px] text-mute">×{it.qty}</span></span>
                        <span className="num font-mono text-[10.5px] text-ink2">{fmtIDR(it.qty * it.estCost)}</span>
                      </div>
                    ))}
                    <p className="pt-1 text-right font-mono text-[11.5px] font-bold text-ink">Total {fmtIDR(p.total)}</p>
                  </div>
                  <div className="mt-2.5 flex items-center gap-2 border-t border-line pt-2.5">
                    {p.status === "SUBMITTED" && <span className="font-mono text-[10.5px] text-warn">Menunggu approval di Approval Engine</span>}
                    {p.status === "APPROVED" && <BtnSm disabled={!canOps(s.role)} onClick={() => { setPoFor(p.id); setSupplierId("S-03"); }} className="!border-pine-500/60 !text-pine-700"><IcCart size={12} /> Buat PO</BtnSm>}
                    {p.status === "PO_CREATED" && <span className="font-mono text-[10.5px] font-bold text-pine-600">PO terkirim ✓</span>}
                  </div>
                </div>
              ))}
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
                        <div>
                          <p className="font-mono text-[13px] font-bold text-ink">{p.code}</p>
                          <p className="font-mono text-[10px] text-mute">{sup?.name} · ref {p.prRef}</p>
                        </div>
                      </div>
                      <StatusChip status={p.status} />
                    </div>
                    <div className="mt-2.5 space-y-1">
                      {p.items.map((it) => (
                        <div key={it.sku} className="flex items-center justify-between rounded-md border border-line bg-canvas/50 px-2.5 py-1.5">
                          <span className="text-[12px] font-semibold text-ink">{it.name} <span className="font-mono text-[10px] text-mute">×{it.qty}</span></span>
                          <span className="num font-mono text-[10.5px] text-ink2">{fmtIDR(it.qty * it.price)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2.5 flex items-center justify-between border-t border-line pt-2.5">
                      <span className="num font-mono text-[12px] font-bold text-ink">{fmtIDR(p.total)}</span>
                      {p.status === "SENT" ? (
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-[10px] ${etaD < 3 ? "font-bold text-warn" : "text-mute"}`}>ETA {fmtDate(p.eta)}</span>
                          <BtnSm disabled={!canOps(s.role)} title={!canOps(s.role) ? "Butuh role gudang/inventory" : undefined} onClick={() => receivePo(p.id)} className="!border-ok/50 !text-ok"><IcTruck size={12} /> Terima (GRN)</BtnSm>
                        </div>
                      ) : <span className="font-mono text-[10px] font-bold text-ok">diterima {fmtDate(p.eta)}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      <p className="font-mono text-[10.5px] text-mute">GRN memposting baris RECEIPT ke ledger append-only & memperbarui batch/expiry — konsisten dengan modul Receiving (Phase 1).</p>

      {/* demand plan modal */}
      <Modal open={dpOpen} onClose={() => setDpOpen(false)} kicker="Demand planning" title="Rencana kebutuhan baru"
        footer={<><BtnGhost onClick={() => setDpOpen(false)}>Batal</BtnGhost><BtnPrimary onClick={submitDp}><IcPlus size={13} /> Ajukan demand</BtnPrimary></>}>
        <div className="space-y-3.5">
          <div><Label>Item</Label><Select value={f.item} onChange={(e) => setF({ ...f, item: e.target.value })}>{itemOpts.map((i) => <option key={i}>{i}</option>)}</Select></div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Qty *</Label><Input type="number" value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} /></div>
            <div><Label>UoM</Label><Select value={f.uom} onChange={(e) => setF({ ...f, uom: e.target.value })}>{["box", "pcs", "set", "pack", "flabot", "roll"].map((u) => <option key={u}>{u}</option>)}</Select></div>
            <div><Label>Est. biaya *</Label><Input type="number" value={f.estCost} onChange={(e) => setF({ ...f, estCost: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Unit peminta</Label><Input value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} /></div>
            <div><Label>Need by</Label><Input type="date" value={f.needBy} onChange={(e) => setF({ ...f, needBy: e.target.value })} /></div>
          </div>
          <p className="rounded-md bg-infobg px-3 py-2 text-xs font-semibold text-info">Alur: Draft → Submitted → Reviewed → Approved → konsolidasi ke Purchase Request.</p>
          {err && <p className="rounded-md bg-dangerbg px-3 py-2 text-xs font-semibold text-danger">{err}</p>}
        </div>
      </Modal>

      {/* PO modal */}
      <Modal open={!!poFor} onClose={() => setPoFor(null)} kicker="Purchase order" title={`PO untuk ${pr?.code ?? ""}`}
        footer={<><BtnGhost onClick={() => setPoFor(null)}>Batal</BtnGhost><BtnPrimary onClick={() => { if (poFor) createPo(poFor, supplierId, new Date(eta + "T09:00:00").toISOString()); setPoFor(null); }}><IcCart size={13} /> Kirim PO ke supplier</BtnPrimary></>}>
        <div className="space-y-3.5">
          <div><Label>Supplier</Label><Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>{s.suppliers.map((sp) => <option key={sp.id} value={sp.id}>{sp.name} — {sp.service}</option>)}</Select></div>
          <div><Label>ETA pengiriman</Label><Input type="date" value={eta} onChange={(e) => setEta(e.target.value)} /></div>
          {pr && <p className="rounded-md border border-line bg-canvas/60 px-3 py-2 font-mono text-[11px] text-ink2">{pr.items.map((i) => `${i.name} ×${i.qty}`).join(" · ")} = <b>{fmtIDR(pr.total)}</b></p>}
        </div>
      </Modal>

      <div className="flex items-center gap-2">
        <Bar pct={70} tone="pine" className="max-w-[220px]" />
        <span className="font-mono text-[10.5px] text-mute">Phase 3 berikutnya: kontrak, rental, depresiasi lanjutan</span>
      </div>
      <button onClick={() => nav("logistics")} className="hidden" aria-hidden="true" />
    </div>
  );
}
