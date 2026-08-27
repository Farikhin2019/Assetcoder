import { useMemo } from "react";
import { useApp } from "../lib/store";
import { Card, Kpi, SectionHead, Bar, Chip, statusId } from "../components/ui";
import { fmtIDRCompact, relTime, daysUntil } from "../lib/types";
import { AlertTriangle, ArrowRight } from "lucide-react";

export default function Dashboard() {
  const { s, nav } = useApp();

  const m = useMemo(() => ({
    inService: s.equipment.filter((e) => e.opStatus === "IN_SERVICE").length,
    assetValue: s.equipment.reduce((a, e) => a + e.acqCost, 0),
    stockValue: s.items.reduce((a, i) => a + i.stock * i.unitCost, 0),
    util: Math.round(s.equipment.reduce((a, e) => a + e.utilization, 0) / (s.equipment.length || 1)),
  }), [s]);

  const attention = useMemo(() => {
    const out: { label: string; detail: string; sev: "danger" | "warn"; go: () => void }[] = [];
    s.equipment.filter((e) => e.calStatus === "EXPIRED").forEach((e) => out.push({ label: `Kalibrasi kadaluarsa — ${e.name}`, detail: `${e.code} · ${e.room}`, sev: "danger", go: () => nav("equipment-detail", e.id) }));
    s.workOrders.filter((w) => w.status !== "CLOSED" && daysUntil(w.scheduled) < 0).forEach((w) => out.push({ label: `Perawatan terlambat — ${w.wo}`, detail: s.equipment.find((e) => e.id === w.eqId)?.name ?? "", sev: "warn", go: () => nav("maintenance") }));
    s.items.filter((i) => i.stock <= i.reorder).forEach((i) => out.push({ label: `Stok menipis — ${i.name}`, detail: `Sisa ${i.stock} ${i.uom} (batas ${i.reorder})`, sev: "warn", go: () => nav("inventory") }));
    s.complaints.filter((c) => c.status === "OPEN").forEach((c) => out.push({ label: `Keluhan terbuka — ${c.code}`, detail: `Prioritas ${statusId(c.priority)}`, sev: c.priority === "CRITICAL" ? "danger" : "warn", go: () => nav("maintenance") }));
    return out.slice(0, 6);
  }, [s, nav]);

  const utilBars = useMemo(() => [...s.equipment].sort((a, b) => b.utilization - a.utilization).slice(0, 7), [s.equipment]);

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Dasbor Operasional</h1>
          <p className="text-xs text-mute">Selamat datang, <b className="text-pine-700">{s.userName}</b> · {s.role}{s.userUnit ? ` · ${s.userUnit}` : ""} — denyut aset & inventori hari ini</p>
        </div>
        <Chip tone="pine" dot>{m.inService} aset beroperasi</Chip>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Utilisasi rata-rata" value={String(m.util)} unit="%" spark={[52, 58, 61, 59, 64, 66, m.util]} onClick={() => nav("equipment")} />
        <Kpi label="Nilai aset medis" value={fmtIDRCompact(m.assetValue)} spark={[20, 22, 24, 23, 26, 28, 30]} tone="info" onClick={() => nav("equipment")} />
        <Kpi label="Nilai stok" value={fmtIDRCompact(m.stockValue)} spark={[12, 14, 13, 15, 14, 16, 15]} tone="info" onClick={() => nav("inventory")} />
        <Kpi label="Perlu perhatian" value={String(attention.length)} spark={[2, 3, 2, 4, 3, 5, attention.length]} tone={attention.length > 3 ? "danger" : "warn"} delta={attention.length > 3 ? "▲ tinggi" : "terkendali"} />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <SectionHead title="Perlu Perhatian" sub="Hal yang butuh tindakan segera — diurutkan dari yang paling mendesak"
            right={<Chip tone={attention.some((a) => a.sev === "danger") ? "danger" : "warn"} dot pulse>{attention.length} item</Chip>} />
          <div className="space-y-2">
            {attention.length === 0 && <p className="py-6 text-center text-xs text-mute">Semua terkendali ✓</p>}
            {attention.map((a, i) => (
              <button key={i} onClick={a.go} className="row-in group flex w-full items-center gap-3 rounded-md border border-line bg-paper px-3 py-2.5 text-left transition hover:border-pine-500/50 hover:shadow-md" style={{ animationDelay: `${i * 50}ms` }}>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${a.sev === "danger" ? "bg-dangerbg text-danger" : "bg-warnbg text-warn"}`}><AlertTriangle size={15} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-bold text-ink">{a.label}</span>
                  <span className="block font-mono text-[10px] text-mute">{a.detail}</span>
                </span>
                <ArrowRight size={14} className="shrink-0 text-mute transition group-hover:translate-x-0.5 group-hover:text-pine-600" />
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <SectionHead title="Utilisasi per aset" sub="Jam pemakaian terhadap waktu tersedia" />
          <div className="space-y-3">
            {utilBars.map((e) => (
              <button key={e.id} onClick={() => nav("equipment-detail", e.id)} className="block w-full text-left group">
                <div className="mb-1 flex justify-between">
                  <span className="truncate text-[11.5px] font-bold text-ink2 group-hover:text-pine-700">{e.name}</span>
                  <span className={`num font-mono text-[11px] font-bold ${e.utilization < 30 ? "text-danger" : e.utilization < 55 ? "text-warn" : "text-pine-700"}`}>{e.utilization}%</span>
                </div>
                <Bar pct={e.utilization} tone={e.utilization < 30 ? "danger" : e.utilization < 55 ? "warn" : "pine"} />
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <SectionHead title="Aktivitas terbaru" sub="Rekam jejak lintas modul" right={<button onClick={() => nav("audit")} className="font-mono text-[10.5px] font-bold text-pine-700 hover:text-pine-600">lihat semua →</button>} />
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
          {s.audit.slice(0, 6).map((a, i) => (
            <div key={a.id} className="row-in rounded-md border border-line bg-paper px-3 py-2.5" style={{ animationDelay: `${i * 40}ms` }}>
              <p className="truncate font-mono text-[10px] font-bold text-pine-700">{a.action}</p>
              <p className="truncate text-[11.5px] text-ink2">{a.entityId}{a.reason ? ` — ${a.reason}` : ""}</p>
              <p className="mt-0.5 font-mono text-[9px] text-mute">{a.actor} · {relTime(a.date)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
