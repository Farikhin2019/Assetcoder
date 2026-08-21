import { useApp } from "../lib/store";
import { Card, Chip, EmptyState, SectionHead, StatusChip } from "../components/ui";
import { fmtDate } from "../lib/types";
import { Stamp } from "lucide-react";

export default function Approvals() {
  const { s, nav } = useApp();

  /* persetujuan yang masih berjalan ditarik dari PR (3 tahap) */
  const pending = s.purchaseRequests.filter((p) => p.status === "IN_APPROVAL");
  const done = s.purchaseRequests.filter((p) => p.status !== "IN_APPROVAL");

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Approval Engine</h1>
          <p className="text-xs text-mute">Matrix configurable: tipe transaksi · nilai · kategori · role (BR-005/006/007) · persetujuan PR via 3 tahap di Procurement</p>
        </div>
        <Chip tone="warn" dot pulse={pending.length > 0}>{pending.length} PR menunggu</Chip>
      </div>

      <Card className="p-4">
        <SectionHead title="Menunggu keputusan" sub="Buka Procurement untuk menyetujui / menolak per-barang sesuai tahap role Anda" />
        {pending.length === 0 ? <EmptyState title="Antrian bersih" sub="Tidak ada persetujuan menunggu." /> : (
          <div className="space-y-2.5">
            {pending.map((pr) => (
              <button key={pr.id} onClick={() => nav("procurement")} className="group flex w-full items-center gap-3 rounded-md border border-line bg-paper px-3 py-2.5 text-left transition hover:border-pine-500/50 hover:shadow-md">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-warnbg text-warn"><Stamp size={16} /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[12.5px] font-bold text-ink group-hover:text-pine-700">{pr.code}</span>
                    <StatusChip status={pr.status} />
                    <Chip tone="neutral">{pr.unit}</Chip>
                  </span>
                  <span className="block font-mono text-[10px] text-mute">{pr.requester} · {pr.lines.length} baris · {fmtDate(pr.date)}</span>
                </span>
                <span className="font-display text-[11px] font-bold text-pine-600">buka →</span>
              </button>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <SectionHead title="Riwayat keputusan" sub="Tercatat imutabel di audit trail" />
        <div className="divide-y divide-line">
          {done.length === 0 && <p className="py-6 text-center text-xs text-mute">Belum ada keputusan.</p>}
          {done.map((pr) => (
            <div key={pr.id} className="flex flex-wrap items-center gap-3 py-2.5">
              <StatusChip status={pr.status} />
              <span className="font-mono text-[11.5px] font-bold text-ink">{pr.code}</span>
              <span className="min-w-0 flex-1 truncate text-[12px] text-ink2">{pr.requester} · {pr.unit}</span>
              <span className="font-mono text-[10.5px] text-mute">{fmtDate(pr.date)}</span>
            </div>
          ))}
        </div>
      </Card>

      <p className="font-mono text-[10.5px] text-mute">Tahap: 1) IT/Umum · 2) Keuangan · 3) COO — tiap tahap bisa menyetujui, menolak (dengan saran), per-barang atau semua.</p>
    </div>
  );
}
