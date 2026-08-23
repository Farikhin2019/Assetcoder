# 01 · Arsitektur

## Bentuk Sistem

Aplikasi client-side **state-driven** (React + Vite + Tailwind). Seluruh domain hidup di satu
reducer terpusat (`src/lib/store.tsx`). Setiap konsep sudah punya padanan yang siap diangkat ke
layanan backend (Asset / Inventory / Technical).

```
┌──────────────────────────────────────────────────────┐
│  WEB / MOBILE  (React)                               │
│    views/ ──baca──▶ AppState (useReducer + Context)  │
│      │                     ▲                         │
│      └──aksi──▶ dispatch ──┘  (satu-satunya jalur tulis)
└──────────────────────────────────────────────────────┘
```

## Aliran Data Universal (pola terpenting)

Setiap aksi domain melewati alur yang sama di `coreReducer`. Contoh `PO_RECEIVE`:

```
aksi user → dispatch({t:"PO_RECEIVE",...})
  ├─ mutasi entitas utama     (purchaseOrders, items.stock, equipment[])
  ├─ terbitkan BAST           (handovers[] — pencatatan serah terima)
  ├─ posting ledger           (RECEIPT — hanya-tambah, BR-003)
  ├─ daftar aset otomatis     (bila baris ASSET — tertelusur ke PO)
  ├─ buat retur otomatis      (bila ada baris KURANG/RUSAK)
  ├─ push TimelineEvent       (muncul di Aset 360°)
  ├─ push AuditEntry          (BR-010, imutabel)
  ├─ push Notif               (ke peran berikutnya)
  └─ push Toast               (umpan balik UI)
```

**Jangan** menulis timeline/audit/ledger secara manual dari view — selalu lewat aksi reducer.

## Pola Cross-Cutting (jangan di-inline per modul)

| Layanan | Rumah di kode | Catatan |
|---------|--------------|---------|
| Audit logging | `mkAudit()` + `audit[]` + view Audit | imutabel, semua aksi kritis |
| Buku besar stok | `mkLedger()` + `ledger[]` | hanya-tambah; FIFO/FEFO |
| BAST / serah terima | `handovers[]` + tab "Serah Terima" | terbit otomatis saat GRN & serah terima unit |
| Retur vendor | `vendorReturns[]` | dibuat otomatis dari selisih GRN |
| Notifikasi | `mkNotif()` + `notifs[]` | ke peran penanggung jawab berikutnya |
| RBAC | `VIEW_PERM`, `ROLE_PERMS`, `canSeeView()` | filter menu + cegat navigasi |
| Timeline aset | `mkTimeline()` + `timeline[]` | semua kegiatan teknis per aset |

## Gerbang Akses

- **Login** (`views/Login.tsx`): pilih user → `loggedIn=true`, role & unit ter-set, masuk ke
  halaman awal sesuai peran.
- **Filter menu**: sidebar/bottom-nav hanya menampilkan modul yang `canSeeView(role, view)`
  bukan `"none"`.
- **Cegat navigasi**: aksi `NAV` di reducer menolak perpindahan ke modul terlarang + toast.
- **Kunci tombol**: tiap aksi tulis dicek dengan fungsi `canXxx(role)` di view; tombol
  `disabled` + tooltip bila bukan wewenangnya.

## Integrasi (target produksi)

SIMRS, Finance/Accounting, Procurement, HR, EMR · eksternal: Supplier, Payment, Notification,
pelaporan pemerintah. Di kode, konektor dimodelkan agar siap disambungkan.
