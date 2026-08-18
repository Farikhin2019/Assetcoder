import { useMemo, useState } from "react";
import { useApp } from "../lib/store";
import { Bar, BtnGhost, BtnPrimary, BtnSm, Card, Chip, EmptyState, Input, Label, Modal, MonoTag, QRGlyph, Select, StatusChip, Tabs, TextArea, chipFor, Tone } from "../components/ui";
import { CalibrationModal, InspectionModal, WOCompleteModal } from "../components/modals";
import { IcBack, IcBolt, IcCal, IcCheck, IcClock, IcDoc, IcFlag, IcGauge, IcPin, IcPlus, IcScan, IcShield, IcSwap, IcUser, IcWrench } from "../components/icons";
import { BUILDINGS, DEST_UNITS } from "../lib/data";
import { EventType, LIFECYCLE_STAGES, Priority, SLA_BY_PRIORITY, daysUntil, fmtDate, fmtDateTime, fmtIDR, fmtIDRCompact } from "../lib/types";

const EVENT_META: Record<EventType, { tone: Tone; label: string }> = {
  LIFECYCLE: { tone: "neutral", label: "Lifecycle" }, MAINTENANCE: { tone: "pine", label: "Maintenance" },
  CALIBRATION: { tone: "info", label: "Calibration" }, COMPLAINT: { tone: "danger", label: "Complaint" },
  REPAIR: { tone: "danger", label: "Repair" }, INSPECTION: { tone: "warn", label: "Inspection" },
  SPARE_PART: { tone: "warn", label: "Spare part" }, TRANSFER: { tone: "warn", label: "Transfer" },
  COST: { tone: "neutral", label: "Cost" }, DOCUMENT: { tone: "info", label: "Document" },
  PROCUREMENT: { tone: "pine", label: "Procurement" }, ASSIGNMENT: { tone: "info", label: "Assignment" },
};

