import { useMemo, useState } from "react";
import { useApp } from "../lib/store";
import { BtnSm, Card, Chip, Input, Label, Modal, SectionHead, StatusChip, Tabs, TextArea } from "../components/ui";
import { fmtDate, fmtIDR, fmtIDRCompact, daysUntil } from "../lib/types";
import { Check, Play, Wrench, Gauge } from "lucide-react";

export default function Maintenance() {
  const { s, nav, startWo, submitWo, calibrate, setCmpStatus } = useApp();
  const [tab, setTab] = useState("wo");
  const [closing, setClosing] = useState<string | null>(null);
  const [closeNote, setCloseNote] = useState("Verifikasi fungsional lolos; unit kembali ke layanan.");
  const [calEq, setCalEq] = useState<string | null>(null);
  const [calResult, setCalResult] = useState<"PASS" | "FAIL">("PASS");
  const [calCert, setCalCert] = useState("KAL-2026-");
  const [calCost, setCalCost] = useState("950000");
  const [err, setErr] = useState("");

  const canTech = ["Teknisi", "Kepala Teknisi", "Pengelola Aset"].includes(s.role);
  const eq = (id: string) => s.equipment.find((e) => e.id === id);
  const tech = (id: string) => s.technicians.find((t) => t.id === id)?.name ?? id;

  const openWo = s.workOrders.filter((w) => w.status !== "CLOSED").length;
  const overdue = s.workOrders.filter((w) => w.status !== "CLOSED" && daysUntil(w.scheduled) < 0).length;
  const calIssue = s.equipment.filter((e) => ["EXPIRED", "DUE_SOON"].includes(e.calStatus)).length;
  const eqCal = s.equipment.find((e) => e.id === calEq);

  const submitClose = () => {
    if (!closing) return;
    submitWo(closing, closeNote.trim() || "Selesai");
    setClosing(null);
  };
  const submitCal = () => {
    if (!calEq) return;
    if (calCert.trim().length < 6) return setErr("Nomor sertifikat wajib diisi.");
    calibrate(calEq, calResult, calCert.trim(), Number(calCost) || 0, new Date(Date.now() + 365 * 864e5).toISOString());
    setCalEq(null); setErr("");
  };

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Maintenance, Kalibrasi & Keluhan</h1>
          <p className="text-xs text-mute">Schedule → Work Order → Eksekusi → Verifikasi → Close · semua event → Equipment Timeline (BR-018)</p>
        </div>
        <div className="flex gap-2">
          <Chip tone="info" dot>{openWo} OPEN WO</Chip>
          <Chip tone="warn" dot pulse={overdue > 0}>{overdue} OVERDUE</Chip>
          <Chip tone="danger" dot>{calIssue} CAL AKSI</Chip>
        </div>
      </div>

      <Card className="p-4">
        <Tabs active={tab} onChange={setTab}
          tabs={[{ id: "wo", label: "Work Order" }, { id: "cal", label: "Kalibrasi" }, { id: "cmp", label: "Keluhan" }]}
          counts={{ wo: s.workOrders.length, cal: s.calibrations.length, cmp: s.complaints.length }} />
        <div className="pt-4">
          {tab === "wo" && (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {s.workOrders.map((w, i) => {
                const e = eq(w.eqId);
                const od = w.status !== "CLOSED" && daysUntil(w.scheduled) < 0;
                return (
                  <div key={w.id} className={`row-in rounded-lg border p-3.5 ${od ? "border-warn/50 bg-warnbg/30" : "border-line bg-paper"}`} style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`flex h-9 w-9 items-center justify-center rounded-md ${w.status === "CLOSED" ? "bg-moss text-mute" : "bg-pine-100 text-pine-700"}`}><Wrench size={16} /></span>
                        <div>
                          <p className="font-mono text-[12.5px] font-bold text-ink">{w.wo} <StatusChip status={w.type} className="ml-1" /></p>
                          <button onClick={() => nav("equipment-detail", w.eqId)} className="text-left text-[13px] font-bold text-pine-700 hover:underline">{e?.name}</button>
                        </div>
                      </div>
                      <StatusChip status={w.status} />
                    </div>
                    <p className="mt-2 line-clamp-2 text-[12px] text-ink2">{w.note}</p>
                    <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10.5px] text-mute">
                      <span>{tech(w.techId)}</span>
                      <span className={od ? "font-bold text-danger" : ""}>{fmtDate(w.scheduled)}{od && ` · overdue`}</span>
                      <span>{fmtIDRCompact(w.laborCost)}</span>
                    </div>
                    {w.status !== "CLOSED" && (
                      <div className="mt-3 flex gap-2 border-t border-line pt-2.5">
                        {w.status === "SCHEDULED" && <BtnSm disabled={!canTech} title={!canTech ? "Butuh role Teknisi" : undefined} onClick={() => startWo(w.id)}><Play size={11} /> Mulai</BtnSm>}
                        {w.status === "IN_PROGRESS" && <BtnSm disabled={!canTech} title={!canTech ? "Butuh role Teknisi" : undefined} onClick={() => { setClosing(w.id); }} className="!border-pine-500/60 !text-pine-700"><Check size={11} /> Verifikasi & tutup</BtnSm>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {tab === "cal" && (
            <div className="overflow-x-auto rounded-md border border-line">
              <table className="w-full min-w-[800px] text-left">
                <thead>
                  <tr className="border-b border-line bg-canvas/70 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">
                    <th className="px-3 py-2.5">Equipment</th><th className="px-3 py-2.5">Sertifikat</th><th className="px-3 py-2.5">Hasil</th>
                    <th className="px-3 py-2.5">Berikutnya</th><th className="px-3 py-2.5 text-right">Biaya</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {s.calibrations.map((c) => {
                    const e = eq(c.eqId);
                    const dd = daysUntil(c.nextDue);
                    return (
                      <tr key={c.id} className="transition hover:bg-pine-50/60">
                        <td className="px-3 py-2.5">
                          <button onClick={() => nav("equipment-detail", c.eqId)} className="text-left">
                            <p className="text-[12.5px] font-bold text-ink hover:text-pine-700">{e?.name}</p>
                            <p className="font-mono text-[10px] text-mute">{e?.code} · {e?.room}</p>
                          </button>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[11px] text-ink2">{c.cert}</td>
                        <td className="px-3 py-2.5"><Chip tone={c.result === "PASS" ? "ok" : "danger"} dot>{c.result}</Chip></td>
                        <td className={`px-3 py-2.5 font-mono text-[11px] ${dd < 0 ? "font-bold text-danger" : dd <= 30 ? "font-bold text-warn" : "text-ink2"}`}>{fmtDate(c.nextDue)}</td>
                        <td className="num px-3 py-2.5 text-right font-mono text-[11px] text-ink2">{fmtIDR(c.cost)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {tab === "cmp" && (
            <div className="space-y-3">
              {s.complaints.map((c, i) => {
                const e = eq(c.eqId);
                const hrsLeft = c.slaHours - (Date.now() - new Date(c.date).getTime()) / 36e5;
                const breach = !["CLOSED", "RESOLVED"].includes(c.status) && hrsLeft < 0;
                return (
                  <div key={c.id} className="row-in rounded-lg border border-line bg-paper p-4" style={{ animationDelay: `${i * 45}ms` }}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Chip tone="danger" dot>{c.code}</Chip>
                      <StatusChip status={c.priority} />
                      <StatusChip status={c.status} />
                      <span className={`font-mono text-[10.5px] ${breach ? "font-bold text-danger" : "text-mute"}`}>SLA {c.slaHours}j · {breach ? `breach` : `${Math.round(hrsLeft)} jam lagi`}</span>
                    </div>
                    <button onClick={() => nav("equipment-detail", c.eqId)} className="mt-1.5 text-left text-[13.5px] font-bold text-ink hover:text-pine-700">{e?.name} <span className="font-mono text-[10.5px] font-medium text-mute">· {e?.room}</span></button>
                    <p className="mt-1 text-[12.5px] text-ink2">{c.description}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-mute">pelapor: {c.reporter}</p>
                    {c.status === "OPEN" && canTech && <BtnSm className="mt-2.5" onClick={() => setCmpStatus(c.id, "IN_PROGRESS")}>Tangani (IN_PROGRESS)</BtnSm>}
                    {c.status === "IN_PROGRESS" && canTech && <BtnSm className="mt-2.5 !border-ok/60 !text-ok" onClick={() => setCmpStatus(c.id, "RESOLVED")}>Tandai RESOLVED</BtnSm>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* close WO modal */}
      <Modal open={!!closing} onClose={() => setClosing(null)} kicker="Tutup work order" title="Verifikasi & catatan"
        footer={<><BtnSm onClick={() => setClosing(null)} className="!py-2">Batal</BtnSm><button onClick={submitClose} className="inline-flex items-center gap-1.5 rounded-md bg-pine-700 px-3.5 py-2 font-display text-[12.5px] font-bold text-pine-50 hover:bg-pine-800"><Check size={13} /> Tutup WO</button></>}>
        <div className="space-y-3">
          <Label>Ringkasan eksekusi</Label>
          <TextArea value={closeNote} onChange={(e) => setCloseNote(e.target.value)} />
          <p className="rounded-md bg-moss px-3 py-2 text-[11px] font-semibold text-ink2">Aset kembali IN_SERVICE · next PM dijadwalkan ulang · tercatat di timeline.</p>
        </div>
      </Modal>

      {/* calibrate modal */}
      <Modal open={!!calEq} onClose={() => setCalEq(null)} kicker="Catat kalibrasi · BR-011" title={eqCal ? `${eqCal.name}` : ""}
        footer={<><BtnSm onClick={() => setCalEq(null)} className="!py-2">Batal</BtnSm><button onClick={submitCal} className="inline-flex items-center gap-1.5 rounded-md bg-pine-700 px-3.5 py-2 font-display text-[12.5px] font-bold text-pine-50 hover:bg-pine-800"><Gauge size={13} /> Simpan</button></>}>
        <div className="space-y-3">
          <div><Label>Hasil</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["PASS", "FAIL"] as const).map((r) => (
                <button key={r} onClick={() => setCalResult(r)} className={`rounded-md border px-2 py-2 font-mono text-[11.5px] font-bold transition ${calResult === r ? (r === "FAIL" ? "border-danger bg-dangerbg text-danger" : "border-pine-600 bg-pine-50 text-pine-700") : "border-line bg-card text-mute"}`}>{r}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>No. sertifikat</Label><Input value={calCert} onChange={(e) => setCalCert(e.target.value)} /></div>
            <div><Label>Biaya (IDR)</Label><Input type="number" value={calCost} onChange={(e) => setCalCost(e.target.value)} /></div>
          </div>
          {err && <p className="rounded-md bg-dangerbg px-3 py-2 text-xs font-semibold text-danger">{err}</p>}
        </div>
      </Modal>

      <p className="font-mono text-[10.5px] text-mute">Kalibrasi kedaluwarsa memicu notifikasi (BR-012) · PM overdue memicu notifikasi (BR-013).</p>
    </div>
  );
}
