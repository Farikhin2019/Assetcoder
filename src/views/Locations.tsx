import { useMemo, useState } from "react";
import { useApp } from "../lib/store";
import { Card, Chip, SectionHead, BtnSm, BtnPrimary, BtnGhost, Modal, Input, Label, Select, EmptyState, MonoTag } from "../components/ui";
import { fmtIDRCompact } from "../lib/types";
import { Building2, MapPin, Layers, DoorOpen, Users, Plus, Pencil, Trash2, ChevronRight } from "lucide-react";

type Sel = { kind: "hospital" | "building" | "floor" | "room" | "unit"; id: string } | null;

export default function Locations() {
  const { s, nav, locSave, locDelete } = useApp();
  const [sel, setSel] = useState<Sel>(null);
  const [edit, setEdit] = useState<Sel & { isNew?: boolean } | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const canEdit = ["Pengelola Aset", "Umum", "IT Administrator", "Direksi", "COO"].includes(s.role);

  const assetsInRoom = (roomName: string, buildingName: string) =>
    s.equipment.filter((e) => e.opStatus !== "RETIRED" && e.opStatus !== "DISPOSED" && e.building === buildingName && e.room === roomName);

  const selected = useMemo(() => {
    if (!sel) return null;
    if (sel.kind === "hospital") return s.hospitals.find((x) => x.id === sel.id);
    if (sel.kind === "building") return s.buildings.find((x) => x.id === sel.id);
    if (sel.kind === "floor") return s.floors.find((x) => x.id === sel.id);
    if (sel.kind === "room") return s.rooms.find((x) => x.id === sel.id);
    return s.units.find((x) => x.id === sel.id);
  }, [sel, s]);

  const openNew = (kind: Sel extends null ? never : NonNullable<Sel>["kind"]) => {
    setForm({});
    setEdit({ kind, id: "", isNew: true });
  };
  const openEdit = () => {
    if (!sel || !selected) return;
    const rec = selected as unknown as Record<string, string | number | boolean>;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(rec)) out[k] = String(v ?? "");
    setForm(out);
    setEdit({ ...sel });
  };
  const save = () => {
    if (!edit) return;
    if (!form.name && edit.kind !== "hospital") { locSave(edit.kind, edit.isNew ? undefined : edit.id, form); setEdit(null); return; }
    locSave(edit.kind, edit.isNew ? undefined : edit.id, form);
    setEdit(null);
  };

  const titleOf = (k: string) => k === "hospital" ? "Fasilitas / RS" : k === "building" ? "Gedung" : k === "floor" ? "Lantai" : k === "room" ? "Ruangan" : "Unit";

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Lokasi & Organisasi</h1>
          <p className="text-xs text-mute">Susunan: Organisasi → Rumah Sakit → Gedung → Lantai → Ruangan → Unit · <b className="text-pine-700">satu aset hanya berada di satu lokasi aktif</b></p>
        </div>
        <Chip tone="pine" dot>{s.equipment.length} aset terpetakan</Chip>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
        {/* pohon struktur */}
        <Card className="p-4 lg:col-span-2">
          <SectionHead title="Struktur lokasi" sub="Klik simpul untuk melihat detail & aset di dalamnya" />
          <div className="space-y-3">
            {s.hospitals.map((h) => (
              <div key={h.id}>
                <button onClick={() => setSel({ kind: "hospital", id: h.id })} className={`flex w-full items-center gap-2 rounded-md border px-2.5 py-2 text-left transition ${sel?.id === h.id ? "border-pine-600 bg-pine-50" : "border-line bg-card hover:border-pine-500/40"}`}>
                  <Building2 size={15} className="text-pine-600" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-bold text-ink">{h.name}{h.main && <span className="ml-1.5 font-mono text-[8.5px] text-warn">· PUSAT</span>}</span>
                    <span className="block font-mono text-[9px] text-mute">{h.kind}</span>
                  </span>
                  <StatusChipMini status={h.status} />
                </button>
                <div className="ml-4 mt-1.5 space-y-1.5 border-l border-line pl-3">
                  {s.buildings.filter((b) => b.hospitalId === h.id).map((b) => {
                    const bAssets = s.equipment.filter((e) => e.opStatus !== "RETIRED" && e.opStatus !== "DISPOSED" && e.building === b.name).length;
                    return (
                      <div key={b.id}>
                        <button onClick={() => setSel({ kind: "building", id: b.id })} className={`flex w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-left transition ${sel?.id === b.id ? "border-pine-600 bg-pine-50" : "border-line bg-card hover:border-pine-500/40"}`}>
                          <MapPin size={13} className="text-pine-600" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[12px] font-bold text-ink">{b.name} <span className="font-medium text-mute">— {b.label}</span></span>
                            <span className="block font-mono text-[8.5px] text-mute">{s.floors.filter((f) => f.buildingId === b.id).length} lantai · {bAssets} aset</span>
                          </span>
                          <StatusChipMini status={b.status} />
                        </button>
                        <div className="ml-4 mt-1.5 space-y-1 border-l border-line pl-3">
                          {s.floors.filter((f) => f.buildingId === b.id).map((f) => {
                            const fRooms = s.rooms.filter((r) => r.floorId === f.id);
                            return (
                              <div key={f.id}>
                                <button onClick={() => setSel({ kind: "floor", id: f.id })} className={`flex w-full items-center gap-2 rounded-md border px-2 py-1 text-left transition ${sel?.id === f.id ? "border-pine-600 bg-pine-50" : "border-line bg-card hover:border-pine-500/40"}`}>
                                  <Layers size={12} className="text-mute" />
                                  <span className="flex-1 text-[11.5px] font-semibold text-ink2">{f.name}</span>
                                  <span className="font-mono text-[8.5px] text-mute">{fRooms.length} ruangan</span>
                                </button>
                                <div className="ml-4 mt-1 space-y-1 border-l border-line pl-3">
                                  {fRooms.map((r) => {
                                    const rAssets = assetsInRoom(r.name, b.name).length;
                                    return (
                                      <button key={r.id} onClick={() => setSel({ kind: "room", id: r.id })} className={`flex w-full items-center gap-2 rounded-md border px-2 py-1 text-left transition ${sel?.id === r.id ? "border-pine-600 bg-pine-50" : "border-line bg-card hover:border-pine-500/40"}`}>
                                        <DoorOpen size={11} className="text-mute" />
                                        <span className="flex-1 truncate text-[11px] font-semibold text-ink2">{r.name}</span>
                                        {rAssets > 0 && <span className="rounded bg-pine-100 px-1 font-mono text-[8.5px] font-bold text-pine-700">{rAssets}</span>}
                                      </button>
                                    );
                                  })}
                                  <button onClick={() => { setForm({ buildingId: b.id, floorId: f.id }); setEdit({ kind: "room", id: "", isNew: true }); }} className="flex w-full items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[9px] font-bold text-mute transition hover:text-pine-700"><Plus size={10} /> ruangan</button>
                                </div>
                              </div>
                            );
                          })}
                          <button onClick={() => { setForm({ buildingId: b.id }); setEdit({ kind: "floor", id: "", isNew: true }); }} className="flex w-full items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[9px] font-bold text-mute transition hover:text-pine-700"><Plus size={10} /> lantai</button>
                        </div>
                      </div>
                    );
                  })}
                  <button onClick={() => { setForm({ hospitalId: h.id }); setEdit({ kind: "building", id: "", isNew: true }); }} className="flex w-full items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[9px] font-bold text-mute transition hover:text-pine-700"><Plus size={10} /> gedung</button>
                </div>
              </div>
            ))}
            {canEdit && <button onClick={() => openNew("hospital")} className="flex items-center gap-1.5 rounded-md border border-dashed border-line2 px-3 py-2 font-display text-[11.5px] font-bold text-mute transition hover:border-pine-500/50 hover:text-pine-700"><Plus size={13} /> Tambah fasilitas</button>}

            <div className="border-t border-line pt-3">
              <p className="mb-1.5 flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-widest text-mute"><Users size={11} /> Unit organisasi</p>
              <div className="flex flex-wrap gap-1.5">
                {s.units.map((u) => {
                  const uAssets = s.equipment.filter((e) => e.opStatus !== "RETIRED" && e.opStatus !== "DISPOSED" && e.unit === u.name).length;
                  return (
                    <button key={u.id} onClick={() => setSel({ kind: "unit", id: u.id })} className={`rounded-md border px-2 py-1 text-[11px] font-bold transition ${sel?.id === u.id ? "border-pine-600 bg-pine-50 text-pine-700" : "border-line bg-card text-ink2 hover:border-pine-500/40"}`}>
                      {u.name}{uAssets > 0 && <span className="ml-1 font-mono text-[8.5px] text-mute">{uAssets}</span>}
                    </button>
                  );
                })}
                {canEdit && <button onClick={() => openNew("unit")} className="flex items-center gap-1 rounded-md border border-dashed border-line2 px-2 py-1 text-[11px] font-bold text-mute hover:text-pine-700"><Plus size={11} /> unit</button>}
              </div>
            </div>
          </div>
        </Card>

        {/* detail */}
        <Card className="p-4 lg:col-span-3">
          {!sel || !selected ? (
            <EmptyState title="Pilih simpul di struktur" sub="Detail, daftar aset, dan aksi edit/hapus muncul di sini." />
          ) : (
            <div>
              <SectionHead
                title={String((selected as { name: string }).name)}
                sub={`${titleOf(sel.kind)} · ${s[sel.kind === "hospital" ? "hospitals" : sel.kind === "building" ? "buildings" : sel.kind === "floor" ? "floors" : sel.kind === "room" ? "rooms" : "units"].length} total`}
                right={canEdit ? (
                  <div className="flex gap-1.5">
                    <BtnSm onClick={openEdit}><Pencil size={11} /> Edit</BtnSm>
                    <BtnSm onClick={() => locDelete(sel.kind, sel.id)} className="!border-danger/50 !text-danger"><Trash2 size={11} /> Hapus</BtnSm>
                  </div>
                ) : <Chip tone="warn">read-only</Chip>}
              />

              {sel.kind === "hospital" && (() => { const h = selected as (typeof s.hospitals)[0]; return (
                <div className="space-y-2">
                  <InfoRow k="Kode" v={h.code} /><InfoRow k="Jenis" v={h.kind} /><InfoRow k="Alamat" v={h.address} /><InfoRow k="Status" v={h.status} />
                  <InfoRow k="Gedung" v={`${s.buildings.filter((b) => b.hospitalId === h.id).length} gedung`} />
                </div>
              ); })()}
              {sel.kind === "building" && (() => { const b = selected as (typeof s.buildings)[0]; const bAssets = s.equipment.filter((e) => e.building === b.name && e.opStatus !== "RETIRED" && e.opStatus !== "DISPOSED"); return (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <InfoRow k="Label" v={b.label} /><InfoRow k="Tahun" v={String(b.year)} />
                    <InfoRow k="Status" v={b.status} /><InfoRow k="Lantai" v={`${s.floors.filter((f) => f.buildingId === b.id).length}`} />
                  </div>
                  <p className="text-[11.5px] text-mute">{b.note}</p>
                  <AssetList assets={bAssets} nav={nav} />
                </div>
              ); })()}
              {sel.kind === "floor" && (() => { const f = selected as (typeof s.floors)[0]; const b = s.buildings.find((x) => x.id === f.buildingId); const fAssets = s.equipment.filter((e) => e.building === b?.name && e.floor === f.name && e.opStatus !== "RETIRED" && e.opStatus !== "DISPOSED"); return (
                <div className="space-y-3">
                  <InfoRow k="Gedung" v={b?.name ?? "—"} />
                  <InfoRow k="Ruangan" v={`${s.rooms.filter((r) => r.floorId === f.id).length}`} />
                  <AssetList assets={fAssets} nav={nav} />
                </div>
              ); })()}
              {sel.kind === "room" && (() => { const r = selected as (typeof s.rooms)[0]; const b = s.buildings.find((x) => x.id === r.buildingId); const rAssets = assetsInRoom(r.name, b?.name ?? ""); return (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <InfoRow k="Gedung" v={b?.name ?? "—"} />
                    <InfoRow k="Lantai" v={s.floors.find((f) => f.id === r.floorId)?.name ?? "—"} />
                    <InfoRow k="Unit penanggung jawab" v={r.unit} />
                    <InfoRow k="Aset aktif" v={String(rAssets.length)} />
                  </div>
                  <AssetList assets={rAssets} nav={nav} />
                </div>
              ); })()}
              {sel.kind === "unit" && (() => { const u = selected as (typeof s.units)[0]; const uAssets = s.equipment.filter((e) => e.unit === u.name && e.opStatus !== "RETIRED" && e.opStatus !== "DISPOSED"); return (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <InfoRow k="Kepala unit" v={u.head} />
                    <InfoRow k="Aset aktif" v={String(uAssets.length)} />
                    <InfoRow k="Nilai aset" v={fmtIDRCompact(uAssets.reduce((a, e) => a + e.acqCost, 0))} />
                  </div>
                  <AssetList assets={uAssets} nav={nav} />
                </div>
              ); })()}
            </div>
          )}
        </Card>
      </div>

      {/* modal tambah/edit */}
      <Modal open={!!edit} onClose={() => setEdit(null)} kicker={edit?.isNew ? "Tambah" : "Edit"} title={`${titleOf(edit?.kind ?? "unit")} ${edit?.isNew ? "baru" : ""}`}
        footer={<><BtnGhost onClick={() => setEdit(null)}>Batal</BtnGhost><BtnPrimary onClick={save}>Simpan</BtnPrimary></>}>
        <div className="space-y-3">
          {edit?.kind === "hospital" && (<>
            <div><Label>Nama fasilitas *</Label><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Kode</Label><Input value={form.code ?? ""} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
              <div><Label>Status</Label><Select value={form.status ?? "AKTIF"} onChange={(e) => setForm({ ...form, status: e.target.value })}>{["AKTIF", "RENCANA", "NONAKTIF"].map((x) => <option key={x}>{x}</option>)}</Select></div>
            </div>
            <div><Label>Jenis</Label><Input value={form.kind ?? ""} onChange={(e) => setForm({ ...form, kind: e.target.value })} placeholder="RS Umum · Kelas B" /></div>
            <div><Label>Alamat</Label><Input value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          </>)}
          {edit?.kind === "building" && (<>
            <div><Label>Nama gedung *</Label><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Gedung F" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Label</Label><Input value={form.label ?? ""} onChange={(e) => setForm({ ...form, label: e.target.value })} /></div>
              <div><Label>Tahun</Label><Input type="number" value={form.year ?? ""} onChange={(e) => setForm({ ...form, year: e.target.value })} /></div>
            </div>
            <div><Label>Status</Label><Select value={form.status ?? "ACTIVE"} onChange={(e) => setForm({ ...form, status: e.target.value })}>{["ACTIVE", "PLANNED", "UNDER_RENOVATION", "INACTIVE"].map((x) => <option key={x}>{x}</option>)}</Select></div>
            <div><Label>Catatan</Label><Input value={form.note ?? ""} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
          </>)}
          {edit?.kind === "floor" && (<>
            <div><Label>Nama lantai *</Label><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Lantai 4" /></div>
            <div><Label>Gedung</Label>
              <Select value={form.buildingId ?? ""} onChange={(e) => setForm({ ...form, buildingId: e.target.value })}>
                {s.buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
            </div>
          </>)}
          {edit?.kind === "room" && (<>
            <div><Label>Nama ruangan *</Label><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ICU Bed 08" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Gedung</Label><Select value={form.buildingId ?? ""} onChange={(e) => setForm({ ...form, buildingId: e.target.value })}>{s.buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></div>
              <div><Label>Lantai</Label><Select value={form.floorId ?? ""} onChange={(e) => setForm({ ...form, floorId: e.target.value })}>{s.floors.filter((f) => f.buildingId === form.buildingId).map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</Select></div>
            </div>
            <div><Label>Unit penanggung jawab</Label><Input value={form.unit ?? ""} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
          </>)}
          {edit?.kind === "unit" && (<>
            <div><Label>Nama unit *</Label><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Farmasi" /></div>
            <div><Label>Kepala unit</Label><Input value={form.head ?? ""} onChange={(e) => setForm({ ...form, head: e.target.value })} /></div>
          </>)}
          <p className="rounded-md bg-infobg px-3 py-2 text-[10.5px] font-semibold text-info">Simpul yang masih memiliki anak/aset aktif tidak bisa dihapus — menjaga aturan satu aset = satu lokasi aktif.</p>
        </div>
      </Modal>
    </div>
  );
}

function InfoRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-canvas/60 px-2.5 py-1.5">
      <span className="font-mono text-[9.5px] font-bold uppercase text-mute">{k}</span>
      <span className="text-[11.5px] font-semibold text-ink2">{v}</span>
    </div>
  );
}
function StatusChipMini({ status }: { status: string }) {
  const tone = status === "AKTIF" || status === "ACTIVE" ? "text-ok bg-okbg" : status === "RENCANA" || status === "PLANNED" ? "text-info bg-infobg" : "text-warn bg-warnbg";
  return <span className={`rounded px-1.5 py-0.5 font-mono text-[8.5px] font-bold ${tone}`}>{status}</span>;
}
function AssetList({ assets, nav }: { assets: { id: string; code: string; name: string; room: string; opStatus: string }[]; nav: (v: never, id?: string) => void }) {
  if (assets.length === 0) return <p className="rounded-md border border-dashed border-line2 px-3 py-4 text-center text-[11px] text-mute">Tidak ada aset aktif di sini.</p>;
  return (
    <div className="space-y-1.5">
      {assets.map((e) => (
        <button key={e.id} onClick={() => nav("equipment-detail" as never, e.id)} className="flex w-full items-center justify-between gap-2 rounded-md border border-line bg-paper px-3 py-2 text-left transition hover:border-pine-500/50 hover:shadow-sm">
          <span className="min-w-0">
            <span className="block truncate text-[12px] font-bold text-ink">{e.name}</span>
            <span className="block font-mono text-[9.5px] text-mute">{e.code} · {e.room}</span>
          </span>
          <ChevronRight size={13} className="shrink-0 text-mute" />
        </button>
      ))}
    </div>
  );
}
