# 00 · Ringkasan Produk

## Apa itu SIMASET

**Single source of truth** untuk seluruh aset rumah sakit: inventori, alat medis, pemeliharaan,
kalibrasi, keluhan, perbaikan, dan utilisasi — sepanjang siklus hidup penuh:

```
planning → procurement → receiving → registration → storage → distribution →
assignment → in-service → maintenance → calibration → complaint → repair →
transfer → retirement → disposal
```

**Prinsip inti:** *Equipment adalah entitas yang terhubung, bukan catatan terisolasi.* Setiap event
teknis (maintenance / kalibrasi / keluhan / perbaikan / inspeksi) menggulung ke satu
**Equipment Timeline ("Equipment 360°")**.

## Prinsip Desain

| Prinsip | Implementasi di kode |
|---------|---------------------|
| Single source of truth | Satu `AppState`; semua view membaca dari store yang sama |
| Traceability penuh (who/what/when/where/why/before-after) | `AuditEntry` menyimpan `actor, action, entity, entityId, reason, delta` |
| Transaction-driven state (ledger = kebenaran) | `LedgerEntry` append-only; `stock` hanya cache turunan |
| Approval-driven untuk transaksi kritis | `approvals` + `PR` 3-tahap + `ApprovalMatrix` di config |
| Mobile-first field ops | view `Mobile` (PWA offline queue + QR) + bottom-nav mobile |
| Configuration over hardcoding | `SystemConfig` (threshold, SLA, cadence, matrix, kanal, kategori/UoM) |
| No hard-delete pada record kritis | status `RETIRED/DISPOSED/CLOSED`, bukan penghapusan |

## Status Fase (MVP Phasing)

| Fase | Cakupan | Status |
|------|---------|--------|
| **P1** | Master Data, Inventory, Warehouse, Receiving, Distribution, Stock Opname, Building/Room, Medical Equipment, Spare Part, Accessories, Technician, Supplier, Asset Registration/QR/Assignment/Transfer, Dashboard, RBAC, Audit Trail | Selesai |
| **P2** | Procurement, Demand Planning, Maintenance (+Form Builder+WO), Inspection, Calibration (+Reminder), Complaint, Repair, Equipment 360°, Notification, Advanced Reporting, Mobile/PWA | Selesai |
| **P3** | Asset Utilization, Rental, Loan, BGS, SGB, Contract, Depreciation, Advanced Analytics, Idle Detection | Selesai |
| **P4** | AI Demand Forecasting, Inventory Optimization, Predictive Maintenance, Utilization Recommendation, Anomaly Detection, Automated Procurement, AI Executive Assistant | Selesai |
| **P5** | Field Ops (PWA offline), Retirement & Disposal, Integration Hub | Selesai |
| **P6** | Consolidation & Governance: Buku Aset, Pusat Notifikasi, Konfigurasi | Selesai |
| **P7** | Command Center, Security & Compliance, multi-branch, Reliability, Event Bus | Selesai |

## Model Organisasi & Akses

```
Organization → Hospital → Branch → Building → Floor → Unit → Sub Unit → Warehouse → Depot
User → Role → Permission → Organization Scope → Data Scope
```

- 12 role: `Direksi, Manajemen, Pengelola Aset, Pengelola Inventory, UPBJ/Pengadaan, Kepala Gudang,
  Petugas Gudang, Kepala Unit, Petugas Unit, Teknisi, Kepala Teknisi, Finance, Auditor, IT Administrator,
  Vendor, COO` (subset aktif di `ROLES`)
- Akses **ber-scope** — mis. *Petugas Gudang* hanya melihat Gudang BHP Medis (WH-01).
- Matrix izin: `ROLE_PERMS` (modul × role → `full | view | none`), data scope: `ROLE_SCOPE`.

## KPI yang Dilacak

```
Utilization Rate = Actual Usage / Available Time × 100%
Idle Rate        = Idle Time / Available Time × 100%
Availability     = Available Time / Scheduled Time × 100%
```

Plus: Inventory Accuracy, Stock Turnover, Stockout Rate, Expiry Rate, Asset Idle Rate,
Asset Condition Index, PM Compliance, **MTTR, MTBF**, Calibration Compliance, Complaint SLA
Compliance, Repair Completion Rate, Repeat Failure Rate.

## Target Non-Fungsional

- API p95 < 500ms · dashboard p95 < 2s · QR lookup < 1s
- Availability ≥ 99,9% · stateless API + shared DB (PostgreSQL + Redis + Object Storage)
- Security: AuthN, RBAC, permission+org/data scope, session mgmt, password policy, MFA-ready,
  audit trail, enkripsi transit/rest, attachment ACL, API auth, rate limiting.
