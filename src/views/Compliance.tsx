import { useMemo, useState } from "react";
import { useApp } from "../lib/store";
import { complianceChecks, complianceScore } from "../lib/compliance";
import { Chip, Card, SectionHead, StatusChip, Bar, BtnSm } from "../components/ui";
import { IcShield, IcCheck, IcWarn, IcClose, IcClock } from "../components/icons";
import { ACTIVE_SESSIONS, API_ENDPOINTS } from "../lib/data";
import { fmtTime, relTime } from "../lib/types";

const domains = ["Asset", "Inventory", "Teknis", "Governance"] as const;

function ScoreDial({ score }: { score: number }) {
  const R = 44, CIRC = 2 * Math.PI * R;
  const color = score >= 95 ? "#1f7a48" : score >= 85 ? "#a3650c" : "#bb3a2b";
  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      <svg width="112" height="112" viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r={R} fill="none" stroke="#e3ede6" strokeWidth="9" />
        <circle cx="50" cy="50" r={R} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={`${(score / 100) * CIRC} ${CIRC}`} style={{ transition: "stroke-dasharray .8s cubic-bezier(.22,.9,.3,1)" }} />
      </svg>
      <div className="absolute text-center">
        <p className="num font-display text-[26px] font-black leading-none" style={{ color }}>{score}</p>
        <p className="font-mono text-[8.5px] font-bold uppercase tracking-wider text-mute">skor %</p>
      </div>
    </div>
  );
}

