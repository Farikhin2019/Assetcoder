import React, { useEffect } from "react";
import { useApp } from "../lib/store";
import { X, Check, AlertTriangle, Info, Bell } from "lucide-react";

export type Tone = "ok" | "warn" | "danger" | "info" | "neutral" | "pine";

const TONE_CHIP: Record<Tone, string> = {
  ok: "bg-okbg text-ok", warn: "bg-warnbg text-warn", danger: "bg-dangerbg text-danger",
  info: "bg-infobg text-info", neutral: "bg-moss text-ink2", pine: "bg-pine-100 text-pine-700",
};
const TONE_DOT: Record<Tone, string> = {
  ok: "bg-ok", warn: "bg-warnhi", danger: "bg-danger", info: "bg-info", neutral: "bg-mute", pine: "bg-pine-500",
};

export function chipFor(status: string): Tone {
  const map: Record<string, Tone> = {
    IN_SERVICE: "ok", MAINTENANCE: "warn", CALIBRATION: "info", DOWN: "danger", RETIRED: "neutral", DISPOSED: "neutral",
    VALID: "ok", DUE_SOON: "warn", EXPIRED: "danger", NOT_REQUIRED: "neutral",
    HIGH: "danger", MEDIUM: "warn", LOW: "neutral", CRITICAL: "danger",
    EXCELLENT: "ok", GOOD: "ok", FAIR: "warn", POOR: "danger",
    SCHEDULED: "info", IN_PROGRESS: "info", CLOSED: "neutral",
    OPEN: "danger", RESOLVED: "ok", ACKNOWLEDGED: "warn",
    IN_APPROVAL: "info", APPROVED: "ok", REJECTED: "danger", PO_CREATED: "pine",
    SENT: "info", RECEIVED: "ok", PENDING: "warn", DELIVERED: "info",
    AKTIF: "ok", RENCANA: "info", NONAKTIF: "neutral", ACTIVE: "ok", PLANNED: "info", UNDER_RENOVATION: "warn", INACTIVE: "neutral",
    RECEIPT: "ok", ISSUE: "info", CONSUMPTION: "info", ADJUSTMENT: "warn", OPENING_BALANCE: "neutral", STOCK_OPNAME: "info",
    PREVENTIVE: "pine", CORRECTIVE: "warn",
  };
  return map[status] ?? "neutral";
}

