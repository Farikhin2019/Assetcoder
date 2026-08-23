import { useMemo, useState } from "react";
import { useApp } from "../lib/store";
import { Card, Chip, Input, Select, StatusChip, Bar, Tabs, MonoTag, EmptyState, BtnPrimary, BtnGhost, Modal, QRGlyph } from "../components/ui";
import { fmtDate, fmtIDRCompact, daysUntil, nextAssetCode, fmtSize } from "../lib/types";
import { ArrowLeft, MapPin, QrCode, Truck, User, Wrench, Printer, Camera, FileText, Download, Copy, Hash } from "lucide-react";

export default function Equipment() {
  const { s, nav } = useApp();
  if (s.view === "equipment-detail" && s.eqId) return <EquipmentDetail />;
  return <EquipmentList />;
}

function EquipmentList() {
  const { s, nav } = useApp();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [risk, setRisk] = useState("ALL");

  const rows = useMemo(() => s.equipment.filter((e) =>
    (status === "ALL" || e.opStatus === status) &&
    (risk === "ALL" || e.risk === risk) &&
    (q === "" || `${e.name} ${e.code} ${e.serial} ${e.room} ${e.brand}`.toLowerCase().includes(q.toLowerCase()))
  ), [s.equipment, q, status, risk]);

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Daftar Aset Medis</h1>
          <p className="text-xs text-mute">{s.equipment.length} aset medis terdaftar · klik untuk melihat detail lengkap (Aset 360°)</p>
        </div>
        <div className="flex gap-2">
          <Chip tone="ok" dot>{s.equipment.filter((e) => e.opStatus === "IN_SERVICE").length} IN SERVICE</Chip>
          <Chip tone="danger" dot>{s.equipment.filter((e) => e.calStatus === "EXPIRED").length} CAL EXPIRED</Chip>
        </div>
      </div>

      <Card className="border-pine-500/25 bg-pine-50/50 p-3.5">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="flex items-center gap-2 font-display text-[13px] font-extrabold tracking-tight text-ink">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-pine-700 text-pine-50"><Hash size={14} /></span>
            Penomoran Aset
          </span>
          <span className="font-mono text-[10px] text-mute">format <b className="text-ink2">AST-RS-{new Date().getFullYear()}-######</b> · unik (BR-001) · imutabel (BR-002)</span>
          <span className="ml-auto flex items-center gap-2">
            <MonoTag>terdaftar {String(s.equipment.length).padStart(6, "0")}</MonoTag>
            <Chip tone="pine" dot>berikutnya {nextAssetCode(s.equipment.map((e) => e.code))}</Chip>
          </span>
        </div>
      </Card>

      <Card className="p-3.5">
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <div className="col-span-2"><Input placeholder="Cari nama, kode, serial, ruangan…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ALL">Semua status</option>
            {["IN_SERVICE", "MAINTENANCE", "CALIBRATION", "DOWN", "RETIRED", "DISPOSED"].map((x) => <option key={x}>{x}</option>)}
          </Select>
          <Select value={risk} onChange={(e) => setRisk(e.target.value)}>
            <option value="ALL">Semua risiko</option>
            {["HIGH", "MEDIUM", "LOW"].map((x) => <option key={x}>{x}</option>)}
          </Select>
        </div>
      </Card>

      {rows.length === 0 ? <Card><EmptyState title="Tidak ada aset yang cocok" sub="Ubah filter atau kata kunci pencarian." /></Card> : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((e, i) => (
            <button key={e.id} onClick={() => nav("equipment-detail", e.id)} style={{ animationDelay: `${(i % 9) * 45}ms` }}
              className="row-in group rounded-lg border border-line bg-card p-4 text-left shadow-[0_1px_2px_rgba(20,33,28,0.05)] transition hover:-translate-y-0.5 hover:border-pine-500/50 hover:shadow-xl">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-display text-[14.5px] font-extrabold tracking-tight text-ink group-hover:text-pine-700">{e.name}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-mute">{e.code} · SN {e.serial}</p>
                </div>
                <StatusChip status={e.opStatus} />
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <Chip tone="neutral">{e.category}</Chip>
                <Chip tone={e.risk === "HIGH" ? "danger" : e.risk === "MEDIUM" ? "warn" : "ok"}>RISK {e.risk}</Chip>
                <StatusChip status={e.calStatus} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-2.5 font-mono text-[10px] text-mute">
                <div><p className="uppercase tracking-wide">Lokasi</p><p className="mt-0.5 truncate font-sans text-[11px] font-bold text-ink2">{e.room}</p></div>
                <div><p className="uppercase tracking-wide">Nilai</p><p className="num mt-0.5 font-sans text-[11px] font-bold text-ink2">{fmtIDRCompact(e.acqCost)}</p></div>
              </div>
              <div className="mt-2.5">
                <div className="mb-1 flex justify-between font-mono text-[9.5px] text-mute"><span>UTILIZATION</span><span className="font-bold text-ink2">{e.utilization}%</span></div>
                <Bar pct={e.utilization} tone={e.utilization < 30 ? "danger" : e.utilization < 55 ? "warn" : "pine"} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EquipmentDetail() {
  const { s, nav, addPhotos, addDocs, printLabel, toast } = useApp();
  const eq = s.equipment.find((e) => e.id === s.eqId);
  const [tab, setTab] = useState("timeline");
  const [labelOpen, setLabelOpen] = useState(false);
  if (!eq) return <EmptyState title="Aset tidak ditemukan" />;

  const tl = s.timeline.filter((t) => t.eqId === eq.id);
  const wos = s.workOrders.filter((w) => w.eqId === eq.id);
  const cals = s.calibrations.filter((c) => c.eqId === eq.id);
  const cmps = s.complaints.filter((c) => c.eqId === eq.id);
  const sup = s.suppliers.find((x) => x.id === eq.supplierId);
  const overdue = daysUntil(eq.nextMaint) < 0;
  const photos = eq.photos ?? [];
  const docs = eq.docs ?? [];

  const onPhotoPick = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files).slice(0, 6).map((f) => ({
      id: "PH-" + Math.random().toString(36).slice(2, 7).toUpperCase(),
      name: f.name, size: fmtSize(f.size), mime: f.type || "image/jpeg",
      dataUrl: URL.createObjectURL(f), date: new Date().toISOString(), by: s.userName,
    }));
    addPhotos(eq.id, list);
  };
  const onDocPick = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files).slice(0, 6).map((f) => ({
      id: "DC-" + Math.random().toString(36).slice(2, 7).toUpperCase(),
      name: f.name, size: fmtSize(f.size), mime: f.type || "application/pdf",
      dataUrl: "", date: new Date().toISOString(), by: s.userName, checksum: "sha256:" + Math.random().toString(36).slice(2, 10),
    }));
    addDocs(eq.id, list);
  };

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button onClick={() => nav("equipment")} className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-pine-700 transition hover:text-pine-600">
          <ArrowLeft size={13} /> Kembali ke registry
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-line bg-card px-3 py-1.5 font-display text-[11.5px] font-bold text-ink2 transition hover:border-pine-500/50 hover:text-pine-700">
            <Camera size={13} /> Unggah Foto
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { onPhotoPick(e.target.files); e.target.value = ""; }} />
          </label>
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-line bg-card px-3 py-1.5 font-display text-[11.5px] font-bold text-ink2 transition hover:border-pine-500/50 hover:text-pine-700">
            <FileText size={13} /> Unggah Dokumen
            <input type="file" multiple className="hidden" onChange={(e) => { onDocPick(e.target.files); e.target.value = ""; }} />
          </label>
          <button onClick={() => setLabelOpen(true)} className="inline-flex items-center gap-1.5 rounded-md bg-pine-700 px-3 py-1.5 font-display text-[11.5px] font-bold text-pine-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition hover:bg-pine-800 active:translate-y-px">
            <QrCode size={13} /> Cetak Label Aset
          </button>
        </div>
      </div>

      <Card className="dark-grain p-5 text-pine-50">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip status={eq.opStatus} />
              <Chip tone={eq.risk === "HIGH" ? "danger" : eq.risk === "MEDIUM" ? "warn" : "ok"}>RISK {eq.risk}</Chip>
              <StatusChip status={eq.calStatus} />
            </div>
            <h1 className="mt-2 font-display text-[24px] font-black tracking-tight">{eq.name}</h1>
            <p className="mt-0.5 font-mono text-[11px] text-pine-100/70">{eq.code} · {eq.brand} {eq.model} · SN {eq.serial}</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-[10.5px] text-pine-100/75">
              <span className="flex items-center gap-1.5"><MapPin size={12} className="text-warnhi" />{eq.building} · {eq.floor} · {eq.room}</span>
              <span className="flex items-center gap-1.5"><User size={12} className="text-warnhi" />{eq.custodian}</span>
              <span className="flex items-center gap-1.5"><Truck size={12} className="text-warnhi" />{sup?.name ?? "—"}</span>
            </div>
            {eq.poRef && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-pine-700 bg-pine-950/50 px-3 py-1.5 font-mono text-[10px] text-pine-100/85">
                <QrCode size={12} className="text-warnhi" /> Asal pengadaan: <b className="text-warnhi">{eq.poRef}</b> · peroleh {fmtDate(eq.acqDate)}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { l: "Nilai perolehan", v: fmtIDRCompact(eq.acqCost) },
              { l: "Kondisi", v: eq.condition },
              { l: "Next PM", v: fmtDate(eq.nextMaint), warn: overdue },
              { l: "Utilisasi", v: eq.utilization + "%" },
            ].map((k) => (
              <div key={k.l} className="rounded-md border border-pine-800 bg-pine-950/50 px-3 py-2">
                <p className="font-mono text-[8.5px] uppercase tracking-wider text-pine-100/50">{k.l}</p>
                <p className={`num mt-0.5 font-display text-[14px] font-black ${k.warn ? "text-danger" : "text-warnhi"}`}>{k.v}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <Tabs active={tab} onChange={setTab}
          tabs={[{ id: "timeline", label: "Riwayat Aktivitas" }, { id: "wo", label: "Perintah Kerja" }, { id: "cal", label: "Kalibrasi" }, { id: "cmp", label: "Keluhan" }, { id: "lamp", label: "Foto & Dokumen" }]}
          counts={{ timeline: tl.length, wo: wos.length, cal: cals.length, cmp: cmps.length, lamp: photos.length + docs.length }} />
        <div className="pt-4">
          {tab === "timeline" && (
            <div className="space-y-2.5">
              {tl.length === 0 && <EmptyState title="Belum ada aktivitas" sub="Semua kegiatan perawatan, kalibrasi, dan perbaikan tercatat di sini." />}
              {tl.map((t, i) => (
                <div key={t.id} className="row-in flex items-start gap-3 rounded-md border border-line bg-paper px-3 py-2.5" style={{ animationDelay: `${i * 50}ms` }}>
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-pine-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-bold text-ink">{t.title}</p>
                    <p className="text-[11.5px] text-ink2">{t.detail}</p>
                    <p className="mt-0.5 font-mono text-[9.5px] text-mute">{t.actor} · {fmtDate(t.date)}{t.cost ? ` · ${fmtIDRCompact(t.cost)}` : ""}</p>
                  </div>
                  <StatusChip status={t.type} />
                </div>
              ))}
            </div>
          )}
          {tab === "wo" && (
            <div className="space-y-2.5">
              {wos.length === 0 && <EmptyState title="Belum ada perintah kerja" sub="Perintah perawatan untuk aset ini akan tampil di sini." />}
              {wos.map((w) => (
                <div key={w.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-paper px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-pine-100 text-pine-700"><Wrench size={14} /></span>
                    <div>
                      <p className="text-[12.5px] font-bold text-ink">{w.wo} <StatusChip status={w.type} className="ml-1" /></p>
                      <p className="font-mono text-[10px] text-mute">{fmtDate(w.scheduled)} · {fmtIDRCompact(w.laborCost)}</p>
                    </div>
                  </div>
                  <StatusChip status={w.status} />
                </div>
              ))}
            </div>
          )}
          {tab === "cal" && (
            <div className="space-y-2.5">
              {cals.length === 0 && <EmptyState title="Belum ada kalibrasi" />}
              {cals.map((c) => (
                <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-paper px-3 py-2.5">
                  <div>
                    <p className="text-[12.5px] font-bold text-ink">{c.cert} <Chip tone={c.result === "PASS" ? "ok" : "danger"} className="ml-1">{c.result}</Chip></p>
                    <p className="font-mono text-[10px] text-mute">{fmtDate(c.date)} · berikutnya {fmtDate(c.nextDue)} · {fmtIDRCompact(c.cost)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === "cmp" && (
            <div className="space-y-2.5">
              {cmps.length === 0 && <EmptyState title="Belum ada keluhan" />}
              {cmps.map((c) => (
                <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-paper px-3 py-2.5">
                  <div>
                    <p className="text-[12.5px] font-bold text-ink">{c.code} <StatusChip status={c.priority} className="ml-1" /></p>
                    <p className="text-[11.5px] text-ink2">{c.description}</p>
                    <p className="mt-0.5 font-mono text-[9.5px] text-mute">{c.reporter} · SLA {c.slaHours} jam</p>
                  </div>
                  <StatusChip status={c.status} />
                </div>
              ))}
            </div>
          )}
          {tab === "lamp" && (
            <div className="space-y-5">
              {/* ── galeri foto ── */}
              <div>
                <div className="mb-2.5 flex items-center justify-between">
                  <p className="font-display text-[13.5px] font-extrabold tracking-tight text-ink">Foto aset <span className="font-mono text-[10.5px] font-semibold text-mute">({photos.length})</span></p>
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-line bg-card px-2.5 py-1.5 font-display text-[11px] font-bold text-ink2 transition hover:border-pine-500/50 hover:bg-pine-50 hover:text-pine-700">
                    <Camera size={12} /> Tambah foto
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { onPhotoPick(e.target.files); e.target.value = ""; }} />
                  </label>
                </div>
                {photos.length === 0 ? (
                  <EmptyState title="Belum ada foto" sub="Unggah dokumentasi visual — kondisi fisik, nameplate, instalasi." />
                ) : (
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                    {photos.map((p, i) => (
                      <figure key={p.id} className="row-in group overflow-hidden rounded-lg border border-line bg-paper transition hover:-translate-y-0.5 hover:border-pine-500/50 hover:shadow-lg" style={{ animationDelay: `${i * 45}ms` }}>
                        <div className="aspect-[4/3] w-full overflow-hidden bg-moss">
                          <img src={p.dataUrl} alt={p.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                        </div>
                        <figcaption className="px-2.5 py-2">
                          <p className="truncate text-[11px] font-bold text-ink">{p.name}</p>
                          <p className="font-mono text-[9px] text-mute">{p.size} · {p.by} · {fmtDate(p.date)}</p>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                )}
              </div>
              {/* ── dokumen ── */}
              <div>
                <div className="mb-2.5 flex items-center justify-between">
                  <p className="font-display text-[13.5px] font-extrabold tracking-tight text-ink">Dokumen <span className="font-mono text-[10.5px] font-semibold text-mute">({docs.length})</span></p>
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-line bg-card px-2.5 py-1.5 font-display text-[11px] font-bold text-ink2 transition hover:border-pine-500/50 hover:bg-pine-50 hover:text-pine-700">
                    <FileText size={12} /> Tambah dokumen
                    <input type="file" multiple className="hidden" onChange={(e) => { onDocPick(e.target.files); e.target.value = ""; }} />
                  </label>
                </div>
                {docs.length === 0 ? (
                  <EmptyState title="Belum ada dokumen" sub="Manual, BAST, sertifikat kalibrasi, invoice…" />
                ) : (
                  <div className="divide-y divide-line overflow-hidden rounded-lg border border-line">
                    {docs.map((dc) => (
                      <div key={dc.id} className="flex flex-wrap items-center gap-3 bg-card px-3 py-2.5 transition hover:bg-pine-50/50">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-moss text-pine-700"><FileText size={16} /></span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12.5px] font-bold text-ink">{dc.name}</p>
                          <p className="truncate font-mono text-[9.5px] text-mute">{dc.size} · {dc.mime} · {dc.checksum}</p>
                        </div>
                        <span className="hidden font-mono text-[9.5px] text-mute sm:block">{dc.by} · {fmtDate(dc.date)}</span>
                        {dc.dataUrl ? (
                          <a href={dc.dataUrl} download={dc.name} className="inline-flex items-center gap-1 rounded-md border border-line bg-card px-2 py-1 font-display text-[10.5px] font-bold text-ink2 transition hover:border-pine-500/50 hover:text-pine-700">
                            <Download size={11} /> Unduh
                          </a>
                        ) : <Chip tone="neutral">metadata</Chip>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="font-mono text-[9.5px] text-mute">Metadata attachment: file_id · nama · mime · ukuran · checksum · pengunggah · waktu (akses tercatat di audit trail).</p>
            </div>
          )}
        </div>
      </Card>

      {/* ── modal cetak label aset ── */}
      <Modal open={labelOpen} onClose={() => setLabelOpen(false)} kicker="Label aset · QR + barcode" title={`Cetak label ${eq.code}`}
        footer={<>
          <BtnGhost onClick={() => { navigator.clipboard?.writeText(eq.code); toast(`Kode ${eq.code} disalin`); }}><Copy size={13} /> Salin Kode</BtnGhost>
          <BtnPrimary onClick={() => printLabel(eq.id)}><Printer size={13} /> Kirim ke Printer Label</BtnPrimary>
        </>}>
        <div className="space-y-3">
          <div className="flex justify-center">
            <div className="w-full max-w-[340px] rounded-lg border-2 border-dashed border-line2 bg-white p-4 text-center shadow-sm">
              <p className="font-mono text-[8.5px] font-bold uppercase tracking-[0.22em] text-mute">RS Harapan Medika · SIMASET</p>
              <div className="mt-2 flex justify-center"><QRGlyph seed={eq.code + eq.serial} size={118} /></div>
              <p className="mt-2 font-mono text-[15px] font-bold tracking-[0.06em] text-ink">{eq.code}</p>
              <p className="mt-0.5 font-display text-[13px] font-extrabold tracking-tight text-ink2">{eq.name}</p>
              <p className="font-mono text-[9.5px] text-mute">{eq.brand} {eq.model} · SN {eq.serial}</p>
              <div className="mt-2 border-t border-dashed border-line2 pt-2">
                <p className="font-mono text-[9.5px] text-ink2">{eq.building} · {eq.floor} · {eq.room}</p>
                <p className="font-mono text-[9.5px] text-mute">Custodian: {eq.custodian}</p>
              </div>
              <div className="mx-auto mt-2.5 flex h-7 w-44 items-stretch justify-center gap-[2px]" aria-hidden>
                {(eq.code + eq.serial).split("").map((ch, i) => (
                  <span key={i} className="bg-ink" style={{ width: `${(ch.charCodeAt(0) % 3) + 1}px` }} />
                ))}
              </div>
            </div>
          </div>
          <p className="rounded-md bg-infobg px-3 py-2 text-[11px] font-semibold text-info">
            Scan QR via mobile field ops → langsung membuka Equipment 360° aset ini. Asset ID tidak pernah berubah (BR-002); pencetakan tercatat di audit trail.
          </p>
        </div>
      </Modal>

      <p className="font-mono text-[10.5px] text-mute">Unit: <MonoTag>{eq.unit}</MonoTag> · Kategori <MonoTag>{eq.category}</MonoTag> · Asset ID imutabel (BR-002)</p>
    </div>
  );
}
