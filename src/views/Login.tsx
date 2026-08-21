import { useState, type ReactNode } from "react";
import { canSeeView, useApp } from "../lib/store";
import { initialsOf, ROLE_SCOPE, View, VIEW_PERM } from "../lib/types";
import { ToastHost } from "../components/ui";
import { ArrowRight, Building2, Check, ClipboardCheck, Cpu, ScanLine, SearchCheck, ShieldCheck, User } from "lucide-react";

const ALL_VIEWS = Object.keys(VIEW_PERM) as View[];
const countModules = (role: string) => ALL_VIEWS.filter((v) => VIEW_PERM[v] >= 0 && canSeeView(role as never, v)).length;

const GROUPS: { label: string; icon: ReactNode; tone: string; roles: string[] }[] = [
  { label: "Eksekutif & Persetujuan", icon: <ShieldCheck size={13} />, tone: "text-warnhi", roles: ["Direksi", "COO", "Finance"] },
  { label: "Umum, Aset & Gudang", icon: <Building2 size={13} />, tone: "text-pine-500", roles: ["Umum", "Pengelola Aset", "Pengelola Inventory", "Kepala Gudang", "Petugas Gudang"] },
  { label: "Unit Peminta", icon: <User size={13} />, tone: "text-info", roles: ["Kepala Unit"] },
  { label: "Teknis & IT", icon: <Cpu size={13} />, tone: "text-danger", roles: ["Kepala Teknisi", "Teknisi", "IT Administrator"] },
  { label: "Pengawasan", icon: <SearchCheck size={13} />, tone: "text-pine-500", roles: ["Auditor"] },
];

