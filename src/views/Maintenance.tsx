import { useState } from "react";
import { useApp } from "../lib/store";
import { Card, Chip, StatusChip, Tabs, EmptyState, BtnSm, BtnPrimary, BtnGhost, Modal, Input, Label, TextArea } from "../components/ui";
import { fmtDate, fmtIDRCompact, daysUntil } from "../lib/types";
import { Wrench, Gauge, AlertTriangle } from "lucide-react";

export default function Maintenance() {
  const { s, nav, startWo, submitWo, calibrate, setCmpStatus } = useApp();
  const [tab, setTab] = useState("wo");
  const [woNote, setWoNote] = useState<{ id: string } | null>(null);
  const [note, setNote] = useState("");
  const [calFor, setCalFor] = useState<string | null>(null);
  const [calCert, setCalCert] = useState("KAL-");
  const [calCost, setCalCost] = useState("950000");
  const [calDue, setCalDue] = useState(new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10));
  const canTech = ["Teknisi", "Kepala Teknisi", "Pengelola Aset"].includes(s.role);

  const eqName = (id: string) => s.equipment.find((e) => e.id === id)?.name ?? id;

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Perawatan, Kalibrasi & Keluhan</h1>
          <p className="text-xs text-mute">Jadwal → Perintah Kerja → Dikerjakan → Verifikasi → Selesai · semua kegiatan tercatat di riwayat aset</p>
        </div>
        <div className="flex gap-2">
          <Chip tone="info" dot>{s.workOrders.filter((w) => w.status !== "CLOSED").length} WO aktif</Chip>
          <Chip tone="danger" dot>{s.equipment.filter((e) => e.calStatus === "EXPIRED").length} kalibrasi kadaluarsa</Chip>
        </div>
      </div>

      <Card className="p-4">
        <Tabs active={tab} onChange={setTab}
          tabs={[{ id: "wo", label: "Perintah Kerja" }, { id: "cal", label: "Kalibrasi" }, { id: "cmp", label: "Keluhan" }]}
          counts={{ wo: s.workOrders.length, cal: s.calibrations.length, cmp: s.complaints.length }} />
        <div className="pt-4">
          {tab === "wo" && (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {s.workOrders.map((w) => {
                const od = w.status !== "CLOSED" && daysUntil(w.scheduled) < 0;
                return (
                  <div key={w.id} className={`rounded-lg border p-4 ${od ? "border-warn/50 bg-warnbg/30" : "border-line bg-paper"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`flex h-9 w-9 items-center justify-center rounded-md ${w.status === "CLOSED" ? "bg-moss text-mute" : "bg-pine-100 text-pine-700"}`}><Wrench size={16} /></span>
                        <div>
                          <p className="font-mono text-[12.5px] font-bold text-ink">{w.wo} <StatusChip status={w.type} className="ml-1" /></p>
                          <button onClick={() => nav("equipment-detail", w.eqId)} className="text-left text-[13px] font-bold text-pine-700 hover:underline">{eqName(w.eqId)}</button>
                        </div>
                      </div>
                      <StatusChip status={w.status} />
                    </div>
                    <p className="mt-2 text-[12px] leading-relaxed text-ink2">{w.note}</p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10.5px] text-mute">
                      <span>{s.technicians.find((t) => t.id === w.techId)?.name ?? "—"}</span>
                      <span className={od ? "font-bold text-danger" : ""}>{fmtDate(w.scheduled)}{od && ` · terlambat ${Math.abs(daysUntil(w.scheduled))} hr`}</span>
                      <span>{fmtIDRCompact(w.laborCost)}</span>
                    </div>
                    {w.status !== "CLOSED" && (
                      <div className="mt-3 flex gap-2 border-t border-line pt-2.5">
                        {w.status === "SCHEDULED" && <BtnSm disabled={!canTech} title={!canTech ? "Butuh role Teknisi / Pengelola Aset" : undefined} onClick={() => startWo(w.id)}>Mulai Dikerjakan</BtnSm>}
                        {w.status === "IN_PROGRESS" && <BtnSm disabled={!canTech} title={!canTech ? "Butuh role Teknisi / Pengelola Aset" : undefined} onClick={() => { setWoNote({ id: w.id }); setNote(""); }} className="!border-pine-500/60 !text-pine-700">Verifikasi & Selesai</BtnSm>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {tab === "cal" && (
            <div className="overflow-x-auto rounded-md border border-line">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="border-b border-line bg-canvas/70 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">
                    <th className="px-3 py-2.5">Aset</th><th className="px-3 py-2.5">Sertifikat</th><th className="px-3 py-2.5">Terakhir</th>
                    <th className="px-3 py-2.5">Berikutnya</th><th className="px-3 py-2.5">Hasil</th><th className="px-3 py-2.5 text-right">Biaya</th><th className="px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {s.calibrations.map((c) => {
                    const eq = s.equipment.find((e) => e.id === c.eqId);
                    const dd = daysUntil(c.nextDue);
                    return (
                      <tr key={c.id} className="transition hover:bg-pine-50/60">
                        <td className="px-3 py-2.5">
                          <button onClick={() => nav("equipment-detail", c.eqId)} className="text-left">
                            <p className="text-[12.5px] font-bold text-ink hover:text-pine-700">{eq?.name ?? "—"}</p>
                            <p className="font-mono text-[10px] text-mute">{eq?.code} · {eq?.room}</p>
                          </button>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[11px] text-ink2">{c.cert}</td>
                        <td className="px-3 py-2.5 font-mono text-[11px] text-ink2">{fmtDate(c.date)}</td>
                        <td className={`px-3 py-2.5 font-mono text-[11px] ${dd < 0 ? "font-bold text-danger" : dd <= 30 ? "font-bold text-warn" : "text-ink2"}`}>{fmtDate(c.nextDue)}</td>
                        <td className="px-3 py-2.5"><Chip tone={c.result === "PASS" ? "ok" : "danger"}>{c.result === "PASS" ? "LULUS" : "GAGAL"}</Chip></td>
                        <td className="num px-3 py-2.5 text-right font-mono text-[11px] text-ink2">{fmtIDRCompact(c.cost)}</td>
                        <td className="px-3 py-2.5">
                          {eq && (eq.calStatus === "DUE_SOON" || eq.calStatus === "EXPIRED") && (
                            <BtnSm disabled={!canTech} title={!canTech ? "Butuh role Teknisi" : undefined} onClick={() => { setCalFor(eq.id); setCalCert("KAL-"); }} className="!border-info/50 !text-info"><Gauge size={11} /> Kalibrasi</BtnSm>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {tab === "cmp" && (
            <div className="space-y-3">
              {s.complaints.length === 0 && <EmptyState title="Belum ada keluhan" />}
              {s.complaints.map((c) => {
                const breach = c.status !== "CLOSED" && Date.now() - new Date(c.date).getTime() > c.slaHours * 36e5;
                return (
                  <div key={c.id} className={`rounded-lg border p-4 ${breach ? "border-danger/50 bg-dangerbg/30" : "border-line bg-paper"}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-md ${breach ? "bg-dangerbg text-danger" : "bg-warnbg text-warn"}`}><AlertTriangle size={14} /></span>
                      <Chip tone="danger" dot>{c.code}</Chip>
                      <StatusChip status={c.priority} />
                      <StatusChip status={c.status} />
                      {breach && <Chip tone="danger" dot pulse>SLA {c.slaHours} jam terlampaui</Chip>}
                    </div>
                    <button onClick={() => nav("equipment-detail", c.eqId)} className="mt-1.5 text-left text-[13.5px] font-bold text-ink hover:text-pine-700">{eqName(c.eqId)} <span className="font-mono text-[10.5px] font-medium text-mute">· {s.equipment.find((e) => e.id === c.eqId)?.code}</span></button>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-ink2">{c.description}</p>
                    <p className="mt-1 font-mono text-[10px] text-mute">{c.reporter} · {fmtDate(c.date)} · SLA {c.slaHours} jam</p>
                    {c.status !== "CLOSED" && (
                      <div className="mt-2.5 flex gap-2 border-t border-line pt-2.5">
                        {c.status === "OPEN" && <BtnSm disabled={!canTech} onClick={() => setCmpStatus(c.id, "IN_PROGRESS")}>Tanggapi (Dikerjakan)</BtnSm>}
                        {c.status === "IN_PROGRESS" && <BtnSm disabled={!canTech} onClick={() => setCmpStatus(c.id, "RESOLVED")} className="!border-ok/50 !text-ok">Tandai Terselesaikan</BtnSm>}
                        {c.status === "RESOLVED" && <BtnSm disabled={!canTech} onClick={() => setCmpStatus(c.id, "CLOSED")} className="!border-line !text-ink2">Tutup Keluhan</BtnSm>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* modal verifikasi WO */}
      <Modal open={!!woNote} onClose={() => setWoNote(null)} kicker="Verifikasi & selesaikan WO" title="Catatan penyelesaian"
        footer={<><BtnGhost onClick={() => setWoNote(null)}>Batal</BtnGhost>
          <BtnPrimary onClick={() => { if (woNote) { submitWo(woNote.id, note.trim() || "Selesai & terverifikasi."); setWoNote(null); } }}><CheckIcon /> Simpan & Selesai</BtnPrimary></>}>
        <div className="space-y-3">
          <Label>Catatan verifikasi</Label>
          <TextArea value={note} onChange={(e) => setNote(e.target.value)} placeholder="cth: uji fungsi lolos, parameter dalam toleransi…" />
        </div>
      </Modal>

      {/* modal kalibrasi */}
      <Modal open={!!calFor} onClose={() => setCalFor(null)} kicker="Catat kalibrasi" title={calFor ? eqName(calFor) : ""}
        footer={<><BtnGhost onClick={() => setCalFor(null)}>Batal</BtnGhost>
          <BtnPrimary onClick={() => {
            if (!calFor) return;
            if (calCert.trim().length < 4) return;
            calibrate(calFor, "PASS", calCert.trim(), Number(calCost) || 0, new Date(calDue + "T09:00:00").toISOString());
            setCalFor(null);
          }}><Gauge size={13} /> Simpan Kalibrasi</BtnPrimary></>}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>No. sertifikat *</Label><Input value={calCert} onChange={(e) => setCalCert(e.target.value)} placeholder="KAL-2026-xxx" /></div>
            <div><Label>Biaya (IDR)</Label><Input type="number" value={calCost} onChange={(e) => setCalCost(e.target.value)} /></div>
          </div>
          <div><Label>Berlaku sampai</Label><Input type="date" value={calDue} onChange={(e) => setCalDue(e.target.value)} /></div>
        </div>
      </Modal>
    </div>
  );
}

function CheckIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m4.5 12.5 5 5L19.5 7" /></svg>; }
