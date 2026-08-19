import { useMemo, useState } from "react";
import { useApp } from "../lib/store";
import { Bar, BtnSm, Card, Chip, SectionHead, StatusChip } from "../components/ui";
import { IcBolt, IcCheck, IcX } from "../components/icons";
import { fmtTime, relTime } from "../lib/types";
import type { AuditEntry } from "../lib/types";

const evMap: [RegExp, string][] = [
  [/ASSET\.DISPOSE/, "asset.disposed"], [/ASSET\.RETIRE/, "asset.retired"], [/ASSET\.INSPECT/, "asset.inspected"],
  [/TRANSFER\.REQUEST|ASSET\.ASSIGN/, "asset.transferred"], [/COMPLAINT/, "asset.complaint.created"],
  [/CALIBRATION/, "asset.calibration.completed"], [/MAINTENANCE\.START/, "asset.maintenance.started"],
  [/REPAIR/, "asset.repair.started"], [/PROCUREMENT\.GRN|INVENTORY\.RECEIVE/, "inventory.received"],
  [/INVENTORY\.ISSUE/, "inventory.issued"], [/INVENTORY\.ADJUST/, "inventory.adjusted"],
  [/STOCK_OPNAME/, "inventory.stock_opname.completed"], [/SYNC|QR\./, "asset.inspected"],
  [/INTEGRATION/, "system.health"], [/PROCUREMENT|DEMAND/, "inventory.received"], [/APPROVAL/, "system.event"],
];
const toEvent = (a: AuditEntry) => (evMap.find(([re]) => re.test(a.action))?.[1] ?? "system.event").toLowerCase();
const corrOf = (id: string) => "corr-" + id.replace(/[^a-z0-9]/gi, "").slice(-8).toLowerCase().padStart(8, "0");

