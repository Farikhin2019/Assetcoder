/* ── SIMASET domain model — PRD v1.0 state machines & enums ── */

export type View =
  | "dashboard" | "equipment" | "equipment-detail" | "inventory" | "logistics" | "opname"
  | "technical" | "complaints" | "procurement" | "reporting"
  | "master" | "locations" | "approvals" | "audit" | "rbac"
  | "utilization" | "rental" | "depreciation" | "intelligence"
  | "mobile" | "disposal" | "integrations"
  | "notifications" | "assetledger" | "config"
  | "command" | "compliance" | "formbuilder"
  | "reliability" | "eventbus";

export type Role =
  | "Direksi" | "Pengelola Aset" | "Pengelola Inventory" | "Kepala Gudang" | "Petugas Gudang"
  | "Kepala Unit" | "Teknisi" | "Kepala Teknisi" | "Auditor" | "IT Administrator"
  | "Finance" | "COO";

export type OpStatus = "IN_SERVICE" | "MAINTENANCE" | "CALIBRATION" | "DOWN" | "RETIRED" | "DISPOSED";
export type CalStatus = "VALID" | "DUE_SOON" | "EXPIRED" | "FAILED" | "NOT_REQUIRED";
export type Risk = "HIGH" | "MEDIUM" | "LOW";
export type Criticality = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type Condition = "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
export type MaintType = "PREVENTIVE" | "CORRECTIVE" | "PREDICTIVE";
export type WOStatus = "SCHEDULED" | "IN_PROGRESS" | "AWAITING_VERIFICATION" | "CLOSED";
export type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type ComplaintStatus = "OPEN" | "ACKNOWLEDGED" | "IN_PROGRESS" | "WAITING_PART" | "WAITING_VENDOR" | "RESOLVED" | "VERIFIED" | "CLOSED";
export type RepairStatus = "ASSESSED" | "AWAITING_APPROVAL" | "APPROVED" | "IN_PROGRESS" | "TESTING" | "CLOSED";
export type TxType = "RECEIPT" | "TRANSFER" | "ISSUE" | "CONSUMPTION" | "RETURN" | "ADJUSTMENT" | "STOCK_OPNAME" | "EXPIRED" | "OPENING_BALANCE";
export type EventType = "LIFECYCLE" | "MAINTENANCE" | "CALIBRATION" | "COMPLAINT" | "REPAIR" | "INSPECTION" | "SPARE_PART" | "TRANSFER" | "COST" | "DOCUMENT" | "PROCUREMENT" | "ASSIGNMENT" | "UTILIZATION" | "FINANCE";
export type ApprovalType = "TRANSFER" | "ADJUSTMENT" | "REPAIR" | "PURCHASE" | "DISPOSAL" | "LOAN";
export type IdleStatus = "ACTIVE" | "LOW_USAGE" | "IDLE" | "UNUSED";
export type LoanStatus = "REQUESTED" | "APPROVED" | "ON_LOAN" | "RETURNED" | "CLOSED" | "REJECTED";
export type NotifKind =
  | "LOW_STOCK" | "CALIBRATION_DUE" | "CALIBRATION_EXPIRED" | "MAINTENANCE_DUE" | "MAINTENANCE_OVERDUE"
  | "COMPLAINT_CREATED" | "COMPLAINT_SLA_BREACH" | "APPROVAL_PENDING" | "STOCK_VARIANCE" | "ASSET_IDLE"
  | "INSPECTION_DUE" | "CONTRACT_EXPIRING" | "REMINDER"
  | "DISPOSAL" | "SYNC";

/* ── entities ── */

