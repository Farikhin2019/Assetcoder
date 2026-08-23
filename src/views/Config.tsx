import { useApp } from "../lib/store";
import { Card, Chip, MonoTag, SectionHead, statusId } from "../components/ui";
import { SLA_BY_PRIORITY, ADJ_APPROVAL_THRESHOLD, fmtIDR } from "../lib/types";
import { Settings2 } from "lucide-react";

export default function Config() {
  const { s } = useApp();

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Pengaturan Sistem</h1>
          <p className="text-xs text-mute">Semua parameter kebijakan terkumpul di satu tempat, tidak tersebar di dalam kode</p>
        </div>
        <Chip tone="pine"><Settings2 size={11} /> read-only demo</Chip>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="p-4">
          <SectionHead title="Identitas organisasi" />
          <div className="space-y-2">
            {[["Organisasi", "PT Harapan Medika Sejahtera"], ["Rumah sakit", "RS Harapan Medika"], ["Cabang", "Cabang Utama (multi-branch ready)"]].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-3 rounded-md bg-canvas/60 px-2.5 py-1.5">
                <span className="font-mono text-[9.5px] font-bold uppercase text-mute">{k}</span>
                <span className="text-[11.5px] font-semibold text-ink2">{v}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <SectionHead title="Batas Persetujuan & SLA" />
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 rounded-md bg-canvas/60 px-2.5 py-1.5">
              <span className="font-mono text-[9.5px] font-bold uppercase text-mute">Penyesuaian stok wajib disetujui bila di atas</span>
              <span className="num font-mono text-[11.5px] font-bold text-pine-700">{fmtIDR(ADJ_APPROVAL_THRESHOLD)}</span>
            </div>
            {Object.entries(SLA_BY_PRIORITY).map(([p, h]) => (
              <div key={p} className="flex items-center justify-between gap-3 rounded-md bg-canvas/60 px-2.5 py-1.5">
                <span className="font-mono text-[9.5px] font-bold uppercase text-mute">Batas waktu keluhan prioritas {statusId(p)}</span>
                <span className="num font-mono text-[11.5px] font-bold text-ink2">{h} jam</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <SectionHead title="Kanal notifikasi" />
          <div className="space-y-2">
            {[["Di Aplikasi", true], ["Surel (Email)", true], ["WhatsApp", false], ["Notifikasi Dorong", true]].map(([k, on]) => (
              <div key={k as string} className="flex items-center justify-between gap-3 rounded-md bg-canvas/60 px-2.5 py-1.5">
                <span className="font-mono text-[9.5px] font-bold uppercase text-mute">{k}</span>
                <Chip tone={on ? "ok" : "neutral"} dot>{on ? "AKTIF" : "MATI"}</Chip>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <SectionHead title="Matriks Persetujuan" sub="Urutan pihak yang harus menyetujui tiap jenis transaksi" />
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
          {[
            { t: "Pembelian (PR)", stages: ["IT / Umum", "Keuangan", "COO"] },
            { t: "Pemindahan Aset", stages: ["Kepala Unit asal", "Pengelola Aset", "Kepala Unit tujuan"] },
            { t: "Penyesuaian Stok", stages: ["Kepala Gudang", "Pengelola Inventori", "Manajemen"] },
            { t: "Perbaikan", stages: ["Kepala Teknisi", "Pengelola Aset"] },
            { t: "Penghapusan Aset", stages: ["Pengelola Aset", "Keuangan", "COO / Direksi"] },
          ].map((m) => (
            <div key={m.t} className="rounded-md border border-line bg-paper p-3">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-pine-700">{m.t}</p>
              <div className="mt-2 flex flex-wrap items-center gap-1">
                {m.stages.map((st, i) => (
                  <span key={st} className="flex items-center gap-1">
                    <MonoTag>{i + 1}. {st}</MonoTag>
                    {i < m.stages.length - 1 && <span className="text-[10px] text-line2">→</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <p className="flex items-center gap-1.5 font-mono text-[10.5px] text-mute"><Settings2 size={12} className="text-pine-600" /> Perubahan konfigurasi dicatat di audit trail (entity: configuration).</p>
    </div>
  );
}