export function Chip({ tone, children, dot, pulse, className = "" }: { tone: Tone; children: React.ReactNode; dot?: boolean; pulse?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 font-mono text-[10.5px] font-semibold tracking-wide whitespace-nowrap ${TONE_CHIP[tone]} ${className}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[tone]} ${pulse ? "pulse-danger" : ""}`} />}
      {children}
    </span>
  );
}

export const StatusChip = ({ status, pulse, className }: { status: string; pulse?: boolean; className?: string }) => (
  <Chip tone={chipFor(status)} dot pulse={pulse} className={className}>{status.replace(/_/g, " ")}</Chip>
);

export const Card = ({ className = "", children }: { className?: string; children: React.ReactNode }) => (
  <div className={`rounded-lg border border-line bg-card shadow-[0_1px_2px_rgba(20,33,28,0.05)] ${className}`}>{children}</div>
);

export const SectionHead = ({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) => (
  <div className="mb-3 flex items-end justify-between gap-3">
    <div>
      <h2 className="font-display text-[15px] font-extrabold tracking-tight text-ink">{title}</h2>
      {sub && <p className="mt-0.5 text-xs text-mute">{sub}</p>}
    </div>
    {right}
  </div>
);

export const MonoTag = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`inline-flex items-center rounded border border-line bg-paper px-1.5 py-0.5 font-mono text-[11px] font-medium text-ink2 ${className}`}>{children}</span>
);

export const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="mb-1 block font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-mute">{children}</label>
);
const fieldCls = "w-full rounded-md border border-line bg-card px-3 py-2 text-[13px] text-ink outline-none transition placeholder:text-mute/70 focus:border-pine-500 focus:ring-2 focus:ring-pine-500/25";
export const Input = (p: React.InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={`${fieldCls} ${p.className ?? ""}`} />;
export const TextArea = (p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={`${fieldCls} min-h-[84px] ${p.className ?? ""}`} />;
export const Select = (p: React.SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={`${fieldCls} ${p.className ?? ""}`} />;

const btnBase = "inline-flex items-center justify-center gap-1.5 rounded-md font-display text-[12.5px] font-bold tracking-tight transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45";
export const BtnPrimary = ({ className = "", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...p} className={`${btnBase} bg-pine-700 px-3.5 py-2 text-pine-50 hover:bg-pine-800 ${className}`} />
);
export const BtnGhost = ({ className = "", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...p} className={`${btnBase} border border-line bg-card px-3 py-1.5 text-ink2 hover:border-pine-500/50 hover:text-pine-700 ${className}`} />
);
export const BtnDanger = ({ className = "", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...p} className={`${btnBase} bg-danger px-3.5 py-2 text-white hover:bg-[#a03023] ${className}`} />
);
export const BtnSm = ({ className = "", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...p} className={`${btnBase} border border-line bg-card px-2.5 py-1 text-[11.5px] text-ink2 hover:border-pine-500/60 hover:bg-pine-50 hover:text-pine-700 ${className}`} />
);

export function Modal({ open, onClose, title, kicker, children, footer, wide }: {
  open: boolean; onClose: () => void; title: string; kicker?: string;
  children: React.ReactNode; footer?: React.ReactNode; wide?: boolean;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-pine-950/55 p-4 pt-[9vh] backdrop-blur-[2px]" onMouseDown={onClose}>
      <div className={`modal-in w-full ${wide ? "max-w-2xl" : "max-w-md"} rounded-xl border border-line bg-paper shadow-2xl`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-line px-5 py-3.5">
          <div>
            {kicker && <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-pine-600">{kicker}</div>}
            <h3 className="font-display text-[15px] font-extrabold tracking-tight text-ink">{title}</h3>
          </div>
          <button onClick={onClose} className="rounded p-1 text-mute transition hover:bg-moss hover:text-ink" aria-label="Close"><X size={16} /></button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line bg-canvas/60 px-5 py-3 rounded-b-xl">{footer}</div>}
      </div>
    </div>
  );
}

export function Tabs({ tabs, active, onChange, counts }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void; counts?: Record<string, number> }) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-line">
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={`relative -mb-px flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 font-display text-[12.5px] font-bold tracking-tight transition ${active === t.id ? "border-pine-600 text-pine-700" : "border-transparent text-mute hover:text-ink"}`}>
          {t.label}
          {counts && counts[t.id] !== undefined && (
            <span className={`rounded px-1.5 font-mono text-[10px] ${active === t.id ? "bg-pine-100 text-pine-700" : "bg-moss text-mute"}`}>{counts[t.id]}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function Bar({ pct, tone = "pine", className = "" }: { pct: number; tone?: Tone; className?: string }) {
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-moss ${className}`}>
      <div className={`bar-fill h-full rounded-full ${tone === "danger" ? "bg-danger" : tone === "warn" ? "bg-warnhi" : tone === "info" ? "bg-info" : "bg-pine-500"}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

export function Sparkline({ data, tone = "pine", w = 96, h = 30 }: { data: number[]; tone?: "pine" | "warn" | "danger" | "info"; w?: number; h?: number }) {
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - 3 - ((v - min) / (max - min || 1)) * (h - 8)}`).join(" ");
  const colors = { pine: "#177057", warn: "#a3650c", danger: "#bb3a2b", info: "#2c6e8f" };
  const last = pts.split(" ").pop()!.split(",");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={colors[tone]} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" className="spark-path" />
      <circle cx={last[0]} cy={last[1]} r="2.6" fill={colors[tone]} />
    </svg>
  );
}

export function Kpi({ label, value, unit, delta, tone = "pine", spark, onClick }: {
  label: string; value: string; unit?: string; delta?: string; tone?: "pine" | "warn" | "danger" | "info";
  spark: number[]; onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="group relative overflow-hidden rounded-lg border border-line bg-card p-4 text-left shadow-[0_1px_2px_rgba(20,33,28,0.05)] transition hover:-translate-y-0.5 hover:border-pine-500/40 hover:shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">{label}</p>
          <p className="mt-1.5 flex items-baseline gap-1">
            <span className="num font-display text-[26px] font-black leading-none tracking-tight text-ink">{value}</span>
            {unit && <span className="text-[11px] font-semibold text-mute">{unit}</span>}
          </p>
          {delta && <p className={`mt-1 font-mono text-[10.5px] font-medium ${tone === "danger" ? "text-danger" : tone === "warn" ? "text-warn" : "text-ok"}`}>{delta}</p>}
        </div>
        <div className="hidden opacity-80 transition group-hover:opacity-100 sm:block"><Sparkline data={spark} tone={tone} /></div>
      </div>
      <div className={`absolute inset-x-0 bottom-0 h-[3px] ${tone === "danger" ? "bg-danger/70" : tone === "warn" ? "bg-warnhi/70" : tone === "info" ? "bg-info/70" : "bg-pine-500/70"} origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100`} />
    </button>
  );
}

export const EmptyState = ({ title, sub }: { title: string; sub?: string }) => (
  <div className="flex flex-col items-center justify-center gap-1 py-12 text-center">
    <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-line2 text-mute"><Info size={17} /></div>
    <p className="font-display text-[13.5px] font-bold text-ink">{title}</p>
    {sub && <p className="max-w-xs text-xs text-mute">{sub}</p>}
  </div>
);

export function ToastHost() {
  const { s, dropToast } = useApp();
  return (
    <div className="pointer-events-none fixed bottom-20 right-5 z-[70] flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-2 md:bottom-5">
      {s.toasts.slice(-4).map((t) => <ToastItem key={t.id} id={t.id} msg={t.msg} kind={t.kind} drop={dropToast} />)}
    </div>
  );
}
function ToastItem({ id, msg, kind, drop }: { id: string; msg: string; kind: "ok" | "warn" | "err" | "info"; drop: (id: string) => void }) {
  useEffect(() => {
    const h = setTimeout(() => drop(id), 4200);
    return () => clearTimeout(h);
  }, [id, drop]);
  const Icon = kind === "ok" ? Check : kind === "err" ? X : kind === "warn" ? AlertTriangle : Bell;
  const tone = kind === "ok" ? "border-ok/30 text-ok" : kind === "err" ? "border-danger/30 text-danger" : kind === "warn" ? "border-warn/30 text-warn" : "border-info/30 text-info";
  return (
    <div className={`toast-in pointer-events-auto flex items-start gap-2.5 rounded-lg border bg-paper px-3.5 py-3 shadow-xl ${tone}`}>
      <Icon size={14} className="mt-0.5 shrink-0" />
      <p className="flex-1 text-[12.5px] leading-snug text-ink">{msg}</p>
      <button onClick={() => drop(id)} className="shrink-0 text-mute transition hover:text-ink"><X size={13} /></button>
    </div>
  );
}
