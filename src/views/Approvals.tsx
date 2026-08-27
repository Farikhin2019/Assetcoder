import { useApp } from "../lib/store";
import { Card, Chip, SectionHead, EmptyState, BtnSm, StatusChip } from "../components/ui";
import { fmtDate } from "../lib/types";
import { ClipboardCheck } from "lucide-react";

export default function Approvals() {
  const { s, nav } = useApp();
  const pending = s.purchaseRequests.filter((p) => p.status === "IN_APPROVAL");

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Pusat Persetujuan</h1>
          <p className="text-xs text-mute">Persetujuan pembelian (PR) berjalan 3 tahap per-barang di menu Pengadaan, sesuai peran Anda</p>
        </div>
        <Chip tone="warn" dot pulse={pending.length > 0}>{pending.length} PR menunggu</Chip>
      </div>

      <Card className="p-4">
        <SectionHead title="Menunggu keputusan" sub="Buka Pengadaan untuk menyetujui / menolak per-barang sesuai tahap Anda"
          right={<BtnSm onClick={() => nav("procurement")} className="!border-pine-500/60 !text-pine-700">Buka Pengadaan →</BtnSm>} />
        {pending.length === 0 ? <EmptyState title="Antrian bersih" sub="Tidak ada permintaan yang menunggu persetujuan." /> : (
          <div className="space-y-2.5">
            {pending.map((pr) => (
              <button key={pr.id} onClick={() => nav("procurement")} className="row-in flex w-full flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-paper px-3 py-2.5 text-left transition hover:border-pine-500/50 hover:shadow-md">
                <span className="min-w-0">
                  <span className="flex items-center gap-2"><ClipboardCheck size={14} className="text-pine-600" /><span className="font-mono text-[12.5px] font-bold text-ink">{pr.code}</span><StatusChip status={pr.status} /></span>
                  <span className="mt-0.5 block font-mono text-[10px] text-mute">{pr.unit} · {pr.lines.length} baris · diajukan {pr.requester}</span>
                </span>
                <span className="font-mono text-[10px] text-mute">butuh {fmtDate(pr.needBy)}</span>
              </button>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <SectionHead title="Tahap persetujuan pembelian" sub="Urutan pihak yang harus menyetujui tiap PR" />
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
          {[
            { t: "Tahap 1 · IT / Umum", roles: "Umum · IT Administrator · Pengelola Aset" },
            { t: "Tahap 2 · Keuangan", roles: "Finance" },
            { t: "Tahap 3 · COO", roles: "COO" },
          ].map((x, i) => (
            <div key={x.t} className="rounded-md border border-line bg-paper p-3">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-pine-700">{x.t}</p>
              <p className="mt-1 text-[11.5px] text-ink2">{x.roles}</p>
            </div>
          ))}
        </div>
      </Card>

      <p className="font-mono text-[10.5px] text-mute">Keputusan per-barang tercatat imutabel di riwayat audit · baris ditolak bisa direvisi & dikirim ulang dari tahap 1.</p>
    </div>
  );
}
