# 00 · Ringkasan Produk

## Apa itu SIMASET

**Sistem Informasi Manajemen Aset Rumah Sakit** — satu sumber kebenaran untuk aset medis
dan inventori RS Harapan Medika, mencakup:

- **Pengadaan barang** — permintaan unit → persetujuan 3 tahap → PO → penerimaan (BAST) →
  distribusi → serah terima ke unit → retur ke vendor.
- **Manajemen aset** — pendaftaran aset, penomoran, label QR, foto/dokumen, riwayat (timeline).
- **Inventori** — stok per gudang + buku besar (ledger) yang hanya-tambah.
- **Perawatan teknis** — perintah kerja (WO), kalibrasi, keluhan (dengan SLA).
- **Struktur organisasi & lokasi** — Rumah Sakit → Gedung → Lantai → Ruangan → Unit (CRUD).
- **Tata kelola** — login per user, menu sesuai hak akses (RBAC), pusat persetujuan,
  riwayat audit, data induk, pengaturan sistem.

**Bahasa antarmuka: Bahasa Indonesia** (lihat [05 · Sistem Desain](./05-design-system.md#label-status-bahasa-indonesia)).

## Prinsip Desain

| Prinsip | Implementasi |
|---------|--------------|
| Satu sumber kebenaran | Satu `AppState`; semua view membaca dari store yang sama |
| Buku besar = kebenaran | `ledger` hanya-tambah; `stock` hanya turunan (BR-003/008) |
| Ketertelusuran penuh | Setiap aksi menulis `AuditEntry` (siapa/apa/kapan/mengapa) |
| Persetujuan bertingkat | PR disetujui 3 tahap per-barang sesuai peran |
| Pencatatan serah terima | Setiap penerimaan/peyerahan menerbitkan **BAST** |
| Konfigurasi terpusat | Ambang, SLA, matriks izin ada di satu tempat, bukan di kode |
| Tanpa hard-delete | Aset dipensiunkan/dihapus-secara-logis, record kritis tak dihapus |
| Hak akses per peran | Menu & tombol menyesuaikan role pengguna (RBAC) |

## Cakupan Modul (12 view)

Login · Dasbor · Aset Medis 360° · Stok & Buku Besar · Pengadaan Barang ·
Perawatan & Kalibrasi · Lokasi & Organisasi · Pusat Persetujuan · Riwayat Audit ·
Peran & Akses · Data Induk · Pengaturan Sistem.

Rincian tiap modul + alur pengadaan: [04 · Peta Modul](./04-module-map.md).

## Target Non-Fungsional (PRD)

- Dashboard responsif & mobile (bottom-nav ter-filter per role).
- Keamanan minimum: login, RBAC + cakupan data, sesi, riwayat audit, MFA-ready (produksi).
