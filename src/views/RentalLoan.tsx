import { useState } from "react";
import { useApp } from "../lib/store";
import { BtnGhost, BtnPrimary, BtnSm, Card, Chip, Input, Label, Modal, Select, StatusChip, Tabs, TextArea, EmptyState } from "../components/ui";
import { IcCheck, IcPin, IcPlus, IcSend, IcTag } from "../components/icons";
import { DEST_UNITS } from "../lib/data";
import { daysUntil, fmtDate, fmtIDR, fmtIDRCompact } from "../lib/types";

const LOAN_STEPS = ["REQUESTED", "APPROVED", "ON_LOAN", "RETURNED", "CLOSED"];

export default function RentalLoan() {
  const { s, nav, requestLoan, advanceLoan, returnLoan, closeLoan, createRental, endRental } = useApp();
  const [tab, setTab] = useState("loan");
  const [loanModal, setLoanModal] = useState(false);
  const [rentModal, setRentModal] = useState(false);
  const [retLoan, setRetLoan] = useState<string | null>(null);
  const [retCond, setRetCond] = useState("");

  const canCreate = ["Pengelola Aset", "Kepala Unit", "Direksi", "Kepala Teknisi"].includes(s.role);
  const eqOf = (id: string) => s.equipment.find((e) => e.id === id);

  /* loan form */
  const [lf, setLf] = useState({ eqId: s.equipment[0]?.id ?? "", toUnit: DEST_UNITS[1], borrower: "", due: new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10), note: "" });
  const [lErr, setLErr] = useState("");
  const submitLoan = () => {
    if (!lf.borrower.trim()) return setLErr("Nama peminjam wajib diisi.");
    if (lf.note.trim().length < 5) return setLErr("Tujuan peminjaman wajib diisi.");
    requestLoan(lf.eqId, lf.toUnit, lf.borrower.trim(), new Date(lf.due + "T17:00:00").toISOString(), lf.note.trim());
    setLoanModal(false); setLf({ ...lf, borrower: "", note: "" }); setLErr("");
  };

  /* rental form */
  const [rf, setRf] = useState({ eqId: s.equipment[0]?.id ?? "", party: "", perDay: "1000000", days: "30" });
  const [rErr, setRErr] = useState("");
  const submitRent = () => {
    if (rf.party.trim().length < 3) return setRErr("Nama penyewa wajib diisi.");
    if (!(Number(rf.perDay) > 0) || !(Number(rf.days) > 0)) return setRErr("Tarif & durasi harus > 0.");
    createRental(rf.eqId, rf.party.trim(), Number(rf.perDay), Number(rf.days));
    setRentModal(false); setRf({ ...rf, party: "" }); setRErr("");
  };

  const activeRentals = s.rentals.filter((r) => r.status === "ACTIVE");
  const rentRevenue = s.rentals.reduce((a, r) => a + r.perDay * Math.max(1, Math.round((new Date(r.end).getTime() - new Date(r.start).getTime()) / 864e5)), 0);
  const bgs = s.contracts.filter((c) => c.kind === "BGS" || c.kind === "SGB");

  return (
    <div className="view-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-ink">Sewa, Pinjaman & BGS/SGB</h1>
          <p className="text-xs text-mute">Loan: Request → Approval → Handover → Usage → Return → Inspection → Close · BGS = Bangun-Guna-Serah, SGB = Sewa-Guna-Bangun</p>
        </div>
        <div className="flex gap-2">
          <BtnGhost disabled={!canCreate} title={!canCreate ? "Butuh Pengelola Aset / Kepala Unit" : undefined} onClick={() => setRentModal(true)}><IcTag size={13} /> Buat Sewa</BtnGhost>
          <BtnPrimary disabled={!canCreate} title={!canCreate ? "Butuh Pengelola Aset / Kepala Unit" : undefined} onClick={() => setLoanModal(true)}><IcPlus size={13} /> Ajukan Pinjaman</BtnPrimary>
        </div>
      </div>

      <Card className="p-4">
        <Tabs active={tab} onChange={setTab}
          tabs={[{ id: "loan", label: "Pinjaman Aset" }, { id: "rent", label: "Sewa (Rental)" }, { id: "contract", label: "Kontrak & BGS/SGB" }]}
          counts={{ loan: s.loans.length, rent: s.rentals.length, contract: s.contracts.length }} />
        <div className="pt-4">

          {tab === "loan" && (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {s.loans.length === 0 && <EmptyState title="Belum ada pinjaman" />}
              {s.loans.map((ln, i) => {
                const eq = eqOf(ln.eqId)!;
                const overdue = ln.status === "ON_LOAN" && daysUntil(ln.due) < 0;
                const stepIdx = ln.status === "REJECTED" ? -1 : LOAN_STEPS.indexOf(ln.status);
                return (
                  <div key={ln.id} className={`row-in rounded-lg border p-4 transition hover:shadow-md ${overdue ? "border-danger/40 bg-dangerbg/20" : "border-line bg-paper"}`} style={{ animationDelay: `${i * 55}ms` }}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-[12.5px] font-bold text-ink">{ln.code}</p>
                          <StatusChip status={ln.status} pulse={overdue} />
                          {overdue && <Chip tone="danger" dot>OVERDUE {Math.abs(daysUntil(ln.due))}h</Chip>}
                        </div>
                        <button onClick={() => nav("equipment-detail", ln.eqId)} className="mt-0.5 text-left text-[13.5px] font-bold text-pine-700 hover:underline">{eq.name}</button>
                      </div>
                      <span className="rounded-md bg-moss px-2 py-1 font-mono text-[10px] font-bold text-ink2">{ln.toUnit}</span>
                    </div>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-ink2">{ln.note}</p>
                    {/* stepper */}
                    <div className="mt-3 flex items-center gap-1">
                      {LOAN_STEPS.map((st, j) => (
                        <span key={st} className="flex items-center gap-1">
                          <span className={`rounded px-1.5 py-0.5 font-mono text-[8.5px] font-bold transition ${j < stepIdx ? "bg-pine-600 text-pine-50" : j === stepIdx ? "bg-warnhi text-pine-950" : "bg-moss text-mute"}`}>{st.replace("_", " ")}</span>
                          {j < LOAN_STEPS.length - 1 && <span className="font-mono text-[9px] text-line2">→</span>}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10.5px] text-mute">
                      <span>peminjam: <b className="text-ink2">{ln.borrower}</b></span>
                      <span className={overdue ? "font-bold text-danger" : ""}>kembali: {fmtDate(ln.due)}</span>
                    </div>
                    {ln.returnCondition && <p className="mt-1.5 rounded-md bg-moss px-2.5 py-1.5 text-[11px] text-ink2">Kondisi kembali: {ln.returnCondition}</p>}
                    <div className="mt-3 flex gap-2 border-t border-line pt-2.5">
                      {ln.status === "REQUESTED" && <span className="font-mono text-[10.5px] text-warn">Menunggu approval di Approval Engine →</span>}
                      {ln.status === "APPROVED" && <BtnSm disabled={!canCreate} onClick={() => advanceLoan(ln.id)} className="!border-pine-500/60 !text-pine-700"><IcSend size={11} /> Serah terima aset</BtnSm>}
                      {ln.status === "ON_LOAN" && <BtnSm disabled={!canCreate} onClick={() => { setRetLoan(ln.id); setRetCond(""); }}><IcCheck size={11} /> Catat pengembalian…</BtnSm>}
                      {ln.status === "RETURNED" && <BtnSm disabled={!canCreate} onClick={() => closeLoan(ln.id)} className="!border-ok/50 !text-ok"><IcCheck size={11} /> Inspeksi & tutup</BtnSm>}
                      {ln.status === "CLOSED" && <span className="font-mono text-[10.5px] text-ok">selesai — riwayat imutabel</span>}
                      {ln.status === "REJECTED" && <span className="font-mono text-[10.5px] text-danger">ditolak — lihat Approval Engine</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "rent" && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Chip tone="pine" dot>{activeRentals.length} sewa aktif</Chip>
                <Chip tone="ok" dot>{fmtIDRCompact(rentRevenue)} total kontrak sewa</Chip>
                <span className="font-mono text-[10.5px] text-mute">· pendapatan non-operasional unit utilisasi</span>
              </div>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {s.rentals.map((r, i) => {
                  const eq = eqOf(r.eqId)!;
                  const days = Math.max(1, Math.round((new Date(r.end).getTime() - new Date(r.start).getTime()) / 864e5));
                  const left = daysUntil(r.end);
                  return (
                    <div key={r.id} className={`row-in rounded-lg border p-4 transition hover:shadow-md ${r.status === "ACTIVE" ? "border-line bg-paper" : "border-line bg-canvas/40"}`} style={{ animationDelay: `${i * 55}ms` }}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-[12.5px] font-bold text-ink">{r.code}</p>
                            <StatusChip status={r.status} />
                          </div>
                          <button onClick={() => nav("equipment-detail", r.eqId)} className="mt-0.5 text-left text-[13.5px] font-bold text-pine-700 hover:underline">{eq.name}</button>
                        </div>
                        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-pine-100 text-pine-700"><IcTag size={16} /></span>
                      </div>
                      <p className="mt-1.5 text-[12px] text-ink2">Penyewa: <b>{r.party}</b></p>
                      <div className="mt-2 grid grid-cols-3 gap-2 border-t border-line pt-2.5 font-mono text-[10.5px] text-mute">
                        <div><p className="uppercase tracking-wide">Tarif</p><p className="num mt-0.5 font-sans text-[12px] font-bold text-ink">{fmtIDR(r.perDay)}/hari</p></div>
                        <div><p className="uppercase tracking-wide">Durasi</p><p className="mt-0.5 font-sans text-[12px] font-bold text-ink">{days} hari · {fmtDate(r.start)}–{fmtDate(r.end)}</p></div>
                        <div><p className="uppercase tracking-wide">Nilai</p><p className="num mt-0.5 font-sans text-[12px] font-bold text-ok">{fmtIDRCompact(r.perDay * days)}</p></div>
                      </div>
                      {r.status === "ACTIVE" && (
                        <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5">
                          <span className={`font-mono text-[10.5px] ${left < 7 ? "font-bold text-warn" : "text-mute"}`}>{left >= 0 ? `${left} hari tersisa` : "lewat jadwal kembali"}</span>
                          <BtnSm disabled={!canCreate} onClick={() => endRental(r.id)} className="!border-ok/50 !text-ok"><IcCheck size={11} /> Akhiri & realisasi</BtnSm>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "contract" && (
            <div className="space-y-4">
              {/* featured BGS/SGB */}
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {bgs.map((c, i) => (
                  <div key={c.id} className="row-in dark-grain rounded-lg p-4 text-pine-50" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="flex items-center gap-2">
                      <span className={`rounded px-2 py-0.5 font-mono text-[10px] font-black tracking-wide ${c.kind === "BGS" ? "bg-warnhi text-pine-950" : "bg-pine-500/30 text-pine-50"}`}>{c.kind}</span>
                      <p className="font-mono text-[10px] text-pine-100/70">{c.code}</p>
                    </div>
                    <p className="mt-2 font-display text-[15px] font-extrabold leading-tight">{c.name}</p>
                    <p className="mt-0.5 text-[11.5px] text-pine-100/80">{c.party}</p>
                    <div className="mt-3 flex items-end justify-between">
                      <p className="num font-display text-[20px] font-black">{fmtIDRCompact(c.value)}</p>
                      <p className="font-mono text-[9.5px] text-pine-100/70">s.d. {fmtDate(c.until)} · {daysUntil(c.until)} hari</p>
                    </div>
                    <p className="mt-2 border-t border-pine-800 pt-2 text-[11px] leading-relaxed text-pine-100/85">{c.note}</p>
                  </div>
                ))}
              </div>
              {/* all contracts */}
              <div className="overflow-x-auto rounded-md border border-line">
                <table className="w-full min-w-[900px] text-left">
                  <thead>
                    <tr className="border-b border-line bg-canvas/70 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-mute">
                      <th className="px-3 py-2.5">Kontrak</th><th className="px-3 py-2.5">Jenis</th><th className="px-3 py-2.5">Pihak</th>
                      <th className="px-3 py-2.5 text-right">Nilai</th><th className="px-3 py-2.5">Berlaku s.d.</th><th className="px-3 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {s.contracts.map((c) => {
                      const dd = daysUntil(c.until);
                      return (
                        <tr key={c.id} className="transition hover:bg-pine-50/60">
                          <td className="px-3 py-2.5">
                            <p className="text-[12.5px] font-bold text-ink">{c.name}</p>
                            <p className="font-mono text-[10px] text-mute">{c.code} · {c.note}</p>
                          </td>
                          <td className="px-3 py-2.5"><Chip tone={c.kind === "BGS" ? "pine" : c.kind === "SGB" ? "info" : c.kind === "RENTAL" ? "warn" : "neutral"}>{c.kind}</Chip></td>
                          <td className="px-3 py-2.5 text-[11.5px] text-ink2">{c.party}</td>
                          <td className="num px-3 py-2.5 text-right font-mono text-[11.5px] font-bold text-ink">{fmtIDRCompact(c.value)}</td>
                          <td className={`px-3 py-2.5 font-mono text-[11px] ${dd < 0 ? "font-bold text-danger" : dd < 60 ? "font-bold text-warn" : "text-ink2"}`}>{fmtDate(c.until)}</td>
                          <td className="px-3 py-2.5">{c.status === "EXPIRED" ? <Chip tone="danger" dot>SELESAI</Chip> : dd < 60 ? <Chip tone="warn" dot pulse>{dd} HARI</Chip> : <Chip tone="ok" dot>AKTIF</Chip>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="font-mono text-[10.5px] text-mute">Kontrak &lt; 60 hari memicu event CONTRACT_EXPIRING (notification engine) · terintegrasi modul Finance untuk jadwal pembayaran.</p>
            </div>
          )}
        </div>
      </Card>

      {/* loan modal */}
      <Modal open={loanModal} onClose={() => setLoanModal(false)} kicker="Asset loan · butuh persetujuan" title="Ajukan pinjaman aset"
        footer={<><BtnGhost onClick={() => setLoanModal(false)}>Batal</BtnGhost><BtnPrimary onClick={submitLoan}><IcSend size={13} /> Ajukan (→ Approval)</BtnPrimary></>}>
        <div className="space-y-3.5">
          <div><Label>Aset</Label>
            <Select value={lf.eqId} onChange={(e) => setLf({ ...lf, eqId: e.target.value })}>
              {s.equipment.filter((e) => e.opStatus === "IN_SERVICE").map((e) => <option key={e.id} value={e.id}>{e.name} — {e.code} ({e.room})</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Unit / pihak peminjam</Label><Select value={lf.toUnit} onChange={(e) => setLf({ ...lf, toUnit: e.target.value })}>{DEST_UNITS.map((u) => <option key={u}>{u}</option>)}<option>Klinik jejaring</option></Select></div>
            <div><Label>Tanggal kembali *</Label><Input type="date" value={lf.due} onChange={(e) => setLf({ ...lf, due: e.target.value })} /></div>
          </div>
          <div><Label>Nama peminjam (PIC) *</Label><Input value={lf.borrower} onChange={(e) => setLf({ ...lf, borrower: e.target.value })} placeholder="cth: Ns. …" /></div>
          <div><Label>Tujuan peminjaman *</Label><TextArea value={lf.note} onChange={(e) => setLf({ ...lf, note: e.target.value })} placeholder="cth: backup saat puncak okupansi…" /></div>
          <p className="rounded-md bg-infobg px-3 py-2 text-xs font-semibold text-info"><IcPin size={12} className="mr-1 inline" /> Matriks: Kepala Unit asal → Pengelola Aset. Setelah approve: serah terima → pemakaian → pengembalian → inspeksi → close.</p>
          {lErr && <p className="rounded-md bg-dangerbg px-3 py-2 text-xs font-semibold text-danger">{lErr}</p>}
        </div>
      </Modal>

      {/* rental modal */}
      <Modal open={rentModal} onClose={() => setRentModal(false)} kicker="Asset rental · pendapatan utilisasi" title="Buat kontrak sewa"
        footer={<><BtnGhost onClick={() => setRentModal(false)}>Batal</BtnGhost><BtnPrimary onClick={submitRent}><IcTag size={13} /> Aktifkan sewa</BtnPrimary></>}>
        <div className="space-y-3.5">
          <div><Label>Aset</Label>
            <Select value={rf.eqId} onChange={(e) => setRf({ ...rf, eqId: e.target.value })}>
              {s.equipment.filter((e) => e.opStatus === "IN_SERVICE").map((e) => <option key={e.id} value={e.id}>{e.name} — {e.code}</option>)}
            </Select>
          </div>
          <div><Label>Penyewa *</Label><Input value={rf.party} onChange={(e) => setRf({ ...rf, party: e.target.value })} placeholder="cth: RSUD / klinik jejaring" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Tarif / hari (IDR) *</Label><Input type="number" value={rf.perDay} onChange={(e) => setRf({ ...rf, perDay: e.target.value })} /></div>
            <div><Label>Durasi (hari) *</Label><Input type="number" value={rf.days} onChange={(e) => setRf({ ...rf, days: e.target.value })} /></div>
          </div>
          {Number(rf.perDay) > 0 && Number(rf.days) > 0 && (
            <p className="rounded-md bg-okbg px-3 py-2 text-xs font-bold text-ok">Estimasi pendapatan: {fmtIDR(Number(rf.perDay) * Number(rf.days))}</p>
          )}
          {rErr && <p className="rounded-md bg-dangerbg px-3 py-2 text-xs font-semibold text-danger">{rErr}</p>}
        </div>
      </Modal>
    </div>
  );
}
