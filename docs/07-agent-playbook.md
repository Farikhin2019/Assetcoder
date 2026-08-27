# 07 · Playbook Agen

Panduan operasional untuk **agen AI** yang memodifikasi SIMASET. Ikuti urutan ini setiap kali
menerima tugas.

## Langkah 0 — Orientasi (selalu)

1. Baca [README](./README.md) → lalu dokumen yang relevan dengan tugas.
2. Jika tugas menyentuh domain, baca [02 · Model Domain](./02-domain-model.md) (jangan langgar BR).
3. Jika tugas menambah fitur, baca [03 · Store & Aksi](./03-store-and-actions.md) (resep).
4. **Selalu akhiri dengan `npm run build`** dan perbaiki semua error TypeScript.

## Aturan Keras (melanggar = bug)

- Jangan memutasi state di luar `coreReducer`. Jangan edit `ledger`/`audit` secara destructif.
- Jangan mengubah `equipment.code` / `asset id` (BR-002).
- Jangan menyimpan stok/nilai yang bisa dihitung dari ledger — hitung saat render.
- Jangan buat mekanisme stok/approval/notif/audit paralel — pakai helper cross-cutting.
- Jangan menambah `View` tanpa mengisi `TITLES` (build akan error `Record<View,string>`).
- Jangan pakai emoji/ikon font — SVG inline dari `icons.tsx`.
- Jangan hardcode kebijakan — pakai `SystemConfig`.

## Checklist Menambah Fitur

```
[ ] Tipe/enum baru di types.ts (jika perlu)
[ ] Aksi di union Act + case di coreReducer (mutasi + timeline + audit + notif + toast)
[ ] Pemetaan event di emitEvent (biar masuk Event Bus)
[ ] Method di interface Api + binding di StoreProvider
[ ] Seed di data.ts (relasi konsisten, ledger = stock)
[ ] View baru (jika perlu) + TITLES + NAV + route
[ ] Gating RBAC pada tombol tulis
[ ] Responsif (grid 1/2 kolom, tabel overflow-x-auto)
[ ] npm run build → 0 error
```

## Jebakan yang Pernah Terjadi (pelajaran)

1. **`Record<View,string>` di `TITLES`** — menambah union `View` tanpa mengisi `TITLES` membuat
   build error. Isi `TITLES` dulu.
2. **Duplicate key di `chipFor`** — object literal TS menolak kunci duplikat; periksa sebelum menambah.
3. **Ledger vs stock tidak sinkron** — saldo akhir `LEDGER_INIT` per SKU harus = `ITEMS[].stock`.
4. **`utilOf` / nilai tersimpan** — utilisasi & kepatuhan dihitung dari deret/ledger; jangan cache
   nilai yang bisa stale.
5. **Approval PURCHASE ≠ Approvals.tsx** — PR memakai alur 3-tahap sendiri (`PR_DECIDE*`).
6. **Tanggal** — selalu relatif via `d()`; jangan ISO absolut (seed jadi "basi").
7. **Ikon tidak ada** — cek `icons.tsx` sebelum pakai `<IcX/>`; tambah di sana bila kurang.

## Perintah

| Perintah | Fungsi |
|----------|--------|
| `npm run build` | **Wajib** — type-check + bundle. Satu-satunya validasi resmi. |
| `npm run dev` | Server dev lokal (untuk manusia). |

## Gaya Kode

- TypeScript strict; hindari `any` (pakai union/`Record` spesifik).
- Satu file per view; komponen bersama di `components/`.
- Nama aksi SCREAMING (`WO_SUBMIT`), event_type lowercase titik (`asset.maintenance.completed`).
- Helper format sudah ada — pakai, jangan bikin ulang.
- UI: pakai pustaka `ui.tsx`; jaga kontras & pola di `06-design-system`.

## Definisi "Selesai"

Sebuah tugas selesai bila: (1) `npm run build` 0 error, (2) aksi baru mengalir ke
timeline + audit + notif (+ ledger bila menyentuh stok), (3) tergating RBAC, (4) responsif di
mobile, dan (5) muncul di Event Bus bila bersifat domain.
