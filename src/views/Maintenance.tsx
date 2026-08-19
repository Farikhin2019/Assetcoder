import { useMemo, useState } from "react";
import { useApp } from "../lib/store";
import { BtnSm, Card, Chip, Modal, SectionHead, StatusChip, Tabs, Bar, MonoTag, Label } from "../components/ui";
import { CalibrationModal, InspectionModal, WOCompleteModal } from "../components/modals";
import { IcBox, IcForm, IcGauge, IcShield, IcWrench } from "../components/icons";
import { CAL_CADENCE, daysUntil, fmtDate, fmtIDR, fmtIDRCompact, overdueBy } from "../lib/types";

export default function Maintenance() {
  const { s, nav, startWorkOrder } = useApp();
  const [tab, setTab] = useState("wo");
  const [woComplete, setWoComplete] = useState<string | null>(null);
  const [calEq, setCalEq] = useState<string | null>(null);
  const [insEq, setInsEq] = useState<string | null>(null);
  const [tplView, setTplView] = useState<string | null>(null);

  const canTech = ["Teknisi", "Kepala Teknisi", "Pengelola Aset", "Direksi"].includes(s.role);
  const eqName = (id: string) => s.equipment.find((e) => e.id === id);

  const wos = useMemo(() => [...s.workOrders].sort((a, b) => (a.status === "CLOSED" ? 1 : 0) - (b.status === "CLOSED" ? 1 : 0) || +new Date(a.scheduled) - +new Date(b.scheduled)), [s.workOrders]);
  const cals = useMemo(() => [...s.calibrations].sort((a, b) => +new Date(a.nextDue) - +new Date(b.nextDue)), [s.calibrations]);
  const tpl = s.formTemplates.find((t) => t.id === tplView);

  const openWo = s.workOrders.filter((w) => w.status !== "CLOSED").length;
  const overdue = s.workOrders.filter((w) => w.status !== "CLOSED" && daysUntil(w.scheduled) < 0).length;
  const calDue = s.equipment.filter((e) => ["DUE_SOON", "EXPIRED", "FAILED"].includes(e.calStatus)).length;
  const insFail = s.inspections.filter((i) => i.result === "FAIL").length;

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Technical Operations</h1>
          <p className="text-xs text-mute">Schedule → WO → Form Builder → Eksekusi → Verifikasi → Close · semua event → Equipment Timeline (BR-018)</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip tone="info" dot>{openWo} OPEN WO</Chip>
          <Chip tone="warn" dot pulse={overdue > 0}>{overdue} OVERDUE</Chip>
          <Chip tone="danger" dot pulse={calDue > 0}>{calDue} CAL ACTION</Chip>
          {insFail > 0 && <Chip tone="danger" dot>{insFail} INSPEKSI FAIL</Chip>}
        </div>
      </div>

      <Card className="p-4">
        <Tabs active={tab} onChange={setTab}
          tabs={[{ id: "wo", label: "Work Orders" }, { id: "cal", label: "Calibration" }, { id: "ins", label: "Inspeksi" }, { id: "form", label: "Form Builder" }, { id: "sp", label: "Spare Parts" }]}
          counts={{ wo: s.workOrders.length, cal: s.calibrations.length, ins: s.inspections.length, form: s.formTemplates.length, sp: s.spareParts.length }} />

        <div className="pt-4">
          {tab === "wo" && (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {wos.map((w, i) => {
                const eq = eqName(w.eqId)!;
                const od = w.status !== "CLOSED" && daysUntil(w.scheduled) < 0;
                const fr = s.formResults.find((f) => f.woId === w.id);
                return (
                  <div key={w.id} className={`row-in rounded-lg border p-3.5 transition hover:shadow-md ${od ? "border-warn/50 bg-warnbg/30" : "border-line bg-paper"}`} style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`flex h-9 w-9 items-center justify-center rounded-md ${w.status === "CLOSED" ? "bg-moss text-mute" : "bg-pine-100 text-pine-700"}`}><IcWrench size={16} /></span>
                        <div>
                          <p className="font-mono text-[12.5px] font-bold text-ink">{w.wo} <StatusChip status={w.type} className="ml-1" /></p>
                          <button onClick={() => nav("equipment-detail", w.eqId)} className="text-left text-[13px] font-bold text-pine-700 hover:underline">{eq.name}</button>
                        </div>
                      </div>
                      <StatusChip status={w.status} />
                    </div>
                    <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-ink2">{w.note}</p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10.5px] text-mute">
                      <span>{s.technicians.find((t) => t.id === w.techId)?.name}</span>
                      <span className={od ? "font-bold text-danger" : ""}>{fmtDate(w.scheduled)}{od && ` · overdue ${overdueBy(w.scheduled)}d`}</span>
                      <span>{fmtIDRCompact(w.laborCost)}</span>
                      <MonoTag>{eq.code}</MonoTag>
                    </div>
                    {fr && <p className="mt-2 flex items-center gap-1.5 font-mono text-[10px] font-bold text-info"><IcForm size={11} /> form hasil tersimpan ({Object.keys(fr.values).length} field) · {fr.actor}</p>}
                    {w.status !== "CLOSED" && (
                      <div className="mt-3 flex gap-2 border-t border-line pt-2.5">
                        {w.status === "SCHEDULED" && <BtnSm disabled={!canTech} title={!canTech ? "Butuh role Teknisi / Kepala Teknisi" : undefined} onClick={() => startWorkOrder(w.id)}>Start execution</BtnSm>}
                        {w.status === "IN_PROGRESS" && <BtnSm disabled={!canTech} title={!canTech ? "Butuh role Teknisi / Kepala Teknisi" : undefined} onClick={() => setWoComplete(w.id)} className="!border-pine-500/60 !text-pine-700">Isi form & tutup</BtnSm>}
                        <BtnSm onClick={() => nav("equipment-detail", w.eqId)}>Equipment 360°</BtnSm>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {tab === "cal" && (
            <div className="space-y-3">
              <p className="rounded-md border border-line bg-canvas/60 px-3 py-2 font-mono text-[10.5px] text-ink2">
                Reminder cadence (configurable): <b>{CAL_CADENCE.join(" / ")} hari</b> sebelum jatuh tempo → Expired. Berjalan sebagai schedulable job, bukan sekadar field.
              </p>
              <div className="overflow-x-auto rounded-md border border-line">
                <table className="w-full min-w-[860px] text-left">
                  <thead>
                    <tr className="border-b border-line bg-canvas/70 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">
                      <th className="px-3 py-2.5">Equipment</th><th className="px-3 py-2.5">Certificate</th><th className="px-3 py-2.5">Last</th>
                      <th className="px-3 py-2.5">Next due</th><th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5">By</th>
                      <th className="px-3 py-2.5 text-right">Cost</th><th className="px-3 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {cals.map((c) => {
                      const eq = eqName(c.eqId)!;
                      const dd = daysUntil(c.nextDue);
                      return (
                        <tr key={c.id} className="transition hover:bg-pine-50/60">
                          <td className="px-3 py-2.5">
                            <button onClick={() => nav("equipment-detail", c.eqId)} className="text-left">
                              <p className="text-[12.5px] font-bold text-ink hover:text-pine-700">{eq.name}</p>
                              <p className="font-mono text-[10px] text-mute">{eq.code} · {eq.room}</p>
                            </button>
                          </td>
                          <td className="px-3 py-2.5 font-mono text-[11px] text-ink2">{c.cert}</td>
                          <td className="px-3 py-2.5 font-mono text-[11px] text-ink2">{fmtDate(c.date)}</td>
                          <td className={`px-3 py-2.5 font-mono text-[11px] ${dd < 0 ? "font-bold text-danger" : dd <= 30 ? "font-bold text-warn" : "text-ink2"}`}>{fmtDate(c.nextDue)}</td>
                          <td className="px-3 py-2.5"><StatusChip status={eq.calStatus} pulse={eq.calStatus === "EXPIRED"} /></td>
                          <td className="px-3 py-2.5 text-[11.5px] text-ink2">{c.techId}</td>
                          <td className="num px-3 py-2.5 text-right font-mono text-[11px] text-ink2">{fmtIDR(c.cost)}</td>
                          <td className="px-3 py-2.5">
                            {["DUE_SOON", "EXPIRED", "FAILED"].includes(eq.calStatus) && (
                              <BtnSm disabled={!canTech} title={!canTech ? "Butuh role Teknisi" : undefined} onClick={() => setCalEq(eq.id)} className="!border-info/50 !text-info">Record</BtnSm>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "ins" && (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {s.inspections.map((ins, i) => {
                const eq = eqName(ins.eqId)!;
                return (
                  <div key={ins.id} className="row-in rounded-lg border border-line bg-paper p-3.5 transition hover:shadow-md" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`flex h-9 w-9 items-center justify-center rounded-md ${ins.result === "FAIL" ? "bg-dangerbg text-danger" : ins.result === "CONDITIONAL" ? "bg-warnbg text-warn" : "bg-okbg text-ok"}`}><IcShield size={16} /></span>
                        <div>
                          <p className="font-mono text-[12.5px] font-bold text-ink">{ins.code}</p>
                          <button onClick={() => nav("equipment-detail", ins.eqId)} className="text-left text-[13px] font-bold text-pine-700 hover:underline">{eq.name}</button>
                        </div>
                      </div>
                      <StatusChip status={ins.result} />
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {ins.checklist.map((c, j) => (
                        <span key={j} className={`rounded border px-1.5 py-0.5 font-mono text-[9.5px] font-bold ${c.pass ? "border-ok/30 bg-okbg text-ok" : "border-danger/30 bg-dangerbg text-danger"}`}>{c.pass ? "✓" : "✗"} {c.item}</span>
                      ))}
                    </div>
                    <p className="mt-2 text-[11.5px] text-ink2">{ins.note}</p>
                    <div className="mt-2 flex items-center justify-between border-t border-line pt-2 font-mono text-[10px] text-mute">
                      <span>{ins.inspector} · {fmtDate(ins.date)}</span>
                      <span className={daysUntil(ins.nextDue) < 0 ? "font-bold text-danger" : ""}>berikutnya {fmtDate(ins.nextDue)}</span>
                    </div>
                  </div>
                );
              })}
              <button onClick={() => setInsEq(s.equipment[0]?.id ?? null)} className="flex min-h-[120px] items-center justify-center rounded-lg border-2 border-dashed border-line2 text-mute transition hover:border-pine-500 hover:text-pine-700">
                <span className="flex items-center gap-2 font-display text-[13px] font-bold"><IcShield size={16} /> Catat inspeksi baru</span>
              </button>
            </div>
          )}

          {tab === "form" && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {s.formTemplates.map((t, i) => (
                <div key={t.id} className="row-in rounded-lg border border-line bg-paper p-4 transition hover:shadow-md" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-pine-100 text-pine-700"><IcForm size={16} /></span>
                      <div>
                        <p className="text-[13.5px] font-bold text-ink">{t.name}</p>
                        <p className="font-mono text-[10px] text-mute">{t.id} · {t.fields.length} field</p>
                      </div>
                    </div>
                    <BtnSm onClick={() => setTplView(t.id)}>Preview</BtnSm>
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {Array.from(new Set(t.fields.map((f) => f.type))).map((ty) => (
                      <span key={ty} className="rounded bg-moss px-1.5 py-0.5 font-mono text-[9px] font-bold text-ink2">{ty}</span>
                    ))}
                  </div>
                </div>
              ))}
              <p className="font-mono text-[10.5px] text-mute md:col-span-2">Field types: text · number · checkbox · radio · select · date · measurement · photo · signature · attachment · instruction · pass/fail. Hasil eksekusi tersimpan sebagai FormResult teraudit.</p>
            </div>
          )}

          {tab === "sp" && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {s.spareParts.map((p, i) => (
                <div key={p.id} className={`row-in rounded-lg border p-3.5 ${p.stock === 0 ? "border-danger/40 bg-dangerbg/25" : p.stock <= p.min ? "border-warn/40 bg-warnbg/25" : "border-line bg-paper"}`} style={{ animationDelay: `${i * 45}ms` }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-moss text-ink2"><IcBox size={15} /></span>
                      <div>
                        <p className="text-[13px] font-bold text-ink">{p.name}</p>
                        <p className="font-mono text-[10px] text-mute">{p.code}</p>
                      </div>
                    </div>
                    {p.stock === 0 ? <Chip tone="danger" dot pulse>OUT</Chip> : p.stock <= p.min ? <Chip tone="warn" dot>LOW</Chip> : <Chip tone="ok" dot>OK</Chip>}
                  </div>
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between font-mono text-[10.5px] text-mute"><span>stock {p.stock} {p.unit} · min {p.min}</span><span>{fmtIDR(p.unitCost)}/{p.unit}</span></div>
                    <Bar pct={(p.stock / Math.max(p.min * 3, 1)) * 100} tone={p.stock === 0 ? "danger" : p.stock <= p.min ? "warn" : "pine"} />
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {p.eqIds.map((id) => (
                      <button key={id} onClick={() => nav("equipment-detail", id)} className="rounded border border-line bg-card px-1.5 py-0.5 font-mono text-[9.5px] font-semibold text-pine-700 transition hover:border-pine-500">{eqName(id)?.name}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* template preview */}
      <Modal open={!!tpl} onClose={() => setTplView(null)} wide kicker="Form builder preview" title={tpl?.name ?? ""}>
        {tpl && (
          <div className="space-y-2.5">
            {tpl.fields.map((f) => (
              <div key={f.id} className="rounded-md border border-line bg-paper px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <Label>{f.label}{f.required && " *"}</Label>
                  <span className="rounded bg-moss px-1.5 py-0.5 font-mono text-[9px] font-bold text-ink2">{f.type}{f.unit ? ` · ${f.unit}` : ""}</span>
                </div>
                {f.type === "instruction" ? <p className="text-[11.5px] italic text-mute">{f.label}</p>
                  : f.type === "passfail" ? <div className="flex gap-2"><span className="rounded bg-okbg px-2 py-1 font-mono text-[10px] font-bold text-ok">PASS</span><span className="rounded bg-dangerbg px-2 py-1 font-mono text-[10px] font-bold text-danger">FAIL</span></div>
                  : f.type === "radio" || f.type === "select" ? <p className="font-mono text-[10.5px] text-mute">opsi: {(f.options ?? []).join(" · ")}</p>
                  : <div className="h-8 rounded border border-dashed border-line2 bg-canvas/60" />}
              </div>
            ))}
          </div>
        )}
      </Modal>

      <WOCompleteModal woId={woComplete} onClose={() => setWoComplete(null)} />
      <CalibrationModal eqId={calEq} onClose={() => setCalEq(null)} />
      <InspectionModal eqId={insEq} onClose={() => setInsEq(null)} />
    </div>
  );
}