export interface Technician { id: string; name: string; specialty: string; cert: string; phone: string; vendor: boolean; }
export interface Supplier { id: string; name: string; service: string; contractUntil: string; contact?: string; }
export interface Accessory { id: string; code: string; name: string; eqId: string; qty: number; condition: Condition; note: string; }
export interface Equipment {
  id: string; code: string; name: string; category: string; brand: string; model: string; serial: string;
  manufacturer: string; prodYear: number; acqDate: string; acqCost: number; supplierId: string; warrantyUntil: string;
  building: string; floor: string; room: string; unit: string; custodian: string; pic: string;
  condition: Condition; opStatus: OpStatus; risk: Risk; criticality: Criticality;
  calRequired: boolean; calStatus: CalStatus; calLast: string | null; calDue: string | null;
  maintStrategy: MaintType; lastMaint: string; nextMaint: string; lifecycle: number; utilization: number; mtbfHours: number;
  docs: { name: string; size: string; kind: string; checksum: string; date: string }[];
}
export interface TimelineEvent { id: string; eqId: string; type: EventType; date: string; title: string; detail: string; actor: string; cost?: number; status?: string; }
export interface InventoryItem { sku: string; name: string; category: string; uom: string; warehouse: string; batch: string | null; expiry: string | null; stock: number; min: number; max: number; reorder: number; unitCost: number; method: "FIFO" | "FEFO"; }
export interface LedgerEntry { id: string; date: string; sku: string; type: TxType; qty: number; balance: number; actor: string; ref: string; reason?: string; }
export interface SparePart { id: string; name: string; code: string; stock: number; min: number; unit: string; unitCost: number; eqIds: string[]; }

export type FormFieldType = "text" | "number" | "checkbox" | "radio" | "select" | "date" | "measurement" | "passfail" | "instruction" | "photo" | "signature" | "attachment";
export interface FormField { id: string; type: FormFieldType; label: string; options?: string[]; unit?: string; required?: boolean; }
export interface FormTemplate { id: string; name: string; fields: FormField[]; }
export interface FormResult { id: string; woId: string; templateId: string; values: Record<string, string>; actor: string; date: string; }

export interface WorkOrder { id: string; wo: string; eqId: string; type: MaintType; techId: string; scheduled: string; status: WOStatus; note: string; laborCost: number; templateId: string; }
export interface CalibrationRecord { id: string; eqId: string; date: string; result: "PASS" | "FAIL" | "ADJUSTED"; cert: string; techId: string; nextDue: string; cost: number; }
export interface Inspection { id: string; code: string; eqId: string; date: string; nextDue: string; inspector: string; checklist: { item: string; pass: boolean }[]; result: "PASS" | "FAIL" | "CONDITIONAL"; note: string; }
export interface Complaint { id: string; code: string; eqId: string; date: string; reporter: string; priority: Priority; description: string; status: ComplaintStatus; slaHours: number; resolution?: string; timelineNote?: string; }
export interface Repair { id: string; code: string; eqId: string; complaintId: string | null; diagnosis: string; partsUsed: { partId: string; qty: number }[]; laborCost: number; status: RepairStatus; techId: string; started: string; }
export interface Approval { id: string; type: ApprovalType; ref: string; summary: string; requester: string; value: number; risk: Risk; matrix: string[]; status: "PENDING" | "APPROVED" | "REJECTED"; date: string; meta?: Record<string, string | number>; }

export interface DemandPlan { id: string; code: string; item: string; qty: number; uom: string; estCost: number; unit: string; needBy: string; status: "DRAFT" | "SUBMITTED" | "REVIEWED" | "APPROVED" | "CONSOLIDATED"; by: string; }

/* ── PR approval: 3 tahap per-barang ──
   Tahap 1: IT (barang IT) atau UMUM (selain IT) → IT Administrator / Pengelola Inventory
   Tahap 2: Keuangan → Finance
   Tahap 3: COO (final)                                                              */
export type PRStageStatus = "PENDING" | "APPROVED" | "REJECTED";
export interface StageDecision { status: PRStageStatus; approver: string; note: string; date: string; }
export interface PRLine { sku: string; name: string; qty: number; unitCost: number; isIT: boolean; stages: StageDecision[]; revision: number; }
export interface PurchaseRequest { id: string; code: string; date: string; requester: string; unit: string; needBy: string; lines: PRLine[]; status: "IN_APPROVAL" | "APPROVED" | "PARTIAL" | "REJECTED" | "PO_CREATED"; }
export interface PurchaseOrder { id: string; code: string; date: string; supplierId: string; items: { sku: string; name: string; qty: number; price: number }[]; total: number; eta: string; status: "SENT" | "PARTIAL" | "RECEIVED" | "CLOSED"; prRef: string; }

