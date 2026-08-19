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

      {/* statistik ringkas */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: "Total entri", v: s.audit.length, sub: "append-only, tak terhapus" },
          { l: "Aktor unik", v: new Set(s.audit.map((a) => a.actor)).size, sub: "termasuk scheduler (system)" },
          { l: "Entitas tersentuh", v: entities.length, sub: "asset · inventory · approval · …" },
          { l: "24 jam terakhir", v: s.audit.filter((a) => Date.now() - new Date(a.date).getTime() < 864e5).length, sub: "aktivitas terkini" },
        ].map((k, i) => (
          <Card key={k.l} className="row-in p-3.5" >
            <div style={{ animationDelay: `${i * 60}ms` }}>
              <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-mute">{k.l}</p>
              <p className="num mt-1 font-display text-[24px] font-black leading-none text-ink">{k.v}</p>
              <p className="mt-1 font-mono text-[9.5px] text-mute">{k.sub}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* distribusi entitas teratas */}
      <Card className="p-4">
        <p className="mb-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-mute">Distribusi entitas teratas</p>
        <div className="space-y-2">
          {(() => {
            const counts = entities.map((e) => ({ e, n: s.audit.filter((a) => a.entity === e).length })).sort((a, b) => b.n - a.n).slice(0, 6);
            const max = Math.max(...counts.map((c) => c.n), 1);
            return counts.map((c) => (
              <div key={c.e} className="flex items-center gap-3">
                <button onClick={() => setEntity(c.e)} className="w-44 shrink-0 truncate text-left font-mono text-[11px] font-semibold text-ink2 transition hover:text-pine-700">{c.e}</button>
                <div className="h-3.5 flex-1 overflow-hidden rounded-sm bg-moss">
                  <div className="bar-fill h-full rounded-sm bg-pine-500/80" style={{ width: `${(c.n / max) * 100}%` }} />
                </div>
                <span className="num w-8 shrink-0 text-right font-mono text-[11px] font-bold text-ink">{c.n}</span>
              </div>
            ));
          })()}
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
