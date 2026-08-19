import React, { useEffect, useRef, useState } from "react";
import { StoreProvider, useApp } from "./lib/store";
import { Chip, ToastHost } from "./components/ui";
import {
  IcBell, IcBolt, IcBox, IcChart, IcCheck, IcChevD, IcClose, IcClock, IcFlag, IcGauge, IcHospital, IcLedger,
  IcLayers, IcPin, IcPlus, IcPulse, IcScan, IcScroll, IcSearch, IcShield, IcStamp, IcSwap, IcTruck, IcUser, IcWarn, IcWrench, IcCart, IcPhone, IcX, IcForm,
} from "./components/icons";
import { ROLES, ROLE_USER, Role, View, fmtDate, relTime } from "./lib/types";
import { anomalies } from "./lib/intel";
import { RegisterModal } from "./components/modals";
import Dashboard from "./views/Dashboard";
import EquipmentList from "./views/EquipmentList";
import EquipmentDetail from "./views/EquipmentDetail";
import Inventory from "./views/Inventory";
import Logistics from "./views/Logistics";
import Opname from "./views/Opname";
import Maintenance from "./views/Maintenance";
import Complaints from "./views/Complaints";
import Procurement from "./views/Procurement";
import Reporting from "./views/Reporting";
import MasterData from "./views/MasterData";
import Locations from "./views/Locations";
import Approvals from "./views/Approvals";
import AuditTrail from "./views/AuditTrail";
import Rbac from "./views/Rbac";
import Utilization from "./views/Utilization";
import RentalLoan from "./views/RentalLoan";
import Depreciation from "./views/Depreciation";
import Intelligence from "./views/Intelligence";
import Mobile from "./views/Mobile";
import Disposal from "./views/Disposal";
import Integrations from "./views/Integrations";
import NotificationCenter from "./views/NotificationCenter";
import AssetLedger from "./views/AssetLedger";
import Config from "./views/Config";
import Command from "./views/Command";
import ComplianceView from "./views/Compliance";
import Reliability from "./views/Reliability";
import EventBus from "./views/EventBus";
import FormBuilder from "./views/FormBuilder";

const TITLES: Record<View, string> = {
  dashboard: "Dashboard", equipment: "Equipment Registry", "equipment-detail": "Equipment 360°",
  inventory: "Inventory & Ledger", logistics: "Gudang & Distribusi", opname: "Stock Opname",
  technical: "Technical Operations", complaints: "Complaints & Repairs", procurement: "Procurement",
  reporting: "Reporting & Analytics", master: "Master Data", locations: "Lokasi, Transfer & QR",
  approvals: "Approval Engine", audit: "Audit Trail", rbac: "Peran & Akses",
  utilization: "Asset Utilization", rental: "Sewa, Pinjaman & BGS/SGB", depreciation: "Depreciation",
  intelligence: "Enterprise Intelligence",
  mobile: "Mobile Field Ops (PWA)", disposal: "Retirement & Disposal", integrations: "Integration Hub",
  notifications: "Pusat Notifikasi", assetledger: "Buku Aset (Fixed Assets)", config: "Konfigurasi Sistem",
  command: "Executive Command Center", compliance: "Security & Compliance",
  formbuilder: "Form Builder",
  reliability: "Reliability Analytics", eventbus: "Event Bus · Telemetri",
};

function Clock() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => {
    const h = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(h);
  }, []);
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="hidden items-center gap-2 rounded-md border border-line bg-card px-2.5 py-1.5 lg:flex">
      <IcClock size={13} className="text-pine-600" />
      <span className="num font-mono text-[12px] font-semibold text-ink">{p(t.getHours())}:{p(t.getMinutes())}<span className="text-mute">:{p(t.getSeconds())}</span></span>
      <span className="hidden font-mono text-[10px] text-mute xl:inline">{fmtDate(t.toISOString())}</span>
    </div>
  );
}

