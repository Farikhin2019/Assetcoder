import { useApp } from "../lib/store";
import { Card, Chip, SectionHead, MonoTag } from "../components/ui";
import { PERM_MODULES, ROLE_PERMS, ROLE_SCOPE, ROLES, initialsOf } from "../lib/types";
import { Check, ShieldCheck, User as UserIcon } from "lucide-react";

export default function Rbac() {
  const { s, login } = useApp();
  const me = s.users.find((u) => u.id === s.userId);

  return (
    <div className="view-in space-y-4">
      <div>
        <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Peran & Akses (RBAC)</h1>
        <p className="text-xs text-mute">User → Role → Permission → Organization Scope → Data Scope · klik user untuk masuk sebagai mereka</p>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="dark-grain p-4 text-pine-50">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-pine-100/70">Sesi aktif</p>
          <div className="mt-2.5 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-pine-500/25 font-display text-[15px] font-black">{me ? initialsOf(me.name) : "—"}</span>
            <div>
              <p className="font-display text-[15px] font-extrabold">{me?.name ?? "—"}</p>
              <p className="font-mono text-[11px] text-pine-100/80">{s.role}{s.userUnit ? ` · ${s.userUnit}` : ""}</p>
            </div>
          </div>
          <p className="mt-3 rounded-md bg-pine-950/40 px-3 py-2 font-mono text-[10.5px] leading-relaxed text-pine-100/85">
            <span className="font-bold text-pine-50">Data scope:</span> {ROLE_SCOPE[s.role]}
          </p>
        </Card>

        <Card className="p-4 lg:col-span-2">
          <SectionHead title="Daftar user" sub="Klik untuk masuk sebagai user tersebut (simulasi sesi)" />
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {s.users.filter((u) => u.active).map((u) => (
              <button key={u.id} onClick={() => login(u.id)}
                className={`flex items-center gap-2 rounded-md border px-2.5 py-2 text-left transition ${s.userId === u.id ? "border-pine-600 bg-pine-50" : "border-line bg-card hover:border-pine-500/50"}`}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-moss font-display text-[10px] font-black text-pine-700">{initialsOf(u.name)}</span>
                <span className="min-w-0">
                  <span className="block truncate text-[11.5px] font-bold text-ink">{u.name}</span>
                  <span className="block truncate font-mono text-[9px] uppercase text-mute">{u.role}{u.unit ? ` · ${u.unit}` : ""}</span>
                </span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={15} className="text-pine-700" />
            <h2 className="font-display text-[14.5px] font-extrabold text-ink">Matrix izin — {PERM_MODULES.length} modul × {ROLES.length} role</h2>
          </div>
          <Chip tone="pine">config-driven · approval matrix terpisah</Chip>
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
              {PERM_MODULES.map((m, mi) => (
                <tr key={m} className="transition hover:bg-pine-50/50">
                  <td className="sticky left-0 z-10 bg-card px-4 py-2 text-[12px] font-bold text-ink">{m}</td>
                  {ROLES.map((r) => {
                    const lv = ROLE_PERMS[r][mi];
                    return (
                      <td key={r} className={`px-2 py-2 text-center ${r === s.role ? "bg-pine-100/40" : ""}`}>
                        {lv === "full" ? <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-pine-600 text-white shadow-sm"><Check size={11} /></span>
                          : lv === "view" ? <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-line2 bg-card text-pine-600"><UserIcon size={10} /></span>
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
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">Organization scope</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink2">RS Harapan Medika (multi-branch ready). Petugas Gudang hanya melihat <MonoTag>Gudang BHP Medis</MonoTag> — data scope di query layer.</p>
        </Card>
        <Card className="p-4">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">Security minimum</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink2">AuthN + RBAC + session mgmt, password policy, <b>MFA-ready</b>, audit imutabel, enkripsi transit/rest, rate limiting.</p>
        </Card>
        <Card className="p-4">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">Enforcement nyata</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink2">Menu sidebar & aksi tulis menyesuaikan role. Coba masuk sebagai <MonoTag>Teknisi</MonoTag> — menu Procurement/Finance tidak muncul.</p>
        </Card>
      </div>
    </div>
  );
}