export default function Integrations() {
  const { s, toggleConnector, retryConnector, toast } = useApp();
  const [replayKey, setReplayKey] = useState(0);
  const canOps = ["IT Administrator", "Pengelola Aset", "Direksi"].includes(s.role);

  const feed = useMemo(() => s.audit.slice(0, 14), [s.audit]);
  const connected = s.connectors.filter((c) => c.status === "CONNECTED").length;
  const evTotal = s.connectors.reduce((a, c) => a + c.evPerMin, 0);
  const retriesTotal = s.connectors.reduce((a, c) => a + c.retries, 0);

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Integration Hub</h1>
          <p className="text-xs text-mute">SIMRS · Finance · HR · EMR · Supplier · Payment · Notification · ASPAK — event-driven, retry + idempotency</p>
        </div>
        <div className="flex gap-2">
          <Chip tone="ok" dot>{connected}/{s.connectors.length} CONNECTED</Chip>
          <Chip tone="info" dot>{evTotal} evt/mnt</Chip>
          <Chip tone={retriesTotal ? "danger" : "ok"} dot pulse={retriesTotal > 0}>{retriesTotal} RETRY</Chip>
        </div>
      </div>

      {/* topology */}
      <Card className="overflow-hidden p-0">
        <div className="dark-grain px-5 py-4 text-pine-50">
          <p className="mb-4 font-mono text-[9.5px] font-bold uppercase tracking-[0.16em] text-pine-500">Reference architecture · PRD §13</p>
          <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center">
            {[
              { label: "SIMASET Core", sub: "Asset · Inventory · Technical", strong: true },
              { label: "API Gateway", sub: "AuthN · rate limit · routing", strong: false },
            ].map((n) => (
              <div key={n.label} className="flex flex-1 items-center gap-2">
                <div className={`flex-1 rounded-lg border px-3 py-2.5 ${n.strong ? "border-warnhi/60 bg-pine-800/80" : "border-pine-700 bg-pine-900/70"}`}>
                  <p className={`font-display text-[12.5px] font-extrabold ${n.strong ? "text-warnhi" : "text-pine-50"}`}>{n.label}</p>
                  <p className="font-mono text-[9px] text-pine-100/60">{n.sub}</p>
                </div>
                <span className="hidden shrink-0 font-mono text-pine-600 md:block">→</span>
              </div>
            ))}
            <div className="flex flex-[2] flex-col gap-1.5">
              {["Asset Service", "Inventory Service", "Technical Service"].map((svc) => (
                <div key={svc} className="relative flex items-center justify-between overflow-hidden rounded-md border border-pine-700 bg-pine-900/70 px-3 py-1.5">
                  <span className="font-mono text-[10.5px] font-bold text-pine-100">{svc}</span>
                  <span className="font-mono text-[9px] text-pine-100/50">stateless</span>
                  <div className="scanline pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-transparent via-pine-500/25 to-transparent" />
                </div>
              ))}
            </div>
            <span className="hidden shrink-0 font-mono text-pine-600 md:block">⇒</span>
            <div className="flex flex-1 items-center gap-2">
              <div className="flex-1 rounded-lg border border-pine-700 bg-pine-950/60 px-3 py-2.5">
                <p className="font-display text-[12px] font-extrabold text-pine-50">PostgreSQL · Redis · Object Storage</p>
                <p className="font-mono text-[9px] text-pine-100/50">Event/Queue → SIMRS, Finance, Notification</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* connectors */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {s.connectors.map((c, i) => {
          const overSla = c.p95 > 500;
          return (
            <div key={c.id} className={`row-in rounded-lg border p-3.5 transition hover:shadow-md ${c.status === "OFFLINE" ? "border-danger/40 bg-dangerbg/25" : c.status === "DEGRADED" ? "border-warn/40 bg-warnbg/25" : "border-line bg-paper"}`} style={{ animationDelay: `${i * 45}ms` }}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold text-ink">{c.name}</p>
                  <p className="font-mono text-[9.5px] text-mute">{c.target}</p>
                </div>
                <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${c.status === "CONNECTED" ? "bg-ok pulse-dot" : c.status === "DEGRADED" ? "bg-warnhi" : "bg-danger pulse-danger"}`} />
              </div>
              <p className="mt-2 line-clamp-2 min-h-[30px] text-[11px] leading-snug text-mute">{c.desc}</p>
              <div className="mt-2.5">
                <div className="mb-1 flex justify-between font-mono text-[9.5px] text-mute">
                  <span>p95 {c.p95}ms</span>
                  <span className={overSla ? "font-bold text-danger" : "text-ok"}>{overSla ? "> SLA 500ms" : "OK"}</span>
                </div>
                <Bar pct={Math.min(100, (c.p95 / 800) * 100)} tone={overSla ? "danger" : c.status === "DEGRADED" ? "warn" : "pine"} />
              </div>
              <div className="mt-2.5 flex items-center justify-between font-mono text-[9.5px] text-mute">
                <span>{c.evPerMin} evt/mnt</span>
                <span>sync {relTime(c.lastSync)}</span>
              </div>
              <div className="mt-2.5 flex gap-1.5 border-t border-line pt-2">
                <BtnSm disabled={!canOps} title={!canOps ? "Butuh IT Administrator / Pengelola Aset" : undefined} onClick={() => toggleConnector(c.id)}>
                  {c.status === "OFFLINE" ? <><IcCheck size={11} /> Sambung</> : <><IcX size={11} /> Putus</>}
                </BtnSm>
                {c.retries > 0 && <BtnSm disabled={!canOps} onClick={() => retryConnector(c.id)} className="!border-danger/50 !text-danger">Retry {c.retries}</BtnSm>}
              </div>
            </div>
          );
        })}
      </div>

      {/* event bus + SLA */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="p-4 xl:col-span-2">
          <SectionHead title="Event bus" sub="Proyeksi audit trail → katalog event (event-driven, async-ready)"
            right={<BtnSm onClick={() => { setReplayKey((k) => k + 1); toast("Event stream di-replay dari head", "info"); }}><IcBolt size={11} /> Replay</BtnSm>} />
          <div key={replayKey} className="max-h-[380px] space-y-1 overflow-y-auto rounded-md border border-line bg-pine-950 p-3">
            {feed.map((a, i) => (
              <div key={a.id + replayKey} className="row-in flex items-center gap-3 rounded px-2 py-1.5 font-mono text-[10.5px] hover:bg-pine-900/60" style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
                <span className="shrink-0 text-pine-600">{fmtTime(a.date)}</span>
                <span className="shrink-0 font-bold text-warnhi">{toEvent(a)}</span>
                <span className="min-w-0 flex-1 truncate text-pine-100/70">{a.entity}:{a.entityId}</span>
                <span className="hidden shrink-0 text-pine-100/40 sm:inline">{corrOf(a.id)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <SectionHead title="Non-functional targets" sub="PRD §12" />
          <div className="space-y-3.5">
            {[
              { l: "API p95 (standard query)", v: 320, target: 500, unit: "ms" },
              { l: "Dashboard p95", v: 1400, target: 2000, unit: "ms" },
              { l: "QR lookup", v: 620, target: 1000, unit: "ms" },
            ].map((m) => (
              <div key={m.l}>
                <div className="mb-1 flex justify-between font-mono text-[10px] text-mute">
                  <span>{m.l}</span>
                  <span className={m.v < m.target ? "font-bold text-ok" : "font-bold text-danger"}>{m.v} / {m.target}{m.unit}</span>
                </div>
                <Bar pct={(m.v / m.target) * 100} tone={m.v < m.target ? "ok" : "danger"} />
              </div>
            ))}
            <div className="border-t border-line pt-3">
              <p className="font-mono text-[9.5px] font-bold uppercase tracking-wider text-mute">Ketersediaan</p>
              <p className="num mt-1 font-display text-[26px] font-black text-pine-700">99,94%</p>
              <p className="font-mono text-[9.5px] text-mute">target ≥ 99,9% · horizontal scaling via load balancer</p>
            </div>
          </div>
        </Card>
      </div>

      <p className="font-mono text-[10.5px] text-mute">
        Event envelope: event_id · event_type · aggregate · correlation_id · retry + idempotency key — audit trail imutabel (BR-010).
      </p>
    </div>
  );
}
