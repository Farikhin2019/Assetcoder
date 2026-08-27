# 02 · Model Domain

Semua tipe di `src/lib/types.ts`. Dokumen ini merangkum entitas, role, RBAC, dan aturan bisnis.

## Entitas Inti

```
User (login) ─ role ─▶ hak akses menu & aksi
Organization ─▶ Hospital ─▶ Building ─▶ Floor ─▶ Room ─▶ Unit
Equipment ─▶ { Timeline, Foto, Dokumen, WorkOrder, Kalibrasi, Keluhan, BAST, Retur }
InventoryItem ─▶ LedgerEntry (hanya-tambah)
PurchaseRequest ─▶ PurchaseOrder ─▶ Delivery ─▶ HandoverRecord(BAST) ─▶ VendorReturn
```

`Equipment` adalah agregat pusat — semua kegiatan teknis menulis ke `timeline[]`.

## Status & Enum

| Domain | Nilai |
|--------|-------|
| `opStatus` aset | `IN_SERVICE · MAINTENANCE · CALIBRATION · DOWN · RETIRED · DISPOSED` |
| `calStatus` | `VALID · DUE_SOON · EXPIRED · NOT_REQUIRED` |
| `condition` | `EXCELLENT · GOOD · FAIR · POOR` |
| `risk` | `HIGH · MEDIUM · LOW` |
| PR (per baris, 3 tahap) | `PENDING · APPROVED · REJECTED` |
| PR (keseluruhan) | `IN_APPROVAL · APPROVED · REJECTED · PO_CREATED` |
| PO | `SENT · RECEIVED` |
| Delivery | `PENDING · DELIVERED · RECEIVED` |
| Kondisi serah terima | `BAIK · KURANG · RUSAK` |
| Jenis BAST | `VENDOR · UNIT` |
| Retur vendor | `DIAJUKAN · DIKIRIM · DIGANTI · REFUND · DITUTUP` |
| Alasan retur | `KURANG · RUSAK` |
| WO | `SCHEDULED · IN_PROGRESS · CLOSED` |
| Jenis WO | `PREVENTIVE · CORRECTIVE` |
| Keluhan | `OPEN · IN_PROGRESS · RESOLVED · CLOSED` (prioritas `CRITICAL/HIGH/MEDIUM/LOW`) |
| Ledger | `RECEIPT · ISSUE · CONSUMPTION · ADJUSTMENT · OPENING_BALANCE · STOCK_OPNAME` |

## Role & RBAC

13 role: `Direksi, COO, Finance, Umum, Pengelola Aset, Pengelola Inventory, Kepala Gudang,
Petugas Gudang, Kepala Unit, Teknisi, Kepala Teknisi, IT Administrator, Auditor`.

- **`VIEW_PERM`** (types.ts): memetakan tiap `View` → indeks modul izin (`-1` = selalu terbuka).
- **`ROLE_PERMS`**: matriks peran × 11 modul izin → `full | view | none`.
- **`canSeeView(role, view)`** (store.tsx): pintu filter menu & cegat navigasi.
- **`ROLE_SCOPE`**: penjelasan cakupan data tiap peran (ditampilkan di UI).
- **`ROLE_USER`**: identitas default tiap peran (nama + inisial).

**Persetujuan PR 3 tahap** (`canDecideStage`, store.tsx):

| Tahap | Label | Role yang boleh |
|-------|-------|-----------------|
| 1 | IT / Umum | `Umum`, `IT Administrator`, `Pengelola Aset` |
| 2 | Keuangan | `Finance` |
| 3 | COO | `COO` |

Rincian aksi per peran di [04 · Peta Modul](./04-module-map.md).

## Aturan Bisnis (WAJIB)

| ID | Aturan |
|----|--------|
| BR-001 | Tiap aset punya kode unik (`AST-RS-{tahun}-{6 digit}`) |
| BR-002 | Kode aset tidak pernah berubah (`nextAssetCode` hanya menambah) |
| BR-003 | Tiap mutasi stok menulis entri ledger |
| BR-008 | Ledger hanya-tambah (tak ada hard-delete) |
| BR-010 | Aksi kritis menulis audit log |
| BR-014 | Keluhan punya SLA sesuai prioritas (`SLA_BY_PRIORITY`) |
| — | **Satu aset = satu lokasi aktif** (guard `LOC_DELETE`: ruangan/gedung/unit yang masih berisi aset aktif tak bisa dihapus) |
| — | Stok tidak boleh negatif |
| — | Penyesuaian stok > `ADJ_APPROVAL_THRESHOLD` (Rp 2 jt) wajib persetujuan |
| — | Tiap serah terima (dari vendor & ke unit) menerbitkan BAST |
| — | Baris GRN yang KURANG/RUSAK otomatis menjadi retur vendor |

## Penomoran Aset

`nextAssetCode(codes)` menghitung kode berikutnya dari urutan tertinggi — unik & imutabel.
Ditampilkan di panel "Penomoran Aset" pada registri.
