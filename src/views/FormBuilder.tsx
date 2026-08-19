import { useEffect, useMemo, useState } from "react";
import { useApp } from "../lib/store";
import { BtnGhost, BtnPrimary, BtnSm, Card, Chip, EmptyState, Input, Label, SectionHead, Select } from "../components/ui";
import { IcCheck, IcClose, IcDoc, IcForm, IcPlus, IcScan, IcWrench } from "../components/icons";
import { FormField, FormFieldType, FormTemplate, uid } from "../lib/types";

const FIELD_TYPES: { type: FormFieldType; label: string; desc: string; hasOptions?: boolean; hasUnit?: boolean }[] = [
  { type: "instruction", label: "Instruksi", desc: "Teks panduan langkah" },
  { type: "text", label: "Teks", desc: "Isian bebas" },
  { type: "number", label: "Angka", desc: "Nilai numerik", hasUnit: true },
  { type: "measurement", label: "Pengukuran", desc: "Hasil ukur + satuan", hasUnit: true },
  { type: "passfail", label: "Pass / Fail", desc: "Uji lulus-gagal" },
  { type: "checkbox", label: "Checkbox", desc: "Ya / tidak" },
  { type: "radio", label: "Pilihan", desc: "Radio button", hasOptions: true },
  { type: "select", label: "Dropdown", desc: "Pilih satu", hasOptions: true },
  { type: "date", label: "Tanggal", desc: "Date picker" },
  { type: "photo", label: "Foto", desc: "Kamera lapangan" },
  { type: "signature", label: "Tanda tangan", desc: "Ttd elektronik" },
  { type: "attachment", label: "Lampiran", desc: "Dokumen pendukung" },
];

const typeLabel = (t: FormFieldType) => FIELD_TYPES.find((f) => f.type === t)?.label ?? t;
const typeMeta = (t: FormFieldType) => FIELD_TYPES.find((f) => f.type === t)!;

const clone = (t: FormTemplate): FormTemplate => ({ ...t, fields: t.fields.map((f) => ({ ...f, options: f.options ? [...f.options] : undefined })) });
const newDraft = (): FormTemplate => ({ id: "FT-" + uid(), name: "Template baru", fields: [] });
const newField = (type: FormFieldType): FormField => ({
  id: "f" + uid().toLowerCase(), type,
  label: type === "instruction" ? "Instruksi pengerjaan…" : `Field ${typeLabel(type).toLowerCase()} baru`,
  options: type === "radio" || type === "select" ? ["Opsi A", "Opsi B"] : undefined,
  unit: type === "measurement" ? "unit" : type === "number" ? "" : undefined,
  required: type !== "instruction",
});

