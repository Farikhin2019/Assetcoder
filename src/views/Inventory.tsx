import { useMemo, useState } from "react";
import { useApp } from "../lib/store";
import { BtnSm, Card, Chip, Input, Label, Modal, Select, StatusChip, Bar, EmptyState, SectionHead, Tabs } from "../components/ui";
import { fmtIDR, fmtIDRCompact, fmtDate } from "../lib/types";
import { BookOpen, Plus, Minus } from "lucide-react";

export default function Inventory() {
  const { s, adjust } = useApp();
  const [q, setQ] = useState("");
  const [ledgerSku, setLedgerSku] = useState<string | null>(null);
  const [adjSku, setAdjSku] = useState<string | null>(null);
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");

  const items = useMemo(() => s.items.filter((i) => q === "" || `${i.sku} ${i.name} ${i.category}`.toLowerCase().includes(q.toLowerCase())), [s.items, q]);
  const ledgerItem = s.items.find((i) => i.sku === ledgerSku);
  const adjItem = s.items.find((i) => i.sku === adjSku);

  const health = (i: typeof s.items[0]) => i.stock <= i.min * 0.4 ? "CRITICAL" : i.stock <= i.reorder ? "LOW" : "OK";
  const canAdjust = ["Pengelola Inventory", "Kepala Gudang", "Pengelola Aset", "Umum"].includes(s.role);

  const submitAdj = () => {
    if (!adjItem) return;
    const dv = Number(delta);
    if (!dv || Number.isNaN(dv)) return setErr("Delta wajib berupa angka ≠ 0.");
    if (adjItem.stock + dv < 0) return setErr(`Stok tidak boleh negatif (tersedia ${adjItem.stock} ${adjItem.uom}).`);
    if (reason.trim().length < 5) return setErr("Alasan adjustment wajib (BR-004).");
    adjust(adjItem.sku, dv, reason.trim());
    setAdjSku(null); setDelta(""); setReason(""); setErr("");
  };

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Inventory & Ledger</h1>
          <p className="text-xs text-mute">Ledger append-only = source of truth (BR-003/008) · saldo stok = cache turunan</p>
        </div>
        <div className="flex gap-2">
          <Chip tone="pine" dot>{s.items.length} SKU</Chip>
          <Chip tone="warn" dot pulse>{s.items.filter((i) => health(i) !== "OK").length} perlu aksi</Chip>
        </div>
      </div>

      <Card className="p-3.5">
        <Input placeholder="Cari SKU, nama, kategori…" value={q} onChange={(e) => setQ(e.target.value)} />
      </Card>

      {items.length === 0 ? <Card><EmptyState title="Tidak ada item" sub="Ubah kata kunci pencarian." /></Card> : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-line bg-canvas/70 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">
                <th className="px-3 py-2.5">Item</th><th className="px-3 py-2.5">Gudang</th>
                <th className="px-3 py-2.5 text-right">Stok</th><th className="px-3 py-2.5 w-36">Level</th>
                <th className="px-3 py-2.5 text-right">Nilai</th><th className="px-3 py-2.5">Metode</th><th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((i) => {
                const h = health(i);
                return (
                  <tr key={i.sku} className="transition hover:bg-pine-50/60">
                    <td className="px-3 py-2.5">
                      <p className="text-[12.5px] font-bold text-ink">{i.name}</p>
                      <p className="font-mono text-[10px] text-mute">{i.sku} · {i.category}</p>
                    </td>
                    <td className="px-3 py-2.5 text-[11.5px] text-ink2">{i.warehouse}</td>
                    <td className="num px-3 py-2.5 text-right font-mono text-[12.5px] font-bold text-ink">{i.stock.toLocaleString("id-ID")} <span className="text-[10px] font-medium text-mute">{i.uom}</span></td>
                    <td className="px-3 py-2.5"><Bar pct={(i.stock / (i.reorder * 3)) * 100} tone={h === "CRITICAL" ? "danger" : h === "LOW" ? "warn" : "pine"} /></td>
                    <td className="num px-3 py-2.5 text-right font-mono text-[11px] text-ink2">{fmtIDRCompact(i.stock * i.unitCost)}</td>
                    <td className="px-3 py-2.5"><Chip tone="neutral">{i.method}</Chip></td>
                    <td className="px-3 py-2.5"><Chip tone={h === "CRITICAL" ? "danger" : h === "LOW" ? "warn" : "ok"} dot pulse={h === "CRITICAL"}>{h}</Chip></td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1.5">
                        <BtnSm onClick={() => setLedgerSku(i.sku)}><BookOpen size={11} /> Ledger</BtnSm>
                        <BtnSm onClick={() => { setAdjSku(i.sku); setDelta(""); setReason(""); setErr(""); }} disabled={!canAdjust} title={!canAdjust ? "Butuh role gudang/inventory" : undefined}><Minus size={10} /><Plus size={10} /></BtnSm>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* ledger drawer */}
      {ledgerItem && (
        <Card className="p-4">
          <SectionHead title={`Ledger — ${ledgerItem.name}`} sub={`${ledgerItem.sku} · transaksi tidak pernah dihapus (BR-008)`}
            right={<div className="flex gap-2"><Chip tone="pine">saldo {ledgerItem.stock} {ledgerItem.uom}</Chip><BtnSm onClick={() => setLedgerSku(null)}>Tutup</BtnSm></div>} />
          <div className="overflow-x-auto rounded-md border border-line">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-line bg-canvas/70 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">
                  <th className="px-3 py-2">Tanggal</th><th className="px-3 py-2">Tipe</th><th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Saldo</th><th className="px-3 py-2">Ref</th><th className="px-3 py-2">Aktor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {s.ledger.filter((l) => l.sku === ledgerItem.sku).map((l) => (
                  <tr key={l.id} className="transition hover:bg-pine-50/50">
                    <td className="px-3 py-2 font-mono text-[10.5px] text-ink2">{fmtDate(l.date)}</td>
                    <td className="px-3 py-2"><StatusChip status={l.type} /></td>
                    <td className={`num px-3 py-2 text-right font-mono text-[11.5px] font-bold ${l.qty >= 0 ? "text-ok" : "text-info"}`}>{l.qty > 0 ? `+${l.qty}` : l.qty}</td>
                    <td className="num px-3 py-2 text-right font-mono text-[11.5px] text-ink">{l.balance.toLocaleString("id-ID")}</td>
                    <td className="px-3 py-2 font-mono text-[10.5px] text-mute">{l.ref}</td>
                    <td className="px-3 py-2 text-[11px] text-mute">{l.actor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* adjust modal */}
      <Modal open={!!adjSku} onClose={() => setAdjSku(null)} kicker="Stock adjustment · BR-004" title={`Adjust — ${adjItem?.name ?? ""}`}
        footer={<><BtnSm onClick={() => setAdjSku(null)} className="!py-2">Batal</BtnSm>
          <button onClick={submitAdj} className="inline-flex items-center gap-1.5 rounded-md bg-pine-700 px-3.5 py-2 font-display text-[12.5px] font-bold text-pine-50 hover:bg-pine-800">Posting adjustment</button></>}>
        <div className="space-y-3.5">
          <p className="rounded-md border border-line bg-canvas/60 px-3 py-2 font-mono text-[11px] text-ink2">Saldo saat ini: <b>{adjItem?.stock} {adjItem?.uom}</b></p>
          <div><Label>Delta (+/-) *</Label><Input type="number" value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="cth: -6 atau +12" /></div>
          <div><Label>Alasan (wajib — BR-004) *</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="cth: selisih hitung fisik, kerusakan…" /></div>
          {adjItem && Number(delta) !== 0 && (
            <p className="rounded-md bg-infobg px-3 py-2 text-xs font-semibold text-info">Akan diposting ke ledger · saldo baru {adjItem.stock + Number(delta)} {adjItem.uom}.</p>
          )}
          {err && <p className="rounded-md bg-dangerbg px-3 py-2 text-xs font-semibold text-danger">{err}</p>}
        </div>
      </Modal>
    </div>
  );
}
