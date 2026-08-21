import { useMemo, useState } from "react";
import { useApp } from "../lib/store";
import { Card, Chip, Input, Select, StatusChip, Bar, SectionHead, Tabs, MonoTag, EmptyState, BtnSm } from "../components/ui";
import { fmtDate, fmtIDRCompact, daysUntil } from "../lib/types";
import { ArrowLeft, MapPin, QrCode, Truck, User, Wrench } from "lucide-react";

export default function Equipment() {
  const { s, nav } = useApp();
  if (s.view === "equipment-detail" && s.eqId) return <EquipmentDetail />;
  return <EquipmentList />;
}

function EquipmentList() {
  const { s, nav } = useApp();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [risk, setRisk] = useState("ALL");

  const rows = useMemo(() => s.equipment.filter((e) =>
    (status === "ALL" || e.opStatus === status) &&
    (risk === "ALL" || e.risk === risk) &&
    (q === "" || `${e.name} ${e.code} ${e.serial} ${e.room} ${e.brand}`.toLowerCase().includes(q.toLowerCase()))
  ), [s.equipment, q, status, risk]);

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Equipment Registry</h1>
          <p className="text-xs text-mute">{s.equipment.length} aset medis terdaftar · klik untuk membuka Equipment 360°</p>
        </div>
        <div className="flex gap-2">
          <Chip tone="ok" dot>{s.equipment.filter((e) => e.opStatus === "IN_SERVICE").length} IN SERVICE</Chip>
          <Chip tone="danger" dot>{s.equipment.filter((e) => e.calStatus === "EXPIRED").length} CAL EXPIRED</Chip>
        </div>
      </div>

      <Card className="p-3.5">
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <div className="col-span-2"><Input placeholder="Cari nama, kode, serial, ruangan…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ALL">Semua status</option>
            {["IN_SERVICE", "MAINTENANCE", "CALIBRATION", "DOWN", "RETIRED", "DISPOSED"].map((x) => <option key={x}>{x}</option>)}
          </Select>
          <Select value={risk} onChange={(e) => setRisk(e.target.value)}>
            <option value="ALL">Semua risiko</option>
            {["HIGH", "MEDIUM", "LOW"].map((x) => <option key={x}>{x}</option>)}
          </Select>
        </div>
      </Card>

      {rows.length === 0 ? <Card><EmptyState title="Tidak ada aset yang cocok" sub="Ubah filter atau kata kunci pencarian." /></Card> : (
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
                <StatusChip status={e.calStatus} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-2.5 font-mono text-[10px] text-mute">
                <div><p className="uppercase tracking-wide">Lokasi</p><p className="mt-0.5 truncate font-sans text-[11px] font-bold text-ink2">{e.room}</p></div>
                <div><p className="uppercase tracking-wide">Nilai</p><p className="num mt-0.5 font-sans text-[11px] font-bold text-ink2">{fmtIDRCompact(e.acqCost)}</p></div>
              </div>
              <div className="mt-2.5">
                <div className="mb-1 flex justify-between font-mono text-[9.5px] text-mute"><span>UTILIZATION</span><span className="font-bold text-ink2">{e.utilization}%</span></div>
                <Bar pct={e.utilization} tone={e.utilization < 30 ? "danger" : e.utilization < 55 ? "warn" : "pine"} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EquipmentDetail() {
  const { s, nav } = useApp();
  const eq = s.equipment.find((e) => e.id === s.eqId);
  const [tab, setTab] = useState("timeline");
  if (!eq) return <EmptyState title="Aset tidak ditemukan" />;

  const tl = s.timeline.filter((t) => t.eqId === eq.id);
  const wos = s.workOrders.filter((w) => w.eqId === eq.id);
  const cals = s.calibrations.filter((c) => c.eqId === eq.id);
  const cmps = s.complaints.filter((c) => c.eqId === eq.id);
  const sup = s.suppliers.find((x) => x.id === eq.supplierId);
  const overdue = daysUntil(eq.nextMaint) < 0;

  return (
    <div className="view-in space-y-4">
      <button onClick={() => nav("equipment")} className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-pine-700 transition hover:text-pine-600">
        <ArrowLeft size={13} /> Kembali ke registry
      </button>

      <Card className="dark-grain p-5 text-pine-50">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip status={eq.opStatus} />
              <Chip tone={eq.risk === "HIGH" ? "danger" : eq.risk === "MEDIUM" ? "warn" : "ok"}>RISK {eq.risk}</Chip>
              <StatusChip status={eq.calStatus} />
            </div>
            <h1 className="mt-2 font-display text-[24px] font-black tracking-tight">{eq.name}</h1>
            <p className="mt-0.5 font-mono text-[11px] text-pine-100/70">{eq.code} · {eq.brand} {eq.model} · SN {eq.serial}</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-[10.5px] text-pine-100/75">
              <span className="flex items-center gap-1.5"><MapPin size={12} className="text-warnhi" />{eq.building} · {eq.floor} · {eq.room}</span>
              <span className="flex items-center gap-1.5"><User size={12} className="text-warnhi" />{eq.custodian}</span>
              <span className="flex items-center gap-1.5"><Truck size={12} className="text-warnhi" />{sup?.name ?? "—"}</span>
            </div>
            {eq.poRef && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-pine-700 bg-pine-950/50 px-3 py-1.5 font-mono text-[10px] text-pine-100/85">
                <QrCode size={12} className="text-warnhi" /> Asal pengadaan: <b className="text-warnhi">{eq.poRef}</b> · peroleh {fmtDate(eq.acqDate)}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { l: "Nilai perolehan", v: fmtIDRCompact(eq.acqCost) },
              { l: "Kondisi", v: eq.condition },
              { l: "Next PM", v: fmtDate(eq.nextMaint), warn: overdue },
              { l: "Utilisasi", v: eq.utilization + "%" },
            ].map((k) => (
              <div key={k.l} className="rounded-md border border-pine-800 bg-pine-950/50 px-3 py-2">
                <p className="font-mono text-[8.5px] uppercase tracking-wider text-pine-100/50">{k.l}</p>
                <p className={`num mt-0.5 font-display text-[14px] font-black ${k.warn ? "text-danger" : "text-warnhi"}`}>{k.v}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <Tabs active={tab} onChange={setTab}
          tabs={[{ id: "timeline", label: "Timeline" }, { id: "wo", label: "Work Order" }, { id: "cal", label: "Kalibrasi" }, { id: "cmp", label: "Keluhan" }]}
          counts={{ timeline: tl.length, wo: wos.length, cal: cals.length, cmp: cmps.length }} />
        <div className="pt-4">
          {tab === "timeline" && (
            <div className="space-y-2.5">
              {tl.length === 0 && <EmptyState title="Belum ada event" sub="Aktivitas teknis akan menggulung ke sini (BR-018)." />}
              {tl.map((t, i) => (
                <div key={t.id} className="row-in flex items-start gap-3 rounded-md border border-line bg-paper px-3 py-2.5" style={{ animationDelay: `${i * 50}ms` }}>
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-pine-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-bold text-ink">{t.title}</p>
                    <p className="text-[11.5px] text-ink2">{t.detail}</p>
                    <p className="mt-0.5 font-mono text-[9.5px] text-mute">{t.actor} · {fmtDate(t.date)}{t.cost ? ` · ${fmtIDRCompact(t.cost)}` : ""}</p>
                  </div>
                  <StatusChip status={t.type} />
                </div>
              ))}
            </div>
          )}
          {tab === "wo" && (
            <div className="space-y-2.5">
              {wos.length === 0 && <EmptyState title="Belum ada work order" />}
              {wos.map((w) => (
                <div key={w.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-paper px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-pine-100 text-pine-700"><Wrench size={14} /></span>
                    <div>
                      <p className="text-[12.5px] font-bold text-ink">{w.wo} <StatusChip status={w.type} className="ml-1" /></p>
                      <p className="font-mono text-[10px] text-mute">{fmtDate(w.scheduled)} · {fmtIDRCompact(w.laborCost)}</p>
                    </div>
                  </div>
                  <StatusChip status={w.status} />
                </div>
              ))}
            </div>
          )}
          {tab === "cal" && (
            <div className="space-y-2.5">
              {cals.length === 0 && <EmptyState title="Belum ada kalibrasi" />}
              {cals.map((c) => (
                <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-paper px-3 py-2.5">
                  <div>
                    <p className="text-[12.5px] font-bold text-ink">{c.cert} <Chip tone={c.result === "PASS" ? "ok" : "danger"} className="ml-1">{c.result}</Chip></p>
                    <p className="font-mono text-[10px] text-mute">{fmtDate(c.date)} · berikutnya {fmtDate(c.nextDue)} · {fmtIDRCompact(c.cost)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === "cmp" && (
            <div className="space-y-2.5">
              {cmps.length === 0 && <EmptyState title="Belum ada keluhan" />}
              {cmps.map((c) => (
                <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-paper px-3 py-2.5">
                  <div>
                    <p className="text-[12.5px] font-bold text-ink">{c.code} <StatusChip status={c.priority} className="ml-1" /></p>
                    <p className="text-[11.5px] text-ink2">{c.description}</p>
                    <p className="mt-0.5 font-mono text-[9.5px] text-mute">{c.reporter} · SLA {c.slaHours} jam</p>
                  </div>
                  <StatusChip status={c.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <p className="font-mono text-[10.5px] text-mute">Unit: <MonoTag>{eq.unit}</MonoTag> · Kategori <MonoTag>{eq.category}</MonoTag> · Asset ID imutabel (BR-002)</p>
    </div>
  );
}
