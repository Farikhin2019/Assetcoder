import { useState } from "react";
import { useApp } from "../lib/store";
import { BtnGhost, BtnPrimary, BtnSm, Card, Chip, Input, Label, SectionHead, Tabs } from "../components/ui";
import { IcCheck, IcPlus, IcShield, IcX } from "../components/icons";
import { ApprovalMatrix, ApprovalStage, ApprovalType, Priority, Role, ROLES } from "../lib/types";

const APPROVAL_TYPES: ApprovalType[] = ["PURCHASE", "TRANSFER", "ADJUSTMENT", "REPAIR", "DISPOSAL", "LOAN"];
const PRIORITIES: Priority[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

function ChipEditor({ items, onAdd, onRemove, addLabel }: { items: string[]; onAdd: (v: string) => void; onRemove: (v: string) => void; addLabel: string }) {
  const [val, setVal] = useState("");
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it) => (
          <span key={it} className="inline-flex items-center gap-1.5 rounded-md border border-line bg-card px-2 py-1 font-mono text-[11px] font-semibold text-ink2">
            {it}
            <button onClick={() => onRemove(it)} className="text-mute transition hover:text-danger"><IcX size={11} /></button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <Input placeholder={addLabel} value={val} onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && val.trim()) { onAdd(val.trim()); setVal(""); } }} />
        <BtnSm onClick={() => { if (val.trim()) { onAdd(val.trim()); setVal(""); } }}><IcPlus size={12} /> Tambah</BtnSm>
      </div>
    </div>
  );
}

