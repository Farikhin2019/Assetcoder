import { useEffect, useState } from "react";
import { useApp } from "../lib/store";
import { BtnGhost, BtnPrimary, Chip, Input, Label, Modal, QRGlyph, Select, TextArea } from "./ui";
import { IcCheck, IcForm, IcGauge, IcPlus, IcShield } from "./icons";
import { BUILDINGS, DEST_UNITS } from "../lib/data";
import { fmtDate, fmtIDR } from "../lib/types";

/* ── Asset Registration (BR-001/002) ── */
export function RegisterModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { s, registerEquipment } = useApp();
  const nextCode = `AST-RS-2026-${String(s.equipment.length + 1).padStart(6, "0")}`;
  const blank = { name: "", category: "Monitoring", brand: "", model: "", serial: "", cost: "", supplierId: "S-03", building: "Gedung B", floor: "Lantai 1", room: "", unit: DEST_UNITS[0], custodian: "", pic: "", calRequired: true };
  const [f, setF] = useState(blank);
  const [err, setErr] = useState("");
  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  useEffect(() => { if (open) { setF(blank); setErr(""); } /* eslint-disable-next-line */ }, [open]);

  const submit = () => {
    if (f.name.trim().length < 3) return setErr("Nama aset wajib diisi.");
    if (!f.serial.trim()) return setErr("Serial number wajib (BR-001: identitas unik).");
    if (s.equipment.some((e) => e.serial.toLowerCase() === f.serial.trim().toLowerCase())) return setErr("Serial number sudah terdaftar di registry (BR-001).");
    if (!f.brand.trim() || !f.model.trim()) return setErr("Merek & model wajib diisi.");
    if (!(Number(f.cost) > 0)) return setErr("Nilai perolehan harus > 0.");
    if (!f.room.trim() || !f.custodian.trim()) return setErr("Ruangan & custodian wajib diisi (satu lokasi & satu custodian aktif).");
    registerEquipment({ name: f.name.trim(), category: f.category, brand: f.brand.trim(), model: f.model.trim(), serial: f.serial.trim(), cost: Number(f.cost), supplierId: f.supplierId, building: f.building, floor: f.floor, room: f.room.trim(), unit: f.unit, custodian: f.custodian.trim(), pic: f.pic.trim() || f.custodian.trim(), calRequired: f.calRequired });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} wide kicker="Asset registration · BR-001/BR-002" title="Registrasi aset baru"
      footer={<><BtnGhost onClick={onClose}>Batal</BtnGhost><BtnPrimary onClick={submit}><IcPlus size={13} /> Daftarkan aset</BtnPrimary></>}>
      <div className="space-y-3.5">
        <div className="flex items-center gap-4 rounded-lg border border-pine-500/30 bg-pine-50 p-3">
          <QRGlyph seed={nextCode + f.serial} size={72} />
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-pine-600">Asset ID (imutabel)</p>
            <p className="font-mono text-[16px] font-bold text-pine-800">{nextCode}</p>
            <p className="mt-0.5 font-mono text-[10px] text-mute">QR + barcode terbit otomatis · ID tidak pernah berubah</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Nama aset *</Label><Input value={f.name} onChange={set("name")} placeholder="cth: Patient Monitor MX550" /></div>
          <div><Label>Kategori</Label><Select value={f.category} onChange={set("category")}>{["Imaging", "Life Support", "Monitoring", "Laboratorium", "Sterilisasi", "Infusion", "Poliklinik"].map((c) => <option key={c}>{c}</option>)}</Select></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Merek *</Label><Input value={f.brand} onChange={set("brand")} placeholder="Philips" /></div>
          <div><Label>Model *</Label><Input value={f.model} onChange={set("model")} placeholder="IntelliVue MX550" /></div>
          <div><Label>Serial no. *</Label><Input value={f.serial} onChange={set("serial")} placeholder="PH-PM-xxxxx" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Nilai perolehan (IDR) *</Label><Input type="number" value={f.cost} onChange={set("cost")} placeholder="250000000" /></div>
          <div><Label>Supplier</Label><Select value={f.supplierId} onChange={set("supplierId")}>{s.suppliers.map((sp) => <option key={sp.id} value={sp.id}>{sp.name}</option>)}</Select></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Gedung</Label><Select value={f.building} onChange={set("building")}>{BUILDINGS.filter((b) => b.status !== "PLANNED").map((b) => <option key={b.id} value={b.name}>{b.name} — {b.label}</option>)}</Select></div>
          <div><Label>Lantai</Label><Select value={f.floor} onChange={set("floor")}>{["Lantai 1", "Lantai 2", "Lantai 3"].map((x) => <option key={x}>{x}</option>)}</Select></div>
          <div><Label>Ruangan *</Label><Input value={f.room} onChange={set("room")} placeholder="cth: ICU Bed 08" /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Unit</Label><Select value={f.unit} onChange={set("unit")}>{DEST_UNITS.map((u) => <option key={u}>{u}</option>)}</Select></div>
          <div><Label>Custodian *</Label><Input value={f.custodian} onChange={set("custodian")} placeholder="Ns. …" /></div>
          <div><Label>PIC teknisi</Label><Input value={f.pic} onChange={set("pic")} placeholder="opsional" /></div>
        </div>
        <label className="flex cursor-pointer items-center gap-2.5 rounded-md border border-line bg-canvas/50 px-3 py-2.5">
          <input type="checkbox" checked={f.calRequired} onChange={(e) => setF({ ...f, calRequired: e.target.checked })} className="h-4 w-4 accent-pine-600" />
          <span className="text-[12.5px] text-ink2">Wajib kalibrasi — jadwal aktif langsung dibuat (BR-011)</span>
        </label>
        {err && <p className="rounded-md bg-dangerbg px-3 py-2 text-xs font-semibold text-danger">{err}</p>}
      </div>
    </Modal>
  );
}

