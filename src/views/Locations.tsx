import { useMemo, useState } from "react";
import { useApp } from "../lib/store";
import { BtnDanger, BtnGhost, BtnPrimary, BtnSm, Card, Chip, EmptyState, Input, Label, Modal, SectionHead, Select, StatusChip } from "../components/ui";
import { fmtIDRCompact } from "../lib/types";
import { Building2, Cross as HospitalIcon, Layers, Pencil, Plus, Trash2, Users } from "lucide-react";

type Kind = "hospital" | "building" | "floor" | "room" | "unit";
type Sel = { kind: Kind; id: string } | null;

const KIND_LABEL: Record<Kind, string> = { hospital: "Fasilitas", building: "Gedung", floor: "Lantai", room: "Ruangan", unit: "Unit" };

export default function Locations() {
  const { s, nav, locSave, locDelete } = useApp();
  const [sel, setSel] = useState<Sel>(null);
  const [editing, setEditing] = useState<Sel & { isNew?: boolean } | null>(null);

  const activeEq = s.equipment.filter((e) => e.opStatus !== "RETIRED" && e.opStatus !== "DISPOSED");
  const eqInRoom = (roomName: string) => activeEq.filter((e) => e.room === roomName);
  const eqInUnit = (unitName: string) => activeEq.filter((e) => e.unit === unitName);

  /* ringkasan per gedung */
  const bldStats = useMemo(() => s.buildings.map((b) => ({
    ...b,
    floors: s.floors.filter((f) => f.buildingId === b.id),
    rooms: s.rooms.filter((r) => r.buildingId === b.id),
    assets: activeEq.filter((e) => e.building === b.name),
  })), [s.buildings, s.floors, s.rooms, activeEq]);

  const canEdit = ["Pengelola Aset", "Umum", "IT Administrator", "Direksi", "COO"].includes(s.role);

  const startNew = (kind: Kind, parentId?: string) => {
    setEditing({ kind, id: "", isNew: true, ...(parentId ? { parent: parentId } : {}) } as never);
  };

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Lokasi & Organisasi</h1>
          <p className="text-xs text-mute">Susunan: Organisasi → Rumah Sakit → Gedung → Lantai → Ruangan → Unit · <b className="text-pine-700">satu aset hanya berada di satu lokasi aktif</b></p>
        </div>
        <div className="flex gap-2">
          <Chip tone="pine" dot>{activeEq.length} aset terpetakan</Chip>
          {!canEdit && <Chip tone="warn" dot>READ-ONLY — {s.role}</Chip>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* ── tree ── */}
        <Card className="p-4 lg:col-span-2">
          <SectionHead title="Struktur lokasi" sub="Klik node untuk melihat detail & aset di dalamnya"
            right={canEdit ? <BtnSm onClick={() => startNew("hospital")}><Plus size={12} /> Fasilitas</BtnSm> : undefined} />
          <div className="space-y-3">
            {s.hospitals.map((h) => (
              <div key={h.id}>
                <button onClick={() => setSel({ kind: "hospital", id: h.id })}
                  className={`flex w-full items-center gap-2.5 rounded-md border px-3 py-2.5 text-left transition ${sel?.kind === "hospital" && sel.id === h.id ? "border-pine-600 bg-pine-50" : "border-line bg-paper hover:border-pine-500/50"}`}>
                  <HospitalIcon size={16} className="shrink-0 text-pine-600" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold text-ink">{h.name} {h.main && <Chip tone="pine" className="ml-1 !text-[8px]">PUSAT</Chip>}</span>
                    <span className="block font-mono text-[9.5px] text-mute">{h.code} · {h.kind}</span>
                  </span>
                  <StatusChip status={h.status} />
                </button>

                <div className="ml-5 mt-1.5 space-y-1.5 border-l-2 border-line pl-3">
                  {s.buildings.filter((b) => b.hospitalId === h.id).map((b) => {
                    const st = bldStats.find((x) => x.id === b.id)!;
                    return (
                      <div key={b.id}>
                        <button onClick={() => setSel({ kind: "building", id: b.id })}
                          className={`flex w-full items-center gap-2 rounded-md border px-2.5 py-2 text-left transition ${sel?.kind === "building" && sel.id === b.id ? "border-pine-600 bg-pine-50" : "border-line bg-card hover:border-pine-500/50"}`}>
                          <Building2 size={14} className="shrink-0 text-pine-500" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[12.5px] font-bold text-ink">{b.name} <span className="font-medium text-mute">— {b.label}</span></span>
                            <span className="block font-mono text-[9px] text-mute">{st.floors.length} lantai · {st.rooms.length} ruangan · {st.assets.length} aset · {fmtIDRCompact(st.assets.reduce((a, e) => a + e.acqCost, 0))}</span>
                          </span>
                          <StatusChip status={b.status} />
                        </button>

                        <div className="ml-5 mt-1 space-y-1 border-l border-line pl-3">
                          {st.floors.map((f) => (
                            <button key={f.id} onClick={() => setSel({ kind: "floor", id: f.id })}
                              className={`flex w-full items-center gap-2 rounded border px-2 py-1.5 text-left transition ${sel?.kind === "floor" && sel.id === f.id ? "border-pine-500 bg-pine-50" : "border-transparent hover:border-line hover:bg-paper"}`}>
                              <Layers size={12} className="shrink-0 text-mute" />
                              <span className="flex-1 text-[11.5px] font-semibold text-ink2">{f.name}</span>
                              <span className="font-mono text-[9px] text-mute">{s.rooms.filter((r) => r.floorId === f.id).length} rm</span>
                            </button>
                          ))}
                          {canEdit && (
                            <button onClick={() => startNew("floor", b.id)} className="flex items-center gap-1 px-2 py-1 font-mono text-[9.5px] font-bold text-pine-600 transition hover:text-pine-500"><Plus size={11} /> lantai</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {canEdit && (
                    <button onClick={() => startNew("building", h.id)} className="flex items-center gap-1 px-2 py-1 font-mono text-[9.5px] font-bold text-pine-600 transition hover:text-pine-500"><Plus size={11} /> gedung</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* unit list */}
          <div className="mt-5 border-t border-line pt-4">
            <SectionHead title="Unit organisasi" sub="Unit penanggung jawab aset"
              right={canEdit ? <BtnSm onClick={() => startNew("unit")}><Plus size={12} /> Unit</BtnSm> : undefined} />
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {s.units.map((u) => (
                <button key={u.id} onClick={() => setSel({ kind: "unit", id: u.id })}
                  className={`flex items-center gap-2 rounded-md border px-2.5 py-2 text-left transition ${sel?.kind === "unit" && sel.id === u.id ? "border-pine-600 bg-pine-50" : "border-line bg-card hover:border-pine-500/50"}`}>
                  <Users size={14} className="shrink-0 text-pine-500" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-bold text-ink">{u.name}</span>
                    <span className="block truncate font-mono text-[9px] text-mute">{u.head} · {eqInUnit(u.name).length} aset</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* ── inspector ── */}
        <Inspector sel={sel} canEdit={canEdit} onEdit={(k, id) => setEditing({ kind: k, id })} onDelete={(k, id) => locDelete(k, id)} onNewRoom={(bId) => startNew("room", bId)} navAsset={(id) => nav("equipment-detail", id)} eqInRoom={eqInRoom} />
      </div>

      <FormModal editing={editing} onClose={() => setEditing(null)} onSave={(kind, id, data) => { locSave(kind, id, data); setEditing(null); }} />
    </div>
  );
}

function Inspector({ sel, canEdit, onEdit, onDelete, onNewRoom, navAsset, eqInRoom }: {
  sel: Sel; canEdit: boolean; onEdit: (k: Kind, id: string) => void; onDelete: (k: Kind, id: string) => void;
  onNewRoom: (buildingId: string) => void; navAsset: (id: string) => void; eqInRoom: (r: string) => ReturnType<typeof Array.prototype.filter>;
}) {
  const { s } = useApp();
  if (!sel) return (
    <Card className="flex h-full items-center justify-center p-6">
      <EmptyState title="Pilih node di struktur" sub="Detail, daftar aset, dan aksi edit/hapus muncul di sini." />
    </Card>
  );

  let title = "", sub = "", meta: [string, string][] = [], rooms: typeof s.rooms = [], assets: typeof s.equipment = [];

  if (sel.kind === "hospital") {
    const h = s.hospitals.find((x) => x.id === sel.id)!;
    title = h.name; sub = `${h.code} · ${h.kind}`;
    meta = [["Status", h.status], ["Alamat", h.address], ["Gedung", String(s.buildings.filter((b) => b.hospitalId === h.id).length)]];
  } else if (sel.kind === "building") {
    const b = s.buildings.find((x) => x.id === sel.id)!;
    const eq = s.equipment.filter((e) => e.building === b.name && e.opStatus !== "RETIRED" && e.opStatus !== "DISPOSED");
    title = b.name; sub = b.label;
    meta = [["Status", b.status], ["Tahun", String(b.year)], ["Catatan", b.note], ["Aset aktif", `${eq.length} · ${fmtIDRCompact(eq.reduce((a, e) => a + e.acqCost, 0))}`]];
    rooms = s.rooms.filter((r) => r.buildingId === b.id);
    assets = eq;
  } else if (sel.kind === "floor") {
    const f = s.floors.find((x) => x.id === sel.id)!;
    const b = s.buildings.find((x) => x.id === f.buildingId);
    title = f.name; sub = b?.name ?? "";
    meta = [["Gedung", b?.name ?? "—"], ["Ruangan", String(s.rooms.filter((r) => r.floorId === f.id).length)]];
    rooms = s.rooms.filter((r) => r.floorId === f.id);
  } else if (sel.kind === "room") {
    const r = s.rooms.find((x) => x.id === sel.id)!;
    const b = s.buildings.find((x) => x.id === r.buildingId);
    const f = s.floors.find((x) => x.id === r.floorId);
    title = r.name; sub = `${b?.name} · ${f?.name}`;
    meta = [["Unit", r.unit], ["Aset aktif", String(eqInRoom(r.name).length)]];
    assets = eqInRoom(r.name) as typeof s.equipment;
  } else {
    const u = s.units.find((x) => x.id === sel.id)!;
    const eq = s.equipment.filter((e) => e.unit === u.name && e.opStatus !== "RETIRED" && e.opStatus !== "DISPOSED");
    title = u.name; sub = `Kepala: ${u.head}`;
    meta = [["Aset aktif", `${eq.length}`]];
    assets = eq;
  }

  return (
    <Card className="flex h-full flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-pine-600">{KIND_LABEL[sel.kind]}</p>
          <h2 className="mt-0.5 truncate font-display text-[18px] font-black tracking-tight text-ink">{title}</h2>
          <p className="truncate text-[11.5px] text-mute">{sub}</p>
        </div>
        {canEdit && (
          <div className="flex shrink-0 gap-1.5">
            <BtnSm onClick={() => onEdit(sel.kind, sel.id)} title="Edit"><Pencil size={12} /></BtnSm>
            <BtnSm onClick={() => onDelete(sel.kind, sel.id)} title="Hapus" className="!border-danger/50 !text-danger"><Trash2 size={12} /></BtnSm>
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1.5">
        {meta.map(([k, v]) => (
          <div key={k} className="flex items-start justify-between gap-3 rounded-md bg-canvas/60 px-2.5 py-1.5">
            <span className="font-mono text-[9.5px] font-bold uppercase tracking-wide text-mute">{k}</span>
            <span className="max-w-[60%] text-right text-[11.5px] font-semibold text-ink2">{v}</span>
          </div>
        ))}
      </div>

      {rooms.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-mute">Ruangan ({rooms.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {rooms.map((r) => (
              <Chip key={r.id} tone="neutral" className="cursor-pointer" >{r.name}</Chip>
            ))}
          </div>
        </div>
      )}

      {sel.kind === "building" && canEdit && (
        <BtnGhost className="mt-3" onClick={() => onNewRoom(sel.id)}><Plus size={13} /> Tambah ruangan</BtnGhost>
      )}

      {assets.length > 0 && (
        <div className="mt-3 flex-1 overflow-y-auto">
          <p className="mb-1.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-mute">Aset di sini ({assets.length})</p>
          <div className="space-y-1.5">
            {assets.map((e) => (
              <button key={e.id} onClick={() => navAsset(e.id)} className="group flex w-full items-center justify-between gap-2 rounded-md border border-line bg-paper px-2.5 py-2 text-left transition hover:border-pine-500/50">
                <span className="min-w-0">
                  <span className="block truncate text-[12px] font-bold text-ink group-hover:text-pine-700">{e.name}</span>
                  <span className="block font-mono text-[9px] text-mute">{e.code} · {e.room}</span>
                </span>
                <StatusChip status={e.opStatus} />
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function FormModal({ editing, onClose, onSave }: {
  editing: (Sel & { isNew?: boolean }) | null; onClose: () => void;
  onSave: (kind: Kind, id: string | undefined, data: Record<string, string>) => void;
}) {
  const { s } = useApp();
  const [f, setF] = useState<Record<string, string>>({});
  const [err, setErr] = useState("");

  const kind = editing?.kind;
  const isEdit = editing && !editing.isNew;

  /* isi form saat editing berubah */
  useMemo(() => {
    setErr("");
    if (!editing) { setF({}); return; }
    if (editing.isNew) {
      const parent = (editing as never as { parent?: string }).parent;
      setF(kind === "hospital" ? { status: "AKTIF", main: "false" }
        : kind === "building" ? { hospitalId: parent ?? s.hospitals[0]?.id ?? "", status: "ACTIVE", year: String(new Date().getFullYear()) }
        : kind === "floor" ? { buildingId: parent ?? s.buildings[0]?.id ?? "" }
        : kind === "room" ? { buildingId: parent ?? s.buildings[0]?.id ?? "", floorId: "", unit: "" }
        : { name: "", head: "" });
      return;
    }
    const rec = kind === "hospital" ? s.hospitals.find((x) => x.id === editing.id)
      : kind === "building" ? s.buildings.find((x) => x.id === editing.id)
      : kind === "floor" ? s.floors.find((x) => x.id === editing.id)
      : kind === "room" ? s.rooms.find((x) => x.id === editing.id)
      : s.units.find((x) => x.id === editing.id);
    if (rec) setF(Object.fromEntries(Object.entries(rec).map(([k, v]) => [k, String(v)])));
  }, [editing]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const submit = () => {
    if (!kind) return;
    if (!(f.name ?? "").trim()) return setErr("Nama wajib diisi.");
    if (kind === "room" && !f.floorId) return setErr("Pilih lantai untuk ruangan ini.");
    onSave(kind, editing?.isNew ? undefined : editing?.id, f);
  };

  if (!editing) return null;

  return (
    <Modal open onClose={onClose} kicker={`${isEdit ? "Edit" : "Tambah"} ${KIND_LABEL[kind!]}`} title={isEdit ? f.name ?? "" : `${KIND_LABEL[kind!]} baru`}
      footer={<><BtnGhost onClick={onClose}>Batal</BtnGhost><BtnPrimary onClick={submit}>{isEdit ? "Simpan perubahan" : "Tambahkan"}</BtnPrimary></>}>
      <div className="space-y-3">
        <div><Label>Nama *</Label><Input value={f.name ?? ""} onChange={set("name")} placeholder={kind === "building" ? "cth: Gedung F" : kind === "floor" ? "cth: Lantai 4" : "Nama…"} /></div>

        {kind === "hospital" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Kode</Label><Input value={f.code ?? ""} onChange={set("code")} placeholder="RS-XX" /></div>
              <div><Label>Jenis</Label><Input value={f.kind ?? ""} onChange={set("kind")} placeholder="RS Umum · Kelas B" /></div>
            </div>
            <div><Label>Alamat</Label><Input value={f.address ?? ""} onChange={set("address")} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Status</Label><Select value={f.status ?? "AKTIF"} onChange={set("status")}>{["AKTIF", "RENCANA", "NONAKTIF"].map((x) => <option key={x}>{x}</option>)}</Select></div>
              <div><Label>Cabang utama?</Label><Select value={f.main ?? "false"} onChange={set("main")}><option value="false">Tidak</option><option value="true">Ya</option></Select></div>
            </div>
          </>
        )}

        {kind === "building" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Fasilitas</Label><Select value={f.hospitalId ?? ""} onChange={set("hospitalId")}>{s.hospitals.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</Select></div>
              <div><Label>Tahun</Label><Input type="number" value={f.year ?? ""} onChange={set("year")} /></div>
            </div>
            <div><Label>Fungsi / label</Label><Input value={f.label ?? ""} onChange={set("label")} placeholder="cth: Rawat Inap & ICU" /></div>
            <div><Label>Status</Label><Select value={f.status ?? "ACTIVE"} onChange={set("status")}>{["ACTIVE", "PLANNED", "UNDER_RENOVATION", "INACTIVE"].map((x) => <option key={x}>{x}</option>)}</Select></div>
            <div><Label>Catatan</Label><Input value={f.note ?? ""} onChange={set("note")} /></div>
          </>
        )}

        {kind === "floor" && (
          <div><Label>Gedung</Label><Select value={f.buildingId ?? ""} onChange={set("buildingId")}>{s.buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></div>
        )}

        {kind === "room" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Gedung</Label><Select value={f.buildingId ?? ""} onChange={set("buildingId")}>{s.buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></div>
              <div><Label>Lantai *</Label><Select value={f.floorId ?? ""} onChange={set("floorId")}><option value="">— pilih —</option>{s.floors.filter((x) => x.buildingId === f.buildingId).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select></div>
            </div>
            <div><Label>Unit penanggung jawab</Label>
              <Select value={f.unit ?? ""} onChange={set("unit")}><option value="">— pilih —</option>{s.units.map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}</Select>
            </div>
          </>
        )}

        {kind === "unit" && (
          <div><Label>Kepala unit</Label><Input value={f.head ?? ""} onChange={set("head")} placeholder="cth: dr. …" /></div>
        )}

        {err && <p className="rounded-md bg-dangerbg px-3 py-2 text-xs font-semibold text-danger">{err}</p>}
        {!isEdit && kind === "room" && <p className="rounded-md bg-infobg px-3 py-2 text-[11px] font-semibold text-info">Satu aset hanya boleh berada di satu ruangan aktif pada satu waktu.</p>}
      </div>
    </Modal>
  );
}
