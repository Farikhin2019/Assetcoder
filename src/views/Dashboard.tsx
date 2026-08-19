import { useMemo } from "react";
import { useApp, itemHealth, utilOf } from "../lib/store";
import { Bar, Card, Chip, Kpi, SectionHead, StatusChip, chipFor } from "../components/ui";
import { IcBolt, IcFlag, IcGauge, IcStamp, IcWarn, IcWrench } from "../components/icons";
import { daysUntil, fmtDateTime, fmtIDRCompact, relTime } from "../lib/types";

export default function Dashboard() {
  const { s, nav } = useApp();

  const stats = useMemo(() => {
    const inService = s.equipment.filter((e) => e.opStatus === "IN_SERVICE").length;
    const down = s.equipment.filter((e) => e.opStatus === "DOWN" || e.opStatus === "MAINTENANCE").length;
    const util = Math.round(s.equipment.reduce((a, e) => a + utilOf(s.utilSeries, e.id, e.utilization), 0) / s.equipment.length);
    const openWo = s.workOrders.filter((w) => w.status !== "CLOSED").length;
    const overdueWo = s.workOrders.filter((w) => w.status !== "CLOSED" && daysUntil(w.scheduled) < 0).length;
    const calAction = s.equipment.filter((e) => ["DUE_SOON", "EXPIRED", "FAILED"].includes(e.calStatus)).length;
    const openCmp = s.complaints.filter((c) => !["RESOLVED", "VERIFIED", "CLOSED"].includes(c.status)).length;
    const lowStock = s.items.filter((i) => itemHealth(i) !== "ok").length;
    const stockValue = s.items.reduce((a, i) => a + i.stock * i.unitCost, 0) + s.spareParts.reduce((a, p) => a + p.stock * p.unitCost, 0);
    const pending = s.approvals.filter((a) => a.status === "PENDING").length;
    const idle = s.equipment.filter((e) => utilOf(s.utilSeries, e.id, e.utilization) < 30 && e.opStatus === "IN_SERVICE").length;
    return { inService, down, util, openWo, overdueWo, calAction, openCmp, lowStock, stockValue, pending, idle };
  }, [s]);

  const attention = useMemo(() => {
    const rows: { icon: React.ReactNode; tone: "danger" | "warn" | "info"; text: string; go: () => void; tag: string }[] = [];
    s.equipment.filter((e) => e.calStatus === "EXPIRED" || e.calStatus === "FAILED").forEach((e) =>
      rows.push({ icon: <IcGauge size={14} />, tone: "danger", text: `${e.name} — kalibrasi ${e.calStatus.toLowerCase()} ${e.calDue ? daysUntil(e.calDue) + " hari" : ""}`, go: () => nav("equipment-detail", e.id), tag: "CALIBRATION" }));
    s.workOrders.filter((w) => w.status !== "CLOSED" && daysUntil(w.scheduled) < 0).forEach((w) => {
      const eq = s.equipment.find((e) => e.id === w.eqId);
      rows.push({ icon: <IcWrench size={14} />, tone: "warn", text: `${w.wo} (${eq?.name}) overdue ${Math.abs(daysUntil(w.scheduled))} hari`, go: () => nav("technical"), tag: "PM OVERDUE" });
    });
    s.complaints.filter((c) => !["RESOLVED", "VERIFIED", "CLOSED"].includes(c.status)).forEach((c) => {
      const eq = s.equipment.find((e) => e.id === c.eqId);
      const hrsLeft = c.slaHours + Math.round((new Date(c.date).getTime() - Date.now()) / 36e5);
      rows.push({ icon: <IcFlag size={14} />, tone: hrsLeft < 0 ? "danger" : "warn", text: `${c.code} (${eq?.name}) — SLA ${hrsLeft < 0 ? "BREACH " + Math.abs(hrsLeft) + " jam" : hrsLeft + " jam tersisa"}`, go: () => nav("complaints"), tag: "COMPLAINT" });
    });
    s.equipment.filter((e) => e.calStatus === "DUE_SOON").forEach((e) =>
      rows.push({ icon: <IcGauge size={14} />, tone: "warn", text: `${e.name} — kalibrasi jatuh tempo ${e.calDue ? daysUntil(e.calDue) : "?"} hari lagi`, go: () => nav("technical"), tag: "CAL DUE" }));
    s.items.filter((i) => itemHealth(i) === "critical" || itemHealth(i) === "low").forEach((i) =>
      rows.push({ icon: <IcWarn size={14} />, tone: itemHealth(i) === "critical" ? "danger" : "warn", text: `${i.name} — stok ${i.stock} ${i.uom} (reorder ${i.reorder})`, go: () => nav("inventory"), tag: "LOW STOCK" }));
    s.inspections.filter((i) => i.result === "FAIL").forEach((i) => {
      const eq = s.equipment.find((e) => e.id === i.eqId);
      rows.push({ icon: <IcWarn size={14} />, tone: "danger", text: `${i.code} (${eq?.name}) — inspeksi FAIL, tindak lanjut wajib`, go: () => nav("technical"), tag: "INSPECTION" });
    });
    if (stats.pending > 0) rows.push({ icon: <IcStamp size={14} />, tone: "info", text: `${stats.pending} transaksi menunggu persetujuan`, go: () => nav("approvals"), tag: "APPROVAL" });
    return rows.slice(0, 9);
  }, [s, stats.pending, nav]);

  const utilBars = useMemo(() => [...s.equipment].sort((a, b) => utilOf(s.utilSeries, b.id, b.utilization) - utilOf(s.utilSeries, a.id, a.utilization)).slice(0, 8), [s.equipment, s.utilSeries]);
  const feed = s.timeline.slice(0, 8);
  const ticker = s.audit.slice(0, 12);

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Operational Pulse</h1>
          <p className="text-xs text-mute">Single source of truth — aset, inventori, dan operasi teknis RS Harapan Medika</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip tone="ok" dot>{stats.inService} IN SERVICE</Chip>
          <Chip tone="warn" dot pulse={stats.down > 0}>{stats.down} OFF SERVICE</Chip>
          <Chip tone="info" dot>{stats.idle} IDLE &lt;30%</Chip>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Utilization Rate" value={`${stats.util}%`} delta="▲ 2.1% vs bulan lalu" spark={[58, 61, 60, 64, 63, 66, 68, 67]} onClick={() => nav("reporting")} />
        <Kpi label="Availability" value={`${Math.round((stats.inService / s.equipment.length) * 100)}%`} delta={`${s.equipment.length} unit terdaftar`} tone="info" spark={[88, 90, 89, 92, 91, 93, 93, 92]} onClick={() => nav("equipment")} />
        <Kpi label="Open Complaints" value={String(stats.openCmp)} delta={stats.openCmp > 2 ? "▼ SLA risk" : "stabil"} tone={stats.openCmp > 2 ? "danger" : "pine"} spark={[5, 4, 6, 3, 4, 4, 3, stats.openCmp + 1]} onClick={() => nav("complaints")} />
        <Kpi label="Nilai Stok" value={fmtIDRCompact(stats.stockValue)} delta={`${stats.lowStock} SKU perlu aksi`} tone={stats.lowStock > 3 ? "warn" : "pine"} spark={[2.1, 2.2, 2.15, 2.3, 2.25, 2.35, 2.3, 2.4]} onClick={() => nav("inventory")} />
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <Card className="p-4 xl:col-span-2">
          <SectionHead title="Attention queue" sub="Diturunkan dari jadwal, SLA, ledger & approval engine" right={<Chip tone="danger" dot pulse>{attention.length} item</Chip>} />
          <div className="space-y-1.5">
            {attention.map((a, i) => (
              <button key={i} onClick={a.go} style={{ animationDelay: `${i * 45}ms` }}
                className={`row-in flex w-full items-center gap-3 rounded-md border border-line bg-paper px-3 py-2.5 text-left transition hover:-translate-y-px hover:border-pine-500/50 hover:shadow-md`}>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${a.tone === "danger" ? "bg-dangerbg text-danger" : a.tone === "warn" ? "bg-warnbg text-warn" : "bg-infobg text-info"}`}>{a.icon}</span>
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-ink">{a.text}</span>
                <Chip tone={a.tone === "danger" ? "danger" : a.tone === "warn" ? "warn" : "info"} className="hidden sm:inline-flex">{a.tag}</Chip>
                <span className="font-mono text-[10px] text-mute">→</span>
              </button>
            ))}
            {attention.length === 0 && <p className="py-8 text-center text-xs text-mute">Semua terkendali — tidak ada item yang butuh perhatian.</p>}
          </div>
        </Card>

        <Card className="p-4">
          <SectionHead title="Utilization per unit" sub="Actual usage / available time" />
          <div className="space-y-2.5">
            {utilBars.map((e, i) => (
              <button key={e.id} onClick={() => nav("equipment-detail", e.id)} className="group block w-full text-left">
                <div className="mb-1 flex items-center justify-between">
                  <span className="truncate text-[11.5px] font-bold text-ink group-hover:text-pine-700">{e.name}</span>
                  <span className={`num font-mono text-[11px] font-bold ${utilOf(s.utilSeries, e.id, e.utilization) < 30 ? "text-danger" : utilOf(s.utilSeries, e.id, e.utilization) < 55 ? "text-warn" : "text-pine-700"}`}>{utilOf(s.utilSeries, e.id, e.utilization)}%</span>
                </div>
                <Bar pct={utilOf(s.utilSeries, e.id, e.utilization)} tone={utilOf(s.utilSeries, e.id, e.utilization) < 30 ? "danger" : utilOf(s.utilSeries, e.id, e.utilization) < 55 ? "warn" : "pine"} />
                <span className="sr-only">{i}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 border-t border-line pt-3">
            <SectionHead title="Persetujuan menunggu" right={<Chip tone="warn">{stats.pending}</Chip>} />
            {s.approvals.filter((a) => a.status === "PENDING").slice(0, 3).map((a) => (
              <button key={a.id} onClick={() => nav("approvals")} className="mb-1.5 flex w-full items-center gap-2 rounded-md border border-line bg-paper px-2.5 py-2 text-left transition hover:border-warn/50 hover:shadow-sm">
                <IcStamp size={13} className="shrink-0 text-warn" />
                <span className="min-w-0 flex-1 truncate text-[11.5px] font-semibold text-ink">{a.summary}</span>
                <span className="font-mono text-[9.5px] text-mute">{relTime(a.date)}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <SectionHead title="Equipment timeline — lintas aset" sub="Setiap event teknis mengalir ke Equipment 360° (BR-018)" right={<Chip tone="pine">{s.timeline.length} events</Chip>} />
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
          {feed.map((t, i) => {
            const eq = s.equipment.find((e) => e.id === t.eqId);
            return (
              <button key={t.id} onClick={() => nav("equipment-detail", t.eqId)} style={{ animationDelay: `${i * 40}ms` }}
                className="row-in flex items-start gap-2.5 rounded-md border border-line bg-paper px-3 py-2.5 text-left transition hover:border-pine-500/50 hover:shadow-md">
                <Chip tone={chipFor(t.type === "COMPLAINT" || t.type === "REPAIR" ? "danger" : t.type)} className="mt-0.5 shrink-0 !text-[9px]">{t.type}</Chip>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-bold text-ink">{t.title}</span>
                  <span className="block truncate text-[11px] text-mute">{eq?.name} · {t.actor} · {fmtDateTime(t.date)}</span>
                </span>
                {t.cost !== undefined && <span className="num shrink-0 font-mono text-[10.5px] font-bold text-pine-700">{fmtIDRCompact(t.cost)}</span>}
              </button>
            );
          })}
        </div>
      </Card>

      {/* audit ticker */}
      <div className="flex items-center gap-3 overflow-hidden rounded-lg border border-line bg-pine-900 px-4 py-2.5">
        <span className="flex shrink-0 items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-warnhi"><IcBolt size={12} /> Live audit</span>
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <div className="ticker-track flex w-max gap-8">
            {[...ticker, ...ticker].map((a, i) => (
              <span key={i} className="flex items-center gap-2 font-mono text-[10.5px] text-pine-100/80">
                <StatusChip status={a.action.includes("REJECT") || a.action.includes("FAIL") || a.action.includes("OVERDUE") || a.action.includes("EXPIRED") ? "danger" : "VALID"} className="!text-[8.5px] !px-1" />
                {a.action} · {a.entityId} · {a.actor}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