export default function LoginScreen() {
  const { s, login } = useApp();
  const [picked, setPicked] = useState<string | null>(null);
  const pickedUser = s.users.find((u) => u.id === picked);

  const stats = {
    aset: s.equipment.filter((e) => e.opStatus === "IN_SERVICE").length,
    approval: s.purchaseRequests.filter((p) => p.status === "IN_APPROVAL").length,
    wo: s.workOrders.filter((w) => w.status !== "CLOSED").length,
    kirim: s.deliveries.filter((d) => d.status !== "RECEIVED").length,
  };

  return (
    <div className="flex min-h-screen">
      {/* panel kiri */}
      <div className="dark-grain relative hidden w-[360px] shrink-0 flex-col overflow-hidden border-r border-pine-800 p-7 text-pine-50 lg:flex">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 overflow-hidden opacity-40">
          <div className="scanline h-full w-10 bg-gradient-to-r from-transparent via-pine-500/30 to-transparent" />
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-pine-700 bg-pine-950 shadow-inner">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <path d="M16 7v18M7 16h18" stroke="#F2A93B" strokeWidth="3.4" strokeLinecap="round" />
              <circle cx="16" cy="16" r="12.2" stroke="#2E8B72" strokeWidth="2.2" />
            </svg>
          </span>
          <div>
            <p className="font-display text-[20px] font-black leading-none tracking-tight">SIMASET</p>
            <p className="mt-1 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-pine-500">Hospital Asset Lifecycle OS</p>
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-pine-800 bg-pine-950/60 p-4">
          <div className="flex items-center gap-2">
            <ScanLine size={14} className="text-warnhi" />
            <p className="font-display text-[13.5px] font-extrabold">RS Harapan Medika</p>
          </div>
          <p className="mt-1 font-mono text-[9.5px] uppercase tracking-widest text-pine-500">Cabang Utama · single source of truth</p>
          <div className="mt-3.5 grid grid-cols-2 gap-2">
            {[
              { l: "Aset aktif", v: stats.aset }, { l: "Menunggu approval", v: stats.approval },
              { l: "WO berjalan", v: stats.wo }, { l: "Pengiriman aktif", v: stats.kirim },
            ].map((k) => (
              <div key={k.l} className="rounded-md border border-pine-800 bg-pine-900/60 px-2.5 py-2">
                <p className="num font-display text-[19px] font-black leading-none text-warnhi">{k.v}</p>
                <p className="mt-1 font-mono text-[8.5px] uppercase tracking-wider text-pine-100/60">{k.l}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-pine-500">Coba alur lengkap</p>
          <div className="mt-2.5 space-y-2">
            {[
              ["1", "Masuk sebagai Kepala Unit (mis. IGD)", "buat permintaan pengadaan"],
              ["2", "Pindah ke Umum → Keuangan → COO", "setujui 3 tahap (per barang)"],
              ["3", "Gudang menerima PO & mengirim", "GRN + distribusi ke unit"],
              ["4", "Unit konfirmasi terima", "lalu jadwalkan maintenance aset"],
            ].map(([n, t, sub]) => (
              <div key={n} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-pine-600 font-mono text-[9.5px] font-bold text-pine-500">{n}</span>
                <p className="text-[11.5px] leading-snug text-pine-100/85"><b className="text-pine-50">{t}</b><span className="block font-mono text-[9.5px] text-pine-100/50">{sub}</span></p>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-auto flex items-center gap-1.5 font-mono text-[9px] text-pine-100/50">
          <ClipboardCheck size={11} className="text-warnhi" /> RBAC aktif: menu & aksi menyesuaikan user yang masuk
        </p>
      </div>

      {/* panel kanan: pilih user */}
      <div className="ops-bg flex min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="mx-auto w-full max-w-[860px] flex-1 px-4 py-6 sm:px-6 sm:py-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-pine-600">Masuk ke sistem</p>
              <h1 className="mt-1 font-display text-[26px] font-black tracking-tight text-ink sm:text-[30px]">Pilih user Anda</h1>
              <p className="mt-1 max-w-[520px] text-[12.5px] text-mute">Setiap user membawa role & unit — menu sidebar dan aksi otomatis menyesuaikan hak aksesnya.</p>
            </div>
            <span className="rounded-md border border-line bg-card px-2.5 py-1.5 font-mono text-[10px] font-bold text-pine-700">{s.users.filter((u) => u.active).length} user aktif</span>
          </div>

          <div className="mt-6 space-y-5">
            {GROUPS.map((g, gi) => {
              const users = s.users.filter((u) => g.roles.includes(u.role) && u.active);
              if (users.length === 0) return null;
              return (
                <div key={g.label} className="row-in" style={{ animationDelay: `${gi * 70}ms` }}>
                  <p className={`mb-2 flex items-center gap-1.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.18em] ${g.tone}`}>{g.icon}{g.label}</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {users.map((u) => {
                      const isPicked = picked === u.id;
                      return (
                        <button key={u.id} onClick={() => (isPicked ? login(u.id) : setPicked(u.id))}
                          className={`group relative rounded-lg border p-3 text-left transition-all duration-200 ${isPicked ? "-translate-y-0.5 border-pine-600 bg-card shadow-xl ring-2 ring-pine-500/30" : "border-line bg-card hover:-translate-y-0.5 hover:border-pine-500/50 hover:shadow-lg"}`}>
                          <div className="flex items-center gap-2.5">
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-[11px] font-black transition ${isPicked ? "bg-pine-700 text-pine-50" : "bg-moss text-pine-700 group-hover:bg-pine-100"}`}>{initialsOf(u.name)}</span>
                            <span className="min-w-0">
                              <span className="block truncate text-[13px] font-bold text-ink">{u.name}</span>
                              <span className="block font-mono text-[9.5px] uppercase tracking-wide text-mute">{u.role}{u.unit ? ` · ${u.unit}` : ""}</span>
                            </span>
                            {isPicked && <Check size={14} className="ml-auto shrink-0 text-pine-600" />}
                          </div>
                          <div className="mt-2.5 flex items-center justify-between border-t border-line pt-2">
                            <span className="font-mono text-[9.5px] text-mute"><b className="text-pine-700">{countModules(u.role)}</b> modul tersedia</span>
                            <span className={`font-display text-[10.5px] font-bold transition ${isPicked ? "text-pine-700" : "text-mute group-hover:text-pine-600"}`}>{isPicked ? "Klik lagi untuk masuk" : "Lihat akses"}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {pickedUser && (
            <div className="modal-in sticky bottom-4 mt-6 rounded-xl border border-pine-600/50 bg-pine-900 p-4 text-pine-50 shadow-2xl">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-pine-700 font-display text-[12px] font-black">{initialsOf(pickedUser.name)}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[14px] font-extrabold">{pickedUser.name} <span className="font-mono text-[10px] font-semibold uppercase text-warnhi">· {pickedUser.role}{pickedUser.unit ? ` · ${pickedUser.unit}` : ""}</span></p>
                  <p className="mt-0.5 truncate font-mono text-[9.5px] text-pine-100/60">{ROLE_SCOPE[pickedUser.role]}</p>
                </div>
                <button onClick={() => login(pickedUser.id)}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg bg-warnhi px-4 py-2.5 font-display text-[13px] font-black tracking-tight text-pine-950 shadow-lg transition hover:brightness-105 active:translate-y-px">
                  Masuk <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          <p className="mt-6 text-center font-mono text-[9.5px] text-mute">Sesi tercatat di audit trail (SESSION.LOGIN) · password policy & MFA-ready (produksi)</p>
        </div>
      </div>

      <ToastHost />
    </div>
  );
}
