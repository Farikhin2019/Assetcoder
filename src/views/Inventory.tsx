import { useMemo, useState } from "react";
import { itemHealth, useApp } from "../lib/store";
import { Bar, BtnSm, Card, Chip, Input, Label, Modal, Select, StatusChip, TextArea, chipFor, EmptyState } from "../components/ui";
import { IcLedger, IcPlus } from "../components/icons";
import { WAREHOUSES } from "../lib/data";
import { ADJ_APPROVAL_THRESHOLD, fmtDate, fmtDateTime, fmtIDR, fmtIDRCompact } from "../lib/types";

export default function Inventory() {
  const { s, adjustStock } = useApp();
  const [q, setQ] = useState("");
  const [wh, setWh] = useState("ALL");
  const [health, setHealth] = useState("ALL");
  const [drawer, setDrawer] = useState<string | null>(null);
  const [adj, setAdj] = useState<string | null>(null);
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");

  const item = s.items.find((i) => i.sku === drawer);
  const adjItem = s.items.find((i) => i.sku === adj);
  const rows = useMemo(() => s.items.filter((i) =>
    (wh === "ALL" || i.warehouse === wh) &&
    (health === "ALL" || itemHealth(i) === health) &&
    (q === "" || `${i.sku} ${i.name} ${i.category}`.toLowerCase().includes(q.toLowerCase()))
  ), [s.items, q, wh, health]);

  const ledgerRows = useMemo(() => (drawer ? s.ledger.filter((l) => l.sku === drawer) : s.ledger).slice(0, 40), [s.ledger, drawer]);

  const submitAdj = () => {
    if (!adjItem) return;
    const dv = Number(delta);
    if (!dv || Number.isNaN(dv)) return setErr("Delta wajib berupa angka ≠ 0.");
    if (adjItem.stock + dv < 0) return setErr(`Stok tidak boleh negatif (tersedia ${adjItem.stock} ${adjItem.uom}).`);
    if (reason.trim().length < 5) return setErr("Alasan adjustment wajib (BR-004).");
    adjustStock(adjItem.sku, dv, reason.trim());
    setAdj(null); setDelta(""); setReason(""); setErr("");
  };

  const totalValue = s.items.reduce((a, i) => a + i.stock * i.unitCost, 0);

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Inventory & Ledger</h1>
          <p className="text-xs text-mute">Ledger append-only = source of truth (BR-003/008) · saldo stok = cache turunan</p>
        </div>
        <div className="flex gap-2">
          <Chip tone="pine" dot>{s.items.length} SKU</Chip>
          <Chip tone="info" dot>{fmtIDRCompact(totalValue)} nilai stok</Chip>
          <Chip tone="warn" dot pulse>{s.items.filter((i) => itemHealth(i) !== "ok").length} perlu aksi</Chip>
        </div>
      </div>

      <Card className="p-3.5">
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <div className="col-span-2"><Input placeholder="Cari SKU, nama, kategori…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <Select value={wh} onChange={(e) => setWh(e.target.value)}><option value="ALL">Semua gudang</option>{WAREHOUSES.map((w) => <option key={w.id}>{w.name}</option>)}</Select>
          <Select value={health} onChange={(e) => setHealth(e.target.value)}>
            <option value="ALL">Semua kondisi</option><option value="ok">OK</option><option value="low">LOW</option><option value="critical">CRITICAL</option><option value="expiry">NEAR EXPIRY</option>
          </Select>
        </div>
      </Card>

      {rows.length === 0 ? <Card><EmptyState title="Tidak ada item" sub="Ubah filter pencarian." /></Card> : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left">
            <thead>
              <tr className="border-b border-line bg-canvas/70 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">
                <th className="px-3 py-2.5">Item</th><th className="px-3 py-2.5">Gudang</th><th className="px-3 py-2.5">Batch / Expired</th>
                <th className="px-3 py-2.5 text-right">Stok</th><th className="px-3 py-2.5 w-36">Level</th>
                <th className="px-3 py-2.5 text-right">Nilai</th><th className="px-3 py-2.5">Metode</th><th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((i) => {
                const h = itemHealth(i);
                return (
                  <tr key={i.sku} className="transition hover:bg-pine-50/60">
                    <td className="px-3 py-2.5">
                      <button onClick={() => setDrawer(i.sku)} className="text-left">
                        <p className="text-[12.5px] font-bold text-ink hover:text-pine-700">{i.name}</p>
                        <p className="font-mono text-[10px] text-mute">{i.sku} · {i.category}</p>
                      </button>
                    </td>
                    <td className="px-3 py-2.5 text-[11.5px] text-ink2">{i.warehouse}</td>
                    <td className="px-3 py-2.5 font-mono text-[10.5px] text-ink2">{i.batch ?? "—"}{i.expiry ? <span className={`ml-1.5 ${h === "expiry" ? "font-bold text-danger" : ""}`}>ED {fmtDate(i.expiry)}</span> : ""}</td>
                    <td className="num px-3 py-2.5 text-right font-mono text-[12.5px] font-bold text-ink">{i.stock.toLocaleString("id-ID")} <span className="text-[10px] font-medium text-mute">{i.uom}</span></td>
                    <td className="px-3 py-2.5"><Bar pct={(i.stock / i.max) * 100} tone={h === "critical" ? "danger" : h === "low" || h === "expiry" ? "warn" : "pine"} /></td>
                    <td className="num px-3 py-2.5 text-right font-mono text-[11px] text-ink2">{fmtIDRCompact(i.stock * i.unitCost)}</td>
                    <td className="px-3 py-2.5"><Chip tone="neutral">{i.method}</Chip></td>
                    <td className="px-3 py-2.5"><Chip tone={chipFor(h)} dot pulse={h === "critical"}>{h === "ok" ? "OK" : h.toUpperCase()}</Chip></td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1.5">
                        <BtnSm onClick={() => setDrawer(i.sku)}><IcLedger size={11} /> Ledger</BtnSm>
                        <BtnSm onClick={() => { setAdj(i.sku); setDelta(""); setReason(""); setErr(""); }}><IcPlus size={11} /> Adjust</BtnSm>
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
      {item && (
        <Card className="p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-[15px] font-extrabold text-ink">Ledger — {item.name}</h2>
              <p className="font-mono text-[10.5px] text-mute">{item.sku} · {WAREHOUSES.find((w) => w.name === item.warehouse)?.code} · transaksi tidak pernah dihapus (BR-008)</p>
            </div>
            <div className="flex gap-2"><Chip tone="pine">saldo {item.stock} {item.uom}</Chip><BtnSm onClick={() => setDrawer(null)}>Tutup</BtnSm></div>
          </div>
          <div className="overflow-x-auto rounded-md border border-line">
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr className="border-b border-line bg-canvas/70 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">
                  <th className="px-3 py-2">Tanggal</th><th className="px-3 py-2">Tipe</th><th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Saldo</th><th className="px-3 py-2">Ref</th><th className="px-3 py-2">Aktor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {ledgerRows.map((l) => (
                  <tr key={l.id} className="transition hover:bg-pine-50/50">
                    <td className="px-3 py-2 font-mono text-[10.5px] text-ink2">{fmtDateTime(l.date)}</td>
                    <td className="px-3 py-2"><StatusChip status={l.type === "EXPIRED" ? "EXPIRED_TX" : l.type} /></td>
                    <td className={`num px-3 py-2 text-right font-mono text-[11.5px] font-bold ${l.qty >= 0 ? "text-ok" : "text-info"}`}>{l.qty > 0 ? `+${l.qty}` : l.qty}</td>
                    <td className="num px-3 py-2 text-right font-mono text-[11.5px] text-ink">{l.balance.toLocaleString("id-ID")}</td>
                    <td className="px-3 py-2 font-mono text-[10.5px] text-mute">{l.ref}{l.reason ? ` · ${l.reason}` : ""}</td>
                    <td className="px-3 py-2 text-[11px] text-mute">{l.actor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* adjust modal */}
      <Modal open={!!adj} onClose={() => setAdj(null)} kicker="Stock adjustment · BR-004/005" title={`Adjust — ${adjItem?.name ?? ""}`}
        footer={<><BtnSm onClick={() => setAdj(null)} className="!py-2">Batal</BtnSm><button onClick={submitAdj} className="inline-flex items-center gap-1.5 rounded-md bg-pine-700 px-3.5 py-2 font-display text-[12.5px] font-bold text-pine-50 hover:bg-pine-800">Posting adjustment</button></>}>
        <div className="space-y-3.5">
          <p className="rounded-md border border-line bg-canvas/60 px-3 py-2 font-mono text-[11px] text-ink2">Saldo saat ini: <b>{adjItem?.stock} {adjItem?.uom}</b> · threshold approval {fmtIDR(s.config.adjThreshold)}</p>
          <div><Label>Delta (+/-) *</Label><Input type="number" value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="cth: -6 atau +12" /></div>
          <div><Label>Alasan (wajib — BR-004) *</Label><TextArea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="cth: selisih hitung fisik, kerusakan, kedaluwarsa…" /></div>
          {adjItem && Number(delta) !== 0 && (
            <p className={`rounded-md px-3 py-2 text-xs font-semibold ${Math.abs(Number(delta)) * adjItem.unitCost > ADJ_APPROVAL_THRESHOLD ? "bg-warnbg text-warn" : "bg-infobg text-info"}`}>
              {Math.abs(Number(delta)) * adjItem.unitCost > ADJ_APPROVAL_THRESHOLD
                ? `Nilai ${fmtIDRCompact(Math.abs(Number(delta)) * adjItem.unitCost)} > threshold → dirutekan ke approval matrix (BR-005).`
                : `Akan diposting langsung ke ledger · saldo baru ${adjItem.stock + Number(delta)} ${adjItem.uom}.`}
            </p>
          )}
          {err && <p className="rounded-md bg-dangerbg px-3 py-2 text-xs font-semibold text-danger">{err}</p>}
        </div>
      </Modal>
    </div>
  );
}
