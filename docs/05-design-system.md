# 05 · Sistem Desain

Identitas: **control-room klinis** — pine/hijau dalam + aksen amber, tipe display tebal
(Archivo) dipadu data monospace (IBM Plex Mono). **Bahasa UI: Indonesia.**

## Design Token (`@theme` di `index.css`)

| Kategori | Token |
|----------|-------|
| Font | `--font-display: Archivo` · `--font-body: IBM Plex Sans` · `--font-mono: IBM Plex Mono` |
| Permukaan | `canvas`, `paper`, `card`, `ink`, `ink2`, `mute`, `line`, `line2` |
| Brand (pine) | `pine-950 → pine-50` (skala lengkap) |
| Status | `ok/okbg` · `warn/warnbg/warnhi` · `danger/dangerbg` · `info/infobg` · `moss` |

Latar ambient: `.ops-bg` (terang) dan `.dark-grain` (panel gelap / header Aset 360°).

## Pustaka Komponen (`components/ui.tsx`)

`Card, SectionHead, Chip, StatusChip, MonoTag, Label/Input/TextArea/Select,
BtnPrimary/BtnGhost/BtnSm, Modal, Kpi, Sparkline, Bar, Tabs, ToastHost, EmptyState, QRGlyph`.

Ikon: **lucide-react** (`<Wrench size={15}/>`) — jangan pakai emoji/ikon font.

## Label Status Bahasa Indonesia

`StatusChip` memakai `statusId(status)` yang memetakan kode → label Indonesia, mis.:

```
IN_SERVICE → Beroperasi        APPROVED → Disetujui       REJECTED → Ditolak
IN_APPROVAL → Menunggu         SENT → Terkirim            RECEIVED → Diterima
PENDING → Menunggu             DELIVERED → Sampai         EXPIRED → Kadaluarsa
DUE_SOON → Segera jatuh tempo  KURANG → Kurang            RUSAK → Rusak
DIAJUKAN → Diajukan            DIGANTI → Diganti          REFUND → Refund
SCHEDULED → Terjadwal          IN_PROGRESS → Dikerjakan   CLOSED → Selesai
```

**Saat menambah status baru:** tambahkan ke `chipFor()` (warna) dan `STATUS_ID` (label Indonesia).

## Pola Visual Wajib

1. **Kontras tipe** — judul `font-display font-black text-[22px]` vs label
   `font-mono uppercase text-[10px]`; angka selalu `font-mono` + `.num`.
2. **Warna status konsisten** — selalu via `chipFor()`/`StatusChip`.
3. **Micro-interaction** — hover angkat kartu, `active:translate-y-px`, reveal `row-in/view-in`.
4. **Umpan balik nyata** — setiap aksi → toast + baris baru di timeline/audit/notif.

## Responsif (mobile)

- Grid selalu `grid-cols-1/2` lalu `md:/lg:/xl:`.
- Tabel: `overflow-x-auto` + `min-w-[…]`.
- Navigasi mobile: **bottom tab bar** ter-filter per role + sheet "Lainnya".
- `viewport-fit=cover` + `env(safe-area-inset-bottom)`.
