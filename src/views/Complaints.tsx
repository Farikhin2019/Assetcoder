import { useMemo, useState } from "react";
import { useApp } from "../lib/store";
import { BtnSm, Card, Chip, Modal, StatusChip, Tabs, TextArea, Label, BtnGhost, BtnPrimary, EmptyState } from "../components/ui";
import { IcFlag, IcWrench } from "../components/icons";
import { fmtDateTime, fmtIDR } from "../lib/types";

const CMP_FLOW: Record<string, string[]> = {
  OPEN: ["ACKNOWLEDGED"], ACKNOWLEDGED: ["IN_PROGRESS", "WAITING_PART", "WAITING_VENDOR"],
  IN_PROGRESS: ["RESOLVED", "WAITING_PART", "WAITING_VENDOR"], WAITING_PART: ["IN_PROGRESS"], WAITING_VENDOR: ["IN_PROGRESS"],
  RESOLVED: ["VERIFIED"], VERIFIED: ["CLOSED"],
};

export default function Complaints() {
  const { s, nav, setComplaintStatus, progressRepair, closeRepair } = useApp();
  const [tab, setTab] = useState("cmp");
  const [resolving, setResolving] = useState<string | null>(null);
  const [resolution, setResolution] = useState("");
  const [resErr, setResErr] = useState("");
  const [closing, setClosing] = useState<string | null>(null);
  const [result, setResult] = useState("");

  const canOp = ["Teknisi", "Kepala Teknisi", "Kepala Unit", "Pengelola Aset", "Direksi"].includes(s.role);
  const eqName = (id: string) => s.equipment.find((e) => e.id === id);

  const cmps = useMemo(() => [...s.complaints].sort((a, b) => (["CLOSED", "VERIFIED", "RESOLVED"].includes(a.status) ? 1 : 0) - (["CLOSED", "VERIFIED", "RESOLVED"].includes(b.status) ? 1 : 0) || +new Date(b.date) - +new Date(a.date)), [s.complaints]);
  const open = s.complaints.filter((c) => !["CLOSED", "VERIFIED", "RESOLVED"].includes(c.status)).length;
  const breaches = s.complaints.filter((c) => !["CLOSED", "VERIFIED", "RESOLVED"].includes(c.status) && Date.now() - new Date(c.date).getTime() > c.slaHours * 36e5).length;

  const slaInfo = (c: (typeof s.complaints)[0]) => {
    const hrsLeft = c.slaHours - (Date.now() - new Date(c.date).getTime()) / 36e5;
    if (hrsLeft < 0) return { txt: `breach ${Math.abs(Math.round(hrsLeft))} jam`, cls: "font-bold text-danger" };
    return { txt: `${Math.round(hrsLeft)} jam tersisa`, cls: hrsLeft < c.slaHours * 0.3 ? "font-bold text-warn" : "text-mute" };
  };

  const submitResolution = () => {
    if (!resolving) return;
    if (resolution.trim().length < 10) return setResErr("Resolusi wajib diisi (min. 10 karakter) — keluhan RESOLVED harus punya resolusi.");
    setComplaintStatus(resolving, "RESOLVED", resolution.trim());
    setResolving(null); setResolution(""); setResErr("");
  };

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Complaints & Repairs</h1>
          <p className="text-xs text-mute">Complaint → Assessment → Maintenance/Repair → Resolution → Verification → Close · SLA per prioritas (BR-014)</p>
        </div>
        <div className="flex gap-2">
          <Chip tone="danger" dot pulse={breaches > 0}>{breaches} SLA BREACH</Chip>
          <Chip tone="warn" dot>{open} OPEN</Chip>
        </div>
      </div>

      <Card className="p-4">
        <Tabs active={tab} onChange={setTab} tabs={[{ id: "cmp", label: "Complaints" }, { id: "rpr", label: "Repairs" }]} counts={{ cmp: s.complaints.length, rpr: s.repairs.length }} />
        <div className="pt-4">
          {tab === "cmp" && (
            <div className="space-y-3">
              {cmps.length === 0 && <EmptyState title="Belum ada keluhan" />}
              {cmps.map((c, i) => {
                const eq = eqName(c.eqId)!;
                const sla = slaInfo(c);
                const nexts = CMP_FLOW[c.status] ?? [];
                return (
                  <div key={c.id} className={`row-in rounded-lg border p-4 transition hover:shadow-md ${c.status === "OPEN" || c.status === "IN_PROGRESS" ? "border-line bg-paper" : "border-line bg-canvas/40"}`} style={{ animationDelay: `${i * 45}ms` }}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Chip tone="danger" dot>{c.code}</Chip>
                      <StatusChip status={c.priority} />
                      <StatusChip status={c.status} />
                      <span className={`font-mono text-[10.5px] ${sla.cls}`}>SLA {c.slaHours}j · {sla.txt}</span>
                      <span className="ml-auto font-mono text-[10px] text-mute">{fmtDateTime(c.date)}</span>
                    </div>
                    <button onClick={() => nav("equipment-detail", c.eqId)} className="mt-1.5 text-left text-[13.5px] font-bold text-ink hover:text-pine-700">{eq.name} <span className="font-mono text-[10.5px] font-medium text-mute">· {eq.code} · {eq.room}</span></button>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-ink2">{c.description}</p>
                    {c.timelineNote && <p className="mt-1.5 rounded-md bg-moss px-2.5 py-1.5 text-[11.5px] text-ink2">{c.timelineNote}</p>}
                    {c.resolution && <p className="mt-1.5 rounded-md bg-okbg px-2.5 py-1.5 text-[11.5px] font-semibold text-ok">Resolusi: {c.resolution}</p>}
                    {nexts.length > 0 && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-2.5">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wide text-mute">aksi:</span>
                        {nexts.map((n) => (
                          n === "RESOLVED"
                            ? <BtnSm key={n} disabled={!canOp} title={!canOp ? "Butuh role teknis/unit" : undefined} onClick={() => { setResolving(c.id); setResolution(""); setResErr(""); }} className="!border-ok/50 !text-ok">Resolve…</BtnSm>
                            : <BtnSm key={n} disabled={!canOp} title={!canOp ? "Butuh role teknis/unit" : undefined} onClick={() => setComplaintStatus(c.id, n as never)}>{n.replace(/_/g, " ")}</BtnSm>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {tab === "rpr" && (
            <div className="space-y-3">
              {s.repairs.map((r, i) => {
                const eq = eqName(r.eqId)!;
                const origin = r.complaintId ? s.complaints.find((c) => c.id === r.complaintId) : null;
                const partCost = r.partsUsed.reduce((a, pu) => a + (s.spareParts.find((p) => p.id === pu.partId)?.unitCost ?? 0) * pu.qty, 0);
                return (
                  <div key={r.id} className="row-in rounded-lg border border-line bg-paper p-4 transition hover:shadow-md" style={{ animationDelay: `${i * 45}ms` }}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-warnbg text-warn"><IcWrench size={14} /></span>
                      <Chip tone="warn" dot>{r.code}</Chip>
                      <StatusChip status={r.status} />
                      {origin ? <Chip tone="danger" className="!text-[9.5px]">asal: {origin.code}</Chip> : <Chip tone="neutral" className="!text-[9.5px]">direct request</Chip>}
                      <span className="ml-auto font-mono text-[10px] text-mute">mulai {fmtDateTime(r.started)}</span>
                    </div>
                    <button onClick={() => nav("equipment-detail", r.eqId)} className="mt-1.5 text-left text-[13.5px] font-bold text-ink hover:text-pine-700">{eq.name} <span className="font-mono text-[10.5px] font-medium text-mute">· {eq.code}</span></button>
                    <p className="mt-1 text-[12.5px] text-ink2"><b>Diagnosis:</b> {r.diagnosis}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10.5px] text-mute">
                      <span>teknisi: {s.technicians.find((t) => t.id === r.techId)?.name}</span>
                      <span>parts: {r.partsUsed.map((pu) => `${s.spareParts.find((p) => p.id === pu.partId)?.name} ×${pu.qty}`).join(", ") || "—"}</span>
                      <span className="font-bold text-ink">total {fmtIDR(partCost + r.laborCost)}</span>
                    </div>
                    {r.status !== "CLOSED" && (
                      <div className="mt-3 flex gap-2 border-t border-line pt-2.5">
                        {r.status === "APPROVED" && <BtnSm disabled={!canOp} onClick={() => progressRepair(r.id)}>Mulai perbaikan</BtnSm>}
                        {r.status === "AWAITING_APPROVAL" && <span className="font-mono text-[10.5px] text-warn">Menunggu approval di Approval Engine →</span>}
                        {r.status === "IN_PROGRESS" && <BtnSm disabled={!canOp} onClick={() => { setClosing(r.id); setResult(""); }} className="!border-ok/50 !text-ok">Testing & tutup…</BtnSm>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      <Modal open={!!resolving} onClose={() => setResolving(null)} kicker="Complaint resolution" title="Catat resolusi"
        footer={<><BtnGhost onClick={() => setResolving(null)}>Batal</BtnGhost><BtnPrimary onClick={submitResolution}><IcFlag size={13} /> Tandai RESOLVED</BtnPrimary></>}>
        <div className="space-y-3">
          <Label>Resolusi *</Label>
          <TextArea value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Tindakan yang dilakukan, pengujian, verifikasi…" />
          {resErr && <p className="rounded-md bg-dangerbg px-3 py-2 text-xs font-semibold text-danger">{resErr}</p>}
        </div>
      </Modal>

      <Modal open={!!closing} onClose={() => setClosing(null)} kicker="Repair closure · BR-015" title="Hasil testing & penutupan"
        footer={<><BtnGhost onClick={() => setClosing(null)}>Batal</BtnGhost><BtnPrimary onClick={() => { if (!closing) return; if (result.trim().length < 5) return; closeRepair(closing, result.trim()); setClosing(null); }}><IcWrench size={13} /> Tutup repair</BtnPrimary></>}>
        <div className="space-y-3">
          <p className="rounded-md bg-infobg px-3 py-2 text-xs font-semibold text-info">Repair harus tertelusur ke complaint / permintaan asal dan punya hasil + tanggal selesai.</p>
          <Label>Hasil testing *</Label>
          <TextArea value={result} onChange={(e) => setResult(e.target.value)} placeholder="cth: uji fungsi lolos, parameter dalam toleransi…" />
        </div>
      </Modal>
    </div>
  );
}