export default function Compliance() {
  const { s, nav, toast } = useApp();
  const [domain, setDomain] = useState<(typeof domains)[number] | "ALL">("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);

  const checks = useMemo(() => complianceChecks(s), [s]);
  const score = complianceScore(checks);
  const flags = checks.filter((x) => x.status === "FLAG");
  const shown = checks.filter((x) => domain === "ALL" || x.domain === domain);

  const posture = [
    { l: "Backup & Point-in-Time Recovery", v: "Aktif · harian", ok: true, note: "Retensi 30 hari, RPO 24 jam / RTO 4 jam" },
    { l: "Enkripsi in-transit & at-rest", v: "TLS 1.3 · AES-256", ok: true, note: "Sertifikat diperbarui otomatis" },
    { l: "Multi-Factor Authentication", v: `${ACTIVE_SESSIONS.filter((x) => x.mfa).length}/${ACTIVE_SESSIONS.length} sesi`, ok: ACTIVE_SESSIONS.every((x) => x.mfa), note: "MFA-ready, wajib untuk role kritis" },
    { l: "Password policy & session mgmt", v: "Enforced", ok: true, note: "Rotasi 90 hari, idle timeout 30 menit" },
    { l: "Rate limiting & API auth", v: "Aktif", ok: true, note: "Token scoped per organization" },
    { l: "Audit trail imutabel", v: `${s.audit.length} entri`, ok: true, note: "Append-only, BR-010" },
  ];

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Security & Compliance</h1>
          <p className="text-xs text-mute">Verifikasi Business Rules (BR-001…BR-018) berjalan live terhadap data — bukan checklist statis</p>
        </div>
        <div className="flex gap-2">
          <Chip tone={flags.length ? "warn" : "ok"} dot pulse={flags.length > 0}>{flags.length} FLAG</Chip>
          <Chip tone="pine" dot>{checks.filter((x) => x.status === "PASS").length} PASS</Chip>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* score + posture */}
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <ScoreDial score={score} />
            <div>
              <p className="font-display text-[15px] font-extrabold text-ink">Kepatuhan Aturan Bisnis</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-mute">
                {flags.length === 0 ? "Seluruh aturan bisnis terpenuhi terhadap kondisi data saat ini." : `${flags.length} aturan butuh tindak lanjut — lihat daftar di samping.`}
              </p>
            </div>
          </div>
          <div className="mt-4 border-t border-line pt-3">
            <SectionHead title="Postur Keamanan" />
            <div className="space-y-2">
              {posture.map((p) => (
                <div key={p.l} className="flex items-start justify-between gap-2 rounded-md border border-line bg-paper px-3 py-2">
                  <div>
                    <p className="text-[12px] font-bold text-ink">{p.l}</p>
                    <p className="font-mono text-[9.5px] text-mute">{p.note}</p>
                  </div>
                  <Chip tone={p.ok ? "ok" : "warn"} dot>{p.v}</Chip>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* BR checklist */}
        <Card className="p-4 lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <SectionHead title="Checklist Business Rules" sub="klik baris untuk detail verifikasi" />
            <div className="flex flex-wrap gap-1.5">
              {(["ALL", ...domains] as const).map((d) => (
                <button key={d} onClick={() => setDomain(d as never)}
                  className={`rounded-md border px-2.5 py-1 font-display text-[11px] font-bold transition ${domain === d ? "border-pine-600 bg-pine-700 text-pine-50" : "border-line bg-card text-ink2 hover:border-pine-500/50"}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            {shown.map((x) => (
              <div key={x.id}>
                <button onClick={() => setExpanded(expanded === x.id ? null : x.id)}
                  className={`flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left transition hover:border-pine-500/40 ${x.status === "FLAG" ? "border-warn/40 bg-warnbg/30" : "border-line bg-paper"}`}>
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${x.status === "PASS" ? "bg-okbg text-ok" : x.status === "FLAG" ? "bg-warnbg text-warn" : "bg-moss text-mute"}`}>
                    {x.status === "PASS" ? <IcCheck size={13} /> : x.status === "FLAG" ? <IcWarn size={13} /> : <IcClose size={12} />}
                  </span>
                  <span className="w-16 shrink-0 font-mono text-[11px] font-bold text-pine-700">{x.rule}</span>
                  <span className="flex-1 text-[12.5px] font-semibold text-ink">{x.desc}</span>
                  <span className="hidden w-20 shrink-0 md:block"><Chip tone={x.status === "PASS" ? "ok" : x.status === "FLAG" ? "warn" : "neutral"}>{x.status}</Chip></span>
                </button>
                {expanded === x.id && (
                  <div className="msg-in ml-9 rounded-b-md border border-t-0 border-line bg-canvas/60 px-3 py-2">
                    <p className="text-[11.5px] leading-relaxed text-ink2">{x.detail}</p>
                    <p className="mt-1 font-mono text-[9.5px] uppercase tracking-wide text-mute">domain: {x.domain}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          {flags.length > 0 && (
            <div className="mt-3 flex items-center justify-between rounded-md border border-warn/40 bg-warnbg px-3 py-2.5">
              <p className="text-[11.5px] font-semibold text-warn">{flags.length} aturan ter-flag — perbaiki kondisi data agar kembali PASS.</p>
              <BtnSm onClick={() => nav(flags[0].domain === "Teknis" ? "technical" : flags[0].domain === "Inventory" ? "inventory" : "equipment")}>Tindak lanjuti →</BtnSm>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* active sessions */}
        <Card className="p-4">
          <SectionHead title="Sesi Aktif" sub="session management · MFA per sesi" right={<Chip tone="neutral">{ACTIVE_SESSIONS.length} sesi</Chip>} />
          <div className="space-y-1.5">
            {ACTIVE_SESSIONS.map((x) => (
              <div key={x.id} className="flex items-center justify-between gap-2 rounded-md border border-line bg-paper px-3 py-2">
                <div>
                  <p className="text-[12px] font-bold text-ink">{x.user} <span className="ml-1 font-mono text-[9.5px] font-medium text-mute">{x.role}</span></p>
                  <p className="font-mono text-[9.5px] text-mute">{x.device} · {x.ip} · sejak {relTime(x.since)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {x.mfa ? <Chip tone="ok">MFA</Chip> : <Chip tone="warn">NO MFA</Chip>}
                  <BtnSm onClick={() => toast(`Sesi ${x.user} diputus (simulasi)`, "warn")}>Putus</BtnSm>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* api health */}
        <Card className="p-4">
          <SectionHead title="API Health (REST v1)" sub="p95 latency · target < 500ms" right={<Chip tone="ok">SLA 99,9%</Chip>} />
          <div className="space-y-1.5">
            {API_ENDPOINTS.map((e) => {
              const over = e.p95 >= 500;
              return (
                <div key={e.path} className="rounded-md border border-line bg-paper px-3 py-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-mono text-[10.5px] font-semibold text-ink"><span className="text-pine-600">{e.method}</span> {e.path}</p>
                    <div className="flex shrink-0 items-center gap-3 font-mono text-[9.5px] text-mute">
                      <span>{e.rpm} rpm</span>
                      <span>{e.errRate}% err</span>
                      <span className={`font-bold ${over ? "text-danger" : "text-ok"}`}>{e.p95}ms</span>
                    </div>
                  </div>
                  <Bar pct={(e.p95 / 600) * 100} tone={over ? "danger" : e.p95 > 400 ? "warn" : "ok"} className="mt-1" />
                </div>
              );
            })}
          </div>
          <p className="mt-2 flex items-center gap-1.5 font-mono text-[9.5px] text-mute"><IcClock size={11} /> dashboard p95 &lt; 2s · QR lookup &lt; 1s · health check terpusat</p>
        </Card>
      </div>

      <p className="font-mono text-[10.5px] text-mute">Checklist diverifikasi ulang setiap kali state berubah — coba buat keluhan tanpa SLA atau biarkan kalibrasi expired, dan skor akan menyesuaikan. <IcShield size={11} className="inline text-pine-600" /> Waktu audit terakhir: {fmtTime(new Date().toISOString())}.</p>
    </div>
  );
}
