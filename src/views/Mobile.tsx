import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../lib/store";
import { Bar, BtnPrimary, BtnGhost, BtnSm, Card, Chip, QRGlyph, SectionHead, StatusChip } from "../components/ui";
import { IcBolt, IcCheck, IcDownload, IcGauge, IcPhone, IcScan, IcSend, IcShield, IcWarn, IcWrench, IcX } from "../components/icons";
import { fmtTime, relTime, uid } from "../lib/types";
import type { MobileTask } from "../lib/types";

const KIND_META = {
  INSPECTION: { label: "Inspeksi", icon: <IcShield size={13} />, tone: "info" as const },
  PM: { label: "PM", icon: <IcWrench size={13} />, tone: "pine" as const },
  CALIBRATION: { label: "Kalibrasi", icon: <IcGauge size={13} />, tone: "warn" as const },
};

export default function Mobile() {
  const { s, nav, mobileDownload, mobileQueue, mobileSync, addInspection, intelAudit } = useApp();
  const [screen, setScreen] = useState<"home" | "scan" | "task" | "queue">("home");
  const [offline, setOffline] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [checks, setChecks] = useState<boolean[]>([true, true, true, true]);
  const [note, setNote] = useState("");
  const [scanning, setScanning] = useState(false);
  const [detected, setDetected] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [conflictId, setConflictId] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const eqOf = (id: string) => s.equipment.find((e) => e.id === id);
  const active = s.mobileTasks.find((t) => t.id === activeId) ?? null;
  const queue = s.mobileTasks.filter((t) => t.status === "QUEUED");
  const conflictTask = s.mobileTasks.find((t) => t.id === "MT-4");

  useEffect(() => () => { if (timerRef.current) window.clearInterval(timerRef.current); }, []);

  const openTask = (t: MobileTask) => { setActiveId(t.id); setChecks([true, true, true, true]); setNote(""); setScreen("task"); };
  const finishTask = () => {
    if (!active) return;
    if (offline) { mobileQueue(active.id); setScreen("home"); }
    else { mobileSync(active.id); setScreen("home"); }
  };

  const runScan = () => {
    setScanning(true); setDetected(null);
    window.setTimeout(() => {
      const pool = s.equipment.filter((e) => e.opStatus === "IN_SERVICE");
      setDetected(pool[Math.floor(Math.random() * pool.length)].id);
      setScanning(false);
    }, 1300);
  };

  const syncAll = () => {
    if (syncing || queue.length === 0) return;
    setSyncing(true); setProgress(0);
    const ids = queue.map((q) => q.id);
    let i = 0;
    timerRef.current = window.setInterval(() => {
      i += 1;
      setProgress(Math.round((i / ids.length) * 100));
      if (i >= ids.length) {
        if (timerRef.current) window.clearInterval(timerRef.current);
        setSyncing(false);
        setScreen("home");
      }
    }, 450);
    // dispatch each (conflict task handled separately)
    ids.forEach((id, idx) => {
      if (id === "MT-4") { setConflictId(id); return; }
      window.setTimeout(() => mobileSync(id), idx * 420);
    });
  };

  const resolvedConflict = (pick: "SERVER" | "FIELD") => {
    if (!conflictId) return;
    mobileSync(conflictId, pick);
    setConflictId(null);
  };

  const quickInspect = (eqId: string) => {
    addInspection(eqId, "Petugas Lapangan (PWA)", [
      { item: "Grounding resistance", pass: true }, { item: "Leakage current", pass: true },
      { item: "Kabel & plug", pass: true }, { item: "Label & QR", pass: true },
    ], "PASS", "Inspeksi cepat via scan QR (mobile).", new Date(Date.now() + 90 * 864e5).toISOString());
    intelAudit("QR.QUICK_INSPECT", "equipment", eqId, "Scan QR → inspeksi cepat");
  };

  const stat = useMemo(() => ({
    synced: s.mobileTasks.filter((t) => t.status === "SYNCED").length,
    queued: queue.length,
    ok: s.syncLog.filter((l) => l.status === "OK").length,
    conflict: s.syncLog.filter((l) => l.status === "CONFLICT").length,
  }), [s.mobileTasks, s.syncLog, queue.length]);

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Mobile Field Ops (PWA)</h1>
          <p className="text-xs text-mute">Offline-capable: Download → Scan QR → Input hasil → Local queue → Sync + conflict resolution</p>
        </div>
        <div className="flex gap-2">
          <Chip tone="ok" dot>{stat.synced} SYNCED</Chip>
          <Chip tone="warn" dot pulse={stat.queued > 0}>{stat.queued} ANTRIAN</Chip>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_1fr]">
        {/* ── Phone frame ── */}
        <div className="mx-auto w-full max-w-[380px]">
          <div className="rounded-[2.8rem] border-[10px] border-pine-950 bg-pine-950 shadow-2xl">
            <div className="dark-grain flex h-[660px] flex-col overflow-hidden rounded-[2rem] text-pine-50">
              {/* status bar */}
              <div className="flex items-center justify-between px-5 pt-4">
                <PhoneClock />
                <div className="flex items-center gap-1.5">
                  {offline ? <Chip tone="warn" dot pulse>OFFLINE</Chip> : <Chip tone="ok" dot>ONLINE</Chip>}
                  <span className="font-mono text-[10px] font-bold text-pine-100">SIMASET Field</span>
                </div>
              </div>

              {/* offline banner */}
              {offline && (
                <div className="mx-4 mt-3 flex items-center gap-2 rounded-md border border-warnhi/40 bg-warn/15 px-3 py-2">
                  <IcWarn size={14} className="shrink-0 text-warnhi" />
                  <p className="text-[10.5px] leading-snug text-pine-100">Mode offline — hasil disimpan ke antrian lokal, disinkron saat online.</p>
                </div>
              )}

              {/* header + offline toggle */}
              <div className="flex items-center justify-between px-5 pt-4">
                <h2 className="font-display text-[16px] font-extrabold tracking-tight">
                  {screen === "home" ? "Tugas Lapangan" : screen === "scan" ? "Scan QR Aset" : screen === "task" ? "Input Hasil" : "Antrian Sinkron"}
                </h2>
                <button onClick={() => setOffline(!offline)} className="relative flex h-5 w-10 items-center rounded-full border border-pine-700 bg-pine-900 px-0.5 transition">
                  <span className={`h-4 w-4 rounded-full transition-all ${offline ? "translate-x-5 bg-warnhi" : "translate-x-0 bg-pine-500"}`} />
                </button>
              </div>

              {/* body */}
              <div className="flex-1 overflow-y-auto px-4 pb-4 pt-3">
                {screen === "home" && (
                  <div className="space-y-2.5">
                    <button onClick={() => { setScreen("scan"); setDetected(null); }} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-pine-600 bg-pine-900/50 py-3 font-display text-[12.5px] font-bold text-pine-100 transition hover:border-pine-500 hover:bg-pine-800/60">
                      <IcScan size={16} className="text-warnhi" /> Scan QR Aset
                    </button>
                    {s.mobileTasks.map((t) => {
                      const eq = eqOf(t.eqId);
                      if (!eq) return null;
                      const km = KIND_META[t.kind];
                      return (
                        <div key={t.id} className="row-in rounded-lg border border-pine-800 bg-pine-900/70 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-[12.5px] font-bold text-pine-50">{eq.name}</p>
                              <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[9.5px] text-pine-100/60">
                                <span className={`flex items-center gap-1 ${km.tone === "info" ? "text-info" : km.tone === "pine" ? "text-pine-500" : "text-warnhi"}`}>{km.icon}{km.label}</span>
                                · {t.code} · {eq.code}
                              </p>
                            </div>
                            <StatusChip status={t.status} />
                          </div>
                          <div className="mt-2.5 flex gap-1.5">
                            {t.status === "ASSIGNED" && <BtnSm onClick={() => mobileDownload(t.id)} className="!border-pine-600 !bg-pine-800 !text-pine-100"><IcDownload size={11} /> Unduh</BtnSm>}
                            {t.status === "DOWNLOADED" && <BtnSm onClick={() => openTask(t)} className="!border-pine-600 !bg-pine-800 !text-pine-100">Kerjakan</BtnSm>}
                            {t.status === "QUEUED" && <span className="font-mono text-[10px] text-warnhi">menunggu sinkron…</span>}
                            {t.status === "SYNCED" && <span className="flex items-center gap-1 font-mono text-[10px] text-pine-500"><IcCheck size={11} /> tersinkron</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {screen === "scan" && (
                  <div className="flex flex-col items-center pt-6">
                    <div className="relative flex h-44 w-44 items-center justify-center overflow-hidden rounded-xl border border-pine-700 bg-pine-950/70">
                      {detected ? (
                        <QRGlyph seed={eqOf(detected)?.code ?? ""} size={120} />
                      ) : (
                        <>
                          <QRGlyph seed="SIMASET-SCAN" size={120} />
                          {scanning && <div className="scanline absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-warnhi/70 to-transparent" />}
                        </>
                      )}
                    </div>
                    <p className="mt-3 font-mono text-[10.5px] text-pine-100/60">{scanning ? "Mendeteksi aset…" : detected ? "Aset terdeteksi" : "Arahkan kamera ke QR aset"}</p>

                    {detected && (() => { const eq = eqOf(detected)!; return (
                      <div className="msg-in mt-4 w-full rounded-lg border border-pine-700 bg-pine-900/80 p-3">
                        <p className="text-[13px] font-bold text-pine-50">{eq.name}</p>
                        <p className="mt-0.5 font-mono text-[9.5px] text-pine-100/60">{eq.code} · {eq.room} · {eq.opStatus}</p>
                        <div className="mt-2.5 flex gap-1.5">
                          <BtnSm onClick={() => quickInspect(detected)} className="!border-pine-600 !bg-pine-800 !text-pine-100"><IcShield size={11} /> Inspeksi cepat</BtnSm>
                          <BtnSm onClick={() => nav("equipment-detail", detected)} className="!border-pine-600 !bg-pine-800 !text-pine-100">Lihat 360°</BtnSm>
                        </div>
                      </div>
                    ); })()}

                    {!detected && <BtnPrimary onClick={runScan} disabled={scanning} className="mt-5 w-44"><IcScan size={13} /> {scanning ? "Memindai…" : "Mulai Scan"}</BtnPrimary>}
                    {detected && <BtnGhost onClick={() => setDetected(null)} className="mt-3 !border-pine-700 !text-pine-100">Scan lagi</BtnGhost>}
                  </div>
                )}

                {screen === "task" && active && (
                  <div className="space-y-3 pt-1">
                    <p className="text-[12.5px] font-bold text-pine-50">{eqOf(active.eqId)?.name}</p>
                    <div className="space-y-1.5">
                      {["Grounding resistance", "Leakage current", "Kabel & plug", "Label & QR"].map((c, i) => (
                        <div key={c} className="flex items-center justify-between rounded-md border border-pine-800 bg-pine-900/70 px-3 py-2">
                          <span className="text-[11px] font-semibold text-pine-100">{c}</span>
                          <div className="flex gap-1">
                            <button onClick={() => setChecks(checks.map((x, j) => (j === i ? true : x)))} className={`rounded px-2 py-0.5 font-mono text-[9.5px] font-bold ${checks[i] ? "bg-pine-600 text-pine-50" : "bg-pine-950 text-pine-100/50"}`}>OK</button>
                            <button onClick={() => setChecks(checks.map((x, j) => (j === i ? false : x)))} className={`rounded px-2 py-0.5 font-mono text-[9.5px] font-bold ${!checks[i] ? "bg-danger text-white" : "bg-pine-950 text-pine-100/50"}`}>NG</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan lapangan…"
                      className="min-h-[70px] w-full rounded-md border border-pine-700 bg-pine-950/60 px-3 py-2 text-[11.5px] text-pine-50 outline-none placeholder:text-pine-100/40 focus:border-pine-500" />
                    <BtnPrimary onClick={finishTask} className="w-full"><IcCheck size={13} /> Selesaikan {offline ? "(offline)" : ""}</BtnPrimary>
                    <BtnGhost onClick={() => setScreen("home")} className="w-full !border-pine-700 !text-pine-100">Kembali</BtnGhost>
                  </div>
                )}

                {screen === "queue" && (
                  <div className="space-y-2.5 pt-1">
                    {conflictId && conflictTask && (
                      <div className="rounded-lg border border-danger/60 bg-danger/15 p-3">
                        <p className="flex items-center gap-1.5 text-[11.5px] font-bold text-danger"><IcWarn size={13} /> Konflik versi — {conflictTask.code}</p>
                        <p className="mt-1 text-[10.5px] leading-snug text-pine-100">Server punya versi lebih baru untuk aset ini. Pilih versi yang dipakai:</p>
                        <div className="mt-2 flex gap-1.5">
                          <BtnSm onClick={() => resolvedConflict("SERVER")} className="!border-info/60 !text-info">Pakai Server</BtnSm>
                          <BtnSm onClick={() => resolvedConflict("FIELD")} className="!border-warn/60 !text-warn">Pakai Lapangan</BtnSm>
                        </div>
                      </div>
                    )}
                    {queue.length === 0 && !conflictId && <p className="pt-8 text-center font-mono text-[11px] text-pine-100/50">Antrian kosong — semua tersinkron.</p>}
                    {queue.map((t) => (
                      <div key={t.id} className="flex items-center justify-between rounded-md border border-pine-800 bg-pine-900/70 px-3 py-2">
                        <span className="font-mono text-[10.5px] text-pine-100">{t.code}</span>
                        <StatusChip status={t.status} />
                      </div>
                    ))}
                    {syncing && (
                      <div className="rounded-md border border-pine-700 bg-pine-950/60 p-3">
                        <div className="mb-1.5 flex justify-between font-mono text-[10px] text-pine-100"><span>Menyinkronkan…</span><span>{progress}%</span></div>
                        <Bar pct={progress} tone="pine" />
                      </div>
                    )}
                    <BtnPrimary onClick={syncAll} disabled={syncing || queue.length === 0} className="w-full"><IcSend size={13} /> Sinkronkan ({queue.length})</BtnPrimary>
                    <BtnGhost onClick={() => setScreen("home")} className="w-full !border-pine-700 !text-pine-100">Kembali</BtnGhost>
                  </div>
                )}
              </div>

              {/* bottom nav */}
              <div className="grid grid-cols-3 border-t border-pine-800 bg-pine-950/80">
                {[
                  { id: "home" as const, label: "Tugas", icon: <IcCheck size={16} /> },
                  { id: "queue" as const, label: `Antrian${queue.length ? ` (${queue.length})` : ""}`, icon: <IcSend size={16} /> },
                  { id: "scan" as const, label: "Scan", icon: <IcScan size={16} /> },
                ].map((b) => (
                  <button key={b.id} onClick={() => { setScreen(b.id); if (b.id === "scan") { setDetected(null); } }}
                    className={`flex flex-col items-center gap-1 py-2.5 text-[9.5px] font-bold transition ${screen === b.id ? "text-warnhi" : "text-pine-100/50 hover:text-pine-100"}`}>
                    {b.icon}{b.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-4">
          <Card className="p-4">
            <SectionHead title="Sync pipeline" sub="Setiap hasil lapangan → event envelope → ledger & timeline (idempoten via correlation_id)"
              right={<Chip tone="pine"><IcBolt size={11} /> local-first</Chip>} />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { l: "Tersinkron", v: stat.synced, c: "text-ok" },
                { l: "Antrian lokal", v: stat.queued, c: "text-warn" },
                { l: "Event OK", v: stat.ok, c: "text-info" },
                { l: "Konflik", v: stat.conflict, c: "text-danger" },
              ].map((k) => (
                <div key={k.l} className="rounded-lg border border-line bg-canvas/50 p-3">
                  <p className="font-mono text-[9.5px] font-semibold uppercase tracking-wider text-mute">{k.l}</p>
                  <p className={`num mt-1 font-display text-[22px] font-black ${k.c}`}>{k.v}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <SectionHead title="Sync log" sub="Event envelope dari perangkat lapangan" />
            <div className="space-y-1.5">
              {s.syncLog.map((l) => (
                <div key={l.id} className="row-in flex items-center justify-between gap-3 rounded-md border border-line bg-paper px-3 py-2">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-mono text-[11px] font-bold text-ink">
                      <span className="text-pine-700">{l.event}</span>
                      <StatusChip status={l.status} />
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[10px] text-mute">{l.taskCode} · {l.note}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-[9.5px] text-mute">{relTime(l.ts)}</p>
                    <p className="font-mono text-[9px] text-pine-600">{l.correlationId.slice(0, 14)}…</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <SectionHead title="Offline-first spec" sub="Sesuai PRD §6 — QR mobile flow & offline mobile" />
            <ol className="space-y-1.5">
              {["Download assigned task saat online", "Operasi offline: scan QR, input hasil", "Simpan ke local queue", "Sync saat online (retry + idempotency)", "Conflict resolution: server vs lapangan"].map((step, i) => (
                <li key={step} className="flex items-center gap-2.5 text-[12px] text-ink2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pine-100 font-mono text-[10px] font-bold text-pine-700">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
            <p className="mt-3 rounded-md bg-moss px-3 py-2 font-mono text-[10px] leading-relaxed text-ink2">
              <IcPhone size={11} className="mr-1 inline text-pine-600" />
              PWA target: API p95 &lt; 500ms · QR lookup &lt; 1s · availability ≥ 99,9%
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PhoneClock() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => {
    const h = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(h);
  }, []);
  return <span className="num font-mono text-[11px] font-bold text-pine-100">{fmtTime(t.toISOString())}</span>;
}
