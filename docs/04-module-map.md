# 04 · Peta Modul & Alur Pengadaan

## 12 View

| Grup | View (id) | File | Tanggung jawab |
|------|-----------|------|----------------|
| Gerbang | `login` | Login.tsx | Pilih user → set role/unit → halaman awal per peran |
| Pantau | `dashboard` | Dashboard.tsx | KPI, antrian "perlu perhatian", utilisasi, timeline |
| Aset | `equipment` / `equipment-detail` | Equipment.tsx | Registri, penomoran, Aset 360°, upload foto/dokumen, cetak label QR |
| Inventori | `inventory` | Inventory.tsx | Stok per gudang + buku besar per-SKU + penyesuaian |
| Pengadaan | `procurement` | Procurement.tsx | PR 3 tahap, PO, GRN+BAST, distribusi, serah terima unit, retur vendor |
| Teknis | `maintenance` | Maintenance.tsx | Perintah kerja, kalibrasi, keluhan (SLA) |
| Lokasi | `locations` | Locations.tsx | Struktur Organisasi→RS→Gedung→Lantai→Ruangan→Unit (CRUD + guard) |
| Tata kelola | `approvals` | Approvals.tsx | Pusat persetujuan (non-PR) + riwayat |
| | `audit` | Audit.tsx | Riwayat audit imutabel, dapat difilter |
| | `rbac` | Rbac.tsx | Matriks izin, daftar user, simulasi sesi |
| Master | `master` | MasterData.tsx | Teknisi, pemasok (kontrak) |
| | `config` | Config.tsx | Ambang persetujuan, SLA, kanal notifikasi, matriks |

## Alur Pengadaan Lengkap (per peran)

```
Ajukan PR ──▶ Persetujuan 3 tahap ──▶ Buat PO ──▶ Terima GRN ──▶ Kirim ──▶ Serah terima unit
(unit)        (IT/Umum→Keu→COO)      (Umum/Inv)   (Gudang+BAST)  (Gudang)  (unit+BAST)
                                                          │
                                          baris KURANG/RUSAK ──▶ Retur vendor
                                                                 (kirim→diganti/refund→tutup)
```

| Langkah | Aksi | Peran yang boleh |
|---------|------|------------------|
| Ajukan PR (BHP / aset, multi-baris) | `createPr` | Kepala Unit, Pengelola Inventory, Direksi |
| Setujui **tahap 1** (IT/Umum) | `prDecide` | Umum, IT Administrator, Pengelola Aset |
| Setujui **tahap 2** (Keuangan) | `prDecide` | Finance |
| Setujui **tahap 3** (COO) | `prDecide` | COO |
| Tolak + saran / Revisi qty / Setujui semua (tahap Anda) | `prDecide`/`prRevise`/`prDecideAll` | approver tahap aktif |
| Buat PO dari PR APPROVED | `createPo` | Umum, Pengelola Inventory, Kepala Gudang |
| Terima GRN + verifikasi qty/kondisi → **BAST vendor** | `receivePo` | Kepala Gudang, Petugas Gudang, Umum |
| Kirim ke unit | `deliver` | Gudang, Umum, Pengelola Inventory |
| Serah terima + tanda tangan → **BAST unit** | `unitReceive` | Kepala Unit pemilik unit |
| Kirim retur ke vendor | `returnSend` | Gudang, Umum |
| Tandai Diganti / Refund | `returnResolve` | Umum, Gudang, Finance, Pengelola Inventory |
| Tutup retur | `returnClose` | Umum, Gudang, Pengelola Inventory |

**Perilaku kunci:**
- Baris PR yang "giliran Anda" disorot; tracker 3 tahap menampilkan siapa memutuskan + catatannya.
- GRN memposting `RECEIPT` ke ledger; baris **ASET** otomatis terdaftar sebagai equipment
  (tertelusur ke PO via `poRef`).
- Baris GRN berkondisi **KURANG/RUSAK** otomatis dibuatkan retur vendor.
- Retur **DIGANTI** menambah stok (ledger) / mendaftarkan aset pengganti; **REFUND** mencatat nilai.
- Tiap serah terima menerbitkan **BAST** bernomor + checksum, tercatat di audit & tab "Serah Terima".

## Contoh Uji Alur (end-to-end)

1. Masuk **Ns. Dewi (Kepala Unit)** → Ajukan PR (campur BHP + aset).
2. Masuk **Bambang (Umum)** → setujui tahap 1 → **Ratna (Finance)** tahap 2 → **COO** tahap 3.
3. Masuk **Umum/Inventory** → Buat PO.
4. Masuk **Kepala Gudang** → Terima GRN (tandai 1 baris RUSAK → retur muncul) → aset terdaftar.
5. Kirim ke unit → masuk **Kepala Unit** → Serah Terima & tanda tangan → BAST terbit.
6. (Opsional) **Gudang** kirim retur → **Umum/Finance** tandai Diganti → Tutup.
