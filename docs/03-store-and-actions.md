# 03 · Store & Aksi

Pusat aplikasi: `src/lib/store.tsx`. **Satu-satunya jalur tulis adalah `dispatch(aksi)`.**
View tidak boleh memutasi state langsung.

## Bentuk State (`AppState`)

```ts
{
  view, eqId,                                   // navigasi
  userId, userName, role, userUnit, loggedIn,   // sesi login
  users[],                                      // akun user (untuk login)
  hospitals[], buildings[], floors[], rooms[], units[],   // struktur organisasi-lokasi
  equipment[], timeline[],                      // aset + riwayat per aset
  items[], ledger[],                            // inventori + buku besar hanya-tambah
  purchaseRequests[], purchaseOrders[], deliveries[],     // pengadaan
  handovers[],                                  // BAST serah terima (VENDOR & UNIT)
  vendorReturns[],                              // retur ke vendor
  workOrders[], calibrations[], complaints[],   // teknis
  suppliers[], technicians[],                   // data induk
  audit[], notifs[], toasts[]                   // cross-cutting
}
```

## Semua Aksi (`Act` union)

| Kelompok | Aksi |
|----------|------|
| **Sesi/UI** | `NAV`, `LOGIN_USER`, `LOGOUT`, `TOAST`, `TOAST_DROP`, `NOTIFS_READ` |
| **Inventori** | `ADJUST` (dengan alasan; > Rp 2 jt butuh persetujuan) |
| **Pengadaan — PR** | `PR_CREATE`, `PR_DECIDE`, `PR_DECIDE_ALL`, `PR_REVISE` |
| **Pengadaan — PO** | `PO_CREATE`, `PO_RECEIVE` (bawa `lines: HandoverLine[]` → BAST vendor) |
| **Distribusi** | `DELIVER`, `UNIT_RECEIVE` (bawa `lines` → BAST unit) |
| **Retur vendor** | `RETURN_SEND`, `RETURN_RESOLVE` (`DIGANTI`\|`REFUND`), `RETURN_CLOSE` |
| **Teknis** | `WO_START`, `WO_SUBMIT`, `CALIBRATE`, `CMP_STATUS` |
| **Lokasi** | `LOC_SAVE` (kind: hospital/building/floor/room/unit), `LOC_DELETE` |
| **Aset** | `EQUIP_ADD_PHOTOS`, `EQUIP_ADD_DOCS`, `PRINT_LABEL` |

## Cara Aksi Terhubung ke UI

1. **Interface `Api`** mendeklarasikan method (mis. `receivePo(...)`).
2. **Provider** membungkus tiap method jadi `dispatch({t:"PO_RECEIVE",...})`.
3. View memanggil via `const { s, receivePo, nav, toast } = useApp()`.

## Resep: Menambah Aksi Baru

1. **`types.ts`** — tambah/ubah tipe bila perlu (entitas, enum, `View`).
2. **`store.tsx`**:
   - tambah varian ke union `Act`;
   - tambah `case` di `coreReducer` (mutasi + BAST/ledger bila menyentuh stok + timeline + audit + notif + toast);
   - tambah method di interface `Api` + binding di provider.
3. **`data.ts`** — tambah seed bila entitas baru butuh data awal.
4. **View** — panggil method dari `useApp()`, kunci tombol dengan `canXxx(role)`.
5. **`npm run build`** — wajib 0 error.

## Resep: Menambah View/Modul Baru

1. `types.ts`: tambah id ke union `View` **dan** ke `VIEW_PERM` (indeks modul izin, atau `-1`).
2. Buat `src/views/NamaView.tsx` (default export).
3. `App.tsx`:
   - import view;
   - tambah ke `TITLES` (wajib — `Record<View,string>` akan error jika kurang);
   - tambah item ke `NAV` (otomatis ter-filter per role);
   - tambah `{s.view === "x" && <X/>}` di blok route.
4. Jalankan `npm run build`.

## Pola Reducer yang Sering Dipakai

```ts
const me = { name: s.userName || "system", role: s.role };
next.timeline = [mkTimeline(eqId, "MAINTENANCE", judul, detail, me.name, cost), ...s.timeline];
next.audit    = [mkAudit(me.name, s.role, "ACTION.NAME", "entity", id, reason), ...s.audit];
next.notifs   = [mkNotif("JENIS", "pesan", refId), ...s.notifs];
next.handovers = [bast, ...next.handovers];   // terbitkan BAST
next.ledger   = [mkLedger(sku, "RECEIPT", qty, balance, me.name, ref), ...next.ledger];
```

> Helper tersedia: `mkTimeline, mkAudit, mkNotif, mkLedger, mkEquipmentFromPo, uid, now`.
> Format di types.ts: `fmtIDR, fmtIDRCompact, fmtDate, daysUntil, relTime, initialsOf, nextAssetCode`.