export const isITSku = (sku: string) => sku.trim().toUpperCase().startsWith("IT-");
export const prStageLabels = (isIT: boolean): string[] => [isIT ? "IT" : "UMUM", "KEUANGAN", "COO"];
export const prStageRole = (isIT: boolean, idx: number): Role =>
  idx === 0 ? (isIT ? "IT Administrator" : "Pengelola Inventory") : idx === 1 ? "Finance" : "COO";
export const lineState = (l: PRLine): "REJECTED" | "APPROVED" | "IN_APPROVAL" => {
  if (l.stages.some((st) => st.status === "REJECTED")) return "REJECTED";
  if (l.stages.every((st) => st.status === "APPROVED")) return "APPROVED";
  return "IN_APPROVAL";
};
export const lineActiveStage = (l: PRLine): number => l.stages.findIndex((st) => st.status === "PENDING");
export const lineTotal = (l: PRLine) => l.qty * l.unitCost;
export const prTotal = (pr: PurchaseRequest) => pr.lines.reduce((a, l) => a + lineTotal(l), 0);
export const prState = (pr: PurchaseRequest): PurchaseRequest["status"] => {
  if (pr.status === "PO_CREATED") return "PO_CREATED";
  const states = pr.lines.map(lineState);
  if (states.every((x) => x === "APPROVED")) return "APPROVED";
  if (states.some((x) => x === "REJECTED")) return "REJECTED";
  if (states.some((x) => x === "APPROVED")) return "PARTIAL";
  return "IN_APPROVAL";
};
export const mkPendingStages = (): StageDecision[] =>
  [0, 1, 2].map(() => ({ status: "PENDING", approver: "", note: "", date: "" }));

export interface Receipt { id: string; ref: string; date: string; supplierId: string; sku: string; qty: number; batch: string | null; expiry: string | null; poRef: string | null; by: string; }
export interface IssueRec { id: string; ref: string; date: string; sku: string; qty: number; dest: string; strategy: "FIFO" | "FEFO"; by: string; }
export interface OpnameSession { id: string; code: string; date: string; status: "COUNTING" | "CLOSED"; by: string; items: { sku: string; name: string; uom: string; system: number; counted: number | null }[]; }
export interface TransferRecord { id: string; ref: string; eqId: string; date: string; requester: string; fromRoom: string; toBuilding: string; toFloor: string; toRoom: string; reason: string; status: "PENDING" | "APPROVED" | "REJECTED"; decidedBy?: string; decidedAt?: string; }
export interface Building { id: string; name: string; label: string; status: "PLANNED" | "ACTIVE" | "UNDER_RENOVATION" | "INACTIVE"; floors: string[]; year: number; note: string; }
export interface DisposalRecord { id: string; code: string; eqId: string; date: string; method: "LELANG" | "HIBAH" | "PEMUSNAHAN" | "PENJUALAN"; residual: number; proceeds: number; approver: string; note: string; }
export interface Connector { id: string; name: string; target: string; status: "CONNECTED" | "DEGRADED" | "OFFLINE"; p95: number; lastSync: string; evPerMin: number; retries: number; desc: string; }
export interface MobileTask { id: string; code: string; eqId: string; kind: "INSPECTION" | "PM" | "CALIBRATION"; woId?: string; due: string; status: "ASSIGNED" | "DOWNLOADED" | "QUEUED" | "SYNCED"; }
export interface SyncEntry { id: string; ts: string; taskCode: string; event: string; correlationId: string; status: "OK" | "CONFLICT" | "RETRY"; note: string; }
export interface RoomInfo { id: string; building: string; floor: string; name: string; unit: string; }
export interface Warehouse { id: string; name: string; code: string; keeper: string; zones: string[]; capacityLoc: number; usedLoc: number; desc: string; }

/* ── Phase 6: configuration & governance (configuration over hardcoding) ── */

