# SIMASET — Dokumentasi Agentic Coding

> Sistem Informasi Manajemen Aset Rumah Sakit
> Enterprise Asset Lifecycle + Inventory + Utilization · Web + Mobile/PWA

Dokumentasi ini dirancang agar **agen AI (dan developer baru)** dapat memahami, memodifikasi, dan memperluas
SIMASET dengan benar — tanpa menebak. Baca berurutan, atau lompat ke bagian yang relevan.

## Peta Dokumen

| # | Dokumen | Untuk siapa / kapan dibaca |
|---|---------|---------------------------|
| 00 | [Ringkasan Produk](./00-overview.md) | Pahami apa ini, prinsip inti, status fase |
| 01 | [Arsitektur](./01-architecture.md) | Pahami bentuk sistem, aliran data, pola cross-cutting |
| 02 | [Model Domain](./02-domain-model.md) | Entitas, enum, state machine, aturan bisnis (BR) |
| 03 | [Store & Aksi](./03-store-and-actions.md) | State, reducer, semua aksi, **resep menambah aksi/modul** |
| 04 | [Data & Seed](./04-data-and-seed.md) | Struktur `data.ts`, konvensi seed, cara menambah data |
| 05 | [Peta Modul](./05-module-map.md) | Semua view/route, tanggung jawab, gating RBAC |
| 06 | [Sistem Desain](./06-design-system.md) | Design token, pustaka komponen, pola visual |
| 07 | [Playbook Agen](./07-agent-playbook.md) | **Mulai di sini jika Anda agen AI**: aturan, checklist, jebakan, perintah build |

## Sekilas Teknologi

- **React 18 + TypeScript** (strict), bundler **Vite**
- **Tailwind CSS v4** — token didefinisikan via `@theme` di `src/index.css`
- **State terpusat** — satu `useReducer` + React Context di `src/lib/store.tsx` (tanpa library state eksternal)
- **Tanpa backend** — seluruh domain berjalan client-side di atas seed deterministik (`src/lib/data.ts`)
- **Font** — Archivo (display) + IBM Plex Sans (body) + IBM Plex Mono (data/kode)

## Struktur Inti

```
src/
  main.tsx            # entry → render <App/>
  App.tsx             # StoreProvider → Shell (sidebar, topbar, route, mobile nav)
  index.css           # Tailwind v4 + @theme token + keyframes
  lib/
    types.ts          # semua tipe domain + helper format (JANGAN taruh UI di sini)
    data.ts           # seed deterministik + konstanta referensi
    store.tsx         # reducer + event bus + Context + semua aksi
    intel.ts          # model rule-based (forecast, optimasi, PM-risk, anomali)
    compliance.ts     # verifikasi aturan bisnis BR-001..BR-018 live
  components/
    ui.tsx            # pustaka primitif (Chip, Card, Modal, Kpi, ...)
    icons.tsx         # seluruh ikon SVG inline
    modals.tsx        # modal lintas-modul (Register, WO, Calibration, Inspection)
  views/              # 30 halaman (satu file per modul)
docs/                 # dokumen ini
```

## Prinsip yang TIDAK Boleh Dilanggar

1. **Ledger adalah kebenaran** — setiap mutasi stok = satu baris `LedgerEntry` append-only (BR-003/008). Jangan pernah mengedit saldo langsung.
2. **Setiap aksi teknis menulis ke timeline** (BR-018) — Equipment 360° adalah agregat pusat.
3. **Setiap aksi kritis menulis audit** (BR-010) — audit trail imutabel.
4. **Asset ID imutabel** (BR-002) — jangan pernah mengubah `code` aset.
5. **Konfigurasi di atas hardcode** — threshold, SLA, cadence, approval matrix hidup di `SystemConfig`.
6. **Tidak ada hard-delete** untuk record kritis — gunakan status/tombol arsip.
