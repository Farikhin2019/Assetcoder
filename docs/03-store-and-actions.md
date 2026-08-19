# 03 · Store & Aksi

Pusat seluruh aplikasi: `src/lib/store.tsx`.
**Satu-satunya jalur tulis adalah `dispatch(aksi)`.** View tidak boleh memutasi state langsung.

## Bentuk State (`AppState`)

```ts
{
  view, eqId, role, searchQuery,            // navigasi & sesi
  equipment[], timeline[],                  // agregat pusat + Equipment 360°
  items[], ledger[],                        // inventori + ledger append-only
  spareParts[], workOrders[], calibrations[], inspections[],
  formTemplates[], formResults[],           // form builder
  complaints[], repairs[], approvals[],     // teknis + approval generik
  demandPlans[], purchaseRequests[], purchaseOrders[],  // procurement
  receipts[], issues[], opnames[], transfers[],         // logistik
  technicians[], suppliers[], accessories[],            // master data
  loans[], rentals[], contracts[],                      // pemanfaatan (P3)
  deprPosted{}, utilSeries{},                           // depresiasi + utilisasi
  disposals[], connectors[], mobileTasks[], syncLog[],  // P5
  config,                                   // SystemConfig (P6)
  events[],                                 // event bus §11 (P7)
  audit[], notifs[], toasts[]               // cross-cutting
}
```

## Semua Aksi (`Act` union) — dikelompokkan

| Kelompok | Aksi |
|----------|------|
| **Sesi/UI** | `NAV, ROLE, SEARCH, TOAST, TOAST_DROP, NOTIFS_READ, NOTIF_READ, NOTIF_ALL_READ, NOTIF_TEST` |
| **Aset** | `REGISTER_EQ, ASSIGN, TRANSFER_REQ, PRINT_QR, RETIRE_REQUEST, DISPOSE_CONFIRM` |
| **Teknis** | `COMPLAINT, CMP_STATUS, CALIBRATE, INSPECT, WO_CREATE, WO_START, WO_SUBMIT, REPAIR_PROGRESS, REPAIR_CLOSE` |
| **Inventori** | `ADJUST, RECEIVE, DISTRIBUTE, OPNAME_CREATE, OPNAME_COUNT, OPNAME_FINALIZE` |
| **Procurement** | `DEMAND_SUBMIT, DEMAND_REVIEW, DEMAND_CONSOLIDATE, PR_DECIDE, PR_DECIDE_ALL, PR_REVISE, PO_CREATE, PO_RECEIVE` |
| **Approval** | `APPROVE` (transfer/adjust/repair/disposal/loan — `PURCHASE` lewat PR 3-tahap) |
| **Pemanfaatan** | `LOAN_REQUEST, LOAN_ADVANCE, LOAN_RETURN, LOAN_CLOSE, RENTAL_CREATE, RENTAL_END, DEPRECIATE_POST, LOG_USAGE` |
| **Master** | `ADD_TECH, ADD_SUPPLIER, ADD_ACCESSORY` |
| **Intelligence** | `INTEL_AUDIT, AUTO_PR, APPLY_REC` |
| **Mobile/Integrasi** | `MOBILE_DOWNLOAD, MOBILE_QUEUE, MOBILE_SYNC, CONNECTOR_TOGGLE, CONNECTOR_RETRY` |
| **Konfigurasi** | `CFG_PATCH, CFG_MATRIX` |
| **Form Builder** | `FORM_SAVE, FORM_DELETE` |

## Cara Aksi Terhubung ke UI

1. **Interface `Api`** mendeklarasikan method (mis. `recordCalibration(...)`).
2. **Provider** (`StoreProvider`) membungkus tiap method menjadi `dispatch({t:"CALIBRATE",...})`.
3. View memanggil via hook `const { s, recordCalibration, nav, toast } = useApp()`.

## Event Bus (otomatis)

`reducer(s, a)` = wrapper atas `coreReducer(s, a)`. Wrapper memanggil `emitEvent(a, before, after)`
yang memetakan aksi → `event_type` + `aggregate_type` + `payload`, lalu men-push `EventEnvelope`
ke `events[]`. **Saat menambah aksi baru, tambahkan pemetaannya di `emitEvent`** agar muncul di
Event Bus & telemetri.

## Resep: Menambah Aksi Baru

1. **`types.ts`** — tambah/ubah tipe bila perlu (entitas, enum, `View`).
2. **`store.tsx`**
   - tambah varian ke union `Act`;
   - tambah `case` di `coreReducer` (mutasi + timeline + audit + notif + toast, sesuai pola §01);
   - tambah pemetaan di `emitEvent`;
   - tambah method di interface `Api` + binding di `StoreProvider`.
3. **`data.ts`** — tambah seed bila entitas baru butuh data awal.
4. **View** — panggil method dari `useApp()`.

## Resep: Menambah Modul/View Baru

1. `types.ts`: tambah id ke union `View`.
2. Buat `src/views/NamaView.tsx` (default export).
3. `App.tsx`:
   - import view;
   - tambah ke `TITLES` (wajib — `Record<View,string>` akan error jika kurang);
   - tambah item ke `NAV` (otomatis muncul di sidebar desktop, chip mobile, dan sheet "Semua Modul");
   - tambah `{s.view === "x" && <X/>}` di blok route.
4. Jika butuh gating RBAC, kunci tombol berdasarkan `s.role` (lihat `05-module-map`).
5. Jalankan `npm run build`.

## Pola yang Sering Dipakai di Reducer

```ts
const me = ROLE_USER[s.role];
const next = { ...s };
next.timeline = [mkTimeline(eqId, "MAINTENANCE", judul, detail, me.name, cost), ...s.timeline];
next.audit    = [mkAudit(me.name, s.role, "ACTION.NAME", "entity", id, reason, delta), ...s.audit];
next.notifs   = [mkNotif("MAINTENANCE_DUE", "...", refId), ...s.notifs];
next.toasts   = [...s.toasts, okToast("...")];
```

> Helper: `mkTimeline, mkAudit, mkNotif, mkLedger, okToast, uid, now` — sudah ada di store.tsx.
> Helper format di types.ts: `fmtIDR, fmtIDRCompact, fmtDate, fmtDateTime, daysUntil, overdueBy, relTime`.
