import { useMemo } from "react";
import { useApp } from "../lib/store";
import { Card, Kpi, SectionHead, StatusChip, Bar, Chip, statusId } from "../components/ui";
import { fmtDate, fmtIDRCompact, relTime, daysUntil } from "../lib/types";
import { Activity, AlertTriangle, ArrowRight, Wrench, Gauge, PackageCheck } from "lucide-react";

export default function Dashboard() {
  const { s, nav } = useApp();

  const m = useMemo(() => {
    const inService = s.equipment.filter((e) => e.opStatus === "IN_SERVICE").length;
    const util = Math.round(s.equipment.reduce((a, e) => a + e.utilization, 0) / Math.max(s.equipment.length, 1));
    const calIssue = s.equipment.filter((e) => ["EXPIRED", "DUE_SOON"].includes(e.calStatus)).length;
    const openWo = s.workOrders.filter((w) => w.status !== "CLOSED").length;
    const openCmp = s.complaints.filter((c) => !["CLOSED", "RESOLVED"].includes(c.status)).length;
    const pendingPr = s.purchaseRequests.filter((p) => p.status === "IN_APPROVAL").length;
    const lowStock = s.items.filter((i) => i.stock <= i.reorder).length;
    const stockValue = s.items.reduce((a, i) => a + i.stock * i.unitCost, 0);
    const assetValue = s.equipment.reduce((a, e) => a + e.acqCost, 0);
    return { inService, util, calIssue, openWo, openCmp, pendingPr, lowStock, stockValue, assetValue };
  }, [s]);

  const attention = useMemo(() => {
    const out: { label: string; detail: string; sev: "danger" | "warn"; go: () => void }[] = [];
    s.equipment.filter((e) => e.calStatus === "EXPIRED").forEach((e) => out.push({ label: `Kalibrasi kadaluarsa — ${e.name}`, detail: `${e.code} · ${e.room}`, sev: "danger", go: () => nav("equipment-detail", e.id) }));
    s.workOrders.filter((w) => w.status !== "CLOSED" && daysUntil(w.scheduled) < 0).forEach((w) => {
      const eq = s.equipment.find((e) => e.id === w.eqId);
      out.push({ label: `Perawatan terlambat — ${w.wo}`, detail: eq?.name ?? "", sev: "warn", go: () => nav("maintenance") });
    });
    s.items.filter((i) => i.stock <= i.reorder).forEach((i) => out.push({ label: `Stok menipis — ${i.name}`, detail: `Sisa ${i.stock} ${i.uom} (batas minimum ${i.reorder})`, sev: "warn", go: () => nav("inventory") }));
    s.complaints.filter((c) => c.status === "OPEN").forEach((c) => out.push({ label: `Keluhan terbuka — ${c.code}`, detail: `Prioritas ${statusId(c.priority)}`, sev: c.priority === "CRITICAL" ? "danger" : "warn", go: () => nav("maintenance") }));
    return out.slice(0, 6);
  }, [s, nav]);

  const utilBars = useMemo(() => [...s.equipment].sort((a, b) => b.utilization - a.utilization).slice(0, 7), [s.equipment]);

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Dashboard Operasional</h1>
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
        {/* attention queue */}
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

        {/* ringkasan cepat */}
        <Card className="dark-grain p-4 text-pine-50">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-pine-500">Ringkasan cepat</p>
          <div className="mt-3 space-y-3">
            {[
              { icon: <Wrench size={14} />, l: "Work order berjalan", v: m.openWo, c: "text-warnhi" },
              { icon: <Gauge size={14} />, l: "Kalibrasi bermasalah", v: m.calIssue, c: "text-danger" },
              { icon: <Activity size={14} />, l: "Keluhan terbuka", v: m.openCmp, c: "text-warnhi" },
              { icon: <PackageCheck size={14} />, l: "PR menunggu approval", v: m.pendingPr, c: "text-pine-500" },
            ].map((k) => (
              <div key={k.l} className="flex items-center justify-between rounded-md border border-pine-800 bg-pine-950/50 px-3 py-2.5">
                <span className="flex items-center gap-2 text-[12px] text-pine-100/85">{k.icon}{k.l}</span>
                <span className={`num font-display text-[17px] font-black ${k.c}`}>{k.v}</span>
              </div>
            ))}
          </div>
          <button onClick={() => nav("procurement")} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md bg-pine-700 py-2 font-display text-[12px] font-bold text-pine-50 transition hover:bg-pine-600">
            Buka Procurement <ArrowRight size={13} />
          </button>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card className="p-4">
          <SectionHead title="Utilisasi per aset" sub="Jam pemakaian terhadap waktu tersedia" />
          <div className="space-y-2.5">
            {utilBars.map((e) => (
              <button key={e.id} onClick={() => nav("equipment-detail", e.id)} className="group block w-full text-left">
                <div className="mb-1 flex items-center justify-between">
                  <span className="truncate text-[12px] font-semibold text-ink group-hover:text-pine-700">{e.name}</span>
                  <span className={`num font-mono text-[11px] font-bold ${e.utilization < 30 ? "text-danger" : e.utilization < 55 ? "text-warn" : "text-pine-700"}`}>{e.utilization}%</span>
                </div>
                <Bar pct={e.utilization} tone={e.utilization < 30 ? "danger" : e.utilization < 55 ? "warn" : "pine"} />
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <SectionHead title="Aktivitas aset terbaru" sub="Semua kegiatan teknis tercatat dan menggulung ke Aset Medis 360°" />
          <div className="space-y-2.5">
            {s.timeline.slice(0, 5).map((t) => {
              const eq = s.equipment.find((e) => e.id === t.eqId);
              return (
                <button key={t.id} onClick={() => nav("equipment-detail", t.eqId)} className="group flex w-full items-start gap-2.5 rounded-md px-1 py-1 text-left transition hover:bg-pine-50/70">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-pine-500" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-bold text-ink group-hover:text-pine-700">{t.title}</span>
                    <span className="block font-mono text-[9.5px] text-mute">{eq?.name} · {t.actor} · {relTime(t.date)}</span>
                  </span>
                  <StatusChip status={t.type} />
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      <p className="font-mono text-[10.5px] text-mute">Jadwal berikutnya: {s.workOrders.filter((w) => w.status === "SCHEDULED").slice(0, 2).map((w) => `${w.wo} · ${fmtDate(w.scheduled)}`).join("  ·  ") || "—"}</p>
    </div>
  );
}
