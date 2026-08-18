import { useMemo, useState } from "react";
import { useApp } from "../lib/store";
import { Card, Chip, Input, Select, EmptyState, MonoTag } from "../components/ui";
import { IcShield } from "../components/icons";
import { fmtDateTime } from "../lib/types";

export default function AuditTrail() {
  const { s } = useApp();
  const [q, setQ] = useState("");
  const [entity, setEntity] = useState("ALL");

  const entities = useMemo(() => Array.from(new Set(s.audit.map((a) => a.entity))).sort(), [s.audit]);
  const rows = useMemo(() => s.audit.filter((a) =>
    (entity === "ALL" || a.entity === entity) &&
    (q === "" || `${a.action} ${a.entityId} ${a.actor} ${a.reason ?? ""} ${a.delta ?? ""}`.toLowerCase().includes(q.toLowerCase()))
  ), [s.audit, q, entity]);

  const actionTone = (action: string) =>
    action.includes("REJECT") || action.includes("FAIL") || action.includes("OVERDUE") || action.includes("EXPIRED") ? "danger"
    : action.includes("COMPLETE") || action.includes("APPROVE") ? "ok"
    : action.includes("REQUEST") || action.includes("CREATE") || action.includes("START") ? "warn" : "info";

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Audit Trail</h1>
          <p className="text-xs text-mute">Imutabel (BR-010) · who / what / when / why / before-after · actor, aksi, entitas, delta</p>
        </div>
        <div className="flex items-center gap-2">
          <Chip tone="pine" dot>{s.audit.length} entri</Chip>
          <Chip tone="neutral"><IcShield size={11} /> APPEND-ONLY</Chip>
        </div>
      </div>

      <Card className="p-3.5">
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
          <div className="col-span-2"><Input placeholder="Cari aksi, ID entitas, aktor, alasan…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <Select value={entity} onChange={(e) => setEntity(e.target.value)}>
            <option value="ALL">Semua entitas</option>
            {entities.map((e) => <option key={e}>{e}</option>)}
          </Select>
        </div>
      </Card>

      <Card className="overflow-x-auto">
        {rows.length === 0 ? <EmptyState title="Tidak ada entri cocok" sub="Ubah filter pencarian." /> : (
          <table className="w-full min-w-[980px] text-left">
            <thead>
              <tr className="border-b border-line bg-canvas/70 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">
                <th className="px-3 py-2.5">Waktu</th><th className="px-3 py-2.5">Aktor</th><th className="px-3 py-2.5">Aksi</th>
                <th className="px-3 py-2.5">Entitas</th><th className="px-3 py-2.5">ID</th><th className="px-3 py-2.5">Alasan</th><th className="px-3 py-2.5">Delta (before → after)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((a, i) => (
                <tr key={a.id} className="row-in transition hover:bg-pine-50/60" style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
                  <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[10.5px] text-mute">{fmtDateTime(a.date)}</td>
                  <td className="px-3 py-2.5"><p className="text-[12px] font-bold text-ink">{a.actor}</p><p className="font-mono text-[9.5px] text-mute">{a.role}</p></td>
                  <td className="px-3 py-2.5"><Chip tone={actionTone(a.action) as never} className="!text-[9.5px]">{a.action}</Chip></td>
                  <td className="px-3 py-2.5 font-mono text-[10.5px] text-ink2">{a.entity}</td>
                  <td className="px-3 py-2.5"><MonoTag>{a.entityId}</MonoTag></td>
                  <td className="max-w-[220px] px-3 py-2.5 text-[11.5px] text-mute">{a.reason ?? "—"}</td>
                  <td className="max-w-[260px] px-3 py-2.5 font-mono text-[10.5px] text-ink2">{a.delta ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <p className="font-mono text-[10.5px] text-mute">Cakupan: asset · inventory · maintenance · calibration · complaint · repair · transfer · approval · stock adjustment · depreciation · disposal · configuration.</p>
    </div>
  );
}
