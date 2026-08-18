import { useApp } from "../lib/store";
import { Card, Chip, MonoTag, SectionHead } from "../components/ui";
import { IcCheck, IcShield, IcUser } from "../components/icons";
import { PERM_MODULES, ROLE_PERMS } from "../lib/data";
import { ROLES, ROLE_SCOPE, ROLE_USER } from "../lib/types";

export default function Rbac() {
  const { s, setRole } = useApp();
  const me = ROLE_USER[s.role];

  return (
    <div className="view-in space-y-4">
      <div>
        <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Peran & Akses (RBAC)</h1>
        <p className="text-xs text-mute">User → Role → Permission → Organization Scope → Data Scope · klik role untuk mensimulasikan sesi</p>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="dark-grain p-4 text-pine-50">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-pine-100/70">Sesi aktif</p>
          <div className="mt-2.5 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-pine-500/25 font-display text-[15px] font-black">{me.initials}</span>
            <div>
              <p className="font-display text-[15px] font-extrabold">{me.name}</p>
              <p className="font-mono text-[11px] text-pine-100/80">{s.role}</p>
            </div>
          </div>
          <p className="mt-3 rounded-md bg-pine-950/40 px-3 py-2 font-mono text-[10.5px] leading-relaxed text-pine-100/85">
            <span className="font-bold text-pine-50">Data scope:</span> {ROLE_SCOPE[s.role]}
          </p>
        </Card>

        <Card className="p-4 lg:col-span-2">
          <SectionHead title="Ganti role (simulasi)" sub="Setiap role melihat izin & data scope berbeda di seluruh aplikasi" />
          <div className="flex flex-wrap gap-1.5">
            {ROLES.map((r) => (
              <button key={r} onClick={() => setRole(r)}
                className={`rounded-md border px-2.5 py-1.5 font-display text-[11.5px] font-bold tracking-tight transition ${s.role === r ? "border-pine-600 bg-pine-700 text-pine-50 shadow" : "border-line bg-card text-ink2 hover:border-pine-500/50 hover:text-pine-700"}`}>
                {r}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-line pt-3 font-mono text-[10.5px] text-mute">
            <span className="flex items-center gap-1.5"><span className="flex h-3.5 w-3.5 items-center justify-center rounded-sm bg-pine-600 text-white"><IcCheck size={9} /></span> full — baca & tulis</span>
            <span className="flex items-center gap-1.5"><span className="flex h-3.5 w-3.5 items-center justify-center rounded-sm border border-line2 bg-card text-pine-600"><IcUser size={9} /></span> view — baca saja</span>
            <span className="flex items-center gap-1.5"><span className="flex h-3.5 w-3.5 items-center justify-center rounded-sm border border-line bg-moss text-mute">–</span> none — tidak terlihat</span>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <div className="flex items-center gap-2">
            <IcShield size={15} className="text-pine-700" />
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
                  <th key={r} className={`px-2 py-2.5 text-center font-mono text-[9px] font-semibold uppercase tracking-wide ${r === s.role ? "bg-pine-100/70 text-pine-800" : "text-mute"}`}>
                    <button onClick={() => setRole(r)} className="transition hover:text-pine-700">{r.split(" ")[0]}</button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {PERM_MODULES.map((mth, mi) => (
                <tr key={mth} className="transition hover:bg-pine-50/50">
                  <td className="sticky left-0 z-10 bg-card px-4 py-2 text-[12px] font-bold text-ink">{mth}</td>
                  {ROLES.map((r) => {
                    const lv = ROLE_PERMS[r][mi];
                    return (
                      <td key={r} className={`px-2 py-2 text-center ${r === s.role ? "bg-pine-100/40" : ""}`}>
                        {lv === "full" ? <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-pine-600 text-white shadow-sm"><IcCheck size={11} /></span>
                          : lv === "view" ? <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-line2 bg-card text-pine-600"><IcUser size={10} /></span>
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
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink2">RS Harapan Medika (single hospital, multi-branch ready). Petugas Gudang hanya melihat <MonoTag>Gudang BHP Medis</MonoTag> — data scope diterapkan di query layer.</p>
        </Card>
        <Card className="p-4">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">Security minimum</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink2">AuthN + RBAC + session management, password policy, <b>MFA-ready</b>, audit trail imutabel, enkripsi in-transit/at-rest, rate limiting API.</p>
        </Card>
        <Card className="p-4">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">Enforcement nyata di app ini</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink2">Coba role <MonoTag>Teknisi</MonoTag> → persetujuan terkunci; role <MonoTag>Auditor</MonoTag> → semua aksi tulis read-only. Setiap keputusan tercatat (BR-010).</p>
        </Card>
      </div>
    </div>
  );
}
