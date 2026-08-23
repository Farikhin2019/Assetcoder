# 06 · Playbook Agen

Panduan untuk **agen AI** yang memodifikasi SIMASET. Ikuti urutan ini setiap menerima tugas.

## Langkah 0 — Orientasi (selalu)

1. Baca [README](./README.md) → dokumen yang relevan dengan tugas.
2. Tugas menyentuh domain? → [02 · Model Domain](./02-domain-model.md) (jangan langgar aturan bisnis).
3. Menambah fitur? → [03 · Store & Aksi](./03-store-and-actions.md) (resep).
4. **Akhiri dengan `npm run build`** dan perbaiki semua error TypeScript.

## Aturan Keras (melanggar = bug)

- Jangan memutasi state di luar `coreReducer`.
- Jangan mengubah kode aset (`nextAssetCode` hanya menambah — BR-002).
- Jangan menyimpan saldo/nilai yang bisa dihitung dari ledger — hitung saat render.
- Jangan buat mekanisme ledger/BAST/audit/notif paralel — pakai helper cross-cutting.
- Menambah `View` **wajib** mengisi `TITLES` dan `VIEW_PERM` (build akan error jika tidak).
- Setiap serah terima harus menerbitkan BAST; setiap mutasi stok harus menulis ledger.
- Kunci aksi tulis dengan `canXxx(role)`; jangan biarkan peran lain menembus wewenang.
- **UI berbahasa Indonesia** — status baru wajib dilabeli di `STATUS_ID`.

## Checklist Menambah Fitur

```
[ ] Tipe/enum baru di types.ts (jika perlu) + VIEW_PERM bila view baru
[ ] Aksi di union Act + case di coreReducer (mutasi + BAST/ledger + timeline + audit + notif + toast)
[ ] Method di interface Api + binding di provider
[ ] Seed di data.ts (relasi konsisten; ledger sinkron dengan stock)
[ ] View baru (jika perlu): import + TITLES + NAV + route
[ ] Gating RBAC pada tombol tulis (canXxx)
[ ] Label & status dalam Bahasa Indonesia (STATUS_ID + chipFor)
[ ] Responsif (grid 1/2 kolom, tabel overflow-x-auto)
[ ] npm run build → 0 error
```

## Jebakan yang Pernah Terjadi

1. **`Record<View,string>` di `TITLES`** — menambah union `View` tanpa mengisi `TITLES` bikin build error.
2. **Kunci duplikat di `chipFor`/`STATUS_ID`** — object literal TS menolak duplikat.
3. **Ledger vs stock tidak sinkron** — saldo akhir `LEDGER_INIT` per SKU harus = `ITEMS[].stock`.
4. **Tanggal absolut** — selalu relatif via `d()` agar seed tetap relevan.
5. **`statusId` tidak diimpor** — bila memakai label Indonesia di view, impor dari `components/ui`.
6. **Proyek pernah ter-reset** — bila build terasa "kosong", cek struktur file dulu sebelum menyunting.

## Definisi "Selesai"

Sebuah tugas selesai bila: (1) `npm run build` 0 error, (2) aksi baru mengalir ke
BAST/ledger + timeline + audit + notif (bila relevan), (3) tergating RBAC, (4) berbahasa
Indonesia & responsif di mobile.
