import { useMemo, useState } from "react";
import { useApp } from "../lib/store";
import { fmtTime, fmtDate } from "../lib/types";
import { IcBolt, IcChevD } from "../components/icons";

/* dark telemetry palette */
const C = {
  bg: "#0b1a15", panel: "#10251e", line: "#1e3a30",
  mute: "#7fa093", dim: "#4c6a5e",
  pine: "#35c79a", amber: "#f2a93b", red: "#ff7a66", blue: "#5ec8e5", violet: "#b69df0",
};

const AGG_COLOR: Record<string, string> = {
  asset: C.pine, inventory: C.blue, work_order: C.amber, calibration: C.violet,
  complaint: C.red, repair: C.amber, approval: C.blue, procurement: C.pine,
};

export default function EventBus() {
  const { s, toast } = useApp();
  const [agg, setAgg] = useState("ALL");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const aggs = useMemo(() => Array.from(new Set(s.events.map((e) => e.aggregate_type))).sort(), [s.events]);

  const rows = useMemo(
    () => s.events.filter((e) => (agg === "ALL" || e.aggregate_type === agg) && (q === "" || `${e.event_type} ${e.aggregate_id} ${e.actor} ${e.payload}`.toLowerCase().includes(q.toLowerCase()))),
    [s.events, agg, q]
  );

  const throughput = useMemo(() => {
    const days: { label: string; v: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - i);
      const end = +start + 864e5;
      days.push({ label: String(start.getDate()).padStart(2, "0"), v: s.events.filter((e) => +new Date(e.timestamp) >= +start && +new Date(e.timestamp) < end).length });
    }
    return days;
  }, [s.events]);
  const maxD = Math.max(...throughput.map((d) => d.v), 1);

  const copy = async (id: string) => {
    const env = s.events.find((e) => e.event_id === id);
    if (!env) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(env, null, 2));
      toast(`Envelope ${id} disalin sebagai JSON`);
    } catch {
      toast("Clipboard tidak tersedia", "warn");
    }
  };

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Event Bus · Telemetri</h1>
          <p className="text-xs text-mute">Setiap transaksi memancarkan envelope imutabel (§11) — event_id · aggregate · actor · payload · correlation_id</p>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-line bg-card px-3 py-1.5">
          <span className="pulse-dot h-2 w-2 rounded-full bg-pine-500" />
          <span className="font-mono text-[11px] font-bold text-pine-700">STREAMING · {s.events.length} event</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        {/* stream console */}
        <div className="lg:col-span-3 overflow-hidden rounded-lg border" style={{ background: C.bg, borderColor: C.line }}>
          <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3" style={{ borderColor: C.line }}>
            <button onClick={() => setAgg("ALL")}
              className="rounded px-2.5 py-1 font-mono text-[10.5px] font-bold transition"
              style={agg === "ALL" ? { background: C.pine, color: C.bg } : { color: C.mute }}>{`*`}</button>
            {aggs.map((a) => (
              <button key={a} onClick={() => setAgg(a)}
                className="rounded px-2.5 py-1 font-mono text-[10.5px] font-bold transition hover:opacity-80"
                style={agg === a ? { background: AGG_COLOR[a], color: C.bg } : { color: AGG_COLOR[a] }}>{a}</button>
            ))}
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="filter event…"
              className="ml-auto w-44 rounded-md border bg-transparent px-2.5 py-1 font-mono text-[11px] outline-none transition focus:border-pine-500"
              style={{ borderColor: C.line, color: "#e8f2ec" }} />
          </div>

          <div className="max-h-[520px] overflow-y-auto">
            {rows.length === 0 && (
              <p className="py-10 text-center font-mono text-[11px]" style={{ color: C.dim }}>— tidak ada event cocok dengan filter —</p>
            )}
            {rows.map((e, i) => {
              const expanded = open === e.event_id;
              return (
                <div key={e.event_id} className="row-in border-b transition hover:bg-white/[0.02]" style={{ borderColor: C.line, animationDelay: `${Math.min(i, 12) * 30}ms` }}>
                  <button onClick={() => setOpen(expanded ? null : e.event_id)} className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-left">
                    <span className="shrink-0 font-mono text-[10px]" style={{ color: C.dim }}>{fmtTime(e.timestamp)}</span>
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: AGG_COLOR[e.aggregate_type] }} />
                    <span className="min-w-0 truncate font-mono text-[10.5px] font-bold sm:w-56 sm:shrink-0 sm:text-[11.5px]" style={{ color: AGG_COLOR[e.aggregate_type] }}>{e.event_type}</span>
                    <span className="hidden w-28 shrink-0 truncate font-mono text-[10.5px] md:block" style={{ color: "#e8f2ec" }}>{e.aggregate_id}</span>
                    <span className="w-full min-w-0 truncate font-mono text-[10px] sm:w-auto sm:flex-1 sm:text-[10.5px]" style={{ color: C.mute }}>{e.payload}</span>
                    <IcChevD size={12} className={`ml-auto shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
                  </button>
                  {expanded && (
                    <div className="msg-in mx-4 mb-3 rounded-md border p-3 font-mono text-[10.5px] leading-relaxed" style={{ borderColor: C.line, background: C.panel }}>
                      <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
                        <p style={{ color: C.dim }}>event_id: <span style={{ color: "#e8f2ec" }}>{e.event_id}</span></p>
                        <p style={{ color: C.dim }}>correlation_id: <span style={{ color: C.pine }}>{e.correlation_id}</span></p>
                        <p style={{ color: C.dim }}>aggregate: <span style={{ color: "#e8f2ec" }}>{e.aggregate_type} / {e.aggregate_id}</span></p>
                        <p style={{ color: C.dim }}>actor: <span style={{ color: "#e8f2ec" }}>{e.actor}</span></p>
                        <p style={{ color: C.dim }}>timestamp: <span style={{ color: "#e8f2ec" }}>{fmtDate(e.timestamp)} {fmtTime(e.timestamp)}</span></p>
                        <p className="md:col-span-2" style={{ color: C.dim }}>payload: <span style={{ color: C.amber }}>{e.payload}</span></p>
                      </div>
                      <button onClick={() => copy(e.event_id)} className="mt-2 rounded border px-2.5 py-1 text-[10px] font-bold transition hover:opacity-75" style={{ borderColor: C.pine, color: C.pine }}>
                        Salin JSON envelope
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            <div className="flex items-center gap-2 px-4 py-2.5 font-mono text-[10.5px]" style={{ color: C.pine }}>
              <IcBolt size={12} /> menunggu event berikutnya<span className="typing-dot">▮</span><span className="typing-dot">▮</span><span className="typing-dot">▮</span>
            </div>
          </div>
        </div>

        {/* side: throughput + catalog */}
        <div className="space-y-3">
          <div className="rounded-lg border p-4" style={{ background: C.bg, borderColor: C.line }}>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: C.mute }}>Throughput 14 hari</p>
            <div className="mt-3 flex h-24 items-end gap-1">
              {throughput.map((d) => (
                <div key={d.label} className="group flex flex-1 flex-col items-center gap-1" title={`${d.label}: ${d.v} event`}>
                  <div className="w-full rounded-t-[2px] transition group-hover:opacity-80" style={{ height: `${Math.max(4, (d.v / maxD) * 100)}%`, background: d.v === maxD && d.v > 0 ? C.pine : "#1e3a30" }} />
                  <span className="font-mono text-[7.5px]" style={{ color: C.dim }}>{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border p-4" style={{ background: C.bg, borderColor: C.line }}>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: C.mute }}>Karakteristik bus</p>
            <div className="mt-3 space-y-2.5 font-mono text-[10.5px]">
              {[
                ["Transport", "async queue + retry idempoten"],
                ["Konsumen", "SIMRS · Finance · HR · EMR · ASPAK"],
                ["Urutan", "at-least-once, order by aggregate"],
                ["Retensi", "140 event di konsol · penuh di DB"],
                ["Integritas", "envelope imutabel, ter-audit"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-3">
                  <span style={{ color: C.dim }}>{k}</span>
                  <span className="text-right" style={{ color: "#cfe6db" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border p-4" style={{ background: C.bg, borderColor: C.line }}>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: C.mute }}>Coba sekarang</p>
            <p className="mt-2 text-[11.5px] leading-relaxed" style={{ color: C.mute }}>
              Lakukan aksi apa pun — catat kalibrasi, tutup WO, distribusi stok, setujui PR — dan envelope-nya akan <span style={{ color: C.pine }}>muncul di stream ini secara instan</span>.
            </p>
          </div>
        </div>
      </div>

      <p className="font-mono text-[10.5px] text-mute">Event envelope mengikuti spesifikasi PRD §11 · dikonsumsi downstream via Integration Hub (konektor aktif di sana).</p>
    </div>
  );
}
