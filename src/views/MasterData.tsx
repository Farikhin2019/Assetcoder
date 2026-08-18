import { useState } from "react";
import { useApp } from "../lib/store";
import { BtnPrimary, BtnGhost, Card, Chip, Input, Label, Modal, MonoTag, Select, StatusChip, Tabs, TextArea } from "../components/ui";
import { IcBox, IcPlus, IcTruck, IcWrench } from "../components/icons";
import { daysUntil, fmtDate } from "../lib/types";

const canEditMaster = (role: string) => ["Pengelola Aset", "Kepala Teknisi", "Kepala Gudang", "IT Administrator", "Direksi"].includes(role);

export default function MasterData() {
  const { s, nav, addTechnician, addSupplier, addAccessory } = useApp();
  const [tab, setTab] = useState("tech");
  const [modal, setModal] = useState<"" | "tech" | "sup" | "acc">("");
  const editable = canEditMaster(s.role);

  const [tf, setTf] = useState({ name: "", specialty: "", cert: "", phone: "", vendor: false });
  const [tErr, setTErr] = useState("");
  const submitTech = () => {
    if (tf.name.trim().length < 3) return setTErr("Nama teknisi wajib diisi.");
    if (!tf.specialty.trim()) return setTErr("Spesialisasi wajib diisi.");
    addTechnician({ name: tf.name.trim(), specialty: tf.specialty.trim(), cert: tf.cert.trim() || "Dalam sertifikasi", phone: tf.phone.trim() || "—", vendor: tf.vendor });
    setTf({ name: "", specialty: "", cert: "", phone: "", vendor: false }); setTErr(""); setModal("");
  };

  const [sf, setSf] = useState({ name: "", service: "", contractUntil: new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10), contact: "" });
  const [sErr, setSErr] = useState("");
  const submitSup = () => {
    if (sf.name.trim().length < 3) return setSErr("Nama supplier wajib diisi.");
    if (!sf.service.trim()) return setSErr("Lingkup layanan wajib diisi.");
    addSupplier({ name: sf.name.trim(), service: sf.service.trim(), contractUntil: new Date(sf.contractUntil + "T09:00:00").toISOString(), contact: sf.contact.trim() || "—" });
    setSf({ name: "", service: "", contractUntil: new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10), contact: "" }); setSErr(""); setModal("");
  };

  const [af, setAf] = useState({ name: "", eqId: s.equipment[0]?.id ?? "", qty: "1", condition: "GOOD", note: "" });
  const [aErr, setAErr] = useState("");
  const submitAcc = () => {
    if (af.name.trim().length < 3) return setAErr("Nama aksesori wajib diisi.");
    if (!(Number(af.qty) > 0)) return setAErr("Jumlah harus > 0.");
    addAccessory({ name: af.name.trim(), eqId: af.eqId, qty: Number(af.qty), condition: af.condition as "GOOD", note: af.note.trim() || "—" });
    setAf({ name: "", eqId: s.equipment[0]?.id ?? "", qty: "1", condition: "GOOD", note: "" }); setAErr(""); setModal("");
  };

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Master Data</h1>
          <p className="text-xs text-mute">Technician DB · Supplier DB · Accessories — configuration over hardcoding, no hard-delete</p>
        </div>
        {!editable && <Chip tone="warn" dot>READ-ONLY — role {s.role}</Chip>}
      </div>

      <Card className="p-4">
        <Tabs active={tab} onChange={setTab}
          tabs={[{ id: "tech", label: "Teknisi" }, { id: "sup", label: "Supplier" }, { id: "acc", label: "Aksesori" }]}
          counts={{ tech: s.technicians.length, sup: s.suppliers.length, acc: s.accessories.length }} />
        <div className="pt-4">
          {tab === "tech" && (
            <div>
              <div className="mb-3 flex justify-end">
                <BtnPrimary disabled={!editable} title={!editable ? "Butuh role Pengelola Aset / Kepala Teknisi" : undefined} onClick={() => setModal("tech")}><IcPlus size={13} /> Tambah teknisi</BtnPrimary>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {s.technicians.map((t, i) => {
                  const openWo = s.workOrders.filter((w) => w.techId === t.id && w.status !== "CLOSED").length;
                  return (
                    <div key={t.id} className="row-in rounded-lg border border-line bg-paper p-3.5 transition hover:border-pine-500/40 hover:shadow-md" style={{ animationDelay: `${i * 50}ms` }}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className={`flex h-9 w-9 items-center justify-center rounded-md ${t.vendor ? "bg-warnbg text-warn" : "bg-pine-100 text-pine-700"}`}><IcWrench size={15} /></span>
                          <div>
                            <p className="text-[13px] font-bold text-ink">{t.name}</p>
                            <p className="font-mono text-[10px] text-mute">{t.id} · {t.phone}</p>
                          </div>
                        </div>
                        {t.vendor ? <Chip tone="warn">VENDOR</Chip> : <Chip tone="pine">INTERNAL</Chip>}
                      </div>
                      <p className="mt-2 text-[12px] text-ink2">{t.specialty}</p>
                      <p className="mt-1 font-mono text-[10.5px] text-mute">{t.cert}</p>
                      <div className="mt-2.5 flex items-center justify-between border-t border-line pt-2">
                        <span className="font-mono text-[10.5px] text-mute">{openWo} WO aktif</span>
                        <Chip tone={openWo > 0 ? "info" : "neutral"} dot>{openWo > 0 ? "ON DUTY" : "STANDBY"}</Chip>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "sup" && (
            <div>
              <div className="mb-3 flex justify-end">
                <BtnPrimary disabled={!editable} title={!editable ? "Butuh role Pengelola Aset / Kepala Gudang" : undefined} onClick={() => setModal("sup")}><IcPlus size={13} /> Tambah supplier</BtnPrimary>
              </div>
              <div className="overflow-x-auto rounded-md border border-line">
                <table className="w-full min-w-[820px] text-left">
                  <thead>
                    <tr className="border-b border-line bg-canvas/70 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">
                      <th className="px-3 py-2.5">Supplier</th><th className="px-3 py-2.5">Layanan</th><th className="px-3 py-2.5">Kontak</th>
                      <th className="px-3 py-2.5">Kontrak s.d.</th><th className="px-3 py-2.5">Status kontrak</th><th className="px-3 py-2.5 text-right">Equipment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {s.suppliers.map((sp) => {
                      const dd = daysUntil(sp.contractUntil);
                      const eqCount = s.equipment.filter((e) => e.supplierId === sp.id).length;
                      return (
                        <tr key={sp.id} className="transition hover:bg-pine-50/60">
                          <td className="px-3 py-2.5"><p className="text-[12.5px] font-bold text-ink">{sp.name}</p><p className="font-mono text-[10px] text-mute">{sp.id}</p></td>
                          <td className="px-3 py-2.5 text-[12px] text-ink2">{sp.service}</td>
                          <td className="px-3 py-2.5 font-mono text-[10.5px] text-ink2">{sp.contact ?? "—"}</td>
                          <td className="px-3 py-2.5 font-mono text-[11px] text-ink2">{fmtDate(sp.contractUntil)}</td>
                          <td className="px-3 py-2.5">{dd < 0 ? <Chip tone="danger" dot pulse>EXPIRED</Chip> : dd < 60 ? <Chip tone="warn" dot>{dd} HARI</Chip> : <Chip tone="ok" dot>AKTIF</Chip>}</td>
                          <td className="num px-3 py-2.5 text-right font-mono text-[11px] text-ink2">{eqCount} unit</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 font-mono text-[10.5px] text-mute">Kontrak kurang dari 60 hari memicu event CONTRACT_EXPIRING ke notification engine.</p>
            </div>
          )}

          {tab === "acc" && (
            <div>
              <div className="mb-3 flex justify-end">
                <BtnPrimary disabled={!editable} title={!editable ? "Butuh role Pengelola Aset" : undefined} onClick={() => setModal("acc")}><IcPlus size={13} /> Tambah aksesori</BtnPrimary>
              </div>
              <div className="overflow-x-auto rounded-md border border-line">
                <table className="w-full min-w-[820px] text-left">
                  <thead>
                    <tr className="border-b border-line bg-canvas/70 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">
                      <th className="px-3 py-2.5">Aksesori</th><th className="px-3 py-2.5">Equipment induk</th><th className="px-3 py-2.5 text-right">Qty</th>
                      <th className="px-3 py-2.5">Kondisi</th><th className="px-3 py-2.5">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {s.accessories.map((ac) => {
                      const eq = s.equipment.find((e) => e.id === ac.eqId);
                      return (
                        <tr key={ac.id} className="transition hover:bg-pine-50/60">
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-moss text-ink2"><IcBox size={14} /></span>
                              <div><p className="text-[12.5px] font-bold text-ink">{ac.name}</p><p className="font-mono text-[10px] text-mute">{ac.code}</p></div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            {eq ? (
                              <button onClick={() => nav("equipment-detail", eq.id)} className="text-left">
                                <p className="text-[12px] font-bold text-pine-700 hover:underline">{eq.name}</p>
                                <MonoTag>{eq.code}</MonoTag>
                              </button>
                            ) : "—"}
                          </td>
                          <td className="num px-3 py-2.5 text-right font-mono text-[12px] font-bold text-ink">{ac.qty}</td>
                          <td className="px-3 py-2.5"><StatusChip status={ac.condition} /></td>
                          <td className="px-3 py-2.5 text-[11.5px] text-mute">{ac.note}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Card>

      <div className="flex flex-wrap gap-1.5">
        {["Alkes Habis Pakai", "Infus & Cairan", "Reagen Lab", "ATK Medis", "box", "pcs", "set", "pack", "flabot", "roll", "FIFO", "FEFO"].map((c) => (
          <span key={c} className="rounded border border-line bg-card px-2 py-0.5 font-mono text-[10px] font-semibold text-mute">{c}</span>
        ))}
        <span className="self-center ml-1 font-mono text-[10px] text-mute">← item categories & UoM (config-driven)</span>
      </div>

      <Modal open={modal === "tech"} onClose={() => setModal("")} kicker="Technician DB" title="Teknisi baru"
        footer={<><BtnGhost onClick={() => setModal("")}>Batal</BtnGhost><BtnPrimary onClick={submitTech}><IcPlus size={13} /> Simpan</BtnPrimary></>}>
        <div className="space-y-3">
          <div><Label>Nama *</Label><Input value={tf.name} onChange={(e) => setTf({ ...tf, name: e.target.value })} placeholder="cth: Rizal Mahendra" /></div>
          <div><Label>Spesialisasi *</Label><Input value={tf.specialty} onChange={(e) => setTf({ ...tf, specialty: e.target.value })} placeholder="cth: Imaging (CT / X-Ray)" /></div>
          <div><Label>Sertifikasi</Label><Input value={tf.cert} onChange={(e) => setTf({ ...tf, cert: e.target.value })} placeholder="cth: CRES/BME-2" /></div>
          <div><Label>Telepon</Label><Input value={tf.phone} onChange={(e) => setTf({ ...tf, phone: e.target.value })} placeholder="08xx-xxxx-xxxx" /></div>
          <label className="flex cursor-pointer items-center gap-2.5 rounded-md border border-line bg-canvas/50 px-3 py-2.5">
            <input type="checkbox" checked={tf.vendor} onChange={(e) => setTf({ ...tf, vendor: e.target.checked })} className="h-4 w-4 accent-pine-600" />
            <span className="text-[12.5px] text-ink2">Teknisi vendor (pihak principal / distributor)</span>
          </label>
          {tErr && <p className="rounded-md bg-dangerbg px-3 py-2 text-xs font-semibold text-danger">{tErr}</p>}
        </div>
      </Modal>

      <Modal open={modal === "sup"} onClose={() => setModal("")} kicker="Supplier DB" title="Supplier baru"
        footer={<><BtnGhost onClick={() => setModal("")}>Batal</BtnGhost><BtnPrimary onClick={submitSup}><IcPlus size={13} /> Simpan</BtnPrimary></>}>
        <div className="space-y-3">
          <div><Label>Nama supplier *</Label><Input value={sf.name} onChange={(e) => setSf({ ...sf, name: e.target.value })} placeholder="cth: PT Alkes Nusantara" /></div>
          <div><Label>Lingkup layanan *</Label><TextArea value={sf.service} onChange={(e) => setSf({ ...sf, service: e.target.value })} placeholder="cth: Ventilator & monitoring — parts & service contract" /></div>
          <div><Label>Kontrak s.d.</Label><Input type="date" value={sf.contractUntil} onChange={(e) => setSf({ ...sf, contractUntil: e.target.value })} /></div>
          <div><Label>Kontak</Label><Input value={sf.contact} onChange={(e) => setSf({ ...sf, contact: e.target.value })} placeholder="PIC / telepon / email" /></div>
          {sErr && <p className="rounded-md bg-dangerbg px-3 py-2 text-xs font-semibold text-danger">{sErr}</p>}
        </div>
      </Modal>

      <Modal open={modal === "acc"} onClose={() => setModal("")} kicker="Equipment accessories" title="Aksesori baru"
        footer={<><BtnGhost onClick={() => setModal("")}>Batal</BtnGhost><BtnPrimary onClick={submitAcc}><IcPlus size={13} /> Simpan</BtnPrimary></>}>
        <div className="space-y-3">
          <div><Label>Nama aksesori *</Label><Input value={af.name} onChange={(e) => setAf({ ...af, name: e.target.value })} placeholder="cth: Probe suhu tambahan" /></div>
          <div><Label>Equipment induk</Label>
            <Select value={af.eqId} onChange={(e) => setAf({ ...af, eqId: e.target.value })}>{s.equipment.map((e) => <option key={e.id} value={e.id}>{e.name} — {e.code}</option>)}</Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Jumlah *</Label><Input type="number" value={af.qty} onChange={(e) => setAf({ ...af, qty: e.target.value })} /></div>
            <div><Label>Kondisi</Label><Select value={af.condition} onChange={(e) => setAf({ ...af, condition: e.target.value })}>{["EXCELLENT", "GOOD", "FAIR", "POOR"].map((c) => <option key={c}>{c}</option>)}</Select></div>
          </div>
          <div><Label>Catatan</Label><TextArea value={af.note} onChange={(e) => setAf({ ...af, note: e.target.value })} placeholder="Jadwal penggantian, lokasi penyimpanan…" /></div>
          {aErr && <p className="rounded-md bg-dangerbg px-3 py-2 text-xs font-semibold text-danger">{aErr}</p>}
        </div>
      </Modal>

      <p className="font-mono text-[10.5px] text-mute">Perubahan master data tercatat di audit trail (entity: technician / supplier / equipment_accessory).</p>
    </div>
  );
}