function NotifBell() {
  const { s, markNotifsRead, nav } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = s.notifs.filter((n) => !n.read).length;

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, []);

  const kindIcon = (k: string) =>
    k.includes("CALIBRATION") || k.includes("MAINTENANCE") ? <IcGauge size={14} />
    : k.includes("STOCK") || k.includes("VARIANCE") || k.includes("LOW_STOCK") ? <IcBox size={14} />
    : k.includes("COMPLAINT") || k.includes("REPAIR") ? <IcFlag size={14} />
    : k.includes("APPROVAL") ? <IcStamp size={14} />
    : k.includes("INSPECTION") ? <IcShield size={14} />
    : k.includes("CONTRACT") ? <IcWarn size={14} />
    : k === "ASSET_IDLE" ? <IcLayers size={14} /> : <IcBolt size={14} />;

  const go = (refId: string, kind: string) => {
    setOpen(false);
    if (refId.startsWith("EQ-")) nav("equipment-detail", refId);
    else if (kind.includes("COMPLAINT") || kind.includes("REPAIR")) nav("complaints");
    else if (kind.includes("APPROVAL")) nav("approvals");
    else if (kind.includes("INSPECTION") || kind.includes("MAINTENANCE") || kind.includes("CALIBRATION")) nav("technical");
    else if (refId.startsWith("CMP")) nav("complaints");
    else nav("inventory");
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className={`relative flex h-9 w-9 items-center justify-center rounded-md border transition ${open ? "border-pine-500/60 bg-pine-50 text-pine-700" : "border-line bg-card text-ink2 hover:border-pine-500/50 hover:text-pine-700"}`}
        aria-label="Notifications">
        <IcBell size={16} />
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 font-mono text-[9.5px] font-bold text-white pulse-danger">{unread}</span>
        )}
      </button>
      {open && (
        <div className="modal-in fixed inset-x-3 top-14 z-40 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[380px] overflow-hidden rounded-lg border border-line bg-paper shadow-2xl">
          <div className="flex items-center justify-between border-b border-line bg-canvas/60 px-3.5 py-2.5">
            <p className="font-display text-[13px] font-extrabold text-ink">Notifications <span className="font-mono text-[10.5px] font-semibold text-mute">· {unread} unread</span></p>
            <button onClick={markNotifsRead} className="flex items-center gap-1 font-mono text-[10.5px] font-bold text-pine-600 hover:underline"><IcCheck size={11} /> tandai dibaca</button>
          </div>
          <div className="max-h-[380px] overflow-y-auto">
            {s.notifs.map((n) => (
              <button key={n.id} onClick={() => go(n.refId, n.kind)} className={`flex w-full items-start gap-2.5 border-b border-line px-3.5 py-2.5 text-left transition last:border-0 hover:bg-pine-50/60 ${n.read ? "opacity-60" : ""}`}>
                <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${n.kind.includes("EXPIRED") || n.kind.includes("BREACH") || n.kind.includes("FAIL") ? "bg-dangerbg text-danger" : n.kind.includes("DUE") || n.kind.includes("OVERDUE") || n.kind.includes("LOW_STOCK") || n.kind.includes("EXPIRING") ? "bg-warnbg text-warn" : "bg-infobg text-info"}`}>
                  {kindIcon(n.kind)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-semibold leading-snug text-ink">{n.msg}</span>
                  <span className="mt-0.5 flex items-center gap-2 font-mono text-[9.5px] text-mute">
                    <Chip tone="neutral" className="!px-1 !py-0 !text-[8.5px]">{n.kind.replace(/_/g, " ")}</Chip>
                    {relTime(n.date)}
                  </span>
                </span>
                {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-pine-500" />}
              </button>
            ))}
          </div>
          <p className="border-t border-line bg-canvas/60 px-3.5 py-2 font-mono text-[9.5px] text-mute">Channels: in-app · email · WhatsApp · push (config-driven)</p>
        </div>
      )}
    </div>
  );
}

function Shell() {
  const { s, nav, setRole, search } = useApp();
  const [roleOpen, setRoleOpen] = useState(false);
  const [regOpen, setRegOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const pending = s.approvals.filter((a) => a.status === "PENDING").length;
  const pendingAnomalies = anomalies(s).length;
  const unread = s.notifs.filter((n) => !n.read).length;
  const active = s.view === "equipment-detail" ? "equipment" : s.view;

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "/" && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement) && !(e.target instanceof HTMLSelectElement)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const NAV: { group: string; items: { id: View; label: string; icon: React.ReactNode; badge?: number }[] }[] = [
    { group: "Executive", items: [
      { id: "command", label: "Command Center", icon: <IcGauge size={15} />, badge: pendingAnomalies > 0 ? pendingAnomalies : undefined },
    ]},
    { group: "Pantau", items: [
      { id: "dashboard", label: "Dashboard", icon: <IcPulse size={15} /> },
      { id: "reporting", label: "Reporting", icon: <IcChart size={15} /> },
    ]},
    { group: "Aset", items: [
      { id: "equipment", label: "Equipment 360°", icon: <IcScan size={15} /> },
      { id: "locations", label: "Lokasi & QR", icon: <IcPin size={15} /> },
    ]},
    { group: "Inventori", items: [
      { id: "inventory", label: "Inventory & Ledger", icon: <IcBox size={15} /> },
      { id: "logistics", label: "Gudang & Distribusi", icon: <IcTruck size={15} /> },
      { id: "opname", label: "Stock Opname", icon: <IcLayers size={15} /> },
    ]},
    { group: "Teknis", items: [
      { id: "technical", label: "Maintenance & Cal.", icon: <IcWrench size={15} /> },
      { id: "formbuilder", label: "Form Builder", icon: <IcForm size={15} /> },
      { id: "complaints", label: "Complaints & Repairs", icon: <IcFlag size={15} /> },
      { id: "procurement", label: "Procurement", icon: <IcCart size={15} /> },
    ]},
    { group: "Pemanfaatan & Finansial", items: [
      { id: "utilization", label: "Utilisasi & Idle", icon: <IcChart size={15} /> },
      { id: "rental", label: "Sewa, Pinjam & BGS", icon: <IcSwap size={15} /> },
      { id: "depreciation", label: "Depresiasi", icon: <IcLedger size={15} /> },
    ]},
    { group: "Intelligence", items: [
      { id: "intelligence", label: "AI Intelligence", icon: <IcBolt size={15} />, badge: pendingAnomalies },
      { id: "reliability", label: "Reliability", icon: <IcGauge size={15} /> },
      { id: "eventbus", label: "Event Bus", icon: <IcPulse size={15} /> },
    ]},
    { group: "Lapangan & Integrasi", items: [
      { id: "mobile", label: "Mobile / PWA", icon: <IcPhone size={15} /> },
      { id: "disposal", label: "Pensiun & Disposal", icon: <IcX size={15} /> },
      { id: "integrations", label: "Integration Hub", icon: <IcPulse size={15} /> },
    ]},
    { group: "Master", items: [
      { id: "master", label: "Master Data", icon: <IcHospital size={15} /> },
    ]},
    { group: "Tata Kelola", items: [
      { id: "approvals", label: "Approvals", icon: <IcStamp size={15} />, badge: pending },
      { id: "audit", label: "Audit Trail", icon: <IcScroll size={15} /> },
      { id: "rbac", label: "Peran & Akses", icon: <IcShield size={15} /> },
      { id: "compliance", label: "Security & Compliance", icon: <IcCheck size={15} /> },
    ]},
    { group: "Konsolidasi", items: [
      { id: "assetledger", label: "Buku Aset", icon: <IcHospital size={15} /> },
      { id: "notifications", label: "Pusat Notifikasi", icon: <IcBell size={15} />, badge: unread },
      { id: "config", label: "Konfigurasi", icon: <IcForm size={15} /> },
    ]},
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="dark-grain hidden w-[228px] shrink-0 flex-col border-r border-pine-800 md:flex">
        <div className="flex items-center gap-2.5 px-4 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-pine-700 bg-pine-950 shadow-inner">
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
              <path d="M16 7v18M7 16h18" stroke="#F2A93B" strokeWidth="3.4" strokeLinecap="round" />
              <circle cx="16" cy="16" r="12.2" stroke="#2E8B72" strokeWidth="2.2" />
            </svg>
          </span>
          <div>
            <p className="font-display text-[16px] font-black leading-none tracking-tight text-pine-50">SIMASET</p>
            <p className="mt-0.5 font-mono text-[8.5px] font-semibold uppercase tracking-[0.16em] text-pine-500">Asset Lifecycle OS</p>
          </div>
        </div>

        <div className="mx-4 mb-3 flex items-center gap-2 rounded-md border border-pine-800 bg-pine-950/60 px-2.5 py-2">
          <IcHospital size={14} className="shrink-0 text-warnhi" />
          <div className="min-w-0">
            <p className="truncate text-[11.5px] font-bold text-pine-100">RS Harapan Medika</p>
            <p className="font-mono text-[8.5px] uppercase tracking-widest text-pine-500">Cabang Utama</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 pb-3">
          {NAV.map((g) => (
            <div key={g.group} className="mb-3">
              <p className="px-2 pb-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-pine-500/80">{g.group}</p>
              {g.items.map((it) => (
                <button key={it.id} onClick={() => nav(it.id)}
                  className={`group mb-0.5 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[12.5px] font-semibold transition ${active === it.id ? "bg-pine-700 text-pine-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" : "text-pine-100/60 hover:bg-pine-800/70 hover:text-pine-100"}`}>
                  <span className={active === it.id ? "text-warnhi" : "text-pine-500 group-hover:text-pine-100"}>{it.icon}</span>
                  <span className="flex-1 font-display tracking-tight">{it.label}</span>
                  {it.badge !== undefined && it.badge > 0 && (
                    <span className="rounded bg-warnhi px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-pine-950">{it.badge}</span>
                  )}
                </button>
              ))}
            </div>
          ))}

          <div className="mx-1 mt-2 rounded-md border border-pine-800 bg-pine-950/50 p-2.5">
            <p className="font-mono text-[8.5px] font-bold uppercase tracking-[0.16em] text-pine-500">Phase roadmap</p>
            <div className="mt-1.5 space-y-1">
              {[["P1 Core Inventory & Asset", true], ["P2 Technical Operations", true], ["P3 Utilization & Finance", true], ["P4 Enterprise Intelligence", true], ["P5 Field Ops & Integration", true], ["P6 Consolidation & Governance", true], ["P7 Command & Compliance", true]].map(([label, on]) => (
                <p key={label as string} className="flex items-center gap-1.5 font-mono text-[9.5px] text-pine-100/70">
                  {on ? <IcCheck size={10} className="text-pine-500" /> : <IcClose size={10} className="text-pine-700" />} {label}
                </p>
              ))}
            </div>
          </div>
        </nav>

        <div className="relative border-t border-pine-800 p-3">
          <button onClick={() => setRoleOpen(!roleOpen)} className="flex w-full items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left transition hover:bg-pine-800/70">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pine-700 font-display text-[11px] font-black text-pine-50">{ROLE_USER[s.role].initials}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11.5px] font-bold text-pine-100">{ROLE_USER[s.role].name}</span>
              <span className="block font-mono text-[9px] uppercase tracking-wider text-warnhi">{s.role}</span>
            </span>
            <IcChevD size={13} className={`text-pine-500 transition ${roleOpen ? "rotate-180" : ""}`} />
          </button>
          {roleOpen && (
            <div className="modal-in absolute bottom-full left-3 right-3 z-40 mb-1 overflow-hidden rounded-lg border border-pine-700 bg-pine-900 shadow-2xl">
              <p className="border-b border-pine-800 px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-pine-500">Switch role (RBAC demo)</p>
              {ROLES.map((r) => (
                <button key={r} onClick={() => { setRole(r); setRoleOpen(false); }} className={`flex w-full items-center justify-between px-3 py-2 text-left text-[12px] font-semibold transition hover:bg-pine-800 ${s.role === r ? "text-warnhi" : "text-pine-100/75"}`}>
                  {r}
                  {s.role === r && <IcCheck size={12} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="z-30 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line bg-paper/90 px-4 py-2.5 backdrop-blur">
          <div className="min-w-0">
            <p className="hidden font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-mute sm:block">SIMASET / RS Harapan Medika</p>
            <h2 className="truncate font-display text-[15px] font-black tracking-tight text-ink">{TITLES[s.view]}</h2>
          </div>

          <div className="relative order-last w-full min-w-0 sm:order-none sm:ml-auto sm:w-auto sm:max-w-[300px] sm:flex-1">
            <IcSearch size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
            <input ref={searchRef} value={s.searchQuery} onChange={(e) => search(e.target.value)}
              placeholder="Cari aset, kode, serial…  ( / )"
              className="w-full rounded-md border border-line bg-canvas py-2 pl-8 pr-8 text-[12.5px] text-ink outline-none transition placeholder:text-mute/70 focus:border-pine-500 focus:bg-card focus:ring-2 focus:ring-pine-500/20" />
            {s.searchQuery && (
              <button onClick={() => search("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-mute hover:text-ink"><IcClose size={13} /></button>
            )}
          </div>

          <Clock />
          <NotifBell />

          <button onClick={() => setRegOpen(true)}
            className="hidden shrink-0 items-center gap-1.5 rounded-md bg-pine-700 px-3 py-2 font-display text-[12px] font-bold tracking-tight text-pine-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition hover:bg-pine-800 active:translate-y-px md:flex">
            <IcPlus size={13} /> Registrasi Aset
          </button>

          <div className="hidden items-center gap-1.5 rounded-md border border-line bg-card px-2.5 py-1.5 lg:flex">
            <IcUser size={13} className="text-pine-600" />
            <span className="font-mono text-[10.5px] font-bold text-ink2">{s.role}</span>
          </div>
        </header>



        <main className="ops-bg flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1240px] p-4 pb-28 sm:pb-6 lg:p-6 lg:pb-8" key={s.view + (s.eqId ?? "")}>
            {s.view === "dashboard" && <Dashboard />}
            {s.view === "equipment" && <EquipmentList />}
            {s.view === "equipment-detail" && <EquipmentDetail />}
            {s.view === "inventory" && <Inventory />}
            {s.view === "logistics" && <Logistics />}
            {s.view === "opname" && <Opname />}
            {s.view === "technical" && <Maintenance />}
            {s.view === "complaints" && <Complaints />}
            {s.view === "procurement" && <Procurement />}
            {s.view === "reporting" && <Reporting />}
            {s.view === "master" && <MasterData />}
            {s.view === "locations" && <Locations />}
            {s.view === "approvals" && <Approvals />}
            {s.view === "audit" && <AuditTrail />}
            {s.view === "rbac" && <Rbac />}
            {s.view === "utilization" && <Utilization />}
            {s.view === "rental" && <RentalLoan />}
            {s.view === "depreciation" && <Depreciation />}
            {s.view === "intelligence" && <Intelligence />}
            {s.view === "mobile" && <Mobile />}
            {s.view === "disposal" && <Disposal />}
            {s.view === "integrations" && <Integrations />}
            {s.view === "notifications" && <NotificationCenter />}
            {s.view === "assetledger" && <AssetLedger />}
            {s.view === "config" && <Config />}
            {s.view === "command" && <Command />}
            {s.view === "compliance" && <ComplianceView />}
            {s.view === "formbuilder" && <FormBuilder />}
            {s.view === "reliability" && <Reliability />}
            {s.view === "eventbus" && <EventBus />}
          </div>
          <footer className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-2 px-4 pb-5 lg:px-6">
            <p className="font-mono text-[10px] text-mute">SIMASET v7.0 · PRD 18 Aug 2026 · Phase 1–7 complete · Command Center · Security & Compliance · multi-branch ready</p>
            <p className="flex items-center gap-1.5 font-mono text-[10px] text-mute"><IcPhone size={11} className="text-pine-600" /> Mobile/PWA: offline queue + QR scan <span className="mx-1 text-line2">·</span> <IcWarn size={11} className="text-warnhi" /> API p95 &lt; 500ms · availability 99,9%</p>
          </footer>
        </main>
      </div>

      {/* ── mobile bottom tab bar ── */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-pine-800 bg-pine-900/95 backdrop-blur-md md:hidden">
        <div className="grid grid-cols-5">
          {[
            { id: "command" as View | "MORE", label: "Command", icon: <IcGauge size={18} /> },
            { id: "dashboard" as View | "MORE", label: "Pantau", icon: <IcPulse size={18} /> },
            { id: "equipment" as View | "MORE", label: "Aset", icon: <IcScan size={18} /> },
            { id: "approvals" as View | "MORE", label: "Setuju", icon: <IcStamp size={18} />, badge: pending },
            { id: "MORE" as View | "MORE", label: "Lainnya", icon: <IcLayers size={18} /> },
          ].map((t) => {
            const isMore = t.id === "MORE";
            const isActive = isMore ? !["command", "dashboard", "equipment", "approvals"].includes(s.view) : s.view === t.id || (t.id === "equipment" && s.view === "equipment-detail");
            return (
              <button key={t.id} onClick={() => (isMore ? setMenuOpen(true) : nav(t.id as View))}
                className={`tap-scale relative flex flex-col items-center gap-0.5 py-2 transition ${isActive ? "text-warnhi" : "text-pine-100/60"}`}>
                {isActive && <span className="absolute top-0 h-0.5 w-8 rounded-b bg-warnhi" />}
                {t.icon}
                <span className="font-display text-[9.5px] font-bold tracking-tight">{t.label}</span>
                {!!t.badge && t.badge > 0 && (
                  <span className="absolute right-1/2 top-1 -mr-4 rounded-full bg-warnhi px-1 font-mono text-[8.5px] font-bold leading-[13px] text-pine-950">{t.badge}</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── mobile "semua modul" sheet ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setMenuOpen(false)}>
          <div className="fade-in absolute inset-0 bg-pine-950/60 backdrop-blur-[2px]" />
          <div className="sheet-up safe-bottom absolute inset-x-0 bottom-0 max-h-[86vh] overflow-y-auto rounded-t-2xl border-t border-line bg-paper shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 border-b border-line bg-paper/95 px-4 pb-2 pt-2.5 backdrop-blur">
              <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-line2" />
              <div className="flex items-center justify-between">
                <p className="font-display text-[15px] font-black tracking-tight text-ink">Semua Modul</p>
                <button onClick={() => setMenuOpen(false)} className="rounded-md p-1.5 text-mute transition hover:bg-moss hover:text-ink"><IcClose size={16} /></button>
              </div>
              <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1">
                {ROLES.map((r) => (
                  <button key={r} onClick={() => setRole(r)}
                    className={`shrink-0 rounded-full border px-3 py-1.5 font-display text-[11px] font-bold transition ${s.role === r ? "border-pine-600 bg-pine-700 text-pine-50" : "border-line bg-card text-ink2"}`}>{r}</button>
                ))}
              </div>
            </div>
            <div className="space-y-4 px-4 py-4">
              <button onClick={() => { setMenuOpen(false); setRegOpen(true); }}
                className="tap-scale flex w-full items-center justify-center gap-1.5 rounded-lg bg-pine-700 py-3 font-display text-[13px] font-bold text-pine-50 active:bg-pine-800">
                <IcPlus size={14} /> Registrasi Aset Baru
              </button>
              {NAV.map((g) => (
                <div key={g.group}>
                  <p className="mb-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-mute">{g.group}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {g.items.map((it) => (
                      <button key={it.id} onClick={() => { nav(it.id); setMenuOpen(false); }}
                        className={`tap-scale flex items-center gap-2 rounded-lg border px-2.5 py-2.5 text-left transition ${s.view === it.id ? "border-pine-500/60 bg-pine-50 text-pine-700" : "border-line bg-card text-ink2"}`}>
                        <span className={s.view === it.id ? "text-pine-600" : "text-mute"}>{it.icon}</span>
                        <span className="min-w-0 flex-1 truncate font-display text-[11.5px] font-bold">{it.label}</span>
                        {!!it.badge && it.badge > 0 && <span className="rounded bg-warnhi px-1 font-mono text-[9px] font-bold text-pine-950">{it.badge}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <p className="pt-1 text-center font-mono text-[9.5px] text-mute">SIMASET v7.0 · sesi: {s.role}</p>
            </div>
          </div>
        </div>
      )}

      <ToastHost />
      <RegisterModal open={regOpen} onClose={() => setRegOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