/* ── WO submit with maintenance-form results + spare parts (BR-016) ── */
export function WOCompleteModal({ woId, onClose }: { woId: string | null; onClose: () => void }) {
  const { s, submitWorkOrder } = useApp();
  const wo = s.workOrders.find((w) => w.id === woId);
  const eq = wo ? s.equipment.find((e) => e.id === wo.eqId) : null;
  const tpl = wo ? s.formTemplates.find((t) => t.id === wo.templateId) : null;
  const availParts = s.spareParts.filter((p) => p.stock > 0 && (eq ? p.eqIds.includes(eq.id) : false));

  const [note, setNote] = useState("Verifikasi fungsional lolos; unit dikembalikan ke layanan.");
  const [values, setValues] = useState<Record<string, string>>({});
  const [parts, setParts] = useState<{ id: string; qty: number }[]>([]);
  const [partId, setPartId] = useState("");
  const [partQty, setPartQty] = useState("1");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (woId) { setValues({}); setParts([]); setErr(""); setPartId(""); setPartQty("1"); setNote("Verifikasi fungsional lolos; unit dikembalikan ke layanan."); }
    // eslint-disable-next-line
  }, [woId]);

  const setVal = (id: string, v: string) => setValues((x) => ({ ...x, [id]: v }));

  const submit = () => {
    if (!wo || !tpl) return;
    for (const fld of tpl.fields) {
      if (fld.required && !(values[fld.id] ?? "").trim()) return setErr(`Field wajib belum diisi: "${fld.label}".`);
    }
    submitWorkOrder(wo.id, note.trim() || "Selesai", parts, values);
    onClose();
  };

  const partsCost = parts.reduce((a, p) => a + (s.spareParts.find((x) => x.id === p.id)?.unitCost ?? 0) * p.qty, 0);

  return (
    <Modal open={!!wo} onClose={onClose} wide kicker={`Maintenance form · ${tpl?.name ?? ""}`} title={wo ? `Tutup ${wo.wo} — ${eq?.name ?? ""}` : ""}
      footer={<><BtnGhost onClick={onClose}>Batal</BtnGhost><BtnPrimary onClick={submit}><IcCheck size={13} /> Simpan form & tutup WO</BtnPrimary></>}>
      {wo && tpl && (
        <div className="space-y-4">
          <div className="space-y-3">
            {tpl.fields.map((fld) => (
              <div key={fld.id}>
                {fld.type === "instruction" ? (
                  <p className="flex items-start gap-2 rounded-md bg-infobg px-3 py-2 text-[11.5px] font-semibold text-info"><IcForm size={14} className="mt-0.5 shrink-0" /> {fld.label}</p>
                ) : (
                  <>
                    <Label>{fld.label}{fld.required && " *"}{fld.unit ? ` (${fld.unit})` : ""}</Label>
                    {fld.type === "text" && <Input value={values[fld.id] ?? ""} onChange={(e) => setVal(fld.id, e.target.value)} placeholder="…" />}
                    {(fld.type === "number" || fld.type === "measurement") && (
                      <div className="flex items-center gap-2">
                        <Input type="number" step="any" value={values[fld.id] ?? ""} onChange={(e) => setVal(fld.id, e.target.value)} placeholder="0" />
                        {fld.unit && <span className="shrink-0 font-mono text-[11px] font-bold text-mute">{fld.unit}</span>}
                      </div>
                    )}
                    {(fld.type === "passfail" || fld.type === "radio") && (
                      <div className="grid grid-cols-3 gap-2">
                        {(fld.type === "passfail" ? ["PASS", "FAIL"] : fld.options ?? []).map((o) => (
                          <button key={o} onClick={() => setVal(fld.id, o)}
                            className={`rounded-md border px-2 py-1.5 font-mono text-[11px] font-bold transition ${values[fld.id] === o ? (o === "FAIL" ? "border-danger bg-dangerbg text-danger" : "border-pine-600 bg-pine-50 text-pine-700") : "border-line bg-card text-mute hover:border-line2"}`}>{o}</button>
                        ))}
                      </div>
                    )}
                    {fld.type === "checkbox" && (
                      <label className="flex cursor-pointer items-center gap-2.5 rounded-md border border-line bg-card px-3 py-2">
                        <input type="checkbox" checked={values[fld.id] === "1"} onChange={(e) => setVal(fld.id, e.target.checked ? "1" : "0")} className="h-4 w-4 accent-pine-600" />
                        <span className="text-[12px] text-ink2">Ya, dilakukan</span>
                      </label>
                    )}
                    {fld.type === "select" && <Select value={values[fld.id] ?? ""} onChange={(e) => setVal(fld.id, e.target.value)}><option value="">— pilih —</option>{(fld.options ?? []).map((o) => <option key={o}>{o}</option>)}</Select>}
                    {fld.type === "date" && <Input type="date" value={values[fld.id] ?? ""} onChange={(e) => setVal(fld.id, e.target.value)} />}
                  </>
                )}
              </div>
            ))}
          </div>

          <div>
            <Label>Spare part dipakai (via ledger — BR-016)</Label>
            <div className="flex gap-2">
              <Select value={partId} onChange={(e) => setPartId(e.target.value)}>
                <option value="">— tidak ada —</option>
                {availParts.map((p) => <option key={p.id} value={p.id}>{p.name} (stok {p.stock}) · {fmtIDR(p.unitCost)}</option>)}
              </Select>
              <Input type="number" className="!w-20" value={partQty} onChange={(e) => setPartQty(e.target.value)} />
              <BtnGhost onClick={() => {
                const q = Number(partQty);
                const part = s.spareParts.find((p) => p.id === partId);
                if (!part || !(q > 0)) return setErr("Pilih spare part & qty valid.");
                if (q > part.stock) return setErr(`Stok ${part.name} hanya ${part.stock}.`);
                if (parts.some((p) => p.id === partId)) return setErr("Part sudah ditambahkan.");
                setParts([...parts, { id: partId, qty: q }]); setPartId(""); setPartQty("1"); setErr("");
              }}><IcPlus size={13} /></BtnGhost>
            </div>
            {parts.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {parts.map((p) => {
                  const part = s.spareParts.find((x) => x.id === p.id)!;
                  return (
                    <div key={p.id} className="flex items-center justify-between rounded-md border border-line bg-canvas/50 px-3 py-1.5">
                      <span className="text-[12px] font-semibold text-ink">{part.name} <span className="font-mono text-[10.5px] text-mute">×{p.qty}</span></span>
                      <span className="flex items-center gap-2 font-mono text-[11px] text-ink2">{fmtIDR(part.unitCost * p.qty)}
                        <button onClick={() => setParts(parts.filter((x) => x.id !== p.id))} className="text-danger hover:underline">hapus</button>
                      </span>
                    </div>
                  );
                })}
                <p className="text-right font-mono text-[11px] font-bold text-ink">Parts {fmtIDR(partsCost)} + jasa {fmtIDR(wo.laborCost)} = {fmtIDR(partsCost + wo.laborCost)}</p>
              </div>
            )}
          </div>

          <div><Label>Ringkasan eksekusi</Label><TextArea value={note} onChange={(e) => setNote(e.target.value)} /></div>
          {err && <p className="rounded-md bg-dangerbg px-3 py-2 text-xs font-semibold text-danger">{err}</p>}
          <p className="rounded-md bg-moss px-3 py-2 text-[11px] font-semibold text-ink2">Hasil form tersimpan sebagai FormResult teraudit dan muncul di timeline equipment (BR-018).</p>
        </div>
      )}
    </Modal>
  );
}

