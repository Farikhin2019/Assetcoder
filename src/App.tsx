import { useState, type ReactNode } from "react";
import { canSeeView, StoreProvider, useApp } from "./lib/store";
import { ToastHost } from "./components/ui";
import { View, initialsOf } from "./lib/types";
import LoginScreen from "./views/Login";
import Dashboard from "./views/Dashboard";
import Equipment from "./views/Equipment";
import Inventory from "./views/Inventory";
import Procurement from "./views/Procurement";
import Maintenance from "./views/Maintenance";
import Locations from "./views/Locations";
import Approvals from "./views/Approvals";
import Audit from "./views/Audit";
import Rbac from "./views/Rbac";
import MasterData from "./views/MasterData";
import Config from "./views/Config";
import {
  Bell, ClipboardCheck, Cog, LayoutDashboard, LogOut, MapPin, PackageSearch, ScanLine,
  ShieldCheck, ShoppingCart, Stethoscope, Users, Wrench, X, Layers, Search,
} from "lucide-react";

const TITLES: Record<View, string> = {
  login: "Masuk", command: "Pusat Kendali", dashboard: "Dasbor Utama",
  equipment: "Aset Medis 360°", "equipment-detail": "Aset Medis 360°",
  inventory: "Stok & Buku Besar", procurement: "Pengadaan Barang", maintenance: "Perawatan & Kalibrasi",
  locations: "Lokasi & Organisasi", approvals: "Pusat Persetujuan", audit: "Riwayat Audit",
  rbac: "Peran & Akses Pengguna", master: "Data Induk", config: "Pengaturan Sistem",
};

function Clock() {
  return null;
}

