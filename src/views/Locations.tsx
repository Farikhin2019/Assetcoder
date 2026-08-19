import { useMemo, useState } from "react";
import { useApp } from "../lib/store";
import { BtnGhost, BtnPrimary, BtnSm, Card, Chip, Modal, QRGlyph, StatusChip, Tabs, EmptyState } from "../components/ui";
import { IcPin, IcScan, IcSwap } from "../components/icons";
import { BUILDINGS, ROOMS } from "../lib/data";
import { fmtDate, fmtDateTime, fmtIDRCompact, relTime } from "../lib/types";

const roomKey = (room: string) => room.split("·")[0].trim().split(" ")[0];

export default function Locations() {
  const { s, nav, printQr } = useApp();
  const [tab, setTab] = useState("bld");
  const [qrEq, setQrEq] = useState<string | null>(null);
  const [scan, setScan] = useState("");
  const [scanErr, setScanErr] = useState("");
  const qrAsset = s.equipment.find((e) => e.id === qrEq);

  const assetCount = (b: string) => s.equipment.filter((e) => e.building === b).length;
  const assetValue = (b: string) => s.equipment.filter((e) => e.building === b).reduce((a, e) => a + e.acqCost, 0);

  const rooms = useMemo(() => ROOMS.map((r) => {
    const assets = s.equipment.filter((e) => e.building === r.building && roomKey(e.room) === r.name.split(" ")[0]);
    return { ...r, assets };
  }), [s.equipment]);

  const doScan = () => {
    const q = scan.trim().toLowerCase();
    if (!q) return setScanErr("Masukkan kode aset / serial (atau klik salah satu aset di bawah).");
    const hit = s.equipment.find((e) => e.code.toLowerCase() === q || e.serial.toLowerCase() === q || e.name.toLowerCase().includes(q));
    if (!hit) return setScanErr(`"${scan}" tidak ditemukan di registry — QR lookup < 1s (NFR).`);
    setScanErr(""); setScan("");
    nav("equipment-detail", hit.id);
  };

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Lokasi, Transfer & QR</h1>
          <p className="text-xs text-mute">Organization → Hospital → Building → Floor → Room → Unit · satu aset = satu lokasi aktif</p>
        </div>
        <div className="flex gap-2">
          <Chip tone="pine" dot>{s.equipment.length} aset terpetakan</Chip>
          <Chip tone="warn" dot pulse>{s.transfers.filter((t) => t.status === "PENDING").length} transfer pending</Chip>
        </div>
      </div>

      <Card className="p-4">
        <Tabs active={tab} onChange={setTab}
          tabs={[{ id: "bld", label: "Gedung & Ruangan" }, { id: "trf", label: "Transfer Aset" }, { id: "qr", label: "Label & Scan QR" }]}
          counts={{ bld: BUILDINGS.length, trf: s.transfers.length, qr: s.equipment.length }} />
        <div className="pt-4">
          {tab === "bld" && (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
              <div className="space-y-3">
                {BUILDINGS.map((b, i) => (
                  <div key={b.id} className="row-in rounded-lg border border-line bg-paper p-3.5 transition hover:shadow-md" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`flex h-9 w-9 items-center justify-center rounded-md ${b.status === "ACTIVE" ? "bg-pine-100 text-pine-700" : b.status === "PLANNED" ? "bg-infobg text-info" : "bg-warnbg text-warn"}`}><IcPin size={16} /></span>
                        <div>
                          <p className="font-display text-[13.5px] font-extrabold text-ink">{b.name} <span className="font-semibold text-mute">— {b.label}</span></p>
                          <p className="font-mono text-[9.5px] text-mute">{b.id} · {b.year} · {b.floors.length} lantai</p>
                        </div>
                      </div>
                      {b.status === "ACTIVE" ? <Chip tone="ok" dot>ACTIVE</Chip> : b.status === "PLANNED" ? <Chip tone="info" dot>PLANNED</Chip> : <Chip tone="warn" dot pulse>RENOVASI</Chip>}
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-mute">{b.note}</p>
                    <div className="mt-2 flex items-center justify-between border-t border-line pt-2 font-mono text-[10px] text-mute">
                      <span><b className="text-ink">{assetCount(b.name)}</b> aset</span>
                      <span className="font-bold text-pine-700">{fmtIDRCompact(assetValue(b.name))}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="overflow-x-auto rounded-md border border-line xl:col-span-2">
                <table className="w-full min-w-[560px] text-left">
                  <thead>
                    <tr className="border-b border-line bg-canvas/70 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">
                      <th className="px-3 py-2.5">Ruangan</th><th className="px-3 py-2.5">Gedung</th><th className="px-3 py-2.5">Unit</th><th className="px-3 py-2.5 text-right">Aset</th><th className="px-3 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {rooms.map((r) => (
                      <tr key={r.id} className="transition hover:bg-pine-50/60">
                        <td className="px-3 py-2.5"><p className="text-[12.5px] font-bold text-ink">{r.name}</p><p className="font-mono text-[9.5px] text-mute">{r.floor}</p></td>
                        <td className="px-3 py-2.5 text-[11.5px] text-ink2">{r.building}</td>
                        <td className="px-3 py-2.5 text-[11.5px] text-mute">{r.unit}</td>
                        <td className="num px-3 py-2.5 text-right font-mono text-[12px] font-bold text-ink">{r.assets.length}</td>
                        <td className="px-3 py-2.5">
                          {r.assets.length > 0 && <BtnSm onClick={() => nav("equipment-detail", r.assets[0].id)}>{r.assets[0].name}{r.assets.length > 1 ? ` +${r.assets.length - 1}` : ""}</BtnSm>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "trf" && (
            <div className="space-y-3">
              {s.transfers.map((t, i) => {
                const eq = s.equipment.find((e) => e.id === t.eqId);
                return (
                  <div key={t.id} className="row-in rounded-lg border border-line bg-paper p-4 transition hover:shadow-md" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`flex h-9 w-9 items-center justify-center rounded-md ${t.status === "PENDING" ? "bg-warnbg text-warn" : t.status === "APPROVED" ? "bg-okbg text-ok" : "bg-dangerbg text-danger"}`}><IcSwap size={16} /></span>
                      <div className="min-w-0">
                        <p className="font-mono text-[12.5px] font-bold text-ink">{t.ref} <span className="font-sans text-[12px] text-ink2">· {eq?.name}</span></p>
                        <p className="font-mono text-[10px] text-mute">{relTime(t.date)} · oleh {t.requester}</p>
                      </div>
                      <span className="ml-auto"><StatusChip status={t.status} pulse={t.status === "PENDING"} /></span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[11px]">
                      <span className="rounded border border-line bg-canvas/60 px-2 py-1 text-ink2">{t.fromRoom}</span>
                      <span className="text-pine-600">→</span>
                      <span className="rounded border border-pine-500/40 bg-pine-50 px-2 py-1 font-bold text-pine-700">{t.toBuilding} · {t.toFloor} · {t.toRoom}</span>
                    </div>
                    <p className="mt-2 text-[11.5px] text-mute">Alasan: {t.reason}</p>
                    <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
                      <span className="font-mono text-[10px] text-mute">{t.decidedBy ? `keputusan: ${t.decidedBy} · ${fmtDate(t.decidedAt!)}` : "menunggu approval matrix (BR-006)"}</span>
                      <BtnSm onClick={() => nav("equipment-detail", t.eqId)}>Equipment 360°</BtnSm>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "qr" && (
            <div className="space-y-4">
              <Card className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-md bg-pine-700 text-pine-50"><IcScan size={20} /></span>
                  <div className="min-w-[220px] flex-1">
                    <p className="font-display text-[14px] font-extrabold text-ink">Scan QR / ketik kode aset</p>
                    <p className="font-mono text-[10px] text-mute">Mobile/PWA field ops · offline queue ready · QR lookup &lt; 1s</p>
                  </div>
                  <div className="flex w-full max-w-sm gap-2">
                    <input value={scan} onChange={(e) => setScan(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doScan()}
                      placeholder="cth: AST-RS-2026-000003 atau DR-VN-30417"
                      className="w-full rounded-md border border-line bg-card px-3 py-2 font-mono text-[12px] outline-none transition focus:border-pine-500 focus:ring-2 focus:ring-pine-500/25" />
                    <BtnPrimary onClick={doScan}><IcScan size={13} /> Buka</BtnPrimary>
                  </div>
                </div>
                {scanErr && <p className="mt-2 rounded-md bg-dangerbg px-3 py-2 text-xs font-semibold text-danger">{scanErr}</p>}
              </Card>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {s.equipment.map((e, i) => (
                  <div key={e.id} className="row-in group rounded-lg border border-line bg-paper p-3 text-center transition hover:-translate-y-0.5 hover:border-pine-500/50 hover:shadow-lg" style={{ animationDelay: `${(i % 10) * 40}ms` }}>
                    <button onClick={() => setQrEq(e.id)} className="mx-auto block w-fit rounded-md bg-card p-1.5 transition group-hover:bg-pine-50"><QRGlyph seed={e.code + e.serial} size={76} /></button>
                    <p className="mt-1.5 truncate font-mono text-[9.5px] font-bold text-pine-700">{e.code}</p>
                    <p className="truncate text-[11px] font-semibold text-ink">{e.name}</p>
                    <p className="truncate font-mono text-[9px] text-mute">{e.room}</p>
                    <BtnSm className="mt-1.5 w-full" onClick={() => printQr(e.id)}>Cetak label</BtnSm>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* QR detail modal */}
      <Modal open={!!qrAsset} onClose={() => setQrEq(null)} kicker="Asset identity · BR-002" title={qrAsset?.name ?? ""}
        footer={qrAsset && <><BtnGhost onClick={() => setQrEq(null)}>Tutup</BtnGhost><BtnPrimary onClick={() => { printQr(qrAsset.id); }}><IcScan size={13} /> Cetak label</BtnPrimary></>}>
        {qrAsset && (
          <div className="flex items-center gap-4">
            <div className="shrink-0 rounded-lg border border-line bg-card p-3"><QRGlyph seed={qrAsset.code + qrAsset.serial} size={128} /></div>
            <div className="space-y-1.5 font-mono text-[11.5px]">
              <p><span className="text-mute">asset_id&nbsp;&nbsp;</span><b className="text-pine-700">{qrAsset.code}</b></p>
              <p><span className="text-mute">serial&nbsp;&nbsp;&nbsp;&nbsp;</span><b>{qrAsset.serial}</b></p>
              <p><span className="text-mute">lokasi&nbsp;&nbsp;&nbsp;&nbsp;</span>{qrAsset.building} · {qrAsset.floor} · {qrAsset.room}</p>
              <p><span className="text-mute">status&nbsp;&nbsp;&nbsp;&nbsp;</span><StatusChip status={qrAsset.opStatus} /></p>
              <p className="pt-1 text-[10px] text-mute">Scan membuka Equipment 360° dengan aksi ter-gate permission.</p>
            </div>
          </div>
        )}
      </Modal>

      {s.transfers.length === 0 && tab === "trf" && <Card><EmptyState title="Belum ada transfer" /></Card>}
      <p className="font-mono text-[10.5px] text-mute">Transfer dieksekusi otomatis saat approval disetujui — lokasi, timeline & audit diperbarui serentak.</p>
    </div>
  );
}
