import { useState } from "react";
import { useApp } from "../lib/store";
import { Card, Chip, StatusChip, Tabs } from "../components/ui";
import { fmtDate, daysUntil } from "../lib/types";
import { Wrench, Truck } from "lucide-react";

export default function MasterData() {
  const { s, nav } = useApp();
  const [tab, setTab] = useState("tech");

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Data Induk</h1>
          <p className="text-xs text-mute">Data dasar teknisi dan pemasok yang menjadi rujukan seluruh modul</p>
        </div>
      </div>

      <Card className="p-4">
        <Tabs active={tab} onChange={setTab}
          tabs={[{ id: "tech", label: "Teknisi" }, { id: "sup", label: "Pemasok" }]}
          counts={{ tech: s.technicians.length, sup: s.suppliers.length }} />
        <div className="pt-4">
          {tab === "tech" && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {s.technicians.map((t, i) => {
                const openWo = s.workOrders.filter((w) => w.techId === t.id && w.status !== "CLOSED").length;
                return (
                  <div key={t.id} className="row-in rounded-lg border border-line bg-paper p-3.5 transition hover:border-pine-500/40 hover:shadow-md" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-pine-100 text-pine-700"><Wrench size={15} /></span>
                      <div>
                        <p className="text-[13px] font-bold text-ink">{t.name}</p>
                        <p className="font-mono text-[10px] text-mute">{t.id}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-[12px] text-ink2">{t.specialty}</p>
                    <p className="mt-1 font-mono text-[10.5px] text-mute">{t.cert}</p>
                    <div className="mt-2.5 flex items-center justify-between border-t border-line pt-2">
                      <span className="font-mono text-[10.5px] text-mute">{openWo} WO aktif</span>
                      <Chip tone={openWo > 0 ? "info" : "neutral"} dot>{openWo > 0 ? "BERTUGAS" : "SIAGA"}</Chip>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "sup" && (
            <div className="overflow-x-auto rounded-md border border-line">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="border-b border-line bg-canvas/70 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">
                    <th className="px-3 py-2.5">Pemasok</th><th className="px-3 py-2.5">Layanan</th>
                    <th className="px-3 py-2.5">Kontrak s.d.</th><th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5 text-right">Aset</th>
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
                        <td className="px-3 py-2.5 font-mono text-[11px] text-ink2">{fmtDate(sp.contractUntil)}</td>
                        <td className="px-3 py-2.5">{dd < 0 ? <Chip tone="danger" dot pulse>KADALUARSA</Chip> : dd < 60 ? <Chip tone="warn" dot>{dd} HARI</Chip> : <Chip tone="ok" dot>AKTIF</Chip>}</td>
                        <td className="num px-3 py-2.5 text-right font-mono text-[11px] text-ink2">{eqCount} unit</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      <p className="flex items-center gap-1.5 font-mono text-[10.5px] text-mute"><Truck size={12} className="text-pine-600" /> Kontrak pemasok &lt; 60 hari memicu peringatan CONTRACT_EXPIRING.</p>
    </div>
  );
}