function Shell() {
  const { s, nav, logout } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const pendingPr = s.purchaseRequests.filter((p) => p.status === "IN_APPROVAL").length;

  const NAV: { group: string; items: { id: View; label: string; icon: ReactNode; badge?: number }[] }[] = [
    { group: "Pantauan", items: [
      { id: "dashboard", label: "Dasbor Utama", icon: <LayoutDashboard size={15} /> },
    ]},
    { group: "Aset", items: [
      { id: "equipment", label: "Aset Medis 360°", icon: <ScanLine size={15} /> },
      { id: "locations", label: "Lokasi & Organisasi", icon: <MapPin size={15} /> },
    ]},
    { group: "Stok & Pengadaan", items: [
      { id: "inventory", label: "Stok & Buku Besar", icon: <PackageSearch size={15} /> },
      { id: "procurement", label: "Pengadaan Barang", icon: <ShoppingCart size={15} />, badge: pendingPr },
    ]},
    { group: "Teknis", items: [
      { id: "maintenance", label: "Perawatan & Kalibrasi", icon: <Wrench size={15} /> },
    ]},
    { group: "Tata Kelola", items: [
      { id: "approvals", label: "Pusat Persetujuan", icon: <ClipboardCheck size={15} />, badge: pendingPr },
      { id: "audit", label: "Riwayat Audit", icon: <ShieldCheck size={15} /> },
      { id: "rbac", label: "Peran & Akses", icon: <Users size={15} /> },
    ]},
    { group: "Data Induk", items: [
      { id: "master", label: "Data Induk", icon: <Stethoscope size={15} /> },
      { id: "config", label: "Pengaturan Sistem", icon: <Cog size={15} /> },
    ]},
  ];

  /* ── filter menu sesuai hak akses role (RBAC) ── */
  const visibleNav = NAV
    .map((g) => ({ ...g, items: g.items.filter((it) => canSeeView(s.role, it.id)) }))
    .filter((g) => g.items.length > 0);
  const visibleCount = visibleNav.reduce((x, g) => x + g.items.length, 0);

  const allTabs: { id: View | "MORE"; label: string; icon: ReactNode; badge?: number }[] = [
    { id: "dashboard", label: "Pantau", icon: <LayoutDashboard size={18} /> },
    { id: "equipment", label: "Aset", icon: <ScanLine size={18} /> },
    { id: "procurement", label: "Beli", icon: <ShoppingCart size={18} />, badge: pendingPr },
    { id: "maintenance", label: "Teknis", icon: <Wrench size={18} /> },
    { id: "inventory", label: "Stok", icon: <PackageSearch size={18} /> },
    { id: "approvals", label: "Setuju", icon: <ClipboardCheck size={18} />, badge: pendingPr },
  ];
  const mobileTabs = allTabs.filter((t) => t.id !== "MORE" && canSeeView(s.role, t.id as View)).slice(0, 4);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── sidebar desktop ── */}
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

        <p className="mx-4 mb-2 rounded-md border border-pine-800 bg-pine-950/50 px-2.5 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-pine-500">
          Hak akses aktif · {visibleCount} modul
        </p>

        <nav className="flex-1 overflow-y-auto px-2.5 pb-3">
          {visibleNav.map((g) => (
            <div key={g.group} className="mb-3">
              <p className="px-2 pb-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-pine-500/80">{g.group}</p>
              {g.items.map((it) => (
                <button key={it.id} onClick={() => nav(it.id)}
                  className={`group mb-0.5 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[12.5px] font-semibold transition ${s.view === it.id ? "bg-pine-700 text-pine-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" : "text-pine-100/60 hover:bg-pine-800/70 hover:text-pine-100"}`}>
                  <span className={s.view === it.id ? "text-warnhi" : "text-pine-500 group-hover:text-pine-100"}>{it.icon}</span>
                  <span className="flex-1 font-display tracking-tight">{it.label}</span>
                  {it.badge !== undefined && it.badge > 0 && (
                    <span className="rounded bg-warnhi px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-pine-950">{it.badge}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* user card + logout */}
        <div className="border-t border-pine-800 p-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pine-700 font-display text-[10.5px] font-black text-pine-50">{initialsOf(s.userName)}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11.5px] font-bold text-pine-100">{s.userName}</span>
              <span className="block font-mono text-[9px] uppercase tracking-wider text-warnhi">{s.role}{s.userUnit ? ` · ${s.userUnit}` : ""}</span>
            </span>
            <button onClick={logout} title="Keluar" className="rounded-md border border-pine-700 p-1.5 text-pine-100/70 transition hover:bg-pine-800 hover:text-warnhi"><LogOut size={14} /></button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* ── topbar ── */}
        <header className="z-30 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line bg-paper/90 px-4 py-2.5 backdrop-blur">
          <div className="min-w-0">
            <p className="hidden font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-mute sm:block">SIMASET / RS Harapan Medika</p>
            <h2 className="truncate font-display text-[15px] font-black tracking-tight text-ink">{TITLES[s.view]}</h2>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* user chip + dropdown (mobile & desktop) */}
            <div className="relative">
              <button onClick={() => setUserOpen(!userOpen)} className="flex items-center gap-2 rounded-md border border-line bg-card px-2.5 py-1.5 transition hover:border-pine-500/50">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pine-700 font-display text-[9px] font-black text-pine-50">{initialsOf(s.userName)}</span>
                <span className="hidden font-mono text-[10.5px] font-bold text-ink2 sm:block">{s.role}</span>
              </button>
              {userOpen && (
                <div className="modal-in absolute right-0 top-full z-40 mt-1.5 w-56 overflow-hidden rounded-lg border border-line bg-paper shadow-2xl">
                  <p className="border-b border-line bg-canvas/60 px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-mute">Ganti user (RBAC demo)</p>
                  <div className="max-h-64 overflow-y-auto">
                    {s.users.filter((u) => u.active).map((u) => (
                      <UserSwitchRow key={u.id} id={u.id} name={u.name} role={u.role} unit={u.unit} active={u.id === s.userId} onDone={() => setUserOpen(false)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button onClick={logout} className="flex items-center gap-1.5 rounded-md border border-line bg-card px-2.5 py-1.5 font-display text-[11px] font-bold text-ink2 transition hover:border-danger/50 hover:text-danger">
              <LogOut size={13} /> <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </header>

        <main className="ops-bg flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1240px] p-4 pb-28 sm:pb-6 lg:p-6 lg:pb-8" key={s.view + (s.eqId ?? "")}>
            {s.view === "dashboard" && <Dashboard />}
            {s.view === "command" && <Dashboard />}
            {(s.view === "equipment" || s.view === "equipment-detail") && <Equipment />}
            {s.view === "inventory" && <Inventory />}
            {s.view === "procurement" && <Procurement />}
            {s.view === "maintenance" && <Maintenance />}
            {s.view === "locations" && <Locations />}
            {s.view === "approvals" && <Approvals />}
            {s.view === "audit" && <Audit />}
            {s.view === "rbac" && <Rbac />}
            {s.view === "master" && <MasterData />}
            {s.view === "config" && <Config />}
          </div>
        </main>
      </div>

      {/* ── mobile bottom tab bar ── */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-pine-800 bg-pine-900/95 backdrop-blur-md md:hidden">
        <div className={`grid`} style={{ gridTemplateColumns: `repeat(${mobileTabs.length + 1}, 1fr)` }}>
          {mobileTabs.map((t) => {
            const isActive = s.view === t.id || (t.id === "equipment" && s.view === "equipment-detail");
            return (
              <button key={t.id} onClick={() => nav(t.id as View)}
                className={`relative flex flex-col items-center gap-0.5 py-2 transition ${isActive ? "text-warnhi" : "text-pine-100/60"}`}>
                {isActive && <span className="absolute top-0 h-0.5 w-8 rounded-b bg-warnhi" />}
                {t.icon}
                <span className="font-display text-[9.5px] font-bold tracking-tight">{t.label}</span>
                {!!t.badge && t.badge > 0 && (
                  <span className="absolute right-1/2 top-1 -mr-4 rounded-full bg-warnhi px-1 font-mono text-[8.5px] font-bold leading-[13px] text-pine-950">{t.badge}</span>
                )}
              </button>
            );
          })}
          <button onClick={() => setMenuOpen(true)} className="flex flex-col items-center gap-0.5 py-2 text-pine-100/60">
            <Layers size={18} />
            <span className="font-display text-[9.5px] font-bold tracking-tight">Lainnya</span>
          </button>
        </div>
      </nav>

      {/* ── mobile sheet ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setMenuOpen(false)}>
          <div className="fade-in absolute inset-0 bg-pine-950/60 backdrop-blur-[2px]" />
          <div className="sheet-up safe-bottom absolute inset-x-0 bottom-0 max-h-[86vh] overflow-y-auto rounded-t-2xl border-t border-line bg-paper shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 border-b border-line bg-paper/95 px-4 pb-2 pt-2.5 backdrop-blur">
              <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-line2" />
              <div className="flex items-center justify-between">
                <p className="font-display text-[15px] font-black tracking-tight text-ink">Semua Modul · {visibleCount}</p>
                <button onClick={() => setMenuOpen(false)} className="rounded-md p-1.5 text-mute transition hover:bg-moss hover:text-ink"><X size={16} /></button>
              </div>
              <p className="mt-1 font-mono text-[9.5px] uppercase tracking-wide text-mute">{s.userName} · {s.role}</p>
            </div>
            <div className="space-y-4 px-4 py-4">
              {visibleNav.map((g) => (
                <div key={g.group}>
                  <p className="mb-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-mute">{g.group}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {g.items.map((it) => (
                      <button key={it.id} onClick={() => { nav(it.id); setMenuOpen(false); }}
                        className={`flex items-center gap-2 rounded-lg border px-2.5 py-2.5 text-left transition ${s.view === it.id ? "border-pine-500/60 bg-pine-50 text-pine-700" : "border-line bg-card text-ink2"}`}>
                        <span className={s.view === it.id ? "text-pine-600" : "text-mute"}>{it.icon}</span>
                        <span className="min-w-0 flex-1 truncate font-display text-[11.5px] font-bold">{it.label}</span>
                        {!!it.badge && it.badge > 0 && <span className="rounded bg-warnhi px-1 font-mono text-[9px] font-bold text-pine-950">{it.badge}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={() => { setMenuOpen(false); logout(); }} className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-danger/40 bg-dangerbg py-2.5 font-display text-[12.5px] font-bold text-danger">
                <LogOut size={14} /> Keluar & ganti user
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastHost />
    </div>
  );
}

function UserSwitchRow({ id, name, role, unit, active, onDone }: { id: string; name: string; role: string; unit: string | null; active: boolean; onDone: () => void }) {
  const { login } = useApp();
  return (
    <button onClick={() => { login(id); onDone(); }}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-pine-50 ${active ? "bg-pine-50" : ""}`}>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-moss font-display text-[9px] font-black text-pine-700">{initialsOf(name)}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[11.5px] font-bold text-ink">{name}</span>
        <span className="block font-mono text-[8.5px] uppercase text-mute">{role}{unit ? ` · ${unit}` : ""}</span>
      </span>
      {active && <Bell size={11} className="text-pine-600" />}
    </button>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Gate />
    </StoreProvider>
  );
}

function Gate() {
  const { s } = useApp();
  if (!s.loggedIn) return <LoginScreen />;
  return <Shell />;
}
