import { useState } from "react";
import { useApp } from "../lib/store";
import { BtnGhost, BtnPrimary, BtnSm, Card, Chip, Input, Label, Modal, MonoTag, SectionHead, Select, Tabs } from "../components/ui";
import { IcCheck, IcPlus, IcShield, IcUser } from "../components/icons";
import { DEST_UNITS, PERM_MODULES, ROLE_PERMS } from "../lib/data";
import { ROLES, ROLE_SCOPE, initialsOf, Role } from "../lib/types";

const canManageUser = (r: string) => ["IT Administrator", "Direksi", "Pengelola Aset"].includes(r);

export default function Rbac() {
  const { s, setRole, loginUser, addUser } = useApp();
  const [tab, setTab] = useState("matrix");
  const [addOpen, setAddOpen] = useState(false);
  const [nf, setNf] = useState({ name: "", role: "Kepala Unit" as Role, unit: DEST_UNITS[0], email: "" });
  const [err, setErr] = useState("");

  const submitUser = () => {
    if (nf.name.trim().length < 3) return setErr("Nama wajib diisi.");
    const email = nf.email.trim() || nf.name.trim().toLowerCase().replace(/[^a-z ]/g, "").split(/\s+/).join(".") + "@rs-harapan.id";
    addUser(nf.name.trim(), nf.role, nf.unit === "—" ? null : nf.unit, email);
    setNf({ name: "", role: "Kepala Unit", unit: DEST_UNITS[0], email: "" }); setErr(""); setAddOpen(false);
  };

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Peran & Akses (RBAC)</h1>
          <p className="text-xs text-mute">User → Role → Permission → Organization Scope → Data Scope</p>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-pine-500/40 bg-pine-50 px-3 py-1.5">
          <span className="pulse-dot h-2 w-2 rounded-full bg-pine-600" />
          <span className="font-mono text-[11px] font-bold text-pine-700">SESU AKTIF: {s.userName}{s.userUnit ? ` · ${s.userUnit}` : ""}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="dark-grain p-4 text-pine-50">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-pine-100/70">Sesi aktif</p>
          <div className="mt-2.5 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-pine-500/25 font-display text-[15px] font-black">{initialsOf(s.userName)}</span>
            <div>
              <p className="font-display text-[15px] font-extrabold">{s.userName}</p>
              <p className="font-mono text-[11px] text-pine-100/80">{s.role}{s.userUnit ? ` · unit ${s.userUnit}` : " · lintas unit"}</p>
            </div>
          </div>
          <p className="mt-3 rounded-md bg-pine-950/40 px-3 py-2 font-mono text-[10.5px] leading-relaxed text-pine-100/85">
            <span className="font-bold text-pine-50">Data scope:</span> {ROLE_SCOPE[s.role]}
          </p>
        </Card>

        <Card className="p-4 lg:col-span-2">
          <SectionHead title="Ganti role cepat (simulasi)" sub="Atau masuk sebagai user spesifik di tab Pengguna" />
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

      <Card className="p-4">
        <Tabs active={tab} onChange={setTab}
          tabs={[{ id: "matrix", label: "Matrix Izin" }, { id: "users", label: "Pengguna & Unit" }]}
          counts={{ matrix: PERM_MODULES.length, users: s.users.length }} />

        {tab === "users" && (
          <div className="pt-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-[10.5px] text-mute">Masuk sebagai user unit untuk mencoba alur: permintaan → persetujuan → konfirmasi terima barang.</p>
              <BtnPrimary disabled={!canManageUser(s.role)} title={!canManageUser(s.role) ? "Butuh IT Administrator / Direksi / Pengelola Aset" : undefined} onClick={() => setAddOpen(true)}>
                <IcPlus size={13} /> Tambah pengguna
              </BtnPrimary>
            </div>
            <div className="overflow-x-auto rounded-md border border-line">
              <table className="w-full min-w-[860px] text-left">
                <thead>
                  <tr className="border-b border-line bg-canvas/70 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">
                    <th className="px-3 py-2.5">Pengguna</th><th className="px-3 py-2.5">Role</th><th className="px-3 py-2.5">Unit</th>
                    <th className="px-3 py-2.5">Email</th><th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {s.users.map((u) => (
                    <tr key={u.id} className={`transition hover:bg-pine-50/60 ${u.id === s.userId ? "bg-pine-50/80" : ""}`}>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-pine-100 font-display text-[11px] font-black text-pine-700">{initialsOf(u.name)}</span>
                          <div>
                            <p className="text-[12.5px] font-bold text-ink">{u.name}</p>
                            <p className="font-mono text-[9.5px] text-mute">{u.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5"><Chip tone={u.role === "Kepala Unit" ? "pine" : u.role === "Finance" || u.role === "COO" ? "warn" : u.role === "IT Administrator" ? "info" : "neutral"}>{u.role}</Chip></td>
                      <td className="px-3 py-2.5">{u.unit ? <MonoTag>{u.unit}</MonoTag> : <span className="font-mono text-[10.5px] text-mute">lintas unit</span>}</td>
                      <td className="px-3 py-2.5 font-mono text-[10.5px] text-mute">{u.email}</td>
                      <td className="px-3 py-2.5">{u.active ? <Chip tone="ok" dot>AKTIF</Chip> : <Chip tone="danger" dot>NON-AKTIF</Chip>}</td>
                      <td className="px-3 py-2.5 text-right">
                        {u.id === s.userId ? <Chip tone="pine" className="!text-[9.5px]">SESU ANDA</Chip> : <BtnSm onClick={() => loginUser(u.id)}>Masuk</BtnSm>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
              <div className="rounded-md border border-line bg-canvas/50 px-3 py-2.5">
                <p className="font-mono text-[9.5px] font-bold uppercase tracking-wide text-mute">Coba alur unit</p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-ink2">Masuk sebagai <b>Ns. Dewi Lestari (ICU)</b> → Procurement → tab <b>Distribusi ke Unit</b> → konfirmasi terima barang Anda.</p>
              </div>
              <div className="rounded-md border border-line bg-canvas/50 px-3 py-2.5">
                <p className="font-mono text-[9.5px] font-bold uppercase tracking-wide text-mute">Coba persetujuan</p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-ink2">Masuk sebagai <b>Ratna Dewi (Finance)</b> lalu <b>dr. Ahmad Fauzi (COO)</b> untuk meloloskan PR 3 tahap.</p>
              </div>
              <div className="rounded-md border border-line bg-canvas/50 px-3 py-2.5">
                <p className="font-mono text-[9.5px] font-bold uppercase tracking-wide text-mute">Coba gudang</p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-ink2">Masuk sebagai <b>Bambang Prasetyo (Kepala Gudang)</b> → terima PO (GRN) → kirim barang ke unit.</p>
              </div>
            </div>
          </div>
        )}

        {tab === "matrix" && (
          <div className="pt-4">
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
                  {PERM_MODULES.map((mth) => (
                    <tr key={mth} className="transition hover:bg-pine-50/50">
                      <td className="sticky left-0 z-10 bg-card px-4 py-2 text-[12px] font-bold text-ink">{mth}</td>
                      {ROLES.map((r) => {
                        const lv = ROLE_PERMS[r][PERM_MODULES.indexOf(mth)];
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
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              <Card className="p-4">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">Organization scope</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink2">RS Harapan Medika (multi-branch ready). Petugas Gudang hanya melihat <MonoTag>Gudang BHP Medis</MonoTag> — data scope di query layer.</p>
              </Card>
              <Card className="p-4">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">Security minimum</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink2">AuthN + RBAC + session mgmt, password policy, <b>MFA-ready</b>, audit imutabel, enkripsi, rate limiting.</p>
              </Card>
              <Card className="p-4">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">Enforcement nyata</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink2">Role <MonoTag>Teknisi</MonoTag> → persetujuan terkunci; <MonoTag>Auditor</MonoTag> → semua tulis read-only. Setiap keputusan tercatat (BR-010).</p>
              </Card>
            </div>
          </div>
        )}
      </Card>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} kicker="User management" title="Pengguna baru"
        footer={<><BtnGhost onClick={() => setAddOpen(false)}>Batal</BtnGhost><BtnPrimary onClick={submitUser}><IcPlus size={13} /> Buat pengguna</BtnPrimary></>}>
        <div className="space-y-3">
          <div><Label>Nama *</Label><Input value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} placeholder="cth: Ns. Ratih Purnama" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Role</Label>
              <Select value={nf.role} onChange={(e) => setNf({ ...nf, role: e.target.value as Role })}>{ROLES.map((r) => <option key={r}>{r}</option>)}</Select>
            </div>
            <div><Label>Unit</Label>
              <Select value={nf.unit} onChange={(e) => setNf({ ...nf, unit: e.target.value })}>
                <option value="—">— lintas unit —</option>
                {DEST_UNITS.map((u) => <option key={u}>{u}</option>)}
                {["Gudang", "Keuangan", "Manajemen", "IT", "Teknik"].map((u) => <option key={u}>{u}</option>)}
              </Select>
            </div>
          </div>
          <div><Label>Email (kosong = dibuat otomatis)</Label><Input value={nf.email} onChange={(e) => setNf({ ...nf, email: e.target.value })} placeholder="nama@rs-harapan.id" /></div>
          {err && <p className="rounded-md bg-dangerbg px-3 py-2 text-xs font-semibold text-danger">{err}</p>}
        </div>
      </Modal>
    </div>
  );
}
