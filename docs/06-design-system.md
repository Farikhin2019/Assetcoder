# 06 · Sistem Desain

Identitas visual SIMASET: **control-room klinis** — pine/hijau dalam + aksen amber, tipe display
tebal (Archivo) dipadu data monospace (IBM Plex Mono). Bukan template generik.

## Design Token (`@theme` di index.css)

| Kategori | Token |
|----------|-------|
| Font | `--font-display: Archivo` · `--font-body: IBM Plex Sans` · `--font-mono: IBM Plex Mono` |
| Permukaan | `canvas #eef1ee` · `paper #fbfcfa` · `card #fff` · `ink #14211c` · `ink2` · `mute #77867e` · `line #dbe3dc` |
| Brand (pine) | `pine-950 #081511` → `pine-50 #eaf3ee` (skala lengkap) |
| Status | `ok #1f7a48 / okbg` · `warn #a3650c / warnbg / warnhi #f2a93b` · `danger #bb3a2b / dangerbg` · `info #2c6e8f / infobg` · `moss #e3ede6` |

Latar ambient berlapis: `.ops-bg` (konten terang) dan `.dark-grain` (panel gelap / Command Center).

## Pustaka Komponen (`components/ui.tsx`)

| Komponen | Kegunaan |
|----------|----------|
| `Chip, StatusChip` | Badge status (warna via `chipFor(status)`) |
| `Card, SectionHead, MonoTag` | Permukaan & label |
| `Label, Input, TextArea, Select` | Form control konsisten |
| `BtnPrimary, BtnGhost, BtnDanger, BtnSm` | Tombol (dukung `disabled` + `title` utk gating) |
| `Modal` | Dialog (Esc/backdrop close, footer opsional, `wide`) |
| `Kpi, Sparkline, Bar` | Visualisasi data |
| `Tabs` | Tab dengan `counts` |
| `ToastHost` | Notifikasi inline |
| `QRGlyph` | Glyph QR deterministik per aset |
| `EmptyState` | Kondisi kosong |

Ikon: seluruhnya **SVG inline** di `components/icons.tsx` (`<IcX size={15}/>`). Jangan pakai emoji/ikon font.

## Pola Visual Wajib

1. **Kontras ukuran/berat tipe** — judul `font-display font-black text-[22px]` vs label
   `font-mono uppercase tracking-[0.12em] text-[10px]`. Angka selalu `font-mono` + `.num` (tabular).
2. **Hirarki status lewat warna** — selalu via `chipFor()`; jangan temukan warna status sendiri.
3. **Micro-interaction** — `transition`, hover angkat kartu (`hover:-translate-y-0.5 hover:shadow-xl`),
   `active:translate-y-px` pada tombol, `row-in`/`view-in` reveal saat render.
4. **Motion** — keyframes di index.css: `viewIn, rowIn, toastIn, modalIn, pulseDot, tickerScroll,
   drawLine (sparkline), sheetUp, scanline, radarRing, typing-dot`.
5. **Data density** — tabel `text-[12.5px]`, label header `text-[10px] uppercase mono`.

## Yang Dihindari (default AI)

- Hero trio terpusat, 3-4 kartu fitur sama rata, gradient headline indigo/violet, font tunggal
  Inter/Roboto, glassmorphism menyeluruh, `rounded-2xl` di mana-mana, blob aurora, palet
  krem-terracotta-serif, latar near-black + satu aksen neon, grid koran padat bergaris rambut.
- **Pengecualian disengaja:** Command Center & Event Bus memakai latar gelap + aksen pine/amber —
  ini *control-room* yang khas untuk subjeknya, bukan "near-black + satu neon".

## Responsif (mobile)

- Grid selalu `grid-cols-1/2` lalu `md:/lg:/xl:`.
- Tabel: `overflow-x-auto` + `min-w-[…]`.
- Navigasi mobile: **bottom tab bar** (Command/Pantau/Aset/Setuju/Lainnya) + sheet "Semua Modul".
- `safe-area`: `viewport-fit=cover` + `env(safe-area-inset-bottom)` (`.safe-bottom`).
- Konten diberi `pb-28` di mobile agar tak tertutup tab bar.
- Toast terangkat di atas tab bar pada layar kecil.
- Sparkline KPI disembunyikan `<640px` agar angka terbaca.
