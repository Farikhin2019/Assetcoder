import { useMemo, useState } from "react";
import { useApp } from "../lib/store";
import { Bar, BtnGhost, BtnPrimary, Card, Chip, Input, Label, Modal, MonoTag, Select, StatusChip, Tabs } from "../components/ui";
import { IcBox, IcSend, IcTruck } from "../components/icons";
import { DEST_UNITS, WAREHOUSES } from "../lib/data";
import { daysUntil, fmtDate, fmtDateTime, fmtIDRCompact } from "../lib/types";

const canOps = (role: string) => ["Kepala Gudang", "Petugas Gudang", "Pengelola Inventory", "Direksi"].includes(role);

export default function Logistics() {
  const { s, nav, receive, distribute } = useApp();
  const [tab, setTab] = useState("wh");
  const [modal, setModal] = useState<"" | "grn" | "dist">("");
  const allowed = canOps(s.role);

  const itemOf = (sku: string) => s.items.find((i) => i.sku === sku);
  const supOf = (id: string) => s.suppliers.find((x) => x.id === id)?.name ?? id;

  const [rf, setRf] = useState({ sku: s.items[0]?.sku ?? "", qty: "", supplierId: "S-03", batch: "", expiry: "", poRef: "" });
  const [rErr, setRErr] = useState("");
  const rItem = itemOf(rf.sku);
  const submitGrn = () => {
    if (!rItem) return setRErr("Pilih item.");
    if (!(Number(rf.qty) > 0)) return setRErr("Qty penerimaan harus > 0.");
    if (!rf.poRef.trim()) return setRErr("Referensi PO wajib diisi (traceability).");
    if (rItem.method === "FEFO" && !rf.expiry) return setRErr("Item FEFO wajib punya tanggal kedaluwarsa (data integrity).");
    receive(rf.sku, Number(rf.qty), rf.supplierId, rf.batch, rf.expiry ? new Date(rf.expiry + "T09:00:00").toISOString() : "", rf.poRef.trim());
    setRf({ sku: s.items[0]?.sku ?? "", qty: "", supplierId: "S-03", batch: "", expiry: "", poRef: "" }); setRErr(""); setModal("");
  };

  const [df, setDf] = useState({ sku: s.items[0]?.sku ?? "", qty: "", dest: DEST_UNITS[0], strategy: "" as "" | "FIFO" | "FEFO" });
  const [dErr, setDErr] = useState("");
  const dItem = itemOf(df.sku);
  const strategy = (df.strategy || dItem?.method || "FIFO") as "FIFO" | "FEFO";
  const submitDist = () => {
    if (!dItem) return setDErr("Pilih item.");
    if (!(Number(df.qty) > 0)) return setDErr("Qty distribusi harus > 0.");
    if (Number(df.qty) > dItem.stock) return setDErr(`Stok tidak cukup — tersedia ${dItem.stock} ${dItem.uom} (stok tidak boleh negatif).`);
    distribute(df.sku, Number(df.qty), df.dest, strategy);
    setDf({ sku: s.items[0]?.sku ?? "", qty: "", dest: DEST_UNITS[0], strategy: "" }); setDErr(""); setModal("");
  };

  const whStats = useMemo(() => WAREHOUSES.map((w) => {
    const skus = s.items.filter((i) => i.warehouse === w.name);
    const value = skus.reduce((a, i) => a + i.stock * i.unitCost, 0);
    const parts = w.code === "WH-04" ? s.spareParts.reduce((a, p) => a + p.stock * p.unitCost, 0) : 0;
    return { ...w, skus, value: value + parts };
  }), [s.items, s.spareParts]);

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Gudang & Distribusi</h1>
          <p className="text-xs text-mute">Goods Receipt → Picking (FIFO/FEFO) → Issue → Unit Receipt · setiap pergerakan = 1 baris ledger (BR-003)</p>
        </div>
        <div className="flex gap-2">
          <BtnGhost onClick={() => setModal("grn")} disabled={!allowed} title={!allowed ? "Butuh role gudang / inventory" : undefined}><IcTruck size={13} /> Catat Penerimaan</BtnGhost>
          <BtnPrimary onClick={() => setModal("dist")} disabled={!allowed} title={!allowed ? "Butuh role gudang / inventory" : undefined}><IcSend size={13} /> Buat Distribusi</BtnPrimary>
        </div>
      </div>

      <Card className="p-4">
        <Tabs active={tab} onChange={setTab}
          tabs={[{ id: "wh", label: "Gudang" }, { id: "in", label: "Penerimaan (GRN)" }, { id: "out", label: "Distribusi" }]}
          counts={{ wh: WAREHOUSES.length, in: s.receipts.length, out: s.issues.length }} />
        <div className="pt-4">
          {tab === "wh" && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {whStats.map((w, i) => (
                <div key={w.id} className="row-in rounded-lg border border-line bg-paper p-4 transition hover:border-pine-500/40 hover:shadow-md" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-md bg-pine-100 text-pine-700"><IcBox size={17} /></span>
                      <div>
                        <p className="font-display text-[14.5px] font-extrabold text-ink">{w.name}</p>
                        <p className="font-mono text-[10px] text-mute">{w.code} · Kepala: {w.keeper}</p>
                      </div>
                    </div>
                    <Chip tone="pine">{w.skus.length} SKU</Chip>
                  </div>
                  <p className="mt-2 text-[11.5px] leading-relaxed text-mute">{w.desc}</p>
                  <div className="mt-3 space-y-1">
                    {w.zones.map((z) => (
                      <div key={z} className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-pine-500" /><span className="font-mono text-[10.5px] text-ink2">{z}</span></div>
                    ))}
                  </div>
                  <div className="mt-3 border-t border-line pt-2.5">
                    <div className="mb-1 flex justify-between font-mono text-[10.5px] text-mute">
                      <span>okupansi {w.usedLoc}/{w.capacityLoc} lokasi</span><span className="font-bold text-ink">{fmtIDRCompact(w.value)}</span>
                    </div>
                    <Bar pct={(w.usedLoc / w.capacityLoc) * 100} tone={w.usedLoc / w.capacityLoc > 0.85 ? "warn" : "pine"} />
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {w.skus.slice(0, 4).map((i) => (
                      <button key={i.sku} onClick={() => nav("inventory")} className="rounded border border-line bg-card px-1.5 py-0.5 font-mono text-[9.5px] font-semibold text-ink2 transition hover:border-pine-500 hover:text-pine-700">{i.sku}</button>
                    ))}
                    {w.skus.length > 4 && <span className="self-center font-mono text-[9.5px] text-mute">+{w.skus.length - 4}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "in" && (
            <div className="overflow-x-auto rounded-md border border-line">
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="border-b border-line bg-canvas/70 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">
                    <th className="px-3 py-2.5">GRN</th><th className="px-3 py-2.5">Tanggal</th><th className="px-3 py-2.5">Item</th>
                    <th className="px-3 py-2.5 text-right">Qty</th><th className="px-3 py-2.5">Batch</th><th className="px-3 py-2.5">Expired</th>
                    <th className="px-3 py-2.5">Supplier</th><th className="px-3 py-2.5">PO</th><th className="px-3 py-2.5">Petugas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {s.receipts.map((r) => {
                    const it = itemOf(r.sku);
                    return (
                      <tr key={r.id} className="transition hover:bg-pine-50/60">
                        <td className="px-3 py-2.5 font-mono text-[11px] font-bold text-pine-700">{r.ref}</td>
                        <td className="px-3 py-2.5 font-mono text-[11px] text-ink2">{fmtDate(r.date)}</td>
                        <td className="px-3 py-2.5"><p className="text-[12px] font-bold text-ink">{it?.name ?? r.sku}</p><MonoTag>{r.sku}</MonoTag></td>
                        <td className="num px-3 py-2.5 text-right font-mono text-[12px] font-bold text-ok">+{r.qty} {it?.uom}</td>
                        <td className="px-3 py-2.5 font-mono text-[10.5px] text-ink2">{r.batch ?? "—"}</td>
                        <td className="px-3 py-2.5 font-mono text-[10.5px]">{r.expiry ? <span className={daysUntil(r.expiry) < 90 ? "font-bold text-warn" : "text-ink2"}>{fmtDate(r.expiry)}</span> : "—"}</td>
                        <td className="px-3 py-2.5 text-[11.5px] text-ink2">{supOf(r.supplierId)}</td>
                        <td className="px-3 py-2.5 font-mono text-[10.5px] text-mute">{r.poRef ?? "—"}</td>
                        <td className="px-3 py-2.5 text-[11.5px] text-mute">{r.by}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {tab === "out" && (
            <div className="overflow-x-auto rounded-md border border-line">
              <table className="w-full min-w-[860px] text-left">
                <thead>
                  <tr className="border-b border-line bg-canvas/70 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">
                    <th className="px-3 py-2.5">Ref</th><th className="px-3 py-2.5">Tanggal</th><th className="px-3 py-2.5">Item</th>
                    <th className="px-3 py-2.5 text-right">Qty</th><th className="px-3 py-2.5">Tujuan unit</th><th className="px-3 py-2.5">Alokasi</th><th className="px-3 py-2.5">Petugas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {s.issues.map((i) => {
                    const it = itemOf(i.sku);
                    return (
                      <tr key={i.id} className="transition hover:bg-pine-50/60">
                        <td className="px-3 py-2.5 font-mono text-[11px] font-bold text-pine-700">{i.ref}</td>
                        <td className="px-3 py-2.5 font-mono text-[11px] text-ink2">{fmtDateTime(i.date)}</td>
                        <td className="px-3 py-2.5"><p className="text-[12px] font-bold text-ink">{it?.name ?? i.sku}</p><MonoTag>{i.sku}</MonoTag></td>
                        <td className="num px-3 py-2.5 text-right font-mono text-[12px] font-bold text-info">−{i.qty} {it?.uom}</td>
                        <td className="px-3 py-2.5"><Chip tone="info">{i.dest}</Chip></td>
                        <td className="px-3 py-2.5"><StatusChip status={i.strategy} /></td>
                        <td className="px-3 py-2.5 text-[11.5px] text-mute">{i.by}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      <Modal open={modal === "grn"} onClose={() => setModal("")} kicker="Procurement & Receiving" title="Catat penerimaan barang (GRN)"
        footer={<><BtnGhost onClick={() => setModal("")}>Batal</BtnGhost><BtnPrimary onClick={submitGrn}><IcTruck size={13} /> Posting ke ledger</BtnPrimary></>}>
        <div className="space-y-3">
          <div><Label>Item</Label>
            <Select value={rf.sku} onChange={(e) => setRf({ ...rf, sku: e.target.value })}>
              {s.items.map((i) => <option key={i.sku} value={i.sku}>{i.name} — {i.sku} (stok {i.stock} {i.uom})</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Qty terima *</Label><Input type="number" value={rf.qty} onChange={(e) => setRf({ ...rf, qty: e.target.value })} placeholder="0" /></div>
            <div><Label>No. PO *</Label><Input value={rf.poRef} onChange={(e) => setRf({ ...rf, poRef: e.target.value })} placeholder="PO-2608-xxx" /></div>
          </div>
          <div><Label>Supplier</Label>
            <Select value={rf.supplierId} onChange={(e) => setRf({ ...rf, supplierId: e.target.value })}>{s.suppliers.map((sp) => <option key={sp.id} value={sp.id}>{sp.name}</option>)}</Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>No. batch</Label><Input value={rf.batch} onChange={(e) => setRf({ ...rf, batch: e.target.value })} placeholder="LTxxxxxx" /></div>
            <div><Label>Expired {rItem?.method === "FEFO" ? "*" : "(opsional)"}</Label><Input type="date" value={rf.expiry} onChange={(e) => setRf({ ...rf, expiry: e.target.value })} /></div>
          </div>
          <p className="rounded-md bg-infobg px-3 py-2 text-xs font-semibold text-info">Penerimaan memposting 1 baris RECEIPT ke ledger append-only (BR-003) & memperbarui batch/expiry item.</p>
          {rErr && <p className="rounded-md bg-dangerbg px-3 py-2 text-xs font-semibold text-danger">{rErr}</p>}
        </div>
      </Modal>

      <Modal open={modal === "dist"} onClose={() => setModal("")} kicker="Warehouse & Distribution" title="Distribusi ke unit"
        footer={<><BtnGhost onClick={() => setModal("")}>Batal</BtnGhost><BtnPrimary onClick={submitDist}><IcSend size={13} /> Issue stok</BtnPrimary></>}>
        <div className="space-y-3">
          <div><Label>Item</Label>
            <Select value={df.sku} onChange={(e) => setDf({ ...df, sku: e.target.value })}>
              {s.items.map((i) => <option key={i.sku} value={i.sku}>{i.name} — {i.sku} (stok {i.stock} {i.uom})</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Qty *</Label><Input type="number" value={df.qty} onChange={(e) => setDf({ ...df, qty: e.target.value })} placeholder={`maks ${dItem?.stock ?? 0}`} /></div>
            <div><Label>Unit tujuan</Label>
              <Select value={df.dest} onChange={(e) => setDf({ ...df, dest: e.target.value })}>{DEST_UNITS.map((u) => <option key={u}>{u}</option>)}</Select>
            </div>
          </div>
          <div>
            <Label>Strategi alokasi</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["FIFO", "FEFO"] as const).map((mth) => (
                <button key={mth} onClick={() => setDf({ ...df, strategy: mth })}
                  className={`rounded-md border px-2 py-2 font-mono text-[11.5px] font-bold transition ${strategy === mth ? "border-pine-600 bg-pine-50 text-pine-700" : "border-line bg-card text-mute hover:border-line2"}`}>
                  {mth}{dItem?.method === mth ? " · default item" : ""}
                </button>
              ))}
            </div>
            <p className="mt-1 font-mono text-[10.5px] text-mute">FEFO = first-expired-first-out untuk item sensitif kedaluwarsa.</p>
          </div>
          {dItem && Number(df.qty) > 0 && (
            <p className={`rounded-md px-3 py-2 text-xs font-semibold ${Number(df.qty) > dItem.stock ? "bg-dangerbg text-danger" : "bg-okbg text-ok"}`}>
              Saldo setelah issue: {dItem.stock - Number(df.qty)} {dItem.uom} {Number(df.qty) <= dItem.reorder ? "· di bawah reorder point!" : ""}
            </p>
          )}
          {dErr && <p className="rounded-md bg-dangerbg px-3 py-2 text-xs font-semibold text-danger">{dErr}</p>}
        </div>
      </Modal>

      <p className="font-mono text-[10.5px] text-mute">Ledger adalah source of truth — saldo stok hanya cache turunan (BR-008: transaksi tidak pernah dihapus).</p>
    </div>
  );
}
