# 05 · Peta Modul

30 view, satu file per modul di `src/views/`. Navigasi didefinisikan sekali di `App.tsx` (`NAV`),
muncul di sidebar desktop, bottom-tab mobile, dan sheet "Semua Modul".

## Grup Navigasi

| Grup | View (id) | File | Tanggung jawab |
|------|-----------|------|----------------|
| **Executive** | `command` | Command.tsx | Command Center gelap: KPI finansial, operasi, multi-branch, ticker |
| **Pantau** | `dashboard` | Dashboard.tsx | Denyut operasional, attention queue, KPI |
| | `reporting` | Reporting.tsx | KPI vs target, grafik, export CSV, panel Intelligence |
| **Aset** | `equipment` | EquipmentList.tsx | Registry: cari/filter/sort aset |
| | `equipment-detail` | EquipmentDetail.tsx | **Equipment 360°** — timeline, lifecycle, semua tab teknis |
| | `locations` | Locations.tsx | Gedung/ruang, transfer, QR & scan |
| **Inventori** | `inventory` | Inventory.tsx | Stok + ledger per-SKU + adjustment |
| | `logistics` | Logistics.tsx | Gudang, GRN/penerimaan, distribusi FIFO/FEFO |
| | `opname` | Opname.tsx | Stock opname end-to-end |
| **Teknis** | `technical` | Maintenance.tsx | WO, kalibrasi, inspeksi, spare part |
| | `formbuilder` | FormBuilder.tsx | Form Builder 3-panel (PRD §6) |
| | `complaints` | Complaints.tsx | Keluhan (SLA) & perbaikan |
| | `procurement` | Procurement.tsx | Demand → PR(3 tahap) → PO → GRN |
| **Pemanfaatan & Finansial** | `utilization` | Utilization.tsx | Utilisasi, deteksi idle, redistribusi |
| | `rental` | RentalLoan.tsx | Sewa, pinjaman, BGS/SGB, kontrak |
| | `depreciation` | Depreciation.tsx | Depresiasi garis lurus, posting bulanan |
| **Intelligence** | `intelligence` | Intelligence.tsx | AI: assistant, forecast, optimasi, PM-risk, anomali, auto-PR |
| | `reliability` | Reliability.tsx | MTTR/MTBF/Availability/Repeat-Failure |
| | `eventbus` | EventBus.tsx | Event bus & telemetri (§11) |
| **Lapangan & Integrasi** | `mobile` | Mobile.tsx | PWA field ops: QR, offline queue, sync+conflict |
| | `disposal` | Disposal.tsx | Pensiun & disposal (BR-007) |
| | `integrations` | Integrations.tsx | Konektor, kesehatan, retry idempoten |
| **Master** | `master` | MasterData.tsx | Teknisi, supplier, aksesori |
| **Tata Kelola** | `approvals` | Approvals.tsx | Approval engine generik |
| | `audit` | AuditTrail.tsx | Audit trail imutabel + statistik |
| | `rbac` | Rbac.tsx | Matrix izin, data scope, role switcher |
| | `compliance` | Compliance.tsx | Skor kepatuhan BR live, posture, sesi, API health |
| **Konsolidasi** | `assetledger` | AssetLedger.tsx | Buku aset (fixed asset ledger) |
| | `notifications` | NotificationCenter.tsx | Pusat notifikasi, kanal, uji event |
| | `config` | Config.tsx | Konfigurasi sistem, approval matrix, kategori/UoM |

## Gating RBAC (pola yang dipakai)

Aksi tulis dikunci berdasar `s.role`. Pola umum:

```tsx
const canTech = ["Teknisi", "Kepala Teknisi", "Pengelola Aset"].includes(s.role);
const canOp   = ["Kepala Gudang", "Petugas Gudang", "Pengelola Inventory"].includes(s.role);
<BtnPrimary disabled={!canTech} title={!canTech ? "Butuh role Teknisi" : undefined}>…</BtnPrimary>
```

- Role **Auditor** → hampir semua aksi tulis read-only.
- Approval `PURCHASE` (PR) punya jalur sendiri 3 tahap (IT/UMUM → Keuangan → COO), **bukan** via
  `Approvals.tsx`. Approval generik (`TRANSFER/ADJUSTMENT/REPAIR/DISPOSAL/LOAN`) via `Approvals.tsx`.
- Matrix izin visual: `ROLE_PERMS` di `data.ts` × `PERM_MODULES`; scope: `ROLE_SCOPE`.

## Konvensi antar-view

- Lompat ke detail aset: `nav("equipment-detail", eqId)`.
- Kembali ke registry: `nav("equipment")`.
- Semua tabel lebar pakai `overflow-x-auto` + `min-w-[…]` (aman di mobile).
- Semua grid pakai `grid-cols-1/2 + md:/lg:/xl:` (responsif; lihat `06-design-system`).
- Umpan balik aksi: `toast(...)` + baris baru di timeline/audit/notif.

## Menambah modul?

Ikuti [Resep: Menambah Modul/View Baru](./03-store-and-actions.md#resep-menambah-modulview-baru),
lalu daftarkan di tabel ini.
