import { useMemo, useState } from "react";
import { useApp } from "../lib/store";
import { BtnPrimary, BtnSm, Card, Chip, EmptyState, Label, Select, SectionHead, StatusChip } from "../components/ui";
import { IcBolt, IcSend } from "../components/icons";
import { EVENT_CATALOG } from "../lib/data";
import { NotifChannel, NotifKind, relTime } from "../lib/types";

const CHANNELS: { id: NotifChannel; label: string }[] = [
  { id: "in-app", label: "In-App" },
  { id: "email", label: "Email" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "push", label: "Push" },
];

const groupOfNotif = (msg: string, refId: string): "stok" | "aset" | "teknis" | "persetujuan" => {
  const m = msg.toUpperCase();
  if (refId.startsWith("BHP-") || refId.startsWith("FAR-") || refId.startsWith("UMU-") || refId.startsWith("IT-") || m.includes("STOK") || m.includes("OPNAME")) return "stok";
  if (m.includes("KALIBRASI") || m.includes("PM") || m.includes("WO") || m.includes("KELUHAN") || m.includes("SLA") || m.includes("INSPEKSI")) return "teknis";
  if (m.includes("PERSETUJUAN") || m.includes("PR ") || m.includes("APPROVAL")) return "persetujuan";
  return "aset";
};

export default function NotificationCenter() {
  const { s, nav, markNotif, markAllNotif, testNotify, cfgPatch } = useApp();
  const [group, setGroup] = useState("ALL");
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [testKind, setTestKind] = useState<NotifKind>("LOW_STOCK");

  const activeChannels = CHANNELS.filter((c) => s.config.channels[c.id]);

  const rows = useMemo(() => s.notifs.filter((n) => {
    if (onlyUnread && n.read) return false;
    if (group === "ALL") return true;
    return groupOfNotif(n.msg, n.refId) === group;
  }), [s.notifs, group, onlyUnread]);

  const unread = s.notifs.filter((n) => !n.read).length;

  const goRef = (refId: string) => {
    if (refId.startsWith("EQ-")) nav("equipment-detail", refId);
    else if (refId.startsWith("CMP-") || refId.startsWith("LN-") || refId.startsWith("RPR-")) nav("complaints");
    else if (/^(BHP|FAR|UMU|IT)-/.test(refId)) nav("inventory");
    else if (refId.startsWith("S-")) nav("master");
    else if (refId.startsWith("APR-")) nav("approvals");
    else nav("dashboard");
  };

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Pusat Notifikasi</h1>
          <p className="text-xs text-mute">Multi-kanal (in-app · email · WhatsApp · push) · event-driven dari notification engine</p>
        </div>
        <div className="flex items-center gap-2">
          <Chip tone={unread > 0 ? "warn" : "ok"} dot pulse={unread > 0}>{unread} belum dibaca</Chip>
          <BtnSm onClick={markAllNotif} disabled={unread === 0}>Tandai semua dibaca</BtnSm>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* left: channel + test event */}
        <div className="space-y-3">
          <Card className="p-4">
            <SectionHead title="Kanal aktif" sub="Konfigurasi tersimpan & diaudit" />
            <div className="space-y-2">
              {CHANNELS.map((c) => {
                const on = s.config.channels[c.id];
                return (
                  <button key={c.id} onClick={() => cfgPatch({ channels: { ...s.config.channels, [c.id]: !on } })}
                    className={`flex w-full items-center justify-between rounded-md border px-3 py-2.5 transition ${on ? "border-pine-500/50 bg-pine-50" : "border-line bg-card opacity-70 hover:opacity-100"}`}>
                    <span className={`text-[12.5px] font-bold ${on ? "text-pine-700" : "text-mute"}`}>{c.label}</span>
                    <span className={`relative h-5 w-9 rounded-full transition ${on ? "bg-pine-600" : "bg-line2"}`}>
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="p-4">
            <SectionHead title="Kirim event uji" sub="Memicu notification engine + audit" />
            <div className="space-y-2.5">
              <div><Label>Event</Label>
                <Select value={testKind} onChange={(e) => setTestKind(e.target.value as NotifKind)}>
                  {EVENT_CATALOG.map((ev) => <option key={ev.event} value={ev.event as NotifKind}>{ev.event}</option>)}
                </Select>
              </div>
              <BtnPrimary className="w-full" disabled={activeChannels.length === 0}
                onClick={() => testNotify(testKind, activeChannels[0].id)}>
                <IcSend size={13} /> Kirim via {activeChannels[0]?.label ?? "—"}
              </BtnPrimary>
              {activeChannels.length === 0 && <p className="rounded-md bg-warnbg px-2.5 py-1.5 text-[11px] font-semibold text-warn">Aktifkan minimal satu kanal.</p>}
            </div>
          </Card>
        </div>

        {/* right: inbox + catalog */}
        <div className="space-y-3 lg:col-span-2">
          <Card className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <SectionHead title="Kotak masuk" sub={`${rows.length} notifikasi`} />
              <div className="flex flex-wrap gap-1.5">
                {["ALL", "stok", "teknis", "persetujuan", "aset"].map((g) => (
                  <button key={g} onClick={() => setGroup(g)}
                    className={`rounded-md border px-2.5 py-1 font-mono text-[10px] font-bold uppercase transition ${group === g ? "border-pine-600 bg-pine-700 text-pine-50" : "border-line bg-card text-mute hover:text-pine-700"}`}>{g}</button>
                ))}
                <button onClick={() => setOnlyUnread(!onlyUnread)}
                  className={`rounded-md border px-2.5 py-1 font-mono text-[10px] font-bold uppercase transition ${onlyUnread ? "border-warn bg-warnbg text-warn" : "border-line bg-card text-mute hover:text-warn"}`}>unread</button>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {rows.length === 0 && <EmptyState title="Tidak ada notifikasi" sub="Semua sudah dibaca atau filter terlalu sempit." />}
              {rows.map((n, i) => (
                <button key={n.id} onClick={() => { markNotif(n.id); goRef(n.refId); }}
                  className={`row-in flex w-full items-start gap-3 rounded-lg border p-3 text-left transition hover:border-pine-500/50 hover:shadow-md ${n.read ? "border-line bg-canvas/40" : "border-line bg-paper"}`}
                  style={{ animationDelay: `${Math.min(i, 10) * 35}ms` }}>
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-line2" : "bg-pine-500 pulse-dot"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusChip status={n.kind} />
                      <span className="font-mono text-[9.5px] text-mute">{relTime(n.date)}</span>
                    </div>
                    <p className={`mt-1 text-[12.5px] leading-snug ${n.read ? "text-mute" : "font-semibold text-ink"}`}>{n.msg}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <SectionHead title="Katalog event" sub={`${EVENT_CATALOG.length} event · PRD §9/§11`} />
            <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
              {EVENT_CATALOG.map((ev) => (
                <div key={ev.event} className="flex items-center justify-between gap-2 rounded-md border border-line bg-canvas/40 px-2.5 py-1.5">
                  <div className="min-w-0">
                    <p className="font-mono text-[10.5px] font-bold text-pine-700">{ev.event}</p>
                    <p className="truncate text-[10.5px] text-mute">{ev.desc}</p>
                  </div>
                  <span className="shrink-0 font-mono text-[9px] text-mute">{ev.channel}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <p className="flex items-center gap-1.5 font-mono text-[10.5px] text-mute">
        <IcBolt size={12} className="text-warnhi" /> Envelope event: event_id · event_type · aggregate · timestamp · actor · payload · correlation_id (idempoten + retry queue).
      </p>
    </div>
  );
}
