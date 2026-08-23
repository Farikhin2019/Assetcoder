# SIMASET — Dokumentasi Agentic Coding

Dokumentasi ini ditulis **berdasarkan kode yang benar-benar ada** di proyek (12 view,
13 role, alur pengadaan 3 tahap + BAST + retur). Jika kode berubah, perbarui dokumen ini.

| # | Dokumen | Isi |
|---|---------|-----|
| 00 | [Ringkasan Produk](./00-overview.md) | Apa itu SIMASET, prinsip, cakupan modul |
| 01 | [Arsitektur](./01-architecture.md) | Aliran data universal, pola cross-cutting |
| 02 | [Model Domain](./02-domain-model.md) | Entitas, role, RBAC, aturan bisnis |
| 03 | [Store & Aksi](./03-store-and-actions.md) | `AppState`, semua aksi, resep menambah fitur |
| 04 | [Peta Modul & Alur Pengadaan](./04-module-map.md) | 12 view + alur PR→BAST→retur per peran |
| 05 | [Sistem Desain](./05-design-system.md) | Token, pustaka `ui.tsx`, label Bahasa Indonesia |
| 06 | [Playbook Agen](./06-agent-playbook.md) | Langkah kerja agen AI, aturan keras, checklist |

## Mulai dari mana?

- **Agen AI** → baca [06 · Playbook Agen](./06-agent-playbook.md) dulu.
- **Memahami fitur** → [04 · Peta Modul](./04-module-map.md).
- **Menambah fitur** → [03 · Store & Aksi](./03-store-and-actions.md).

## Perintah

```bash
npm run dev     # server pengembangan
npm run build   # WAJIB dijalankan & harus 0 error sebelum selesai
```
