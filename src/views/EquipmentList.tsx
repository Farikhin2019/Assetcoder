import { useMemo, useState } from "react";
import { useApp } from "../lib/store";
import { Bar, Card, Chip, Input, Select, StatusChip, EmptyState, QRGlyph } from "../components/ui";
import { IcScan } from "../components/icons";
import { fmtDate, fmtIDRCompact } from "../lib/types";

type SortKey = "name" | "cost" | "util" | "risk";

export default function EquipmentList() {
  const { s, nav } = useApp();
  const [q, setQ] = useState(s.searchQuery);
  const [status, setStatus] = useState("ALL");
  const [cat, setCat] = useState("ALL");
  const [risk, setRisk] = useState("ALL");
  const [sort, setSort] = useState<SortKey>("risk");

  const cats = useMemo(() => Array.from(new Set(s.equipment.map((e) => e.category))), [s.equipment]);

  const rows = useMemo(() => {
    let r = s.equipment.filter((e) =>
      (status === "ALL" || e.opStatus === status) &&
      (cat === "ALL" || e.category === cat) &&
      (risk === "ALL" || e.risk === risk) &&
      (q === "" || `${e.name} ${e.code} ${e.serial} ${e.room} ${e.brand}`.toLowerCase().includes(q.toLowerCase()))
    );
    const riskOrd = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    r = [...r].sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name)
        : sort === "cost" ? b.acqCost - a.acqCost
        : sort === "util" ? a.utilization - b.utilization
        : riskOrd[a.risk] - riskOrd[b.risk]);
    return r;
  }, [s.equipment, q, status, cat, risk, sort]);

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Equipment Registry</h1>
          <p className="text-xs text-mute">{s.equipment.length} aset medis terdaftar · klik untuk membuka Equipment 360°</p>
        </div>
        <div className="flex gap-2">
          <Chip tone="ok" dot>{s.equipment.filter((e) => e.opStatus === "IN_SERVICE").length} IN SERVICE</Chip>
          <Chip tone="danger" dot>{s.equipment.filter((e) => e.calStatus === "EXPIRED" || e.calStatus === "FAILED").length} CAL GAGAL</Chip>
        </div>
      </div>

      <Card className="p-3.5">
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-6">
          <div className="col-span-2">
            <Input placeholder="Cari nama, kode, serial, ruangan…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ALL">Semua status</option>
            {["IN_SERVICE", "MAINTENANCE", "CALIBRATION", "DOWN", "RETIRED"].map((x) => <option key={x}>{x}</option>)}
          </Select>
          <Select value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="ALL">Semua kategori</option>
            {cats.map((c) => <option key={c}>{c}</option>)}
          </Select>
          <Select value={risk} onChange={(e) => setRisk(e.target.value)}>
            <option value="ALL">Semua risiko</option>
            {["HIGH", "MEDIUM", "LOW"].map((x) => <option key={x}>{x}</option>)}
          </Select>
          <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="risk">Urut: risiko</option>
            <option value="cost">Urut: nilai aset</option>
            <option value="util">Urut: utilization</option>
            <option value="name">Urut: nama</option>
          </Select>
        </div>
      </Card>

      {rows.length === 0 ? (
        <Card><EmptyState title="Tidak ada aset yang cocok" sub="Ubah filter atau kata kunci pencarian." /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((e, i) => (
            <button key={e.id} onClick={() => nav("equipment-detail", e.id)} style={{ animationDelay: `${(i % 9) * 45}ms` }}
              className="row-in group rounded-lg border border-line bg-card p-4 text-left shadow-[0_1px_2px_rgba(20,33,28,0.05)] transition hover:-translate-y-0.5 hover:border-pine-500/50 hover:shadow-xl">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-display text-[14.5px] font-extrabold tracking-tight text-ink group-hover:text-pine-700">{e.name}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-mute">{e.code} · SN {e.serial}</p>
                </div>
                <StatusChip status={e.opStatus} />
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <Chip tone="neutral">{e.category}</Chip>
                <Chip tone={e.risk === "HIGH" ? "danger" : e.risk === "MEDIUM" ? "warn" : "ok"}>RISK {e.risk}</Chip>
                {e.calRequired && <StatusChip status={e.calStatus} />}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-2.5 font-mono text-[10px] text-mute">
                <div><p className="uppercase tracking-wide">Lokasi</p><p className="mt-0.5 truncate font-sans text-[11px] font-bold text-ink2">{e.room}</p></div>
                <div><p className="uppercase tracking-wide">Nilai</p><p className="num mt-0.5 font-sans text-[11px] font-bold text-ink2">{fmtIDRCompact(e.acqCost)}</p></div>
                <div><p className="uppercase tracking-wide">Next maint.</p><p className="mt-0.5 font-sans text-[11px] font-bold text-ink2">{fmtDate(e.nextMaint)}</p></div>
              </div>
              <div className="mt-2.5">
                <div className="mb-1 flex justify-between font-mono text-[9.5px] text-mute"><span>UTILIZATION</span><span className="font-bold text-ink2">{e.utilization}%</span></div>
                <Bar pct={e.utilization} tone={e.utilization < 30 ? "danger" : e.utilization < 55 ? "warn" : "pine"} />
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 font-mono text-[10.5px] text-mute">
        <IcScan size={13} className="text-pine-600" /> QR mobile flow: Scan → Equipment 360° → Inspect/Maintain/Calibrate/Complaint (gated by permission)
      </div>
    </div>
  );
}
