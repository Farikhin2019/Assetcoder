# 04 · Data & Seed

Seluruh data awal hidup di `src/lib/data.ts`. Seed bersifat **deterministik** — relatif terhadap
"waktu sekarang" via helper `d(offsetHari, jam?)`, sehingga aplikasi selalu tampak "hidup"
(jatuh tempo, SLA, overdue selalu relevan kapan pun dijalankan).

## Konvensi Penamaan Ekspor

`data.ts` mengekspor konstanta UPPERCASE yang diimpor store sebagai nilai awal `AppState`:

```
EQUIPMENT, TIMELINE, ITEMS, LEDGER_INIT, SPARE_PARTS,
FORM_TEMPLATES, WORK_ORDERS, CALIBRATIONS, INSPECTIONS,
COMPLAINTS, REPAIRS, APPROVALS,
DEMAND_PLANS, PURCHASE_REQUESTS, PURCHASE_ORDERS,
RECEIPTS, ISSUES, OPNAMES, TRANSFERS,
TECHNICIANS, SUPPLIERS, ACCESSORIES,
LOANS, RENTALS, CONTRACTS, DEPR_POSTED,
DISPOSALS, CONNECTORS, MOBILE_TASKS, SYNC_LOG,
CONFIG_DEFAULT (via APPROVAL_MATRIX_DEFAULT),
BRANCHES, API_ENDPOINTS, ACTIVE_SESSIONS, BUILDING_VALUES, EVENT_CATALOG
```

> Catatan: seed `events[]` (event bus) didefinisikan **inline di `INIT`** (store.tsx), bukan di
> data.ts — karena envelope adalah artefak runtime. Event baru ditambahkan otomatis oleh wrapper
> `reducer` via `emitEvent`, dibatasi 140 entri terakhir.

Plus konstanta referensi: `PERM_MODULES, ROLE_PERMS, ROLE_SCOPE (types), DEST_UNITS, UTIL_SERIES`.

## Helper Penting

| Helper | Fungsi |
|--------|--------|
| `d(offsetHari, jam?)` | ISO string relatif hari ini (mis. `d(-12, 9)` = 12 hari lalu, 09:xx) |
| `uid()` | id acak pendek |
| `periodKey(date)` | kunci periode `YYYY-MM` untuk depresiasi |
| `isITSku(sku)` | SKU berawalan `IT-` → jalur approval IT |
| `mkPendingStages(matrix)` | bikin status 3 tahap untuk PR baru |
| `genSeries(util, seed)` | deret jam pemakaian mingguan untuk utilisasi |

## Aturan Menambah Seed

1. **Jaga konsistensi relasi.** `eqId` harus ada di `EQUIPMENT`; `sku` harus ada di `ITEMS`;
   `supplierId` di `SUPPLIERS`; `techId` di `TECHNICIANS`.
2. **Ledger harus konsisten dengan `stock`.** Saldo akhir `LEDGER_INIT` per SKU harus sama dengan
   `ITEMS[].stock`. Jika menambah item, beri baris `OPENING_BALANCE` + mutasi yang hasilnya = stock.
3. **Gunakan `d()`** untuk semua tanggal, jangan hardcode ISO absolut.
4. **Tambahkan `timeline`/`audit` awal** bila entitas baru punya sejarah yang layak ditampilkan.
5. **Jangan hardcode nilai kebijakan** (threshold, SLA, cadence) — taruh di `CONFIG_DEFAULT`.

## Contoh: menambah item inventori yang konsisten

```ts
// ITEMS — stock akhir harus = hasil akhir ledger
{ sku:"BHP-0999", name:"Item Baru", category:"Alkes Habis Pakai", uom:"box",
  warehouse:"Gudang BHP Medis", batch:"BB260101", expiry:d(300),
  stock:50, min:20, max:200, reorder:30, unitCost:10_000, method:"FEFO" }

// LEDGER_INIT — saldo berjalan sampai 50
{ id:uid(), date:d(-30,8), sku:"BHP-0999", type:"OPENING_BALANCE", qty:40, balance:40, actor:"system", ref:"OB-2026-07" },
{ id:uid(), date:d(-5,9),  sku:"BHP-0999", type:"RECEIPT", qty:10, balance:50, actor:"Kepala Gudang", ref:"GR-2608-099" },
```

## Data Turunan (dihitung, bukan disimpan)

Beberapa "data" sengaja **dihitung saat render** agar selalu benar dan reaktif:

- Saldo stok per SKU (dari ledger) — meski `stock` juga dicache.
- Status kalibrasi `DUE_SOON/EXPIRED` (dari `calDue` + `daysUntil`).
- SLA breach (dari `date + slaHours`).
- MTTR/MTBF/Availability/Repeat-Failure (view `Reliability`, dari complaints/repairs/WO).
- Skor kepatuhan BR (lib/compliance.ts).
- Forecast/anomali/rekomendasi (lib/intel.ts).

> Jika Anda tergoda menyimpan nilai yang bisa dihitung dari ledger/timeline, **hitung saja** —
> menjaga single source of truth.