export default function EquipmentDetail() {
  const { s, nav, logComplaint, requestTransfer, createWorkOrder, startWorkOrder, assignEquipment, printQr } = useApp();
  const eq = s.equipment.find((e) => e.id === s.eqId);
  const [tab, setTab] = useState("timeline");
  const [tlFilter, setTlFilter] = useState<"ALL" | EventType>("ALL");
  const [modal, setModal] = useState<"" | "complaint" | "transfer" | "wo" | "cal" | "inspect" | "assign" | "doc">("");
  const [docIdx, setDocIdx] = useState(0);
  const [woComplete, setWoComplete] = useState<string | null>(null);
  const [calEq, setCalEq] = useState<string | null>(null);
  const [insEq, setInsEq] = useState<string | null>(null);

  const [cPri, setCPri] = useState<Priority>("HIGH");
  const [cDesc, setCDesc] = useState(""); const [cRep, setCRep] = useState(""); const [cErr, setCErr] = useState("");
  const [tB, setTB] = useState("Gedung D"); const [tF, setTF] = useState("Lantai 2"); const [tR, setTR] = useState(""); const [tWhy, setTWhy] = useState(""); const [tErr, setTErr] = useState("");
  const [wType, setWType] = useState<"PREVENTIVE" | "CORRECTIVE" | "PREDICTIVE">("PREVENTIVE");
  const [wTpl, setWTpl] = useState("FT-PM-VNT"); const [wNote, setWNote] = useState(""); const [wErr, setWErr] = useState("");
  const [aCust, setACust] = useState(""); const [aPic, setAPic] = useState(""); const [aUnit, setAUnit] = useState(DEST_UNITS[1]); const [aErr, setAErr] = useState("");

  const timeline = useMemo(() => s.timeline.filter((t) => t.eqId === eq?.id && (tlFilter === "ALL" || t.type === tlFilter)), [s.timeline, eq, tlFilter]);
  const wos = s.workOrders.filter((w) => w.eqId === eq?.id);
  const cals = s.calibrations.filter((c) => c.eqId === eq?.id);
  const cmps = s.complaints.filter((c) => c.eqId === eq?.id);
  const rprs = s.repairs.filter((r) => r.eqId === eq?.id);
  const inss = s.inspections.filter((i) => i.eqId === eq?.id);
  const parts = s.spareParts.filter((p) => p.eqIds.includes(eq?.id ?? ""));
  const costs = useMemo(() => s.timeline.filter((t) => t.eqId === eq?.id && t.cost !== undefined), [s.timeline, eq]);
  const frOf = (woId: string) => s.formResults.find((f) => f.woId === woId);

  if (!eq) return <EmptyState title="Equipment not found" sub="Kembali ke registry untuk memilih aset." />;

  const supplier = s.suppliers.find((x) => x.id === eq.supplierId);
  const ageMonths = Math.max(0, Math.round((Date.now() - new Date(eq.acqDate).getTime()) / (864e5 * 30.44)));
  const monthly = (eq.acqCost * 0.9) / 96;
  const accum = Math.min(eq.acqCost * 0.9, monthly * ageMonths);
  const book = eq.acqCost - accum;
  const tco = costs.reduce((a, t) => a + (t.cost ?? 0), 0);
  const canTech = ["Teknisi", "Kepala Teknisi", "Pengelola Aset", "Direksi"].includes(s.role);

  const submitComplaint = () => {
    if (cDesc.trim().length < 10) return setCErr("Deskripsi keluhan minimal 10 karakter.");
    if (!cRep.trim()) return setCErr("Nama pelapor wajib diisi.");
    logComplaint(eq.id, cPri, cDesc.trim(), cRep.trim());
    setModal(""); setCDesc(""); setCRep(""); setCErr("");
  };
  const submitTransfer = () => {
    if (!tR.trim()) return setTErr("Ruangan tujuan wajib diisi.");
    if (tR.trim() === eq.room) return setTErr("Sumber ≠ tujuan (data integrity rule).");
    if (tWhy.trim().length < 5) return setTErr("Alasan transfer wajib (jejak audit).");
    requestTransfer(eq.id, tB, tF, tR.trim(), tWhy.trim());
    setModal(""); setTR(""); setTWhy(""); setTErr("");
  };
  const submitWo = () => {
    if (wNote.trim().length < 5) return setWErr("Lingkup pekerjaan wajib diisi.");
    createWorkOrder(eq.id, wType, wNote.trim(), wTpl);
    setModal(""); setWNote(""); setWErr("");
  };
  const submitAssign = () => {
    if (!aCust.trim()) return setAErr("Custodian wajib diisi (satu custodian aktif).");
    assignEquipment(eq.id, aCust.trim(), aPic.trim() || eq.pic, aUnit);
    setModal(""); setAErr("");
  };

  return (
    <div className="view-in space-y-4">
      <button onClick={() => nav("equipment")} className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-pine-700 hover:underline"><IcBack size={13} /> Equipment Registry</button>

      {/* header */}
      <Card className="overflow-hidden">
        <div className="dark-grain flex flex-col gap-4 p-5 text-pine-50 lg:flex-row lg:items-center">
          <div className="flex shrink-0 flex-col items-center gap-1.5">
            <div className="rounded-lg bg-paper p-2 shadow-lg"><QRGlyph seed={eq.code + eq.serial} size={92} /></div>
            <button onClick={() => printQr(eq.id)} className="flex items-center gap-1 font-mono text-[9.5px] font-bold text-pine-100/80 hover:text-warnhi"><IcScan size={11} /> CETAK LABEL</button>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-[20px] font-black tracking-tight">{eq.name}</h1>
              <StatusChip status={eq.opStatus} />
              <StatusChip status={eq.calStatus} pulse={eq.calStatus === "EXPIRED"} />
              <Chip tone={eq.risk === "HIGH" ? "danger" : eq.risk === "MEDIUM" ? "warn" : "ok"}>RISK {eq.risk}</Chip>
            </div>
            <p className="mt-1 font-mono text-[11px] text-pine-100/70">{eq.code} · {eq.brand} {eq.model} · SN {eq.serial} · {eq.prodYear}</p>
            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
              <Fact icon={<IcPin size={11} />} label="Lokasi" v={`${eq.room}`} sub={`${eq.building} · ${eq.floor}`} />
              <Fact icon={<IcUser size={11} />} label="Custodian" v={eq.custodian} sub={`PIC: ${eq.pic}`} />
              <Fact icon={<IcCal size={11} />} label="Kalibrasi" v={eq.calDue ? fmtDate(eq.calDue) : "—"} sub={eq.calDue ? `${daysUntil(eq.calDue)} hari lagi` : "tidak wajib"} warn={!!eq.calDue && daysUntil(eq.calDue) < 30} />
              <Fact icon={<IcWrench size={11} />} label="Next PM" v={fmtDate(eq.nextMaint)} sub={`${eq.maintStrategy} · terakhir ${fmtDate(eq.lastMaint)}`} warn={daysUntil(eq.nextMaint) < 0} />
            </div>
          </div>
          <div className="shrink-0 rounded-lg border border-pine-700 bg-pine-950/50 p-3.5">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-pine-500">Book value</p>
            <p className="num mt-1 font-display text-[19px] font-black">{fmtIDRCompact(book)}</p>
            <div className="mt-1.5 h-1 w-32 overflow-hidden rounded-full bg-pine-800"><div className="bar-fill h-full rounded-full bg-warnhi" style={{ width: `${(book / eq.acqCost) * 100}%` }} /></div>
            <p className="mt-1.5 font-mono text-[9.5px] text-pine-100/60">perolehan {fmtIDRCompact(eq.acqCost)} · TCO {fmtIDRCompact(tco)}</p>
          </div>
        </div>
        {/* lifecycle stepper */}
        <div className="border-t border-line bg-canvas/50 px-5 py-3">
          <div className="flex flex-wrap items-center gap-y-1.5">
            {LIFECYCLE_STAGES.map((st, i) => (
              <span key={st} className="flex items-center">
                <span className={`rounded px-1.5 py-0.5 font-mono text-[8.5px] font-bold tracking-wide ${i === eq.lifecycle ? "bg-pine-700 text-pine-50 shadow" : i < eq.lifecycle ? "bg-pine-100 text-pine-700" : "border border-line bg-card text-mute"}`}>{st}</span>
                {i < LIFECYCLE_STAGES.length - 1 && <span className={`mx-0.5 font-mono text-[9px] ${i < eq.lifecycle ? "text-pine-500" : "text-line2"}`}>→</span>}
              </span>
            ))}
          </div>
        </div>
      </Card>

      {/* actions */}
      <div className="flex flex-wrap gap-2">
        <ActionBtn onClick={() => setModal("complaint")} icon={<IcFlag size={13} />} label="Log Complaint" tone="danger" />
        <ActionBtn onClick={() => setCalEq(eq.id)} icon={<IcGauge size={13} />} label="Record Calibration" disabled={!canTech} gate="Teknisi / Kepala Teknisi" />
        <ActionBtn onClick={() => setInsEq(eq.id)} icon={<IcShield size={13} />} label="Inspeksi" disabled={!canTech} gate="Teknisi / Kepala Teknisi" />
        <ActionBtn onClick={() => setModal("wo")} icon={<IcWrench size={13} />} label="New Work Order" disabled={!canTech && s.role !== "Kepala Unit"} gate="Teknisi / Kepala Unit" />
        <ActionBtn onClick={() => setModal("transfer")} icon={<IcSwap size={13} />} label="Request Transfer" disabled={s.role === "Auditor"} gate="selain Auditor" />
        <ActionBtn onClick={() => { setACust(eq.custodian); setAPic(eq.pic); setAUnit(eq.unit); setAErr(""); setModal("assign"); }} icon={<IcUser size={13} />} label="Assign" disabled={s.role === "Auditor"} gate="selain Auditor" />
        <span className="ml-auto hidden items-center gap-1.5 font-mono text-[10.5px] text-mute md:flex"><IcClock size={12} /> Semua aksi → audit trail & timeline (BR-010/018)</span>
      </div>

      {/* tabs */}
      <Card className="p-4">
        <Tabs active={tab} onChange={setTab} counts={{ timeline: timeline.length, wo: wos.length, cal: cals.length, cmp: cmps.length + rprs.length, sp: parts.length, cost: costs.length, doc: eq.docs.length }}
          tabs={[{ id: "timeline", label: "Timeline 360°" }, { id: "wo", label: "Work Orders" }, { id: "cal", label: "Calibration" }, { id: "cmp", label: "Complaints & Repairs" }, { id: "sp", label: "Spare Parts" }, { id: "cost", label: "Costs" }, { id: "doc", label: "Documents" }]} />

        <div className="pt-4">
          {tab === "timeline" && (
            <div>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {(["ALL", "MAINTENANCE", "CALIBRATION", "COMPLAINT", "REPAIR", "INSPECTION", "TRANSFER", "SPARE_PART", "LIFECYCLE", "ASSIGNMENT"] as const).map((f) => (
                  <button key={f} onClick={() => setTlFilter(f as "ALL" | EventType)}
                    className={`rounded-md border px-2 py-1 font-mono text-[10px] font-bold transition ${tlFilter === f ? "border-pine-600 bg-pine-700 text-pine-50" : "border-line bg-card text-mute hover:text-ink"}`}>{f === "ALL" ? "SEMUA" : EVENT_META[f as EventType]?.label ?? f}</button>
                ))}
              </div>
              <div className="relative ml-2 space-y-0 border-l-2 border-line pl-5">
                {timeline.length === 0 && <p className="py-6 text-xs text-mute">Belum ada event untuk filter ini.</p>}
                {timeline.map((t, i) => (
                  <div key={t.id} className="row-in relative pb-4" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                    <span className={`absolute -left-[27px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-card ${t.type === "COMPLAINT" || t.type === "REPAIR" ? "bg-danger" : t.type === "CALIBRATION" ? "bg-info" : t.type === "INSPECTION" || t.type === "TRANSFER" ? "bg-warnhi" : "bg-pine-500"}`} />
                    <div className="flex flex-wrap items-center gap-2">
                      <Chip tone={EVENT_META[t.type].tone} className="!text-[9px]">{t.type}</Chip>
                      <p className="text-[13px] font-bold text-ink">{t.title}</p>
                      {t.status && <StatusChip status={t.status} />}
                      <span className="ml-auto font-mono text-[10px] text-mute">{fmtDateTime(t.date)}</span>
                    </div>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-ink2">{t.detail}</p>
                    <p className="mt-0.5 flex items-center gap-2 font-mono text-[10px] text-mute">oleh {t.actor}{t.cost !== undefined && <span className="font-bold text-pine-700">· {fmtIDR(t.cost)}</span>}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "wo" && (
            <TableWrap head={["WO", "Tipe", "Teknisi", "Jadwal", "Status", "Form", "Aksi"]}>
              {wos.length === 0 && <NoRows msg="Belum ada work order." />}
              {wos.map((w) => {
                const fr = frOf(w.id);
                return (
                  <tr key={w.id} className="transition hover:bg-pine-50/50">
                    <Td mono bold>{w.wo}</Td>
                    <Td><StatusChip status={w.type} /></Td>
                    <Td>{s.technicians.find((t) => t.id === w.techId)?.name ?? w.techId}</Td>
                    <Td mono className={daysUntil(w.scheduled) < 0 && w.status !== "CLOSED" ? "!text-danger font-bold" : ""}>{fmtDate(w.scheduled)}</Td>
                    <Td><StatusChip status={w.status} /></Td>
                    <Td>{fr ? <button onClick={() => setModal("doc")} className="font-mono text-[10.5px] font-bold text-info hover:underline"><IcCheck size={10} className="inline" /> hasil tersimpan</button> : <span className="font-mono text-[10.5px] text-mute">—</span>}</Td>
                    <Td>
                      {w.status === "SCHEDULED" && canTech && <BtnSm onClick={() => startWorkOrder(w.id)}>Start</BtnSm>}
                      {w.status === "IN_PROGRESS" && canTech && <BtnSm onClick={() => setWoComplete(w.id)} className="!border-pine-500/60 !text-pine-700">Isi form & tutup</BtnSm>}
                    </Td>
                  </tr>
                );
              })}
            </TableWrap>
          )}

          {tab === "cal" && (
            <TableWrap head={["Tanggal", "Hasil", "Sertifikat", "Oleh", "Next due", "Biaya"]}>
              {cals.length === 0 && <NoRows msg="Belum ada riwayat kalibrasi." />}
              {cals.map((c) => (
                <tr key={c.id} className="transition hover:bg-pine-50/50">
                  <Td mono>{fmtDate(c.date)}</Td>
                  <Td><StatusChip status={c.result} /></Td>
                  <Td mono bold>{c.cert}</Td>
                  <Td>{c.techId}</Td>
                  <Td mono className={daysUntil(c.nextDue) < 30 ? "!text-danger font-bold" : ""}>{fmtDate(c.nextDue)}</Td>
                  <Td mono>{fmtIDR(c.cost)}</Td>
                </tr>
              ))}
            </TableWrap>
          )}

          {tab === "cmp" && (
            <div className="space-y-3">
              {cmps.length === 0 && rprs.length === 0 && <p className="py-6 text-center text-xs text-mute">Tidak ada keluhan maupun repair.</p>}
              {cmps.map((c) => (
                <div key={c.id} className="rounded-lg border border-line bg-paper p-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip tone="danger" dot>{c.code}</Chip>
                    <StatusChip status={c.priority} />
                    <StatusChip status={c.status} />
                    <span className="font-mono text-[10.5px] text-mute">SLA {c.slaHours} jam · {fmtDateTime(c.date)} · {c.reporter}</span>
                  </div>
                  <p className="mt-1.5 text-[12.5px] text-ink2">{c.description}</p>
                  {c.resolution && <p className="mt-1 rounded-md bg-okbg px-2.5 py-1.5 text-[11.5px] font-semibold text-ok">Resolusi: {c.resolution}</p>}
                </div>
              ))}
              {rprs.map((r) => (
                <div key={r.id} className="rounded-lg border border-line bg-paper p-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip tone="warn" dot>{r.code}</Chip>
                    <StatusChip status={r.status} />
                    <MonoTag>{r.complaintId ? `asal: ${s.complaints.find((c) => c.id === r.complaintId)?.code ?? r.complaintId}` : "tanpa complaint (BR-015 traced)"}</MonoTag>
                    <span className="font-mono text-[10.5px] text-mute">mulai {fmtDate(r.started)}</span>
                  </div>
                  <p className="mt-1.5 text-[12.5px] text-ink2">{r.diagnosis}</p>
                </div>
              ))}
            </div>
          )}

          {tab === "sp" && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {parts.length === 0 && <p className="col-span-2 py-6 text-center text-xs text-mute">Tidak ada spare part terikat.</p>}
              {parts.map((p) => (
                <div key={p.id} className="rounded-lg border border-line bg-paper p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div><p className="text-[13px] font-bold text-ink">{p.name}</p><p className="font-mono text-[10px] text-mute">{p.code}</p></div>
                    {p.stock === 0 ? <Chip tone="danger" dot pulse>OUT</Chip> : p.stock <= p.min ? <Chip tone="warn" dot>LOW</Chip> : <Chip tone="ok" dot>OK</Chip>}
                  </div>
                  <div className="mt-2"><Bar pct={(p.stock / Math.max(p.min * 3, 1)) * 100} tone={p.stock === 0 ? "danger" : p.stock <= p.min ? "warn" : "pine"} /></div>
                  <p className="mt-1.5 font-mono text-[10.5px] text-mute">stok {p.stock} {p.unit} · {fmtIDR(p.unitCost)}/{p.unit} · konsumsi via ledger (BR-016)</p>
                </div>
              ))}
            </div>
          )}

          {tab === "cost" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <CostCard label="Nilai perolehan" v={fmtIDRCompact(eq.acqCost)} />
                <CostCard label="Akumulasi penyusutan" v={fmtIDRCompact(accum)} />
                <CostCard label="Nilai buku" v={fmtIDRCompact(book)} />
                <CostCard label="TCO operasional" v={fmtIDRCompact(tco)} />
              </div>
              <TableWrap head={["Tanggal", "Event", "Aktor", "Biaya"]}>
                {costs.length === 0 && <NoRows msg="Belum ada biaya tercatat." />}
                {costs.map((c) => (
                  <tr key={c.id} className="transition hover:bg-pine-50/50">
                    <Td mono>{fmtDate(c.date)}</Td>
                    <Td bold>{c.title}</Td>
                    <Td>{c.actor}</Td>
                    <Td mono bold>{fmtIDR(c.cost ?? 0)}</Td>
                  </tr>
                ))}
              </TableWrap>
            </div>
          )}

          {tab === "doc" && (
            <div>
              {eq.docs.length === 0 ? <p className="py-6 text-center text-xs text-mute">Belum ada dokumen terlampir.</p> : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {eq.docs.map((dc, i) => (
                    <button key={i} onClick={() => { setDocIdx(i); setModal("doc"); }} className="flex items-center gap-3 rounded-lg border border-line bg-paper p-3.5 text-left transition hover:border-pine-500/50 hover:shadow-md">
                      <span className="flex h-10 w-10 items-center justify-center rounded-md bg-infobg text-info"><IcDoc size={17} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-bold text-ink">{dc.name}</span>
                        <span className="font-mono text-[10px] text-mute">{dc.size} · {fmtDate(dc.date)}</span>
                      </span>
                      <IcDoc size={14} className="text-mute" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* modals */}
      <Modal open={modal === "complaint"} onClose={() => setModal("")} kicker="Complaint management · BR-014" title={`Keluhan baru — ${eq.name}`}
        footer={<><BtnGhost onClick={() => setModal("")}>Batal</BtnGhost><BtnPrimary onClick={submitComplaint}><IcFlag size={13} /> Catat complaint</BtnPrimary></>}>
        <div className="space-y-3.5">
          <div><Label>Prioritas (menentukan SLA)</Label>
            <div className="grid grid-cols-4 gap-2">
              {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as Priority[]).map((p) => (
                <button key={p} onClick={() => setCPri(p)} className={`rounded-md border px-1 py-2 font-mono text-[10px] font-bold transition ${cPri === p ? "border-pine-600 bg-pine-50 text-pine-700" : "border-line bg-card text-mute hover:border-line2"}`}>{p}<span className="block text-[8.5px] font-medium opacity-70">{SLA_BY_PRIORITY[p]} jam</span></button>
              ))}
            </div>
          </div>
          <div><Label>Pelapor *</Label><Input value={cRep} onChange={(e) => setCRep(e.target.value)} placeholder="Nama & unit pelapor" /></div>
          <div><Label>Deskripsi *</Label><TextArea value={cDesc} onChange={(e) => setCDesc(e.target.value)} placeholder="Gejala, kondisi pasien/operasional, langkah awal…" /></div>
          {cErr && <p className="rounded-md bg-dangerbg px-3 py-2 text-xs font-semibold text-danger">{cErr}</p>}
        </div>
      </Modal>

      <Modal open={modal === "transfer"} onClose={() => setModal("")} kicker="Asset transfer · butuh persetujuan (BR-006)" title={`Pindahkan ${eq.name}`}
        footer={<><BtnGhost onClick={() => setModal("")}>Batal</BtnGhost><BtnPrimary onClick={submitTransfer}><IcSwap size={13} /> Ajukan transfer</BtnPrimary></>}>
        <div className="space-y-3.5">
          <p className="rounded-md border border-line bg-canvas/60 px-3 py-2 font-mono text-[11px] text-ink2">Asal: {eq.building} · {eq.floor} · {eq.room}</p>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Gedung tujuan</Label><Select value={tB} onChange={(e) => setTB(e.target.value)}>{BUILDINGS.filter((b) => b.status === "ACTIVE").map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}</Select></div>
            <div><Label>Lantai</Label><Select value={tF} onChange={(e) => setTF(e.target.value)}>{["Lantai 1", "Lantai 2", "Lantai 3"].map((x) => <option key={x}>{x}</option>)}</Select></div>
          </div>
          <div><Label>Ruangan tujuan *</Label><Input value={tR} onChange={(e) => setTR(e.target.value)} placeholder="cth: ICCU · Bed 02" /></div>
          <div><Label>Alasan *</Label><TextArea value={tWhy} onChange={(e) => setTWhy(e.target.value)} placeholder="Justifikasi operasional…" /></div>
          {tErr && <p className="rounded-md bg-dangerbg px-3 py-2 text-xs font-semibold text-danger">{tErr}</p>}
        </div>
      </Modal>

      <Modal open={modal === "wo"} onClose={() => setModal("")} kicker="Maintenance planning" title={`Work order baru — ${eq.name}`}
        footer={<><BtnGhost onClick={() => setModal("")}>Batal</BtnGhost><BtnPrimary onClick={submitWo}><IcWrench size={13} /> Jadwalkan WO</BtnPrimary></>}>
        <div className="space-y-3.5">
          <div><Label>Tipe</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["PREVENTIVE", "CORRECTIVE", "PREDICTIVE"] as const).map((t) => (
                <button key={t} onClick={() => setWType(t)} className={`rounded-md border px-2 py-2 font-mono text-[10.5px] font-bold transition ${wType === t ? "border-pine-600 bg-pine-50 text-pine-700" : "border-line bg-card text-mute hover:border-line2"}`}>{t}</button>
              ))}
            </div>
          </div>
          <div><Label>Form template (form builder)</Label>
            <Select value={wTpl} onChange={(e) => setWTpl(e.target.value)}>{s.formTemplates.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.fields.length} field</option>)}</Select>
          </div>
          <div><Label>Lingkup pekerjaan *</Label><TextArea value={wNote} onChange={(e) => setWNote(e.target.value)} placeholder="cth: PM semi-annual + electrical safety test" /></div>
          {wErr && <p className="rounded-md bg-dangerbg px-3 py-2 text-xs font-semibold text-danger">{wErr}</p>}
        </div>
      </Modal>

      <Modal open={modal === "assign"} onClose={() => setModal("")} kicker="Asset assignment" title={`Tugaskan ${eq.name}`}
        footer={<><BtnGhost onClick={() => setModal("")}>Batal</BtnGhost><BtnPrimary onClick={submitAssign}><IcUser size={13} /> Simpan penugasan</BtnPrimary></>}>
        <div className="space-y-3.5">
          <div><Label>Custodian baru *</Label><Input value={aCust} onChange={(e) => setACust(e.target.value)} placeholder="cth: Ns. Dewi Lestari" /></div>
          <div><Label>PIC teknis</Label><Input value={aPic} onChange={(e) => setAPic(e.target.value)} placeholder="teknisi penanggung jawab" /></div>
          <div><Label>Unit</Label><Select value={aUnit} onChange={(e) => setAUnit(e.target.value)}>{DEST_UNITS.map((u) => <option key={u}>{u}</option>)}</Select></div>
          <p className="rounded-md bg-infobg px-3 py-2 text-xs font-semibold text-info">Satu aset = satu custodian aktif. Riwayat penugasan tercatat di timeline & audit.</p>
          {aErr && <p className="rounded-md bg-dangerbg px-3 py-2 text-xs font-semibold text-danger">{aErr}</p>}
        </div>
      </Modal>

      <Modal open={modal === "doc"} onClose={() => setModal("")} kicker="Attachment metadata" title={eq.docs[docIdx]?.name ?? ""}>
        {eq.docs[docIdx] && (
          <div className="space-y-2 font-mono text-[11.5px]">
            {[["file_name", eq.docs[docIdx].name], ["mime/type", eq.docs[docIdx].kind], ["size", eq.docs[docIdx].size], ["checksum", eq.docs[docIdx].checksum], ["uploaded_at", fmtDateTime(eq.docs[docIdx].date)], ["uploaded_by", "Pengelola Aset"]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-line pb-1.5"><span className="text-mute">{k}</span><span className="truncate text-right font-semibold text-ink">{v}</span></div>
            ))}
            <p className="pt-1 text-[10.5px] text-mute">Akses lampiran dikontrol per role & scope organisasi.</p>
          </div>
        )}
      </Modal>

      <WOCompleteModal woId={woComplete} onClose={() => setWoComplete(null)} />
      <CalibrationModal eqId={calEq} onClose={() => setCalEq(null)} />
      <InspectionModal eqId={insEq} onClose={() => setInsEq(null)} />

      {inss.length > 0 && tab === "timeline" && (
        <p className="font-mono text-[10.5px] text-mute"><IcBolt size={11} className="inline text-warnhi" /> {inss.length} inspeksi tercatat untuk aset ini — hasil terakhir: {inss[0].result}</p>
      )}
    </div>
  );
}

const Fact = ({ icon, label, v, sub, warn }: { icon: React.ReactNode; label: string; v: string; sub: string; warn?: boolean }) => (
  <div>
    <p className="flex items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-pine-100/60">{icon}{label}</p>
    <p className={`mt-0.5 truncate text-[12.5px] font-bold ${warn ? "text-warnhi" : "text-pine-50"}`}>{v}</p>
    <p className="truncate font-mono text-[9.5px] text-pine-100/50">{sub}</p>
  </div>
);
const CostCard = ({ label, v }: { label: string; v: string }) => (
  <div className="rounded-lg border border-line bg-paper p-3"><p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-mute">{label}</p><p className="num mt-1 font-display text-[16px] font-black text-ink">{v}</p></div>
);
const ActionBtn = ({ onClick, icon, label, disabled, gate, tone }: { onClick: () => void; icon: React.ReactNode; label: string; disabled?: boolean; gate?: string; tone?: "danger" }) => (
  <button onClick={onClick} disabled={disabled} title={disabled ? `Butuh role: ${gate}` : undefined}
    className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 font-display text-[12.5px] font-bold tracking-tight transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45 ${tone === "danger" ? "bg-danger text-white hover:bg-[#a03023]" : "border border-line bg-card text-ink2 hover:border-pine-500/50 hover:text-pine-700"}`}>
    {icon}{label}
  </button>
);
const Td = ({ children, mono, bold, className = "" }: { children?: React.ReactNode; mono?: boolean; bold?: boolean; className?: string }) => (
  <td className={`px-3 py-2.5 align-top text-[12px] text-ink2 ${mono ? "font-mono text-[11.5px]" : ""} ${bold ? "font-bold text-ink" : ""} ${className}`}>{children}</td>
);
const TableWrap = ({ head, children }: { head: string[]; children: React.ReactNode }) => (
  <div className="overflow-x-auto rounded-md border border-line">
    <table className="w-full min-w-[760px] text-left">
      <thead><tr className="border-b border-line bg-canvas/70 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">{head.map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
      <tbody className="divide-y divide-line">{children}</tbody>
    </table>
  </div>
);
const NoRows = ({ msg }: { msg: string }) => (<tr><td colSpan={7} className="px-3 py-6 text-center text-xs text-mute">{msg}</td></tr>);
