# 02 · Model Domain

Semua tipe hidup di `src/lib/types.ts`. Dokumen ini merangkum entitas, enum, state machine,
dan aturan bisnis yang **wajib ditegakkan**.

## Entitas Inti (relasi)

```
BUILDING → ROOM → EQUIPMENT → { ACCESSORY, SPARE_PART, MAINTENANCE(WO), CALIBRATION,
                                COMPLAINT, REPAIR, INSPECTION, ASSIGNMENT, TRANSFER,
                                IMAGE, DOCUMENT, DEPRECIATION, LIFECYCLE_HISTORY }
TECHNICIAN → MAINTENANCE, CALIBRATION, REPAIR, INSPECTION
SUPPLIER   → EQUIPMENT, SPARE_PART, MAINTENANCE, CALIBRATION, REPAIR
```

`Equipment` adalah **agregat pusat** — semua modul teknis foreign-key ke `equipment.id` dan
menulis ke `timeline[]` (BR-018).

## Enum & Status

| Domain | Nilai |
|--------|-------|
| `OpStatus` | `IN_SERVICE · MAINTENANCE · CALIBRATION · DOWN · RETIRED · DISPOSED` |
| `CalStatus` | `VALID · DUE_SOON · EXPIRED · FAILED · NOT_REQUIRED` |
| `Risk` | `HIGH · MEDIUM · LOW` |
| `Criticality` | `CRITICAL · HIGH · MEDIUM · LOW` |
| `Condition` | `EXCELLENT · GOOD · FAIR · POOR` |
| `MaintType` | `PREVENTIVE · CORRECTIVE · PREDICTIVE` |
| `WOStatus` | `SCHEDULED · IN_PROGRESS · AWAITING_VERIFICATION · CLOSED` |
| `ComplaintStatus` | `OPEN · ACKNOWLEDGED · IN_PROGRESS · WAITING_PART · WAITING_VENDOR · RESOLVED · VERIFIED · CLOSED` |
| `RepairStatus` | `ASSESSED · AWAITING_APPROVAL · APPROVED · IN_PROGRESS · TESTING · CLOSED` |
| `TxType` (ledger) | `RECEIPT · TRANSFER · ISSUE · CONSUMPTION · RETURN · ADJUSTMENT · STOCK_OPNAME · EXPIRED · OPENING_BALANCE` |
| `ApprovalType` | `TRANSFER · ADJUSTMENT · REPAIR · PURCHASE · DISPOSAL · LOAN` |
| `IdleStatus` | `ACTIVE · LOW_USAGE · IDLE · UNUSED` |
| `LoanStatus` | `REQUESTED · APPROVED · ON_LOAN · RETURNED · CLOSED · REJECTED` |
| `EventType` (timeline) | `LIFECYCLE · MAINTENANCE · CALIBRATION · COMPLAINT · REPAIR · INSPECTION · SPARE_PART · TRANSFER · COST · DOCUMENT · PROCUREMENT · ASSIGNMENT · UTILIZATION · FINANCE` |

## State Machine

### Asset Lifecycle (umum)
```
PLANNED → REQUESTED → PROCURED → RECEIVED → REGISTERED → ASSIGNED → IN_USE →
MAINTENANCE → TRANSFERRED → RETIRED → DISPOSED
```

### Medical Equipment Lifecycle (detail) — `LIFECYCLE_STAGES`
```
PLANNED → PROCURED → RECEIVED → INSTALLED → REGISTERED → COMMISSIONED → IN_SERVICE
IN_SERVICE ⇄ MAINTENANCE,  IN_SERVICE ⇄ CALIBRATION → IN_SERVICE
IN_SERVICE → COMPLAINT → REPAIR → TESTING → IN_SERVICE → RETIRED → DISPOSED
```
Direpresentasikan via `equipment.lifecycle` (index ke `LIFECYCLE_STAGES`) + `opStatus`.

### Alur Kerja Kunci
```
Demand Planning:  Draft → Submitted → Reviewed → Approved → Procurement Planning
Procurement:      Demand → Purchase Request → Approval(3 tahap) → PO → Supplier → Goods Receipt
Distribution:     Unit Request → Approval → Picking → FIFO/FEFO → Issue → Delivery → Unit Receipt
Stock Opname:     Create → Freeze/Snapshot → Count → Compare → Variance → Verify → Approval → Adjustment
Asset Transfer:   Source → Request → Approval → Order → Handover → Destination
Maintenance:      Schedule → WO → Form → Execute → Submit → Verify → Close
Complaint:        Complaint → Assessment → Classification → Maint/Repair → Resolution → Verify → Close
Repair:           Request → Assessment → Diagnosis → Approval → Execute → Testing → Verify → Close
Asset Loan:       Request → Approval → Allocate → Handover → Usage → Return → Inspection → Close
QR Mobile:        Scan → Detail → {Inspect, Maintain, Calibrate, Complaint, Repair, Transfer, History}
Offline mobile:   Download task → Offline → Scan QR → Input → Local queue → Sync (conflict resolution)
```

## Aturan Bisnis (WAJIB ditegakkan — diverifikasi `compliance.ts`)

| ID | Aturan |
|----|--------|
| BR-001 | Setiap aset punya Asset ID unik |
| BR-002 | Asset ID tidak pernah berubah sepanjang lifecycle |
| BR-003 | Setiap pergerakan inventori menghasilkan entri ledger |
| BR-004 | Stock adjustment wajib beralasan |
| BR-005 | Adjustment di atas threshold wajib approval (`config.adjThreshold`) |
| BR-006 | Transfer aset wajib approval (matrix) |
| BR-007 | Disposal aset wajib approval |
| BR-008 | Transaksi inventori tidak pernah di-hard-delete |
| BR-009 | Riwayat lifecycle aset imutabel |
| BR-010 | Semua transaksi kritis menghasilkan audit log |
| BR-011 | Equipment wajib-kalibrasi harus punya jadwal kalibrasi aktif |
| BR-012 | Kalibrasi kedaluwarsa memicu notifikasi |
| BR-013 | PM lewat jadwal memicu notifikasi |
| BR-014 | Keluhan punya SLA berdasar prioritas (`config.slaByPriority`) |
| BR-015 | Repair tertelusur ke keluhan/permintaan asal |
| BR-016 | Pemakaian spare part decrement stok via transaksi inventori |
| BR-017 | Perubahan kondisi equipment dicatat di condition history |
| BR-018 | Semua aktivitas teknis equipment tampil di Equipment Timeline |

## Integritas Data

- Stok tidak boleh negatif kecuali eksplisit dikonfigurasi (`config.negativeStockAllowed`).
- Satu aset = satu lokasi aktif; satu custodian aktif pada satu waktu.
- Transfer: `source != destination`.
- Item track-batch wajib batch; track-expiry wajib tanggal ED.
- Keluhan RESOLVED wajib punya resolusi; repair CLOSED wajib hasil + tanggal selesai.

## Event Catalog & Envelope (§11)

```
event_id, event_type, aggregate_type, aggregate_id, timestamp, actor, payload, correlation_id
```
`aggregate_type ∈ asset | inventory | work_order | calibration | complaint | repair | approval | procurement`.
Dipancarkan otomatis oleh wrapper reducer (`emitEvent`) — lihat [03 · Store & Aksi](./03-store-and-actions.md).