export default function FormBuilder() {
  const { s, saveForm, deleteForm, toast } = useApp();
  const canEdit = ["Teknisi", "Kepala Teknisi", "Pengelola Aset", "Direksi"].includes(s.role);

  const [draft, setDraft] = useState<FormTemplate>(() => (s.formTemplates[0] ? clone(s.formTemplates[0]) : newDraft()));
  const [selected, setSelected] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const isNew = !s.formTemplates.some((t) => t.id === draft.id);
  const selField = draft.fields.find((f) => f.id === selected) ?? null;

  const loadTemplate = (t: FormTemplate) => { setDraft(clone(t)); setSelected(null); setDirty(false); setConfirmDel(false); };
  const startNew = () => { setDraft(newDraft()); setSelected(null); setDirty(false); setConfirmDel(false); };

  const mutate = (fn: (t: FormTemplate) => FormTemplate) => { setDraft((d) => fn(clone(d))); setDirty(true); };
  const setField = (id: string, patch: Partial<FormField>) => mutate((t) => ({ ...t, fields: t.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)) }));
  const addField = (type: FormFieldType) => {
    const f = newField(type);
    mutate((t) => ({ ...t, fields: [...t.fields, f] }));
    setSelected(f.id);
  };
  const removeField = (id: string) => { mutate((t) => ({ ...t, fields: t.fields.filter((f) => f.id !== id) })); if (selected === id) setSelected(null); };
  const moveField = (id: string, dir: -1 | 1) => mutate((t) => {
    const i = t.fields.findIndex((f) => f.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= t.fields.length) return t;
    const fields = [...t.fields];
    [fields[i], fields[j]] = [fields[j], fields[i]];
    return { ...t, fields };
  });

  const save = () => {
    if (draft.name.trim().length < 3) return toast("Nama template minimal 3 karakter.", "err");
    if (draft.fields.length === 0) return toast("Tambahkan minimal satu field.", "err");
    const bad = draft.fields.find((f) => f.type !== "instruction" && f.label.trim().length === 0);
    if (bad) return toast(`Ada field tanpa label (${typeLabel(bad.type)}).`, "err");
    const needsOpt = draft.fields.find((f) => (f.type === "radio" || f.type === "select") && (!f.options || f.options.length < 2));
    if (needsOpt) return toast(`Field "${needsOpt.label}" butuh minimal 2 opsi.`, "err");
    saveForm({ ...draft, name: draft.name.trim() });
    setDirty(false);
  };

  const removeTemplate = () => {
    if (isNew) { startNew(); return; }
    deleteForm(draft.id);
    const rest = s.formTemplates.filter((t) => t.id !== draft.id);
    setConfirmDel(false);
    if (rest.length) loadTemplate(rest[0]); else startNew();
  };

  /* count WOs using this template */
  const usedBy = useMemo(() => s.workOrders.filter((w) => w.templateId === draft.id).length, [s.workOrders, draft.id]);

  return (
    <div className="view-in flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Maintenance Form Builder</h1>
          <p className="text-xs text-mute">Rancang template form pemeliharaan — field tersimpan & langsung dipakai saat menutup Work Order (12 tipe field)</p>
        </div>
        {!canEdit && <Chip tone="warn" dot>READ-ONLY — role {s.role}</Chip>}
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[240px_1fr_320px]">
        {/* ── template library ── */}
        <Card className="flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-3.5 py-3">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-mute">Pustaka template</p>
            <Chip tone="pine">{s.formTemplates.length}</Chip>
          </div>
          <div className="flex-1 space-y-1.5 overflow-y-auto p-2.5">
            {s.formTemplates.length === 0 && <p className="px-2 py-4 text-center text-xs text-mute">Belum ada template.</p>}
            {s.formTemplates.map((t) => {
              const active = t.id === draft.id;
              const used = s.workOrders.some((w) => w.templateId === t.id);
              return (
                <button key={t.id} onClick={() => loadTemplate(t)}
                  className={`w-full rounded-lg border px-3 py-2.5 text-left transition ${active ? "border-pine-500 bg-pine-50 shadow-sm" : "border-line bg-card hover:border-pine-500/40 hover:bg-pine-50/40"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className={`truncate text-[12.5px] font-bold ${active ? "text-pine-800" : "text-ink"}`}>{t.name}</p>
                    <span className="shrink-0 font-mono text-[9.5px] text-mute">{t.fields.length}f</span>
                  </div>
                  <p className="mt-0.5 font-mono text-[9px] text-mute">{used ? "dipakai work order" : "tersedia"}</p>
                </button>
              );
            })}
          </div>
          <div className="border-t border-line p-2.5">
            <BtnPrimary className="w-full" onClick={startNew} disabled={!canEdit}><IcPlus size={13} /> Template baru</BtnPrimary>
          </div>
        </Card>

        {/* ── canvas ── */}
        <Card className="flex flex-col overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-pine-100 text-pine-700"><IcForm size={15} /></span>
            <Input value={draft.name} onChange={(e) => { setDraft((d) => ({ ...d, name: e.target.value })); setDirty(true); }}
              disabled={!canEdit} className="!w-64 !py-1.5 font-display !text-[14px] !font-extrabold" />
            {isNew && <Chip tone="info">BARU</Chip>}
            {dirty && <Chip tone="warn" dot>belum disimpan</Chip>}
            <span className="ml-auto flex items-center gap-2">
              {usedBy > 0 && <Chip tone="neutral">{usedBy} WO aktif</Chip>}
              {!isNew && (
                <BtnSm disabled={!canEdit} onClick={() => setConfirmDel(true)} className="!text-danger hover:!border-danger/50">Hapus</BtnSm>
              )}
              <BtnPrimary disabled={!canEdit || !dirty} onClick={save}><IcCheck size={13} /> Simpan template</BtnPrimary>
            </span>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            {draft.fields.length === 0 && (
              <EmptyState title="Kanvas kosong" sub="Pilih tipe field di panel kanan untuk mulai merancang form." />
            )}
            {draft.fields.map((f, i) => (
              <div key={f.id} onClick={() => setSelected(f.id)}
                className={`row-in group flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 transition ${selected === f.id ? "border-pine-500 bg-pine-50/60 shadow-sm" : "border-line bg-paper hover:border-pine-500/40"}`}
                style={{ animationDelay: `${i * 30}ms` }}>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded font-mono text-[9px] font-bold text-mute">{i + 1}</span>
                <span className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide ${f.type === "instruction" ? "bg-infobg text-info" : f.type === "passfail" ? "bg-warnbg text-warn" : "bg-moss text-ink2"}`}>{typeLabel(f.type)}</span>
                <p className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-ink">
                  {f.label}
                  {f.required && f.type !== "instruction" && <span className="ml-1 text-danger">*</span>}
                  {f.unit && <span className="ml-1 font-mono text-[10px] font-normal text-mute">({f.unit})</span>}
                </p>
                {canEdit && (
                  <span className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
                    <button onClick={(e) => { e.stopPropagation(); moveField(f.id, -1); }} className="rounded px-1.5 py-0.5 font-mono text-[10px] text-mute hover:bg-moss hover:text-ink" disabled={i === 0}>▲</button>
                    <button onClick={(e) => { e.stopPropagation(); moveField(f.id, 1); }} className="rounded px-1.5 py-0.5 font-mono text-[10px] text-mute hover:bg-moss hover:text-ink" disabled={i === draft.fields.length - 1}>▼</button>
                    <button onClick={(e) => { e.stopPropagation(); removeField(f.id); }} className="rounded p-1 text-mute hover:bg-dangerbg hover:text-danger"><IcClose size={13} /></button>
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* field palette */}
          <div className="border-t border-line bg-canvas/50 p-3">
            <p className="mb-2 font-mono text-[9.5px] font-bold uppercase tracking-[0.12em] text-mute">Tambah field</p>
            <div className="grid grid-cols-3 gap-1.5 md:grid-cols-6">
              {FIELD_TYPES.map((ft) => (
                <button key={ft.type} disabled={!canEdit} onClick={() => addField(ft.type)} title={ft.desc}
                  className="rounded-md border border-line bg-card px-2 py-1.5 font-display text-[10.5px] font-bold text-ink2 transition hover:-translate-y-0.5 hover:border-pine-500/60 hover:text-pine-700 hover:shadow disabled:opacity-50">
                  {ft.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* ── inspector + preview ── */}
        <div className="flex flex-col gap-4 overflow-hidden">
          <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="border-b border-line px-4 py-3">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-mute">Properti field</p>
            </div>
            <div className="flex-1 space-y-3.5 overflow-y-auto p-4">
              {!selField ? (
                <p className="py-6 text-center text-xs text-mute">Klik sebuah field di kanvas untuk mengedit propertinya.</p>
              ) : (
                <>
                  <div>
                    <Label>Tipe</Label>
                    <p className="rounded-md border border-line bg-canvas/60 px-3 py-2 font-mono text-[11.5px] font-bold text-ink2">{typeLabel(selField.type)} <span className="font-normal text-mute">— {typeMeta(selField.type).desc}</span></p>
                  </div>
                  {selField.type !== "instruction" ? (
                    <div>
                      <Label>Label / pertanyaan *</Label>
                      <Input value={selField.label} disabled={!canEdit} onChange={(e) => setField(selField.id, { label: e.target.value })} />
                    </div>
                  ) : (
                    <div>
                      <Label>Teks instruksi</Label>
                      <textarea value={selField.label} disabled={!canEdit} onChange={(e) => setField(selField.id, { label: e.target.value })}
                        className="min-h-[70px] w-full rounded-md border border-line bg-card px-3 py-2 text-[13px] outline-none focus:border-pine-500" />
                    </div>
                  )}
                  {(typeMeta(selField.type).hasOptions) && (
                    <div>
                      <Label>Opsi (satu per baris, min. 2)</Label>
                      <textarea value={(selField.options ?? []).join("\n")} disabled={!canEdit}
                        onChange={(e) => setField(selField.id, { options: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean) })}
                        className="min-h-[80px] w-full rounded-md border border-line bg-card px-3 py-2 font-mono text-[12px] outline-none focus:border-pine-500" />
                    </div>
                  )}
                  {typeMeta(selField.type).hasUnit && (
                    <div>
                      <Label>Satuan {selField.type === "number" ? "(opsional)" : "*"}</Label>
                      <Input value={selField.unit ?? ""} disabled={!canEdit} onChange={(e) => setField(selField.id, { unit: e.target.value })} placeholder="cth: %, kPa/min, jam" />
                    </div>
                  )}
                  {selField.type !== "instruction" && (
                    <label className="flex cursor-pointer items-center gap-2.5 rounded-md border border-line bg-canvas/50 px-3 py-2.5">
                      <input type="checkbox" checked={!!selField.required} disabled={!canEdit} onChange={(e) => setField(selField.id, { required: e.target.checked })} className="h-4 w-4 accent-pine-600" />
                      <span className="text-[12.5px] text-ink2">Wajib diisi teknisi</span>
                    </label>
                  )}
                </>
              )}
            </div>
          </Card>

          {/* live preview */}
          <Card className="max-h-[300px] overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-mute">Preview (tampilan teknisi)</p>
              <IcScan size={13} className="text-pine-600" />
            </div>
            <div className="max-h-[236px] space-y-2.5 overflow-y-auto p-4">
              {draft.fields.length === 0 && <p className="text-center text-[11px] text-mute">Belum ada field.</p>}
              {draft.fields.map((f) => (
                <div key={f.id}>
                  {f.type === "instruction" ? (
                    <p className="rounded-md bg-infobg px-2.5 py-1.5 text-[10.5px] font-semibold text-info">{f.label}</p>
                  ) : (
                    <>
                      <p className="mb-1 font-mono text-[9.5px] font-semibold uppercase tracking-wide text-mute">{f.label}{f.required && " *"}{f.unit ? ` (${f.unit})` : ""}</p>
                      {f.type === "text" && <div className="rounded-md border border-line bg-canvas/60 px-2.5 py-1.5 text-[11px] text-mute/60">…</div>}
                      {(f.type === "number" || f.type === "measurement" || f.type === "date") && <div className="rounded-md border border-line bg-canvas/60 px-2.5 py-1.5 font-mono text-[11px] text-mute/60">{f.type === "date" ? "dd/mm/yyyy" : "0"}</div>}
                      {(f.type === "passfail") && <div className="flex gap-1.5">{["PASS", "FAIL"].map((o) => <span key={o} className="rounded border border-line bg-card px-2 py-0.5 font-mono text-[9.5px] font-bold text-mute">{o}</span>)}</div>}
                      {(f.type === "radio" || f.type === "select") && <div className="flex flex-wrap gap-1.5">{(f.options ?? []).map((o) => <span key={o} className="rounded border border-line bg-card px-2 py-0.5 font-mono text-[9.5px] text-mute">{o}</span>)}</div>}
                      {f.type === "checkbox" && <span className="inline-flex items-center gap-1.5 text-[10.5px] text-mute"><span className="inline-block h-3.5 w-3.5 rounded-sm border border-line2 bg-card" /> Ya, dilakukan</span>}
                      {f.type === "photo" && <span className="inline-flex items-center gap-1.5 rounded border border-dashed border-line2 px-2 py-1 font-mono text-[9.5px] text-mute"><IcScan size={11} /> Ambil foto</span>}
                      {f.type === "signature" && <div className="rounded-md border border-line bg-canvas/60 px-2.5 py-1.5 text-[11px] text-mute/60">tanda tangan…</div>}
                      {f.type === "attachment" && <span className="inline-flex items-center gap-1.5 rounded border border-dashed border-line2 px-2 py-1 font-mono text-[9.5px] text-mute"><IcDoc size={11} /> Lampirkan</span>}
                    </>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* delete confirm */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-pine-950/50 p-4" onClick={() => setConfirmDel(false)}>
          <div className="modal-in w-full max-w-sm rounded-xl border border-line bg-paper p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-dangerbg text-danger"><IcWrench size={16} /></span>
              <div>
                <h3 className="font-display text-[15px] font-extrabold text-ink">Hapus template?</h3>
                <p className="text-xs text-mute">“{draft.name}” · {draft.fields.length} field{usedBy > 0 ? ` · dipakai ${usedBy} WO aktif` : ""}</p>
              </div>
            </div>
            {usedBy > 0 ? (
              <p className="mt-3 rounded-md bg-warnbg px-3 py-2 text-xs font-semibold text-warn">Template masih dipakai work order — penghapusan akan diblokir sistem.</p>
            ) : (
              <p className="mt-3 text-xs text-ink2">Aksi ini tercatat di audit trail dan tidak bisa dibatalkan.</p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <BtnGhost onClick={() => setConfirmDel(false)}>Batal</BtnGhost>
              <button onClick={removeTemplate} className="inline-flex items-center gap-1.5 rounded-md bg-danger px-3.5 py-2 font-display text-[12.5px] font-bold text-white hover:bg-[#a03023]"><IcClose size={13} /> Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
