import { useEffect, useState, type ReactNode } from "react";
import { StoreProvider, canSeeView, useApp } from "./lib/store";
import { View, initialsOf, ROLE_SCOPE } from "./lib/types";
import { Chip, ToastHost } from "./components/ui";
import {
  LayoutDashboard, ScanLine, PackageSearch, ShoppingCart, Wrench, MapPin, ClipboardCheck, ShieldCheck,
  Users, Stethoscope, Cog, Bell, LogOut, Menu, X, Building2,
} from "lucide-react";
import Login from "./views/Login";
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

const TITLES: Record<View, string> = {
  login: "Masuk",
  dashboard: "Dasbor Utama",
  equipment: "Aset Medis 360°", "equipment-detail": "Aset Medis 360°",
  inventory: "Stok & Buku Besar", procurement: "Pengadaan Barang", maintenance: "Perawatan & Kalibrasi",
  locations: "Lokasi & Organisasi", approvals: "Pusat Persetujuan", audit: "Riwayat Audit",
  rbac: "Peran & Akses Pengguna", master: "Data Induk", config: "Pengaturan Sistem",
};

function Shell() {
  const { s, nav, logout, markNotifsRead } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const pendingPr = s.purchaseRequests.filter((p) => p.status === "IN_APPROVAL").length;
  const unread = s.notifs.filter((n) => !n.read).length;

  const NAV: { group: string; items: { id: View; label: string; icon: ReactNode; badge?: number }[] }[] = [
    { group: "Pantau", items: [
      { id: "dashboard", label: "Dasbor", icon: <LayoutDashboard size={15} /> },
    ]},
    { group: "Aset", items: [
      { id: "equipment", label: "Aset Medis 360°", icon: <ScanLine size={15} /> },
      { id: "locations", label: "Lokasi & Organisasi", icon: <MapPin size={15} /> },
    ]},
    { group: "Inventori & Pengadaan", items: [
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
    { group: "Induk & Pengaturan", items: [
      { id: "master", label: "Data Induk", icon: <Stethoscope size={15} /> },
      { id: "config", label: "Pengaturan Sistem", icon: <Cog size={15} /> },
    ]},
  ];

  /* ── filter menu sesuai hak akses role (RBAC) ── */
  const visibleNav = NAV
    .map((g) => ({ ...g, items: g.items.filter((it) => canSeeView(s.role, it.id)) }))
    .filter((g) => g.items.length > 0);
  const visibleCount = visibleNav.reduce((x, g) => x + g.items.length, 0);

  const allTabs: { id: View; label: string; icon: ReactNode; badge?: number }[] = [
    { id: "dashboard", label: "Pantau", icon: <LayoutDashboard size={18} /> },
    { id: "equipment", label: "Aset", icon: <ScanLine size={18} /> },
    { id: "procurement", label: "Beli", icon: <ShoppingCart size={18} />, badge: pendingPr },
    { id: "maintenance", label: "Teknis", icon: <Wrench size={18} /> },
    { id: "inventory", label: "Stok", icon: <PackageSearch size={18} /> },
    { id: "approvals", label: "Setuju", icon: <ClipboardCheck size={18} />, badge: pendingPr },
  ];
  const mobileTabs = allTabs.filter((t) => canSeeView(s.role, t.id)).slice(0, 4);

  useEffect(() => { document.title = `${TITLES[s.view]} · SIMASET`; }, [s.view]);

  if (!s.loggedIn) return <Login />;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── sidebar desktop ── */}
      <aside className="dark-grain hidden w-[232px] shrink-0 flex-col border-r border-pine-800 md:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-pine-700 bg-pine-950">
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
              <path d="M16 7v18M7 16h18" stroke="#F2A93B" strokeWidth="3.4" strokeLinecap="round" />
              <circle cx="16" cy="16" r="12.2" stroke="#2E8B72" strokeWidth="2.2" />
            </svg>
          </span>
          <div>
            <p className="font-display text-[15px] font-black leading-none tracking-tight text-pine-50">SIMASET</p>
            <p className="mt-0.5 font-mono text-[7.5px] font-semibold uppercase tracking-[0.16em] text-pine-500">Aset Rumah Sakit</p>
          </div>
        </div>

        <div className="mx-4 mb-3 rounded-md border border-pine-800 bg-pine-950/50 px-2.5 py-2">
          <p className="font-mono text-[8px] font-bold uppercase tracking-widest text-pine-500">Hak akses aktif</p>
          <p className="mt-0.5 font-mono text-[9.5px] text-pine-100/80">{visibleCount} modul · {s.role}</p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-3">
          {visibleNav.map((g) => (
            <div key={g.group} className="mb-3">
              <p className="px-2 pb-1 font-mono text-[8.5px] font-bold uppercase tracking-[0.16em] text-pine-500">{g.group}</p>
              <div className="space-y-0.5">
                {g.items.map((it) => {
                  const active = s.view === it.id || (it.id === "equipment" && s.view === "equipment-detail");
                  return (
                    <button key={it.id} onClick={() => nav(it.id)}
                      className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition ${active ? "bg-pine-700 text-pine-50 shadow-inner" : "text-pine-100/70 hover:bg-pine-800/70 hover:text-pine-50"}`}>
                      {it.icon}
                      <span className="flex-1 truncate font-display text-[12px] font-bold tracking-tight">{it.label}</span>
                      {!!it.badge && it.badge > 0 && <span className="rounded bg-warnhi px-1.5 font-mono text-[9px] font-bold leading-[15px] text-pine-950">{it.badge}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-pine-800 p-3">
          <div className="flex items-center gap-2.5 rounded-md bg-pine-950/50 px-2.5 py-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pine-700 font-display text-[10px] font-black text-pine-50">{initialsOf(s.userName)}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11.5px] font-bold text-pine-50">{s.userName}</p>
              <p className="truncate font-mono text-[8.5px] uppercase text-pine-500">{s.role}{s.userUnit ? ` · ${s.userUnit}` : ""}</p>
            </div>
            <button onClick={logout} title="Keluar" className="rounded p-1.5 text-pine-100/60 transition hover:bg-pine-800 hover:text-warnhi"><LogOut size={14} /></button>
          </div>
        </div>
      </aside>

      {/* ── konten ── */}
      <div className="ops-bg flex min-w-0 flex-1 flex-col">
        {/* topbar */}
        <header className="flex items-center gap-3 border-b border-line bg-paper/80 px-4 py-3 backdrop-blur md:px-6">
          <button onClick={() => setMenuOpen(true)} className="rounded-md p-1.5 text-ink2 transition hover:bg-moss md:hidden"><Menu size={18} /></button>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-[15px] font-black tracking-tight text-ink">{TITLES[s.view]}</h2>
            <p className="hidden font-mono text-[9px] text-mute sm:block">{ROLE_SCOPE[s.role]}</p>
          </div>

          {/* notifikasi */}
          <div className="relative">
            <button onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false); }} className="relative rounded-md p-2 text-ink2 transition hover:bg-moss">
              <Bell size={17} />
              {unread > 0 && <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger font-mono text-[8.5px] font-bold text-white">{unread}</span>}
            </button>
            {notifOpen && (
              <div className="modal-in absolute right-0 top-11 z-40 w-[340px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-line bg-paper shadow-2xl">
                <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
                  <p className="font-display text-[12.5px] font-extrabold text-ink">Notifikasi</p>
                  <button onClick={markNotifsRead} className="font-mono text-[9.5px] font-bold text-pine-700 hover:text-pine-600">tandai dibaca</button>
                </div>
                <div className="max-h-[320px] overflow-y-auto">
                  {s.notifs.length === 0 && <p className="px-3.5 py-6 text-center text-[11px] text-mute">Tidak ada notifikasi.</p>}
                  {s.notifs.map((n) => (
                    <div key={n.id} className={`border-b border-line/60 px-3.5 py-2.5 ${n.read ? "opacity-60" : ""}`}>
                      <p className="text-[11.5px] font-semibold leading-snug text-ink">{n.msg}</p>
                      <p className="mt-0.5 font-mono text-[8.5px] text-mute">{n.kind} · {n.refId}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* user */}
          <div className="relative">
            <button onClick={() => { setUserOpen(!userOpen); setNotifOpen(false); }} className="flex items-center gap-2 rounded-md border border-line bg-card px-2.5 py-1.5 transition hover:border-pine-500/50">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-pine-700 font-display text-[9.5px] font-black text-pine-50">{initialsOf(s.userName)}</span>
              <span className="hidden text-left sm:block">
                <span className="block text-[11px] font-bold leading-tight text-ink">{s.userName}</span>
                <span className="block font-mono text-[8.5px] uppercase text-mute">{s.role}</span>
              </span>
            </button>
            {userOpen && (
              <div className="modal-in absolute right-0 top-11 z-40 w-[280px] overflow-hidden rounded-lg border border-line bg-paper shadow-2xl">
                <div className="border-b border-line px-3.5 py-2.5">
                  <p className="text-[12.5px] font-bold text-ink">{s.userName}</p>
                  <p className="font-mono text-[9px] uppercase text-mute">{s.role}{s.userUnit ? ` · ${s.userUnit}` : ""}</p>
                  <p className="mt-1 font-mono text-[8.5px] text-mute">{ROLE_SCOPE[s.role]}</p>
                </div>
                <button onClick={() => nav("rbac")} className="block w-full px-3.5 py-2.5 text-left text-[11.5px] font-semibold text-ink2 transition hover:bg-pine-50">Ganti user (simulasi)</button>
                <button onClick={logout} className="flex w-full items-center gap-2 border-t border-line px-3.5 py-2.5 text-left text-[11.5px] font-bold text-danger transition hover:bg-dangerbg/50"><LogOut size={13} /> Keluar</button>
              </div>
            )}
          </div>
        </header>

        {/* area konten */}
        <main className="flex-1 overflow-y-auto px-4 py-4 pb-28 md:px-6 md:pb-6">
          {s.view === "dashboard" && <Dashboard />}
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
        </main>
      </div>

      {/* ── bottom nav mobile ── */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-pine-800 bg-pine-900/95 backdrop-blur-md md:hidden">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${mobileTabs.length + 1}, 1fr)` }}>
          {mobileTabs.map((t) => {
            const active = s.view === t.id || (t.id === "equipment" && s.view === "equipment-detail");
            return (
              <button key={t.id} onClick={() => nav(t.id)} className={`relative flex flex-col items-center gap-0.5 py-2 transition ${active ? "text-warnhi" : "text-pine-100/60"}`}>
                {active && <span className="absolute top-0 h-0.5 w-8 rounded-b bg-warnhi" />}
                {t.icon}
                <span className="font-display text-[9.5px] font-bold tracking-tight">{t.label}</span>
                {!!t.badge && t.badge > 0 && <span className="absolute right-1/2 top-1 -mr-4 rounded-full bg-warnhi px-1 font-mono text-[8px] font-bold leading-[13px] text-pine-950">{t.badge}</span>}
              </button>
            );
          })}
          <button onClick={() => setMenuOpen(true)} className="flex flex-col items-center gap-0.5 py-2 text-pine-100/60 transition hover:text-pine-50">
            <Menu size={18} />
            <span className="font-display text-[9.5px] font-bold tracking-tight">Lainnya</span>
          </button>
        </div>
      </nav>

      {/* ── sheet "Lainnya" mobile ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setMenuOpen(false)}>
          <div className="fade-in absolute inset-0 bg-pine-950/60 backdrop-blur-[2px]" />
          <div className="sheet-up safe-bottom absolute inset-x-0 bottom-0 max-h-[86vh] overflow-y-auto rounded-t-2xl border-t border-line bg-paper shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 border-b border-line bg-paper/95 px-4 pb-2 pt-2.5 backdrop-blur">
              <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-line2" />
              <div className="flex items-center justify-between">
                <p className="font-display text-[15px] font-black tracking-tight text-ink">Semua Modul</p>
                <button onClick={() => setMenuOpen(false)} className="rounded-md p-1.5 text-mute transition hover:bg-moss hover:text-ink"><X size={16} /></button>
              </div>
              <p className="mt-1 font-mono text-[9px] text-mute">Masuk sebagai <b className="text-pine-700">{s.userName}</b> · {s.role} · {visibleCount} modul</p>
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
              <button onClick={() => { setMenuOpen(false); logout(); }} className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-danger/40 py-3 font-display text-[13px] font-bold text-danger transition hover:bg-dangerbg/50">
                <LogOut size={14} /> Keluar ({s.userName.split(" ")[0]})
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastHost />
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