export default function Config() {
  const { s, cfgPatch, cfgMatrix } = useApp();
  const [tab, setTab] = useState("param");
  const canEdit = ["IT Administrator", "Pengelola Aset", "Direksi", "Pengelola Inventory"].includes(s.role);

  /* parameter draft */
  const [orgName, setOrgName] = useState(s.config.orgName);
  const [hospital, setHospital] = useState(s.config.hospital);
  const [adjThreshold, setAdjThreshold] = useState(String(s.config.adjThreshold));
  const [sla, setSla] = useState<Record<Priority, string>>({
    CRITICAL: String(s.config.slaByPriority.CRITICAL), HIGH: String(s.config.slaByPriority.HIGH),
    MEDIUM: String(s.config.slaByPriority.MEDIUM), LOW: String(s.config.slaByPriority.LOW),
  });
  const [cadence, setCadence] = useState<number[]>(s.config.calCadence);
  const [newCad, setNewCad] = useState("");

  /* matrix draft */
  const [matrix, setMatrix] = useState<ApprovalMatrix>(JSON.parse(JSON.stringify(s.config.approvalMatrix)));

  const setStage = (type: ApprovalType, idx: number, patch: Partial<ApprovalStage>) =>
    setMatrix({ ...matrix, [type]: matrix[type].map((st, i) => (i === idx ? { ...st, ...patch } : st)) });
  const toggleRole = (type: ApprovalType, idx: number, role: Role) => {
    const st = matrix[type][idx];
    const roles = st.roles.includes(role) ? st.roles.filter((r) => r !== role) : [...st.roles, role];
    setStage(type, idx, { roles });
  };
  const moveStage = (type: ApprovalType, idx: number, dir: -1 | 1) => {
    const arr = [...matrix[type]];
    const j = idx + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    setMatrix({ ...matrix, [type]: arr });
  };

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Konfigurasi Sistem</h1>
          <p className="text-xs text-mute">Configuration over hardcoding — parameter, approval matrix, kategori & UoM · semua perubahan diaudit</p>
        </div>
        {!canEdit && <Chip tone="warn" dot>READ-ONLY — role {s.role}</Chip>}
      </div>

      <Card className="p-4">
        <Tabs active={tab} onChange={setTab}
          tabs={[{ id: "param", label: "Parameter" }, { id: "matrix", label: "Approval Matrix" }, { id: "master", label: "Kategori & UoM" }]} />
        <div className="pt-4">
          {tab === "param" && (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <Card className="p-4">
                <SectionHead title="Organisasi" sub="Identitas multi-cabang" />
                <div className="space-y-3">
                  <div><Label>Nama organisasi</Label><Input value={orgName} onChange={(e) => setOrgName(e.target.value)} disabled={!canEdit} /></div>
                  <div><Label>Rumah sakit</Label><Input value={hospital} onChange={(e) => setHospital(e.target.value)} disabled={!canEdit} /></div>
                  <label className="flex cursor-pointer items-center justify-between rounded-md border border-line bg-canvas/50 px-3 py-2.5">
                    <span className="text-[12.5px] text-ink2">Izinkan stok negatif (terkonfigurasi eksplisit)</span>
                    <button disabled={!canEdit} onClick={() => cfgPatch({ negativeStockAllowed: !s.config.negativeStockAllowed })}
                      className={`relative h-5 w-9 rounded-full transition ${s.config.negativeStockAllowed ? "bg-warn" : "bg-line2"}`}>
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${s.config.negativeStockAllowed ? "left-[18px]" : "left-0.5"}`} />
                    </button>
                  </label>
                  <BtnPrimary disabled={!canEdit} onClick={() => cfgPatch({ orgName, hospital })}><IcCheck size={13} /> Simpan organisasi</BtnPrimary>
                </div>
              </Card>

              <Card className="p-4">
                <SectionHead title="Threshold & SLA" sub="Menggerakkan routing approval & SLA keluhan" />
                <div className="space-y-3">
                  <div><Label>Threshold approval adjustment (IDR)</Label><Input type="number" value={adjThreshold} onChange={(e) => setAdjThreshold(e.target.value)} disabled={!canEdit} /></div>
                  <div>
                    <Label>SLA keluhan per prioritas (jam)</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {PRIORITIES.map((p) => (
                        <div key={p}>
                          <p className="mb-1 font-mono text-[9px] font-bold uppercase text-mute">{p}</p>
                          <Input type="number" value={sla[p]} disabled={!canEdit} onChange={(e) => setSla({ ...sla, [p]: e.target.value })} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <BtnPrimary disabled={!canEdit} onClick={() => cfgPatch({
                    adjThreshold: Number(adjThreshold) || s.config.adjThreshold,
                    slaByPriority: { CRITICAL: Number(sla.CRITICAL), HIGH: Number(sla.HIGH), MEDIUM: Number(sla.MEDIUM), LOW: Number(sla.LOW) },
                  })}><IcCheck size={13} /> Simpan threshold & SLA</BtnPrimary>
                </div>
              </Card>

              <Card className="p-4 lg:col-span-2">
                <SectionHead title="Cadence reminder kalibrasi (hari sebelum jatuh tempo)" sub="PRD: 90 / 60 / 30 / 14 / 7 → Expired" />
                <div className="flex flex-wrap items-center gap-1.5">
                  {cadence.map((c) => (
                    <span key={c} className="inline-flex items-center gap-1.5 rounded-md border border-pine-500/40 bg-pine-50 px-2.5 py-1.5 font-mono text-[12px] font-bold text-pine-700">
                      T−{c}
                      {canEdit && <button onClick={() => setCadence(cadence.filter((x) => x !== c))} className="text-pine-500 transition hover:text-danger"><IcX size={11} /></button>}
                    </span>
                  ))}
                  <span className="font-mono text-[11px] font-bold text-danger">→ EXPIRED</span>
                </div>
                <div className="mt-3 flex max-w-sm gap-2">
                  <Input type="number" placeholder="cth: 45" value={newCad} onChange={(e) => setNewCad(e.target.value)} disabled={!canEdit} />
                  <BtnSm disabled={!canEdit} onClick={() => { const n = Number(newCad); if (n > 0 && !cadence.includes(n)) { const next = [...cadence, n].sort((a, b) => b - a); setCadence(next); cfgPatch({ calCadence: next }); setNewCad(""); } }}><IcPlus size={12} /> Tambah</BtnSm>
                </div>
              </Card>
            </div>
          )}

          {tab === "matrix" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 text-[12px] text-mute"><IcShield size={14} className="text-pine-700" /> Rantai persetujuan per tipe transaksi — stage 1 s.d. N, tiap stage punya role yang boleh memutuskan.</p>
                <div className="flex gap-2">
                  <BtnGhost onClick={() => setMatrix(JSON.parse(JSON.stringify(s.config.approvalMatrix)))}>Reset</BtnGhost>
                  <BtnPrimary disabled={!canEdit} onClick={() => cfgMatrix(matrix)}><IcCheck size={13} /> Simpan matrix</BtnPrimary>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                {APPROVAL_TYPES.map((type) => (
                  <Card key={type} className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-display text-[13.5px] font-extrabold text-ink">{type}</h3>
                      <BtnSm disabled={!canEdit} onClick={() => setMatrix({ ...matrix, [type]: [...matrix[type], { label: "Tahap baru", roles: [] }] })}><IcPlus size={11} /> Stage</BtnSm>
                    </div>
                    <div className="space-y-2">
                      {matrix[type].map((st, idx) => (
                        <div key={idx} className="rounded-md border border-line bg-canvas/40 p-2.5">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pine-700 font-mono text-[10px] font-bold text-pine-50">{idx + 1}</span>
                            <Input value={st.label} disabled={!canEdit} onChange={(e) => setStage(type, idx, { label: e.target.value })} />
                            <BtnSm disabled={!canEdit || idx === 0} onClick={() => moveStage(type, idx, -1)}>↑</BtnSm>
                            <BtnSm disabled={!canEdit || idx === matrix[type].length - 1} onClick={() => moveStage(type, idx, 1)}>↓</BtnSm>
                            <BtnSm disabled={!canEdit || matrix[type].length <= 1} onClick={() => setMatrix({ ...matrix, [type]: matrix[type].filter((_, i) => i !== idx) })}><IcX size={11} /></BtnSm>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {ROLES.map((r) => {
                              const on = st.roles.includes(r);
                              return (
                                <button key={r} disabled={!canEdit} onClick={() => toggleRole(type, idx, r)}
                                  className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold transition ${on ? "bg-pine-700 text-pine-50" : "bg-moss text-mute hover:text-pine-700"}`}>{r}</button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {tab === "master" && (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <Card className="p-4">
                <SectionHead title="Kategori item" sub="Dipakai saat registrasi item & permintaan" />
                <ChipEditor items={s.config.itemCategories} addLabel="Kategori baru…"
                  onAdd={(v) => canEdit && cfgPatch({ itemCategories: [...s.config.itemCategories, v] })}
                  onRemove={(v) => canEdit && cfgPatch({ itemCategories: s.config.itemCategories.filter((x) => x !== v) })} />
              </Card>
              <Card className="p-4">
                <SectionHead title="Satuan (UoM)" sub="Konversi UoM mengikuti metode FIFO/FEFO" />
                <ChipEditor items={s.config.uoms} addLabel="UoM baru…"
                  onAdd={(v) => canEdit && cfgPatch({ uoms: [...s.config.uoms, v] })}
                  onRemove={(v) => canEdit && cfgPatch({ uoms: s.config.uoms.filter((x) => x !== v) })} />
              </Card>
            </div>
          )}
        </div>
      </Card>

      <p className="font-mono text-[10.5px] text-mute">Perubahan konfigurasi tercatat imutabel di audit trail (entity: configuration / approval_matrix) — BR-010.</p>
    </div>
  );
}
