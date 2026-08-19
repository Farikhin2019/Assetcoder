# 01 · Arsitektur

## Bentuk Sistem (saat ini)

SIMASET dibangun sebagai **aplikasi client-side state-driven**. Seluruh domain (aset, ledger,
approval, event) hidup di satu reducer terpusat. Ini adalah bentuk *front-end-first* dari
arsitektur target di bawah — setiap konsep sudah memiliki padanan yang siap diangkat ke layanan.

```
┌─────────────────────────────────────────────────────────┐
│  WEB APP / MOBILE-PWA  (React)                          │
│    views/  ──baca──▶  AppState (useReducer + Context)   │
│      │                    ▲                             │
│      └──aksi──▶ dispatch ─┘  (satu-satunya jalur tulis) │
└─────────────────────────────────────────────────────────┘
```

## Arsitektur Referensi (target produksi, PRD §13)

```
WEB APP / MOBILE-PWA → API GATEWAY → APPLICATION API
                                        │
              ┌─────────────────────────┼─────────────────────────┐
              ▼                         ▼                         ▼
        Asset Service           Inventory Service          Technical Service
        (lifecycle, transfer,   (warehouse, stock,         (maintenance, calibration,
         inspection, assign,    procurement,               complaint, repair, equipment)
         depreciation)          distribution)
              └─────────────────────────┼─────────────────────────┘
                                  PostgreSQL + Redis + Object Storage
                                        │
                                  Event/Queue → SIMRS, Finance, Notification
```

**Kunci:** tiga layanan (Asset / Inventory / Technical) berbagi **Equipment** sebagai agregat
pusat dan menulis ke proyeksi timeline yang sama. Di kode, ini terwujud sebagai satu `AppState`
dengan `timeline: TimelineEvent[]`.

## Aliran Data Universal (pola terpenting)

**Setiap aksi domain** melewati alur yang sama di `coreReducer` (store.tsx). Contoh `CALIBRATE`:

```
aksi user → dispatch({t:"CALIBRATE",...})
  ├─ mutasi entitas utama        (equipment[].calStatus, calibrations[])
  ├─ push TimelineEvent          (BR-018: muncul di Equipment 360°)
  ├─ push AuditEntry             (BR-010: imutabel)
  ├─ push Notif                  (mesin notifikasi)
  ├─ push LedgerEntry            (jika menyentuh stok — BR-003/016)
  └─ push Toast                  (feedback UI)
```

Setelah `coreReducer` mengembalikan state baru, **wrapper `reducer`** memanggil
`emitEvent(aksi, stateSebelum)` yang memetakan aksi → **EventEnvelope** (§11) dan men-push-nya ke
`events[]` (maks 140) — dikonsumsi oleh Event Bus, Integration Hub, dan downstream. **Jangan**
menulis event secara manual; wrapper melakukannya otomatis untuk semua aksi yang terpetakan di
`emitEvent`.

## Pola Cross-Cutting (jangan di-inline per modul)

| Layanan | Rumah di kode | Catatan |
|---------|--------------|---------|
| Approval matrix | `SystemConfig.approvalMatrix` + view `Approvals`/`Procurement` | config-driven (PRD §8 build note 5) |
| Notification engine | `mkNotif()` + `notifs[]` + view `NotificationCenter` | 16+ event type (`NotifKind`) |
| Audit logging | `mkAudit()` + `audit[]` + view `AuditTrail` | imutabel, semua aksi kritis |
| Inventory engine | `mkLedger()` + `ledger[]` | append-only; FIFO/FEFO |
| Event bus | wrapper `reducer` + `emitEvent()` + `events[]` | envelope §11 |
| Intelligence | `lib/intel.ts` | model rule-based deterministik |
| Compliance | `lib/compliance.ts` | verifikasi BR live |

> **Aturan emas (PRD §17):** approval, notifikasi, dan audit adalah layanan *cross-cutting* —
> hampir semua modul bergantung pada ketiganya. Saat menambah modul, **pakai helper yang ada**,
> jangan buat mekanisme paralel.

## Konsumsi Spare Part (BR-016)

Konsumsi spare part (di repair/maintenance) **wajib lewat inventory engine yang sama** —
jangan pernah membuat mekanisme stok paralel. Lihat `submitWorkOrder` → posting `CONSUMPTION`
ke ledger dan decrement `spareParts[].stock`.

## Scheduler / Background Job

Reminder kalibrasi & PM (due/overdue) dirancang sebagai **schedulable job**, bukan sekadar field
tanggal jatuh tempo. Di implementasi client-side, ini disimulasikan: status `calStatus`
(`DUE_SOON/EXPIRED`) dan `nextMaint` dihitung/dibandingkan terhadap `daysUntil()` saat render,
dan mesin compliance (`BR-012/013`) memverifikasi notifikasinya terpicu.

## Integrasi (target)

- **Internal:** SIMRS, Finance/Accounting, Procurement, HR, EMR
- **Eksternal:** Supplier, Payment, Notification, Government Reporting (ASPAK)
- View `Integrations` memodelkan konektor + kesehatan + retry idempoten.
