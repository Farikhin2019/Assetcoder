import { useState } from "react";
import { useApp } from "../lib/store";
import { Card, Chip, SectionHead, MonoTag, EmptyState, Input, BtnPrimary } from "../components/ui";
import { PERM_MODULES, ROLE_PERMS, ROLES, ROLE_SCOPE, initialsOf } from "../lib/types";
import { Check, Eye, Minus, UserPlus } from "lucide-react";

export default function Rbac() {
  const { s, login, toast } = useApp();
  const [filter, setFilter] = useState("");

  const shown = s.users.filter((u) => filter === "" || `${u.name} ${u.role} ${u.unit ?? ""}`.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Peran & Akses Pengguna</h1>
          <p className="text-xs text-mute">User → Peran → Izin → Cakupan data · klik user untuk masuk sebagai mereka (simulasi)</p>
        </div>
        <Chip tone="pine" dot>{s.users.length} user</Chip>
      </div>

      <Card className="p-4">
        <SectionHead title="Daftar user" sub="Klik untuk masuk sebagai user tersebut"
          right={<Input placeholder="Cari user…" value={filter} onChange={(e) => setFilter(e.target.value)} className="!w-52" />} />
        {shown.length === 0 ? <EmptyState title="Tidak ada user cocok" /> : (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
            {shown.map((u) => (
              <button key={u.id} onClick={() => login(u.id)} className="row-in group flex items-center gap-3 rounded-lg border border-line bg-paper p-3 text-left transition hover:-translate-y-0.5 hover:border-pine-500/50 hover:shadow-lg">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-moss font-display text-[12px] font-black text-pine-700 group-hover:bg-pine-100">{initialsOf(u.name)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold text-ink">{u.name}</span>
                  <span className="block font-mono text-[9.5px] uppercase tracking-wide text-mute">{u.role}{u.unit ? ` · ${u.unit}` : ""}</span>
                  <span className="mt-0.5 block truncate font-mono text-[9px] text-mute">{ROLE_SCOPE[u.role]}</span>
                </span>
                {s.userId === u.id && <Chip tone="pine" dot>Anda</Chip>}
              </button>
            ))}
          </div>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <SectionHead title="Matriks izin" sub={`${PERM_MODULES.length} modul × ${ROLES.length} peran`} />
          <div className="flex gap-3 font-mono text-[9.5px] text-mute">
            <span className="flex items-center gap-1"><Check size={11} className="text-ok" /> penuh</span>
            <span className="flex items-center gap-1"><Eye size={11} className="text-info" /> baca</span>
            <span className="flex items-center gap-1"><Minus size={11} /> tanpa akses</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead>
              <tr className="border-b border-line bg-canvas/70">
                <th className="sticky left-0 z-10 bg-canvas px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">Modul</th>
                {ROLES.map((r) => (
                  <th key={r} className={`px-2 py-2.5 text-center font-mono text-[9px] font-semibold uppercase tracking-wide ${r === s.role ? "bg-pine-100/70 text-pine-800" : "text-mute"}`}>{r.split(" ")[0]}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {PERM_MODULES.map((mod) => (
                <tr key={mod} className="transition hover:bg-pine-50/50">
                  <td className="sticky left-0 z-10 bg-card px-4 py-2 text-[12px] font-bold text-ink">{mod}</td>
                  {ROLES.map((r) => {
                    const lv = ROLE_PERMS[r][PERM_MODULES.indexOf(mod)];
                    return (
                      <td key={r} className={`px-2 py-2 text-center ${r === s.role ? "bg-pine-100/40" : ""}`}>
                        {lv === "full" ? <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-pine-600 text-white"><Check size={11} /></span>
                          : lv === "view" ? <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-line2 bg-card text-info"><Eye size={10} /></span>
                          : <span className="inline-block h-0.5 w-3 rounded bg-line2 align-middle" />}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card className="p-4">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">Cakupan organisasi</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink2">RS Harapan Medika (multi-cabang siap). Petugas Gudang hanya melihat <MonoTag>Gudang BHP Medis</MonoTag> — cakupan diterapkan di lapisan query.</p>
        </Card>
        <Card className="p-4">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">Keamanan minimum</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink2">Login + RBAC + sesi, kebijakan kata sandi, <b>siap MFA</b>, riwayat audit imutabel, enkripsi, pembatasan laju API.</p>
        </Card>
        <Card className="p-4">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">Berlaku nyata di aplikasi ini</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink2">Masuk sebagai <MonoTag>Teknisi</MonoTag> → menu Pengadaan disembunyikan; <MonoTag>Auditor</MonoTag> → semua aksi tulis terkunci.</p>
        </Card>
      </div>
    </div>
  );
}