export type NotifChannel = "in-app" | "email" | "whatsapp" | "push";
export interface ApprovalStage { label: string; roles: Role[]; }
export type ApprovalMatrix = Record<ApprovalType, ApprovalStage[]>;
export interface SystemConfig {
  orgName: string;
  hospital: string;
  adjThreshold: number;
  negativeStockAllowed: boolean;
  slaByPriority: Record<Priority, number>;
  calCadence: number[];
  itemCategories: string[];
  uoms: string[];
  channels: Record<NotifChannel, boolean>;
  approvalMatrix: ApprovalMatrix;
}
export interface AssetClassRow { id: string; code: string; name: string; klass: "GEDUNG" | "RUANGAN" | "ALKES" | "KENDARAAN"; location: string; custodian: string; condition: string; status: string; cost: number; book: number; }

/* ── Phase 7: command center & compliance ── */

export interface Branch { id: string; code: string; name: string; city: string; status: "ACTIVE" | "SETUP"; assets: number; value: number; util: number; openIssues: number; }
export type ComplianceStatus = "PASS" | "FLAG" | "NA";
export interface ComplianceCheck { id: string; rule: string; domain: "Asset" | "Inventory" | "Teknis" | "Governance"; desc: string; status: ComplianceStatus; detail: string; }
export interface ApiEndpoint { path: string; method: string; p95: number; rpm: number; errRate: number; }
export interface ActiveSession { id: string; user: string; role: Role; device: string; ip: string; since: string; mfa: boolean; }

/* ── Phase 3: utilization, rental/loan, BGS/SGB, contracts, depreciation ── */

export interface Loan { id: string; code: string; eqId: string; toUnit: string; borrower: string; requested: string; due: string; status: LoanStatus; note: string; returnCondition?: string; }
export interface Rental { id: string; code: string; eqId: string; party: string; start: string; end: string; perDay: number; status: "ACTIVE" | "COMPLETED"; }
export interface BizContract { id: string; code: string; kind: "BGS" | "SGB" | "SERVICE" | "RENTAL"; name: string; party: string; value: number; start: string; until: string; status: "ACTIVE" | "DRAFT" | "EXPIRED"; note: string; }
export interface DepreciationTx { id: string; period: string; eqId: string; amount: number; accumAfter: number; nbvAfter: number; }

export const DEPR_SALVAGE = 0.1;
export const DEPR_LIFE_YEARS: Record<string, number> = { Imaging: 8, "Life Support": 6, Monitoring: 5, Laboratorium: 6, Sterilisasi: 7, Infusion: 5, Poliklinik: 5 };
export const lifeYears = (category: string) => DEPR_LIFE_YEARS[category] ?? 5;
export const monthlyDep = (acqCost: number, category: string) => (acqCost * (1 - DEPR_SALVAGE)) / (lifeYears(category) * 12);
export const periodKey = (dt: Date) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
export const idleStatusOf = (pct: number): IdleStatus => (pct >= 65 ? "ACTIVE" : pct >= 40 ? "LOW_USAGE" : pct >= 15 ? "IDLE" : "UNUSED");

export interface AuditEntry { id: string; date: string; actor: string; role: string; action: string; entity: string; entityId: string; reason?: string; delta?: string; }

/* ── Event bus (§11): every transaction emits an immutable envelope ── */
export interface EventEnvelope {
  event_id: string; event_type: string; aggregate_type: "asset" | "inventory" | "work_order" | "calibration" | "complaint" | "repair" | "approval" | "procurement";
  aggregate_id: string; timestamp: string; actor: string; payload: string; correlation_id: string;
}
export interface Notif { id: string; kind: NotifKind; msg: string; refId: string; date: string; read: boolean; }
export interface Toast { id: string; msg: string; kind: "ok" | "warn" | "err" | "info"; }
export type PermLevel = "full" | "view" | "none";

/* ── reference data ── */

export const LIFECYCLE_STAGES = ["PLANNED", "PROCURING", "RECEIVED", "INSTALLED", "REGISTERED", "COMMISSIONED", "IN_SERVICE", "RETIRED", "DISPOSED"] as const;
export const ADJ_APPROVAL_THRESHOLD = 2_000_000;
export const SLA_BY_PRIORITY: Record<Priority, number> = { CRITICAL: 4, HIGH: 8, MEDIUM: 24, LOW: 72 };
export const CAL_CADENCE = [90, 60, 30, 14, 7];

