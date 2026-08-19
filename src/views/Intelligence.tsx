import React, { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../lib/store";
import {
  anomalies, execSummary, forecastSku, idleAssets, inventoryOptimize, nbvOf, pmRisks,
  procurementRecs, skuStats, templateFor, utilOf,
} from "../lib/intel";
import { Bar, BtnGhost, BtnPrimary, BtnSm, Card, Chip, Input, SectionHead, Select, StatusChip, Tabs, EmptyState } from "../components/ui";
import { IcBolt, IcCart, IcChart, IcCheck, IcFlag, IcGauge, IcLayers, IcScan, IcSend, IcShield, IcSwap, IcWrench } from "../components/icons";
import { daysUntil, fmtDate, fmtIDR, fmtIDRCompact, relTime } from "../lib/types";

type Tab = "assist" | "forecast" | "optimize" | "predict" | "utilize" | "anomaly" | "autopr";

const MODELS = [
  { name: "Demand Model", v: "v3.2", metric: "MAPE 11.4%", run: "trained 2 jam lalu", tone: "text-warnhi" },
  { name: "Anomaly Engine", v: "streaming", metric: "6 aturan aktif", run: "realtime", tone: "text-pine-100" },
  { name: "PM Risk", v: "v1.8", metric: "AUC 0.87", run: "nightly 02.00", tone: "text-pine-100" },
  { name: "Procurement Opt", v: "EOQ/SS", metric: "SL 95%", run: "on-demand", tone: "text-pine-100" },
];

export default function Intelligence() {
  const { s } = useApp();
  const [tab, setTab] = useState<Tab>("assist");
  const live = useMemo(() => ({ an: anomalies(s), proc: procurementRecs(s), sum: execSummary(s) }), [s]);

  return (
    <div className="view-in space-y-4">
      {/* ── intelligence console header ── */}
      <div className="dark-grain relative overflow-hidden rounded-xl border border-pine-800 p-5 text-pine-50">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 overflow-hidden">
          <div className="scanline h-full w-24 bg-gradient-to-r from-transparent via-pine-500/25 to-transparent" />
        </div>
        <div className="relative flex flex-wrap items-center gap-5">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
            <svg viewBox="0 0 64 64" className="absolute inset-0">
              <circle cx="32" cy="32" r="30" fill="none" stroke="#2E8B72" strokeOpacity="0.35" />
              <circle cx="32" cy="32" r="30" fill="none" stroke="#F2A93B" strokeWidth="1.4" className="radar-ring" />
              <circle cx="32" cy="32" r="30" fill="none" stroke="#2E8B72" strokeWidth="1.4" className="radar-ring delay" />
            </svg>
            <IcBolt size={26} className="brain-glow text-warnhi" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[9.5px] font-bold uppercase tracking-[0.2em] text-pine-500">Phase 4 · Enterprise Intelligence</p>
            <h1 className="font-display text-[24px] font-black leading-tight tracking-tight">SIMASET Intelligence</h1>
            <p className="mt-0.5 text-[12px] text-pine-100/75">
              {live.sum.anomalies} anomali terdeteksi · {live.sum.proc} SKU butuh pengadaan · {live.sum.idle} aset idle · semua dibaca dari ledger live
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {MODELS.map((m) => (
              <div key={m.name} className="rounded-md border border-pine-800 bg-pine-950/55 px-2.5 py-1.5">
                <p className={`font-mono text-[10px] font-bold ${m.tone}`}>{m.name} <span className="text-pine-500">{m.v}</span></p>
                <p className="font-mono text-[8.5px] text-pine-100/60">{m.metric} · {m.run}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Card className="p-4">
        <Tabs active={tab} onChange={(t) => setTab(t as Tab)}
          tabs={[
            { id: "assist", label: "Executive Assistant" },
            { id: "forecast", label: "Demand Forecast" },
            { id: "optimize", label: "Optimasi Stok" },
            { id: "predict", label: "Predictive Maint." },
            { id: "utilize", label: "Utilisasi" },
            { id: "anomaly", label: "Anomali" },
            { id: "autopr", label: "Auto-Procurement" },
          ]}
          counts={{ anomaly: live.an.length, autopr: live.proc.length }}
        />
        <div className="pt-4">
          {tab === "assist" && <Assistant />}
          {tab === "forecast" && <ForecastTab />}
          {tab === "optimize" && <OptimizeTab />}
          {tab === "predict" && <PredictTab />}
          {tab === "utilize" && <UtilizeTab />}
          {tab === "anomaly" && <AnomalyTab />}
          {tab === "autopr" && <AutoPrTab />}
        </div>
      </Card>
    </div>
  );
}

/* ═══════════ AI Executive Assistant ═══════════ */
interface Msg { id: number; from: "user" | "ai"; text?: string; node?: React.ReactNode; title?: string; }

function Assistant() {
  const { s, nav } = useApp();
  const [msgs, setMsgs] = useState<Msg[]>([
    { id: 0, from: "ai", title: "SIMASET Assistant", node: <p className="text-[12.5px] leading-relaxed">Selamat datang. Saya membaca <b>ledger, work order, kalibrasi, complaint & kontrak live</b> — tanyakan apa saja tentang operasional aset RS Harapan Medika, atau pakai saran cepat di bawah.</p> },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(1);

  useEffect(() => { boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" }); }, [msgs, thinking]);

  const ask = (q: string) => {
    if (!q.trim() || thinking) return;
    setMsgs((m) => [...m, { id: idRef.current++, from: "user", text: q }]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      const a = answer(q);
      setMsgs((m) => [...m, { id: idRef.current++, from: "ai", title: a.title, node: a.node }]);
      setThinking(false);
    }, 620 + Math.random() * 420);
  };

  /* ── intent matcher over live state ── */
  const answer = (q: string): { title: string; node: React.ReactNode } => {
    const t = q.toLowerCase();
    const sum = execSummary(s);
    const goEq = (id: string) => <BtnSm onClick={() => nav("equipment-detail", id)}>Buka 360° →</BtnSm>;

    if (/(kalibrasi|kal).*(expired|gagal|kedaluwarsa)|expired/.test(t)) {
      const list = s.equipment.filter((e) => ["EXPIRED", "FAILED"].includes(e.calStatus));
      return {
        title: "Kalibrasi bermasalah",
        node: list.length === 0 ? <p>Tidak ada — semua sertifikat valid. ✅</p> : (
          <div className="space-y-1.5">{list.map((e) => (
            <div key={e.id} className="flex flex-wrap items-center gap-2 rounded-md border border-line bg-canvas/50 px-2.5 py-1.5">
              <StatusChip status={e.calStatus} pulse={e.calStatus === "EXPIRED"} />
              <span className="text-[12px] font-bold text-ink">{e.name}</span>
              <span className="font-mono text-[10px] text-mute">{e.code} · {e.room}</span>
              <span className="ml-auto">{goEq(e.id)}</span>
            </div>
          ))}
            <p className="pt-1 font-mono text-[10.5px] text-mute">Rekomendasi: jadwalkan re-kalibrasi minggu ini — CSSD menahan batch untuk autoclave.</p>
          </div>
        ),
      };
    }
    if (/stok.*(menipis|rendah|low|habis)|low.?stock|reorder/.test(t)) {
      const list = s.items.filter((i) => i.stock <= i.reorder).sort((a, b) => a.stock / a.reorder - b.stock / b.reorder);
      return {
        title: `Stok perlu aksi (${list.length} SKU)`,
        node: <div className="space-y-1.5">{list.map((i) => (
          <div key={i.sku} className="flex items-center gap-2 rounded-md border border-line bg-canvas/50 px-2.5 py-1.5">
            <Chip tone={i.stock <= i.min ? "danger" : "warn"} dot>{i.stock <= i.min ? "CRITICAL" : "LOW"}</Chip>
            <span className="text-[12px] font-bold text-ink">{i.name}</span>
            <span className="ml-auto font-mono text-[10.5px] text-ink2">{i.stock}/{i.reorder} {i.uom} · cover {skuStats(s, i.sku).coverage}h</span>
          </div>
        ))}<p className="pt-1 font-mono text-[10.5px] text-mute">Buka tab <b>Auto-Procurement</b> untuk membuat PR otomatis dari daftar ini.</p></div>,
      };
    }
    if (/idle|utilisasi.*(rendah|terendah)|menganggur/.test(t)) {
      const list = idleAssets(s);
      const potential = list.reduce((a, x) => a + x.e.acqCost * 0.0004 * 30, 0);
      return {
        title: `Aset idle (${list.length}) — potensi ${fmtIDRCompact(potential)}/bulan`,
        node: <div className="space-y-1.5">{list.map(({ e, pct }) => (
          <div key={e.id} className="flex items-center gap-2 rounded-md border border-line bg-canvas/50 px-2.5 py-1.5">
            <span className="num font-mono text-[13px] font-black text-danger">{pct}%</span>
            <span className="text-[12px] font-bold text-ink">{e.name}</span>
            <span className="font-mono text-[10px] text-mute">{e.room}</span>
            <span className="ml-auto">{goEq(e.id)}</span>
          </div>
        ))}<p className="pt-1 font-mono text-[10.5px] text-mute">Potensi = estimasi pendapatan sewa 0,04%/hari dari nilai perolehan. Tab <b>Utilisasi</b> punya aksi redistribusi.</p></div>,
      };
    }
    if (/sla|keluhan|complaint|breach/.test(t)) {
      const open = s.complaints.filter((c) => !["CLOSED", "VERIFIED", "RESOLVED"].includes(c.status));
      return {
        title: `Keluhan terbuka (${open.length}) · ${sum.breaches} breach SLA`,
        node: <div className="space-y-1.5">{open.map((c) => {
          const hrs = Math.round((Date.now() - new Date(c.date).getTime()) / 36e5);
          const breach = hrs > c.slaHours;
          return (
            <div key={c.id} className="flex flex-wrap items-center gap-2 rounded-md border border-line bg-canvas/50 px-2.5 py-1.5">
              <Chip tone={breach ? "danger" : "warn"} dot pulse={breach}>{breach ? "BREACH" : `SLA ${c.slaHours}j`}</Chip>
              <span className="text-[12px] font-bold text-ink">{c.code}</span>
              <span className="font-mono text-[10px] text-mute">{c.eqId} · {relTime(c.date)} · {c.priority}</span>
              <span className="ml-auto"><BtnSm onClick={() => nav("complaints")}>Buka →</BtnSm></span>
            </div>
          );
        })}</div>,
      };
    }
    if (/pengadaan|procurement|purchase|pr\b|po\b/.test(t)) {
      const recs = procurementRecs(s);
      const total = recs.reduce((a, r) => a + r.qty * r.estCost, 0);
      return {
        title: "Rekomendasi pengadaan bulan depan",
        node: <div className="space-y-1.5">
          {recs.slice(0, 5).map((r) => (
            <div key={r.sku} className="flex items-center gap-2 rounded-md border border-line bg-canvas/50 px-2.5 py-1.5">
              <span className="text-[12px] font-bold text-ink">{r.name}</span>
              <span className="font-mono text-[10px] text-mute">{r.reason}</span>
              <span className="ml-auto font-mono text-[10.5px] font-bold text-ink">+{r.qty} {r.uom} · {fmtIDRCompact(r.qty * r.estCost)}</span>
            </div>
          ))}
          <p className="pt-1 font-mono text-[10.5px] text-mute">Total estimasi <b className="text-ink">{fmtIDR(total)}</b> untuk {recs.length} SKU · eksekusi via tab <b>Auto-Procurement</b> (PR + approval otomatis).</p>
        </div>,
      };
    }
    if (/biaya|termahal|nilai aset|acap|capex/.test(t)) {
      const top = [...s.equipment].sort((a, b) => b.acqCost - a.acqCost).slice(0, 5);
      return {
        title: "Top 5 aset per nilai perolehan",
        node: <div className="space-y-1.5">{top.map((e, i) => (
          <div key={e.id} className="flex items-center gap-2 rounded-md border border-line bg-canvas/50 px-2.5 py-1.5">
            <span className="font-mono text-[10px] font-bold text-mute">#{i + 1}</span>
            <span className="text-[12px] font-bold text-ink">{e.name}</span>
            <span className="ml-auto num font-mono text-[11px] font-black text-pine-700">{fmtIDRCompact(e.acqCost)}</span>
          </div>
        ))}<p className="pt-1 font-mono text-[10.5px] text-mute">Nilai buku portofolio saat ini: <b className="text-ink">{fmtIDRCompact(sum.nbv)}</b> (lihat modul Depresiasi).</p></div>,
      };
    }
    if (/depresiasi|nilai buku|nbv|penyusutan/.test(t)) {
      return {
        title: "Posisi depresiasi portofolio",
        node: <div className="space-y-2">
          <p className="text-[12.5px]">Total nilai buku <b className="num">{fmtIDR(sum.nbv)}</b> dari {s.equipment.length} aset, metode garis lurus (residu 10%).</p>
          <div className="flex gap-2"><BtnSm onClick={() => nav("depreciation")}>Buka Depresiasi →</BtnSm></div>
        </div>,
      };
    }
    if (/maintenance|pm\b|pemeliharaan|overdue/.test(t)) {
      const risks = pmRisks(s).slice(0, 4);
      return {
        title: "Risiko pemeliharaan tertinggi",
        node: <div className="space-y-1.5">{risks.map((r) => (
          <div key={r.id} className="flex items-center gap-2 rounded-md border border-line bg-canvas/50 px-2.5 py-1.5">
            <span className="num font-mono text-[13px] font-black text-warn">{r.prob30}%</span>
            <span className="text-[12px] font-bold text-ink">{r.name}</span>
            <span className="font-mono text-[10px] text-mute">gangguan 30 hari · {r.drivers[0]}</span>
            <span className="ml-auto">{goEq(r.id)}</span>
          </div>
        ))}<p className="pt-1 font-mono text-[10.5px] text-mute">Skor gabungan: criticality + risk + PM overdue + beban utilisasi + status kalibrasi.</p></div>,
      };
    }
    if (/pinjaman|loan|sewa|rental|bgs|sgb|kontrak/.test(t)) {
      const activeLoans = s.loans.filter((l) => ["ON_LOAN", "APPROVED", "REQUESTED"].includes(l.status)).length;
      const expSoon = s.contracts.filter((c) => daysUntil(c.until) < 60 && c.status === "ACTIVE");
      return {
        title: "Pemanfaatan & kontrak",
        node: <div className="space-y-2">
          <p className="text-[12.5px]">{activeLoans} pinjaman aktif/berjalan · {s.rentals.filter((r) => r.status === "ACTIVE").length} sewa aktif · {expSoon.length} kontrak jatuh tempo &lt; 60 hari{expSoon.length > 0 && <span className="font-mono text-[10.5px] text-warn"> ({expSoon.map((c) => c.code).join(", ")})</span>}.</p>
          <BtnSm onClick={() => nav("rental")}>Buka Sewa/Pinjam/BGS →</BtnSm>
        </div>,
      };
    }
    if (/ringkas|overview|summary|status|laporan|hari ini/.test(t)) {
      return {
        title: "Ringkasan eksekutif",
        node: <div className="space-y-2 text-[12.5px] leading-relaxed">
          <p><b>{sum.inService}/{sum.assets}</b> aset in-service · utilisasi rata-rata sehat. <b className="text-danger">{sum.calBad}</b> aset kalibrasi expired/failed dan <b className="text-danger">{sum.breaches}</b> keluhan breach SLA — butuh atensi hari ini.</p>
          <p><b className="text-warn">{sum.low}</b> SKU di bawah reorder point, <b>{sum.proc}</b> rekomendasi pengadaan otomatis (estimasi bisa dieksekusi 1 klik). <b>{sum.pending}</b> persetujuan menunggu Anda di Approval Engine.</p>
          <p className="font-mono text-[10.5px] text-mute">Nilai buku portofolio {fmtIDRCompact(sum.nbv)} · {sum.idle} aset idle terdeteksi · {sum.anomalies} anomali live.</p>
          <div className="flex gap-2 pt-1">
            <BtnSm onClick={() => nav("approvals")}>Approvals ({sum.pending}) →</BtnSm>
            <BtnSm onClick={() => nav("dashboard")}>Dashboard →</BtnSm>
          </div>
        </div>,
      };
    }
    return {
      title: "Saya bisa bantu dengan:",
      node: <ul className="list-disc space-y-1 pl-4 text-[12.5px] leading-relaxed text-ink2">
        <li>"Aset yang kalibrasinya kedaluwarsa"</li>
        <li>"Stok yang menipis" / "rekomendasi pengadaan bulan depan"</li>
        <li>"Aset idle" / "risiko maintenance tertinggi"</li>
        <li>"Keluhan yang breach SLA" / "nilai buku portofolio"</li>
        <li>"Ringkasan eksekutif hari ini"</li>
      </ul>,
    };
  };

  const suggestions = ["Ringkasan eksekutif hari ini", "Aset yang kalibrasinya kedaluwarsa", "Rekomendasi pengadaan bulan depan", "Aset idle", "Keluhan yang breach SLA"];

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1fr]">
      <div>
        <div ref={boxRef} className="h-[460px] space-y-3 overflow-y-auto rounded-lg border border-line bg-canvas/50 p-3.5">
          {msgs.map((m) => m.from === "user" ? (
            <div key={m.id} className="msg-in ml-auto max-w-[85%] rounded-lg rounded-br-sm bg-pine-700 px-3.5 py-2.5 text-[12.5px] font-semibold text-pine-50 shadow">{m.text}</div>
          ) : (
            <div key={m.id} className="msg-in max-w-[92%] rounded-lg rounded-bl-sm border border-line bg-card p-3.5 shadow-sm">
              <div className="mb-1.5 flex items-center gap-1.5">
                <IcBolt size={12} className="text-warnhi" />
                <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-pine-600">{m.title}</span>
                <span className="ml-auto font-mono text-[8.5px] text-mute">model v3.2 · live state</span>
              </div>
              {m.node}
            </div>
          ))}
          {thinking && (
            <div className="msg-in flex w-16 items-center justify-center gap-1 rounded-lg border border-line bg-card px-3 py-2.5 shadow-sm">
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-pine-500" />
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-pine-500" />
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-pine-500" />
            </div>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask(input)} placeholder="Tanya tentang aset, stok, SLA, pengadaan… (Enter)" />
          <BtnPrimary onClick={() => ask(input)} disabled={!input.trim() || thinking}><IcSend size={13} /> Tanya</BtnPrimary>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suggestions.map((q) => (
            <button key={q} onClick={() => ask(q)} className="rounded-full border border-line bg-card px-2.5 py-1 font-mono text-[10px] font-semibold text-ink2 transition hover:border-pine-500/60 hover:bg-pine-50 hover:text-pine-700 active:translate-y-px">{q}</button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Card className="p-4">
          <SectionHead title="Signal hari ini" sub="dihitung ulang tiap perubahan state" />
          <div className="space-y-2">
            {[
              { icon: <IcGauge size={14} />, label: "Kalibrasi expired/failed", v: live2(s).calBad, tone: "text-danger" },
              { icon: <IcFlag size={14} />, label: "Complaint breach SLA", v: live2(s).breaches, tone: "text-danger" },
              { icon: <IcCart size={14} />, label: "SKU butuh pengadaan", v: live2(s).proc, tone: "text-warn" },
              { icon: <IcLayers size={14} />, label: "Aset idle (<40%)", v: live2(s).idle, tone: "text-warn" },
              { icon: <IcShield size={14} />, label: "Anomali live", v: live2(s).an, tone: "text-info" },
            ].map((r) => (
              <div key={r.label} className="flex items-center gap-2.5 rounded-md border border-line bg-paper px-3 py-2">
                <span className="text-pine-600">{r.icon}</span>
                <span className="flex-1 text-[12px] font-semibold text-ink2">{r.label}</span>
                <span className={`num font-display text-[16px] font-black ${r.tone}`}>{r.v}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="dark-grain p-4 text-pine-50">
          <p className="font-mono text-[9.5px] font-bold uppercase tracking-[0.16em] text-pine-500">Cara kerja</p>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-pine-100/80">
            Jawaban dihasilkan dari <b className="text-pine-50">state aplikasi live</b> (ledger, WO, kalibrasi, complaint) — bukan teks statis. Coba buat complaint atau adjust stok, lalu tanya ulang: jawaban ikut berubah.
          </p>
        </Card>
      </div>
    </div>
  );
}
const live2 = (s: ReturnType<typeof useApp>["s"]) => {
  const sum = execSummary(s);
  return { calBad: sum.calBad, breaches: sum.breaches, proc: sum.proc, idle: sum.idle, an: sum.anomalies };
};

/* ═══════════ Demand Forecast ═══════════ */
function ForecastTab() {
  const { s } = useApp();
  const [sku, setSku] = useState(s.items[0]?.sku ?? "");
  const f = useMemo(() => forecastSku(s, sku, 6), [s, sku]);
  const st = useMemo(() => skuStats(s, sku), [s, sku]);
  const item = s.items.find((i) => i.sku === sku)!;
  const all = useMemo(() => s.items.map((i) => skuStats(s, i.sku)).sort((a, b) => a.coverage - b.coverage), [s]);

  const W = 660, H = 190, pad = 10, slot = (W - pad * 2) / (f.hist.length + f.fc.length);
  const maxV = Math.max(...f.hist, ...f.fc.map((x) => x.hi), 1);
  const y = (v: number) => H - 26 - (v / maxV) * (H - 46);
  const cx = (i: number) => pad + slot * i + slot / 2;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Select className="!w-72" value={sku} onChange={(e) => setSku(e.target.value)}>
            {s.items.map((i) => <option key={i.sku} value={i.sku}>{i.name} — {i.sku}</option>)}
          </Select>
          <Chip tone={st.coverage < 30 ? "danger" : st.coverage < 60 ? "warn" : "ok"} dot>coverage {st.coverage} hari</Chip>
          <Chip tone="neutral">σ harian {st.sigma.toFixed(1)} {item.uom}</Chip>
        </div>
        <div className="rounded-lg border border-line bg-paper p-3">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            {[0.25, 0.5, 0.75, 1].map((g) => (
              <line key={g} x1={pad} x2={W - pad} y1={y(maxV * g)} y2={y(maxV * g)} stroke="#dbe3dc" strokeDasharray="3 4" strokeWidth="0.7" />
            ))}
            <line x1={pad} x2={W - pad} y1={H - 26} y2={H - 26} stroke="#c9d4cb" strokeWidth="1" />
            {f.hist.map((v, i) => (
              <g key={"h" + i}>
                <rect x={cx(i) - slot * 0.3} y={y(v)} width={slot * 0.6} height={H - 26 - y(v)} rx="2" fill="#177057" opacity="0.85">
                  <title>{`Minggu -${f.hist.length - i}: ${v} ${item.uom}`}</title>
                </rect>
                <text x={cx(i)} y={H - 12} textAnchor="middle" fontSize="8" fill="#77867e" fontFamily="IBM Plex Mono">-{f.hist.length - i}</text>
              </g>
            ))}
            <polygon
              points={[...f.fc.map((p, i) => `${cx(f.hist.length + i)},${y(p.hi)}`), ...f.fc.map((p, i) => `${cx(f.hist.length + f.fc.length - 1 - i)},${y(f.fc[f.fc.length - 1 - i].lo)}`)].join(" ")}
              fill="#F2A93B" opacity="0.16"
            />
            <polyline points={f.fc.map((p, i) => `${cx(f.hist.length + i)},${y(p.mean)}`).join(" ")} fill="none" stroke="#F2A93B" strokeWidth="2" className="spark-path" />
            {f.fc.map((p, i) => <circle key={"c" + i} cx={cx(f.hist.length + i)} cy={y(p.mean)} r="2.6" fill="#F2A93B"><title>{`Minggu +${i + 1}: ${p.mean} (CI ${p.lo}–${p.hi})`}</title></circle>)}
            {f.fc.map((_, i) => <text key={"t" + i} x={cx(f.hist.length + i)} y={H - 12} textAnchor="middle" fontSize="8" fill="#a3650c" fontFamily="IBM Plex Mono">+{i + 1}</text>)}
            <line x1={cx(f.hist.length - 1) + slot / 2} x2={cx(f.hist.length - 1) + slot / 2} y1={16} y2={H - 26} stroke="#bb3a2b" strokeDasharray="2 3" strokeWidth="0.8" />
            <text x={cx(f.hist.length - 1) + slot / 2 + 4} y={22} fontSize="8" fill="#bb3a2b" fontFamily="IBM Plex Mono">hari ini</text>
          </svg>
          <div className="mt-1 flex gap-4 font-mono text-[9.5px] text-mute">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-pine-600" /> konsumsi aktual (mingguan)</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-warnhi" /> forecast ± CI 80%</span>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {[
            { l: "Konsumsi 60 hari", v: `${st.used60} ${item.uom}` },
            { l: "Rata-rata/hari", v: `${st.perDay.toFixed(1)} ${item.uom}` },
            { l: "Forecast 30 hari", v: `${f.fc.slice(0, 4).reduce((a, b) => a + b.mean, 0)} ${item.uom}` },
            { l: "Stok saat ini", v: `${item.stock} ${item.uom}` },
          ].map((k) => (
            <div key={k.l} className="rounded-md border border-line bg-paper px-3 py-2">
              <p className="font-mono text-[9px] font-semibold uppercase tracking-wide text-mute">{k.l}</p>
              <p className="num font-display text-[16px] font-black text-ink">{k.v}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-mute">Coverage terendah</p>
          <div className="space-y-1.5">
            {all.slice(0, 6).map((r) => (
              <button key={r.sku} onClick={() => setSku(r.sku)} className="flex w-full items-center gap-2 rounded-md border border-line bg-card px-2.5 py-1.5 text-left transition hover:border-pine-500/50">
                <Chip tone={r.coverage < 30 ? "danger" : r.coverage < 60 ? "warn" : "ok"} dot>{r.coverage < 999 ? `${r.coverage}h` : "∞"}</Chip>
                <span className="min-w-0 flex-1 truncate text-[11.5px] font-bold text-ink">{r.name}</span>
                <span className="font-mono text-[9.5px] text-mute">{r.perDay.toFixed(1)}/hari</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ Inventory Optimization ═══════════ */
function OptimizeTab() {
  const { s, applyRec } = useApp();
  const recs = useMemo(() => inventoryOptimize(s), [s]);
  const canApply = ["Pengelola Inventory", "Kepala Gudang", "Direksi", "Pengelola Aset"].includes(s.role);
  const outdated = recs.filter((r) => r.curRop !== r.rop || r.curMin !== r.min);
  const capitalDelta = recs.reduce((a, r) => a + (r.min - r.curMin) * r.unitCost, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone="info" dot>service level 95% (z=1,65)</Chip>
        <Chip tone="neutral">lead time 7 hari</Chip>
        <Chip tone="neutral">holding cost 20%/th</Chip>
        <Chip tone={outdated.length ? "warn" : "ok"} dot>{outdated.length ? `${outdated.length} SKU belum optimal` : "semua parameter optimal"}</Chip>
        <span className="ml-auto font-mono text-[10.5px] text-mute">Δ working capital min-stock: <b className={capitalDelta >= 0 ? "text-warn" : "text-ok"}>{capitalDelta >= 0 ? "+" : ""}{fmtIDRCompact(capitalDelta)}</b></span>
      </div>
      <div className="overflow-x-auto rounded-md border border-line">
        <table className="w-full min-w-[1020px] text-left">
          <thead>
            <tr className="border-b border-line bg-canvas/70 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">
              <th className="px-3 py-2.5">SKU</th><th className="px-3 py-2.5">ABC</th><th className="px-3 py-2.5 text-right">Stok</th>
              <th className="px-3 py-2.5 text-right">Safety stock</th><th className="px-3 py-2.5 text-right">ROP kini → rekomendasi</th>
              <th className="px-3 py-2.5 text-right">EOQ</th><th className="px-3 py-2.5 text-right">Min–Max baru</th><th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {recs.map((r) => {
              const applied = r.curRop === r.rop && r.curMin === r.min;
              return (
                <tr key={r.sku} className="transition hover:bg-pine-50/60">
                  <td className="px-3 py-2.5"><p className="text-[12.5px] font-bold text-ink">{r.name}</p><p className="font-mono text-[10px] text-mute">{r.sku}</p></td>
                  <td className="px-3 py-2.5"><Chip tone={r.abc === "A" ? "danger" : r.abc === "B" ? "warn" : "neutral"}>{r.abc}</Chip></td>
                  <td className="num px-3 py-2.5 text-right font-mono text-[12px] font-bold text-ink">{r.stock}</td>
                  <td className="num px-3 py-2.5 text-right font-mono text-[11px] text-ink2">{r.ss}</td>
                  <td className="px-3 py-2.5 text-right">
                    <span className="num font-mono text-[11px] text-mute">{r.curRop}</span>
                    <span className="mx-1 text-mute">→</span>
                    <span className={`num font-mono text-[12px] font-black ${r.deltaRop > 0 ? "text-danger" : r.deltaRop < 0 ? "text-ok" : "text-ink"}`}>{r.rop}</span>
                  </td>
                  <td className="num px-3 py-2.5 text-right font-mono text-[11px] text-ink2">{r.eoq}</td>
                  <td className="num px-3 py-2.5 text-right font-mono text-[11px] text-ink2">{r.min}–{r.max}</td>
                  <td className="px-3 py-2.5">
                    {applied
                      ? <Chip tone="ok" dot>OPTIMAL</Chip>
                      : <BtnSm disabled={!canApply} title={!canApply ? "Butuh Pengelola Inventory / Kepala Gudang" : undefined} onClick={() => applyRec(r.sku, r.min, r.rop, r.max)} className="!border-pine-500/60 !text-pine-700"><IcCheck size={11} /> Terapkan</BtnSm>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="font-mono text-[10.5px] text-mute">Kelas A = 70% nilai konsumsi tahunan · rekomendasi menerapkan safety stock statistik + ROP + EOQ ke konfigurasi item (teraudit CONFIG.OPTIMIZE).</p>
    </div>
  );
}

/* ═══════════ Predictive Maintenance ═══════════ */
function PredictTab() {
  const { s, createWorkOrder, nav } = useApp();
  const risks = useMemo(() => pmRisks(s), [s]);
  const canWo = ["Teknisi", "Kepala Teknisi", "Pengelola Aset", "Direksi"].includes(s.role);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {risks.slice(0, 6).map((r, i) => (
          <div key={r.id} className={`row-in rounded-lg border p-4 transition hover:shadow-md ${r.prob30 > 55 ? "border-danger/40 bg-dangerbg/20" : r.prob30 > 30 ? "border-warn/40 bg-warnbg/20" : "border-line bg-paper"}`} style={{ animationDelay: `${i * 55}ms` }}>
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <button onClick={() => nav("equipment-detail", r.id)} className="truncate text-left text-[13.5px] font-extrabold text-ink hover:text-pine-700">{r.name}</button>
                <p className="font-mono text-[10px] text-mute">{r.code} · {r.category}</p>
              </div>
              <div className="text-right">
                <p className={`num font-display text-[26px] font-black leading-none ${r.prob30 > 55 ? "text-danger" : r.prob30 > 30 ? "text-warn" : "text-pine-700"}`}>{r.prob30}%</p>
                <p className="font-mono text-[8.5px] uppercase tracking-wide text-mute">risk 30 hari</p>
              </div>
            </div>
            <div className="mt-2"><Bar pct={r.prob30} tone={r.prob30 > 55 ? "danger" : r.prob30 > 30 ? "warn" : "pine"} /></div>
            <div className="mt-2.5 flex flex-wrap gap-1">
              {r.drivers.map((d) => <span key={d} className="rounded border border-line bg-card px-1.5 py-0.5 font-mono text-[9px] font-semibold text-ink2">{d}</span>)}
            </div>
            <div className="mt-2.5 flex items-center gap-3 border-t border-line pt-2.5 font-mono text-[10px] text-mute">
              <span>MTBF {r.mtbf}j</span><span>MTTR ~{r.mttr}j</span><span className="ml-auto">util {r.pct}%</span>
            </div>
            <div className="mt-2.5 flex gap-2">
              <BtnSm disabled={!canWo} title={!canWo ? "Butuh role teknis" : undefined} onClick={() => { createWorkOrder(r.id, "PREDICTIVE", `WO prediktif dari AI PM Risk (skor ${r.score}) — verifikasi ${r.drivers[0]}.`, templateFor(r.category)); }}>
                <IcWrench size={11} /> Buat WO prediktif
              </BtnSm>
              <BtnSm onClick={() => nav("technical")}><IcScan size={11} /> WO board</BtnSm>
            </div>
          </div>
        ))}
      </div>
      <p className="font-mono text-[10.5px] text-mute">Skor = criticality + risk level + PM overdue (×3/hari) + beban utilisasi &gt;85% + kalibrasi expired + keluhan terbuka · probabilitas dinormalisasi 3–94%.</p>
    </div>
  );
}

/* ═══════════ Utilization Recommendation ═══════════ */
function UtilizeTab() {
  const { s, nav, requestTransfer, logUsage } = useApp();
  const idle = useMemo(() => idleAssets(s), [s]);
  const top = useMemo(() => [...s.equipment].map((e) => ({ e, pct: utilOf(s.utilSeries, e.id, e.utilization) })).sort((a, b) => b.pct - a.pct).slice(0, 6), [s]);
  const potential = idle.reduce((a, x) => a + x.e.acqCost * 0.0004 * 30, 0);
  const canMove = ["Pengelola Aset", "Kepala Unit", "Direksi"].includes(s.role);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div>
        <SectionHead title={`Idle detection (${idle.length} aset)`} sub={`potensi pendapatan/realokasi ≈ ${fmtIDRCompact(potential)}/bulan (0,04%/hari × nilai perolehan)`} />
        <div className="space-y-2">
          {idle.length === 0 && <Card><EmptyState title="Tidak ada aset idle" sub="Semua aset in-service berada di atas ambang 40%." /></Card>}
          {idle.map(({ e, pct }, i) => (
            <div key={e.id} className={`row-in flex flex-wrap items-center gap-3 rounded-lg border p-3.5 ${pct < 15 ? "border-danger/40 bg-dangerbg/20" : "border-warn/40 bg-warnbg/15"}`} style={{ animationDelay: `${i * 55}ms` }}>
              <span className="num font-display text-[22px] font-black text-danger">{pct}%</span>
              <div className="min-w-0 flex-1">
                <button onClick={() => nav("equipment-detail", e.id)} className="text-left text-[13px] font-extrabold text-ink hover:text-pine-700">{e.name}</button>
                <p className="font-mono text-[10px] text-mute">{e.code} · {e.room} · {pct < 15 ? "UNUSED" : "LOW_USAGE/IDLE"}</p>
              </div>
              <div className="flex gap-2">
                <BtnSm onClick={() => logUsage(e.id, 6)} title="Simulasi sinkron pemakaian dari mobile/PWA"><IcChart size={11} /> +6 jam</BtnSm>
                <BtnSm disabled={!canMove} title={!canMove ? "Butuh Pengelola Aset / Kepala Unit" : undefined} onClick={() => requestTransfer(e.id, "Gedung C", "Lantai 1", "Pool Aset Sentral", "Rekomendasi AI: aset idle — redistribusi/redudansi check")} className="!border-pine-500/60 !text-pine-700">
                  <IcSwap size={11} /> Redistribusi
                </BtnSm>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <SectionHead title="Utilisasi tertinggi" sub="kandidat capacity planning & pengadaan berikutnya" />
        <Card className="p-4">
          <div className="space-y-2.5">
            {top.map(({ e, pct }) => (
              <button key={e.id} onClick={() => nav("equipment-detail", e.id)} className="group block w-full text-left">
                <div className="mb-1 flex justify-between">
                  <span className="truncate text-[11.5px] font-bold text-ink group-hover:text-pine-700">{e.name}</span>
                  <span className={`num font-mono text-[11px] font-bold ${pct > 85 ? "text-danger" : "text-pine-700"}`}>{pct}%</span>
                </div>
                <Bar pct={pct} tone={pct > 85 ? "danger" : "pine"} />
              </button>
            ))}
          </div>
          <p className="mt-3 border-t border-line pt-2.5 font-mono text-[10px] text-mute">Aset &gt;85% berisiko antre layanan — model menyarankan unit cadangan pada kategori terkait.</p>
        </Card>
      </div>
    </div>
  );
}

/* ═══════════ Anomaly Detection ═══════════ */
function AnomalyTab() {
  const { s, nav, intelAudit } = useApp();
  const [acks, setAcks] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"ALL" | "danger" | "warn">("ALL");
  const list = useMemo(() => anomalies(s).filter((a) => filter === "ALL" || a.sev === filter), [s, filter]);

  const ack = (id: string, label: string) => {
    setAcks((x) => new Set(x).add(id));
    intelAudit("ANOMALY.ACK", "anomaly", id, `Anomali dikonfirmasi operator: ${label}`);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone="danger" dot pulse>{anomalies(s).filter((a) => a.sev === "danger").length} kritikal</Chip>
        <Chip tone="warn" dot>{anomalies(s).filter((a) => a.sev === "warn").length} peringatan</Chip>
        <div className="ml-auto flex gap-1.5">
          {(["ALL", "danger", "warn"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-md border px-2.5 py-1 font-mono text-[10.5px] font-bold transition ${filter === f ? "border-pine-600 bg-pine-700 text-pine-50" : "border-line bg-card text-mute hover:text-ink"}`}>{f === "ALL" ? "SEMUA" : f === "danger" ? "KRITIKAL" : "PERINGATAN"}</button>
          ))}
        </div>
      </div>
      {list.length === 0 ? <Card><EmptyState title="Tidak ada anomali" sub="Semua aliran data dalam batas normal." /></Card> : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {list.map((a, i) => {
            const done = acks.has(a.id);
            return (
              <div key={a.id} className={`row-in rounded-lg border p-4 transition ${done ? "border-line bg-canvas/40 opacity-60" : a.sev === "danger" ? "border-danger/40 bg-dangerbg/15" : "border-warn/40 bg-warnbg/15"}`} style={{ animationDelay: `${i * 45}ms` }}>
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${a.sev === "danger" ? "bg-danger pulse-danger" : "bg-warnhi"}`} />
                  <p className="font-display text-[13.5px] font-extrabold text-ink">{a.label}</p>
                  <Chip tone={a.sev === "danger" ? "danger" : "warn"} className="ml-auto">{a.sev === "danger" ? "KRITIKAL" : "WARNING"}</Chip>
                </div>
                <p className="mt-1.5 text-[12px] leading-relaxed text-ink2">{a.detail}</p>
                <div className="mt-3 flex gap-2 border-t border-line pt-2.5">
                  <BtnSm onClick={() => (a.view === "equipment-detail" && a.refId ? nav("equipment-detail", a.refId) : nav(a.view))}>Investigasi →</BtnSm>
                  <BtnSm disabled={done} onClick={() => ack(a.id, a.label)}>{done ? "Terkonfirmasi ✓" : "Acknowledge"}</BtnSm>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <p className="font-mono text-[10.5px] text-mute">Mesin aturan live: SLA complaint · status kalibrasi · hasil inspeksi · WO overdue · stok ≤ min · kontrak supplier · acknowledgement tercatat di audit trail.</p>
    </div>
  );
}

/* ═══════════ Automated Procurement ═══════════ */
function AutoPrTab() {
  const { s, nav, autoPr } = useApp();
  const recs = useMemo(() => procurementRecs(s), [s]);
  const total = recs.reduce((a, r) => a + r.qty * r.estCost, 0);
  const canPr = ["Pengelola Inventory", "Pengelola Aset", "Direksi", "Kepala Gudang"].includes(s.role);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-pine-500/30 bg-pine-50 p-4">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-pine-600">AI Procurement Engine</p>
          <p className="mt-1 text-[13px] font-bold text-ink">{recs.length} SKU direkomendasikan · estimasi <span className="num text-pine-700">{fmtIDR(total)}</span></p>
          <p className="font-mono text-[10px] text-mute">basis: forecast 45 hari + safety stock − stok on-hand · PR dibuat otomatis + masuk approval matrix</p>
        </div>
        <div className="flex gap-2">
          <BtnGhost onClick={() => nav("procurement")}><IcCart size={13} /> Lihat Procurement</BtnGhost>
          <BtnPrimary disabled={!canPr || recs.length === 0} title={!canPr ? "Butuh Pengelola Inventory / Pengelola Aset" : undefined} onClick={() => { autoPr(recs.map((r) => ({ sku: r.sku, name: r.name, qty: r.qty, estCost: r.estCost }))); }}>
            <IcBolt size={13} /> Buat PR otomatis ({recs.length} SKU)
          </BtnPrimary>
        </div>
      </div>
      {recs.length === 0 ? <Card><EmptyState title="Tidak ada kekurangan stok terproyeksi" sub="Coverage semua SKU di atas ambang 30 hari." /></Card> : (
        <div className="overflow-x-auto rounded-md border border-line">
          <table className="w-full min-w-[880px] text-left">
            <thead>
              <tr className="border-b border-line bg-canvas/70 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">
                <th className="px-3 py-2.5">SKU</th><th className="px-3 py-2.5 text-right">Stok</th><th className="px-3 py-2.5 text-right">Coverage</th>
                <th className="px-3 py-2.5">Alasan model</th><th className="px-3 py-2.5 text-right">Rekomendasi qty</th><th className="px-3 py-2.5 text-right">Estimasi biaya</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {recs.map((r) => (
                <tr key={r.sku} className="transition hover:bg-pine-50/60">
                  <td className="px-3 py-2.5"><p className="text-[12.5px] font-bold text-ink">{r.name}</p><p className="font-mono text-[10px] text-mute">{r.sku}</p></td>
                  <td className="num px-3 py-2.5 text-right font-mono text-[12px] font-bold text-ink">{r.stock} {r.uom}</td>
                  <td className="px-3 py-2.5 text-right"><Chip tone={r.coverage < 14 ? "danger" : "warn"} dot>{r.coverage} hari</Chip></td>
                  <td className="px-3 py-2.5 font-mono text-[10.5px] text-ink2">{r.reason}</td>
                  <td className="num px-3 py-2.5 text-right font-mono text-[12.5px] font-black text-pine-700">+{r.qty} {r.uom}</td>
                  <td className="num px-3 py-2.5 text-right font-mono text-[11px] text-ink2">{fmtIDR(r.qty * r.estCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