/* ── Calibration record (BR-011/012) ── */
export function CalibrationModal({ eqId, onClose }: { eqId: string | null; onClose: () => void }) {
  const { s, recordCalibration } = useApp();
  const eq = s.equipment.find((e) => e.id === eqId);
  const [result, setResult] = useState<"PASS" | "ADJUSTED" | "FAIL">("PASS");
  const [cert, setCert] = useState("KAL-2026-");
  const [tech, setTech] = useState("T-01");
  const [cost, setCost] = useState("1000000");
  const [due, setDue] = useState(() => new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10));
  const [err, setErr] = useState("");

  const submit = () => {
    if (!eq) return;
    if (cert.trim().length < 6) return setErr("Nomor sertifikat wajib diisi.");
    if (!due) return setErr("Jadwal kalibrasi berikutnya wajib diisi (BR-011).");
    recordCalibration(eq.id, result, cert.trim(), s.technicians.find((t) => t.id === tech)?.name ?? tech, Number(cost) || 0, new Date(due + "T09:00:00").toISOString());
    setErr(""); onClose();
  };

  return (
    <Modal open={!!eq} onClose={onClose} kicker="Calibration record" title={eq ? `${eq.name} — ${eq.code}` : ""}
      footer={<><BtnGhost onClick={onClose}>Batal</BtnGhost><BtnPrimary onClick={submit}><IcGauge size={13} /> Simpan hasil kalibrasi</BtnPrimary></>}>
      <div className="space-y-3.5">
        <div>
          <Label>Hasil</Label>
          <div className="grid grid-cols-3 gap-2">
            {(["PASS", "ADJUSTED", "FAIL"] as const).map((r) => (
              <button key={r} onClick={() => setResult(r)}
                className={`rounded-md border px-2 py-2 font-mono text-[11.5px] font-bold transition ${result === r ? (r === "FAIL" ? "border-danger bg-dangerbg text-danger" : "border-pine-600 bg-pine-50 text-pine-700") : "border-line bg-card text-mute hover:border-line2"}`}>{r}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Certificate no.</Label><Input value={cert} onChange={(e) => setCert(e.target.value)} placeholder="KAL-2026-xxx" /></div>
          <div><Label>Biaya (IDR)</Label><Input type="number" value={cost} onChange={(e) => setCost(e.target.value)} /></div>
        </div>
        <div><Label>Calibrated by</Label>
          <Select value={tech} onChange={(e) => setTech(e.target.value)}>{s.technicians.map((t) => <option key={t.id} value={t.id}>{t.name} — {t.cert}</option>)}</Select>
        </div>
        <div>
          <Label>Kalibrasi berikutnya (jadwal aktif — BR-011)</Label>
          <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          <p className="mt-1 font-mono text-[10.5px] text-mute">Cadence reminder: 90/60/30/14/7 hari sebelum jatuh tempo → {due ? fmtDate(new Date(due).toISOString()) : "—"}</p>
        </div>
        {result === "FAIL" && <p className="rounded-md bg-dangerbg px-3 py-2 text-xs font-semibold text-danger">Hasil FAIL: calStatus → FAILED, notifikasi eskalasi dikirim, equipment ditahan dari layanan.</p>}
        {err && <p className="rounded-md bg-dangerbg px-3 py-2 text-xs font-semibold text-danger">{err}</p>}
      </div>
    </Modal>
  );
}

/* ── Inspection checklist ── */
const DEFAULT_CHECK = ["Grounding resistance", "Leakage current", "Kabel & plug", "Fisik & kebersihan", "Label aset & QR"];
export function InspectionModal({ eqId, onClose }: { eqId: string | null; onClose: () => void }) {
  const { s, addInspection } = useApp();
  const eq = s.equipment.find((e) => e.id === eqId);
  const [checks, setChecks] = useState<{ item: string; pass: boolean }[]>(DEFAULT_CHECK.map((item) => ({ item, pass: true })));
  const [inspector, setInspector] = useState("Fajar Nugroho");
  const [note, setNote] = useState("");
  const [nextDue, setNextDue] = useState(() => new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10));
  const [err, setErr] = useState("");

  useEffect(() => { if (eqId) { setChecks(DEFAULT_CHECK.map((item) => ({ item, pass: true }))); setErr(""); setNote(""); } }, [eqId]);

  const failed = checks.filter((c) => !c.pass).length;
  const result = failed === 0 ? "PASS" : failed <= 1 ? "CONDITIONAL" : "FAIL";

  const submit = () => {
    if (!eq) return;
    if (!note.trim()) return setErr("Catatan inspeksi wajib diisi.");
    addInspection(eq.id, inspector, checks, result, note.trim(), new Date(nextDue + "T09:00:00").toISOString());
    onClose();
  };

  return (
    <Modal open={!!eq} onClose={onClose} wide kicker="Asset inspection · BR-017" title={eq ? `Inspeksi — ${eq.name}` : ""}
      footer={<><BtnGhost onClick={onClose}>Batal</BtnGhost><BtnPrimary onClick={submit}><IcShield size={13} /> Catat inspeksi ({result})</BtnPrimary></>}>
      <div className="space-y-3.5">
        <div className="space-y-1.5">
          <Label>Checklist</Label>
          {checks.map((c, i) => (
            <div key={i} className="flex items-center justify-between rounded-md border border-line bg-card px-3 py-2">
              <span className="text-[12.5px] font-semibold text-ink">{c.item}</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button onClick={() => setChecks(checks.map((x, j) => (j === i ? { ...x, pass: true } : x)))}
                  className={`rounded px-2.5 py-1 font-mono text-[10.5px] font-bold transition ${c.pass ? "bg-okbg text-ok" : "bg-moss text-mute hover:text-ink"}`}>PASS</button>
                <button onClick={() => setChecks(checks.map((x, j) => (j === i ? { ...x, pass: false } : x)))}
                  className={`rounded px-2.5 py-1 font-mono text-[10.5px] font-bold transition ${!c.pass ? "bg-dangerbg text-danger" : "bg-moss text-mute hover:text-ink"}`}>FAIL</button>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Inspector</Label>
            <Select value={inspector} onChange={(e) => setInspector(e.target.value)}>{s.technicians.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}</Select>
          </div>
          <div><Label>Inspeksi berikutnya</Label><Input type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} /></div>
        </div>
        <div><Label>Catatan *</Label><TextArea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Temuan, pengukuran, rekomendasi…" /></div>
        <p className="rounded-md bg-canvas/60 px-3 py-2 text-[11.5px] text-ink2">
          Hasil terhitung: <Chip tone={result === "PASS" ? "ok" : result === "CONDITIONAL" ? "warn" : "danger"} dot>{result}</Chip>
          <span className="ml-2 font-mono text-[10.5px] text-mute">{checks.length - failed}/{checks.length} item lolos · kondisi aset dicatat ke condition history</span>
        </p>
        {err && <p className="rounded-md bg-dangerbg px-3 py-2 text-xs font-semibold text-danger">{err}</p>}
      </div>
    </Modal>
  );
}
