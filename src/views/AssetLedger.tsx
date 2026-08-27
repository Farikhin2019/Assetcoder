import { useMemo, useState } from "react";
import { useApp } from "../lib/store";
import { BtnSm, Card, Chip, EmptyState, Input, MonoTag, SectionHead, Select, StatusChip } from "../components/ui";
import { IcBox, IcDownload, IcHospital, IcLayers, IcPin } from "../components/icons";
import { BUILDING_VALUES, BUILDINGS, ROOMS } from "../lib/data";
import { AssetClassRow, DEPR_SALVAGE, fmtIDRCompact, monthlyDep } from "../lib/types";

const tokens = (str: string) => str.toLowerCase().split(/[\s·\-–,]+/).filter(Boolean);
const roomHas = (room: string, name: string) => {
  const rt = tokens(room); const nt = tokens(name);
  return nt.every((t) => rt.includes(t));
};

export default function AssetLedger() {
  const { s, nav, toast } = useApp();
  const [q, setQ] = useState("");
  const [klass, setKlass] = useState("ALL");
  const [bld, setBld] = useState("ALL");

  const rows = useMemo<AssetClassRow[]>(() => {
    const out: AssetClassRow[] = [];
    // Buildings (fixed asset, nilai dari register)
    for (const b of BUILDINGS) {
      const v = BUILDING_VALUES[b.name] ?? { cost: 0, book: 0, year: b.year, custodian: "—", condition: "—" };
      out.push({ id: b.id, code: `AST-BLD-${b.id}`, name: `${b.name} — ${b.label}`, klass: "GEDUNG", location: b.floors.length + " lantai", custodian: v.custodian, condition: v.condition, status: b.status, cost: v.cost, book: v.book });
    }
    // Rooms (unit lokasi)
    for (const r of ROOMS) {
      const count = s.equipment.filter((e) => roomHas(e.room, r.name)).length;
      out.push({ id: r.id, code: `AST-RM-${r.id}`, name: `Ruang ${r.name}`, klass: "RUANGAN", location: `${r.building} · ${r.floor}`, custodian: r.unit, condition: "—", status: "ACTIVE", cost: 0, book: 0 });
      void count;
    }
    // Medical equipment (nilai buku dari depresiasi)
    for (const e of s.equipment) {
      const monthly = monthlyDep(e.acqCost, e.category);
      const posted = (s.deprPosted[e.id] ?? []).length;
      const accum = Math.min(e.acqCost * (1 - DEPR_SALVAGE), posted * monthly);
      out.push({ id: e.id, code: e.code, name: e.name, klass: "ALKES", location: `${e.building} · ${e.room}`, custodian: e.custodian, condition: e.condition, status: e.opStatus, cost: e.acqCost, book: e.acqCost - accum });
    }
    return out;
  }, [s.equipment, s.deprPosted]);

  const filtered = rows.filter((r) =>
    (klass === "ALL" || r.klass === klass) &&
    (bld === "ALL" || r.location.startsWith(bld)) &&
    (q === "" || `${r.code} ${r.name} ${r.location} ${r.custodian}`.toLowerCase().includes(q.toLowerCase()))
  );

  const totCost = filtered.reduce((a, r) => a + r.cost, 0);
  const totBook = filtered.reduce((a, r) => a + r.book, 0);

  const exportCsv = () => {
    const csv = [
      ["asset_id", "nama", "kelas", "lokasi", "custodian", "kondisi", "status", "nilai_perolehan", "nilai_buku"],
      ...filtered.map((r) => [r.code, r.name, r.klass, r.location, r.custodian, r.condition, r.status, r.cost, r.book]),
    ].map((c) => c.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "simaset-buku-aset.csv"; a.click();
    URL.revokeObjectURL(a.href);
    toast(`Buku aset diunduh (${filtered.length} baris)`);
  };

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Buku Aset (Fixed Asset Ledger)</h1>
          <p className="text-xs text-mute">Register aset tetap terpadu — gedung, ruangan & alkes — Asset ID imutabel (BR-002) · satu lokasi & custodian aktif</p>
        </div>
        <div className="flex items-center gap-2">
          <Chip tone="pine" dot>{filtered.length} aset</Chip>
          <BtnSm onClick={exportCsv}><IcDownload size={12} /> Export CSV</BtnSm>
        </div>
      </div>

      {/* summary strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: "Gedung", v: rows.filter((r) => r.klass === "GEDUNG").length, icon: <IcHospital size={16} />, tone: "bg-pine-100 text-pine-700" },
          { l: "Ruangan", v: rows.filter((r) => r.klass === "RUANGAN").length, icon: <IcLayers size={16} />, tone: "bg-infobg text-info" },
          { l: "Alat Kesehatan", v: rows.filter((r) => r.klass === "ALKES").length, icon: <IcBox size={16} />, tone: "bg-okbg text-ok" },
          { l: "Total Nilai Buku", v: fmtIDRCompact(totBook), icon: <IcPin size={16} />, tone: "bg-warnbg text-warn" },
        ].map((k) => (
          <Card key={k.l} className="flex items-center gap-3 p-4">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${k.tone}`}>{k.icon}</span>
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">{k.l}</p>
              <p className="num font-display text-[20px] font-black leading-tight text-ink">{k.v}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-3.5">
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <div className="col-span-2"><Input placeholder="Cari kode, nama, lokasi, custodian…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <Select value={klass} onChange={(e) => setKlass(e.target.value)}>
            <option value="ALL">Semua kelas</option>
            {["GEDUNG", "RUANGAN", "ALKES"].map((k) => <option key={k}>{k}</option>)}
          </Select>
          <Select value={bld} onChange={(e) => setBld(e.target.value)}>
            <option value="ALL">Semua gedung</option>
            {BUILDINGS.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
          </Select>
        </div>
      </Card>

      <Card className="overflow-x-auto">
        {filtered.length === 0 ? <EmptyState title="Tidak ada aset cocok" sub="Ubah filter pencarian." /> : (
          <table className="w-full min-w-[1020px] text-left">
            <thead>
              <tr className="border-b border-line bg-canvas/70 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">
                <th className="px-3 py-2.5">Asset ID</th><th className="px-3 py-2.5">Nama aset</th><th className="px-3 py-2.5">Kelas</th>
                <th className="px-3 py-2.5">Lokasi</th><th className="px-3 py-2.5">Custodian</th><th className="px-3 py-2.5">Kondisi</th>
                <th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5 text-right">Perolehan</th><th className="px-3 py-2.5 text-right">Nilai buku</th><th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((r, i) => (
                <tr key={r.code} className="row-in transition hover:bg-pine-50/60" style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
                  <td className="px-3 py-2.5"><MonoTag>{r.code}</MonoTag></td>
                  <td className="px-3 py-2.5 text-[12.5px] font-bold text-ink">{r.name}</td>
                  <td className="px-3 py-2.5"><StatusChip status={r.klass} /></td>
                  <td className="px-3 py-2.5 text-[11.5px] text-ink2">{r.location}</td>
                  <td className="px-3 py-2.5 text-[11.5px] text-mute">{r.custodian}</td>
                  <td className="px-3 py-2.5">{r.condition === "—" ? <span className="font-mono text-[10.5px] text-mute">—</span> : <StatusChip status={r.condition} />}</td>
                  <td className="px-3 py-2.5"><StatusChip status={r.status} /></td>
                  <td className="num px-3 py-2.5 text-right font-mono text-[11px] text-ink2">{r.cost > 0 ? fmtIDRCompact(r.cost) : "—"}</td>
                  <td className="num px-3 py-2.5 text-right font-mono text-[11.5px] font-bold text-pine-700">{r.book > 0 ? fmtIDRCompact(r.book) : "—"}</td>
                  <td className="px-3 py-2.5">
                    {r.klass === "ALKES" && <BtnSm onClick={() => nav("equipment-detail", r.id)}>360°</BtnSm>}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-line bg-canvas/60">
                <td colSpan={7} className="px-3 py-2.5 font-mono text-[10.5px] font-bold uppercase tracking-wide text-mute">Total ({filtered.length} aset)</td>
                <td className="num px-3 py-2.5 text-right font-mono text-[12px] font-black text-ink">{fmtIDRCompact(totCost)}</td>
                <td className="num px-3 py-2.5 text-right font-mono text-[12px] font-black text-pine-700">{fmtIDRCompact(totBook)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </Card>

      <SectionHead title="Catatan tata kelola" sub="Sumber kebenaran: ledger aset & depresiasi" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card className="p-4"><p className="text-[12.5px] leading-relaxed text-ink2"><b className="text-pine-700">Asset ID imutabel.</b> Kode aset tidak pernah berubah sepanjang siklus hidup, termasuk saat transfer antar gedung (BR-002).</p></Card>
        <Card className="p-4"><p className="text-[12.5px] leading-relaxed text-ink2"><b className="text-pine-700">Satu custodian aktif.</b> Setiap aset tercatat pada tepat satu custodian & satu lokasi aktif; perpindahan wajib lewat transfer berpersetujuan.</p></Card>
        <Card className="p-4"><p className="text-[12.5px] leading-relaxed text-ink2"><b className="text-pine-700">Nilai buku live.</b> Nilai buku alkes dihitung dari akumulasi depresiasi yang diposting periodik, konsisten dengan modul Depresiasi.</p></Card>
      </div>
    </div>
  );
}