export const ROLE_USER: Record<Role, { name: string; initials: string }> = {
  "Direksi": { name: "dr. Hartono Wibowo", initials: "HW" },
  "Pengelola Aset": { name: "Rina Kusuma, S.T.", initials: "RK" },
  "Kepala Gudang": { name: "Bambang Prasetyo", initials: "BP" },
  "Petugas Gudang": { name: "Sari Melati", initials: "SM" },
  "Kepala Unit": { name: "Ns. Dewi Lestari", initials: "DL" },
  "Teknisi": { name: "Agus Firmansyah", initials: "AF" },
  "Auditor": { name: "Yusuf Ramadhan", initials: "YR" },
  "Pengelola Inventory": { name: "Galih Saputra", initials: "GS" },
  "Kepala Teknisi": { name: "Hendra Wijaya", initials: "HW" },
  "IT Administrator": { name: "Dian Pratiwi", initials: "DP" },
  "Finance": { name: "Ratna Dewi, S.E.", initials: "RD" },
  "COO": { name: "dr. H. Ahmad Fauzi, MARS", initials: "AF" },
};

export const ROLES: Role[] = ["Direksi", "Pengelola Aset", "Pengelola Inventory", "Kepala Gudang", "Petugas Gudang", "Kepala Unit", "Teknisi", "Kepala Teknisi", "Auditor", "IT Administrator", "Finance", "COO"];

export const ROLE_SCOPE: Record<Role, string> = {
  "Direksi": "Seluruh organisasi (multi-cabang ready)",
  "Pengelola Aset": "Seluruh aset & gedung RS Harapan Medika",
  "Pengelola Inventory": "Semua gudang + ledger inventory",
  "Kepala Gudang": "Semua gudang (WH-01 s.d. WH-04)",
  "Petugas Gudang": "Hanya Gudang BHP Medis (WH-01)",
  "Kepala Unit": "Aset & stok di unit sendiri",
  "Teknisi": "Work order & equipment yang ditugaskan",
  "Kepala Teknisi": "Seluruh WO, kalibrasi & teknisi",
  "Auditor": "Read-only global + audit trail penuh",
  "IT Administrator": "Konfigurasi, RBAC & integrasi · approver PR tahap-1 untuk barang IT",
  "Finance": "Otorisasi keuangan — approver PR tahap-2 (Keuangan)",
  "COO": "Chief Operating Officer — approver PR tahap-3 (final)",
};

/* ── format helpers ── */

export const DAY = 86_400_000;
export const now = () => Date.now();
export const d = (offsetDays: number, hour = 9) => {
  const t = new Date(now() + offsetDays * DAY);
  t.setHours(hour, Math.abs((offsetDays * 17) % 60), 0, 0);
  return t.toISOString();
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const fmtDate = (iso: string) => { const t = new Date(iso); return `${String(t.getDate()).padStart(2, "0")} ${MONTHS[t.getMonth()]} ${t.getFullYear()}`; };
export const fmtTime = (iso: string) => { const t = new Date(iso); return `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`; };
export const fmtDateTime = (iso: string) => `${fmtDate(iso)} · ${fmtTime(iso)}`;
export const daysUntil = (iso: string) => Math.ceil((new Date(iso).getTime() - now()) / DAY);
export const overdueBy = (iso: string) => Math.floor((now() - new Date(iso).getTime()) / DAY);
export const fmtIDR = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");
export const fmtIDRCompact = (n: number) => {
  if (n >= 1e9) return "Rp " + (n / 1e9).toLocaleString("id-ID", { maximumFractionDigits: 2 }) + " M";
  if (n >= 1e6) return "Rp " + (n / 1e6).toLocaleString("id-ID", { maximumFractionDigits: 1 }) + " jt";
  if (n >= 1e3) return "Rp " + (n / 1e3).toLocaleString("id-ID", { maximumFractionDigits: 0 }) + " rb";
  return fmtIDR(n);
};
export const uid = () => Math.random().toString(36).slice(2, 9).toUpperCase();
export const relTime = (iso: string) => {
  const diff = now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m} mnt lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const dd = Math.floor(h / 24);
  return dd === 1 ? "kemarin" : `${dd} hr lalu`;
};
