import { useMemo, useState } from "react";
import { useApp } from "../lib/store";
import { Card, Chip, Input, Select, StatusChip, Bar, BtnSm, EmptyState, MonoTag, SectionHead } from "../components/ui";
import { fmtIDRCompact, relTime } from "../lib/types";
import { PackageSearch } from "lucide-react";

export default function Inventory() {
  const { s, adjust, toast } = useApp();
  const [q, setQ] = useState("");
  const [sku, setSku] = useState<string | null>(null);
  const [adjFor, setAdjFor] = useState<string | null>(null);
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");

  const items = useMemo(() => s.items.filter((i) =>
    q === "" || `${i.sku} ${i.name} ${i.category} ${i.warehouse}`.toLowerCase().includes(q.toLowerCase())
  ), [s.items, q]);

  const ledger = useMemo(() => (sku ? s.ledger.filter((l) => l.sku === sku) : s.ledger).slice(0, 30), [s.ledger, sku]);
  const active = s.items.find((i) => i.sku === sku);

  const submitAdjust = () => {
    const d = Number(delta);
    if (!adjFor || !d || Number.isNaN(d)) { toast("Delta harus berupa angka ≠ 0.", "err"); return; }
    if (reason.trim().length < 4) { toast("Alasan penyesuaian wajib diisi.", "err"); return; }
    adjust(adjFor, d, reason.trim());
    setAdjFor(null); setDelta(""); setReason("");
  };

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Stok & Buku Besar</h1>
          <p className="text-xs text-mute">Buku besar hanya-tambah adalah sumber kebenaran · setiap mutasi tercatat dan tidak bisa dihapus</p>
        </div>
        <Chip tone="pine" dot>{s.items.length} SKU · {fmtIDRCompact(s.items.reduce((a, i) => a + i.stock * i.unitCost, 0))}</Chip>
      </div>

      <Card className="p-3.5">
        <Input placeholder="Cari SKU, nama, kategori, gudang…" value={q} onChange={(e) => setQ(e.target.value)} />
      </Card>

      {items.length === 0 ? <Card><EmptyState title="Tidak ada barang" sub="Ubah kata kunci pencarian." /></Card> : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="border-b border-line bg-canvas/70 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">
                <th className="px-3 py-2.5">Barang</th><th className="px-3 py-2.5">Gudang</th>
                <th className="px-3 py-2.5 text-right">Stok</th><th className="px-3 py-2.5 w-36">Level Stok</th>
                <th className="px-3 py-2.5 text-right">Nilai</th><th className="px-3 py-2.5">Metode</th><th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((i) => {
                const low = i.stock <= i.reorder;
                return (
                  <tr key={i.sku} className="transition hover:bg-pine-50/60">
                    <td className="px-3 py-2.5">
                      <p className="text-[12.5px] font-bold text-ink">{i.name}</p>
                      <p className="font-mono text-[10px] text-mute">{i.sku} · {i.category}</p>
                    </td>
                    <td className="px-3 py-2.5 text-[11.5px] text-ink2">{i.warehouse}</td>
                    <td className="num px-3 py-2.5 text-right font-mono text-[12px] font-bold text-ink">{i.stock.toLocaleString("id-ID")} <span className="text-[10px] text-mute">{i.uom}</span></td>
                    <td className="px-3 py-2.5"><Bar pct={(i.stock / (i.reorder * 2 || 1)) * 100} tone={low ? "danger" : "pine"} /></td>
                    <td className="num px-3 py-2.5 text-right font-mono text-[11px] text-ink2">{fmtIDRCompact(i.stock * i.unitCost)}</td>
                    <td className="px-3 py-2.5"><Chip tone="neutral">{i.method}</Chip></td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1.5">
                        <BtnSm onClick={() => setSku(i.sku)}><PackageSearch size={11} /> Buku Besar</BtnSm>
                        <BtnSm onClick={() => { setAdjFor(i.sku); setDelta(""); setReason(""); }}>Sesuaikan</BtnSm>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {sku && active && (
        <Card className="p-4">
          <SectionHead title={`Buku Besar — ${active.name}`} sub={`${active.sku} · mutasi terbaru di atas · hanya-tambah`}
            right={<BtnSm onClick={() => setSku(null)}>Tutup</BtnSm>} />
          <div className="overflow-x-auto rounded-md border border-line">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-line bg-canvas/70 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">
                  <th className="px-3 py-2">Tanggal</th><th className="px-3 py-2">Jenis</th><th className="px-3 py-2 text-right">Jumlah</th>
                  <th className="px-3 py-2 text-right">Saldo</th><th className="px-3 py-2">Referensi</th><th className="px-3 py-2">Pelaku</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {ledger.map((l) => (
                  <tr key={l.id} className="transition hover:bg-pine-50/50">
                    <td className="px-3 py-2 font-mono text-[10.5px] text-ink2" title={relTime(l.date)}>{relTime(l.date)}</td>
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

      {adjFor && (
        <Card className="p-4">
          <SectionHead title={`Sesuaikan Stok — ${s.items.find((i) => i.sku === adjFor)?.name}`} sub="Penyesuaian di atas Rp 2 jt butuh persetujuan (BR)" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div><label className="mb-1 block font-mono text-[10.5px] font-semibold uppercase text-mute">Delta (+/-)</label>
              <Input type="number" value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="cth: -6 atau +12" /></div>
            <div className="md:col-span-2"><label className="mb-1 block font-mono text-[10.5px] font-semibold uppercase text-mute">Alasan (wajib)</label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="cth: selisih hitung fisik, kedaluwarsa…" /></div>
          </div>
          <div className="mt-3 flex gap-2">
            <BtnSm onClick={submitAdjust} className="!border-pine-500/60 !text-pine-700">Simpan Penyesuaian</BtnSm>
            <BtnSm onClick={() => setAdjFor(null)}>Batal</BtnSm>
          </div>
        </Card>
      )}

      <p className="flex items-center gap-1.5 font-mono text-[10.5px] text-mute"><PackageSearch size={12} className="text-pine-600" /> Saldo stok = turunan buku besar (BR-003/008) · metode FEFO untuk barang ber-expiry, FIFO umum.</p>
    </div>
  );
}
