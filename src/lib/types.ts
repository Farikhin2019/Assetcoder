/* ── SIMASET domain model ── */

export type View =
  | "login" | "command" | "dashboard" | "equipment" | "equipment-detail"
  | "inventory" | "procurement" | "maintenance" | "locations" | "approvals"
  | "audit" | "rbac" | "master" | "config";

export type Role =
  | "Direksi" | "COO" | "Finance" | "Umum" | "Pengelola Aset" | "Pengelola Inventory"
  | "Kepala Gudang" | "Petugas Gudang" | "Kepala Unit" | "Teknisi" | "Kepala Teknisi"
  | "IT Administrator" | "Auditor";

/* ── entities ── */

export interface UserAccount { id: string; name: string; role: Role; unit: string | null; email: string; active: boolean; }
export interface Hospital { id: string; code: string; name: string; kind: string; status: "AKTIF" | "RENCANA" | "NONAKTIF"; address: string; main: boolean; }
export interface Building { id: string; hospitalId: string; name: string; label: string; status: "PLANNED" | "ACTIVE" | "UNDER_RENOVATION" | "INACTIVE"; year: number; note: string; }
export interface Floor { id: string; buildingId: string; name: string; }
export interface RoomInfo { id: string; buildingId: string; floorId: string; name: string; unit: string; }
export interface UnitNode { id: string; name: string; head: string; }

export interface Equipment {
  id: string; code: string; name: string; category: string; brand: string; model: string; serial: string;
  acqDate: string; acqCost: number; supplierId: string;
  building: string; floor: string; room: string; unit: string; custodian: string;
  condition: "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
  opStatus: "IN_SERVICE" | "MAINTENANCE" | "CALIBRATION" | "DOWN" | "RETIRED" | "DISPOSED";
  risk: "HIGH" | "MEDIUM" | "LOW";
  calStatus: "VALID" | "DUE_SOON" | "EXPIRED" | "NOT_REQUIRED";
  nextMaint: string; utilization: number; poRef?: string;
}

export interface InventoryItem { sku: string; name: string; category: string; uom: string; warehouse: string; stock: number; min: number; reorder: number; unitCost: number; method: "FIFO" | "FEFO"; }
export type TxType = "RECEIPT" | "ISSUE" | "CONSUMPTION" | "ADJUSTMENT" | "OPENING_BALANCE" | "STOCK_OPNAME";
export interface LedgerEntry { id: string; date: string; sku: string; type: TxType; qty: number; balance: number; actor: string; ref: string; }

export type PRStageStatus = "PENDING" | "APPROVED" | "REJECTED";
export interface StageDecision { status: PRStageStatus; approver?: string; note?: string; date?: string; }
export interface PRLine { id: string; kind: "ITEM" | "ASSET"; sku?: string; name: string; category?: string; qty: number; unitCost: number; stages: StageDecision[]; }
export interface PurchaseRequest { id: string; code: string; date: string; requester: string; unit: string; needBy: string; status: "IN_APPROVAL" | "APPROVED" | "REJECTED" | "PO_CREATED"; lines: PRLine[]; }
export interface PurchaseOrder { id: string; code: string; date: string; supplierId: string; items: { kind: "ITEM" | "ASSET"; sku?: string; name: string; category?: string; qty: number; price: number }[]; total: number; eta: string; status: "SENT" | "RECEIVED"; prRef: string; }
export interface Delivery { id: string; code: string; date: string; poRef: string; unit: string; items: { name: string; qty: number }[]; status: "PENDING" | "DELIVERED" | "RECEIVED"; courier?: string; receivedBy?: string; }

/* ── Serah terima / BAST (pencatatan penerimaan dari vendor & penyerahan ke unit) ── */
export type HandoverKind = "VENDOR" | "UNIT";
export type HandoverCondition = "BAIK" | "KURANG" | "RUSAK";
export interface HandoverLine { name: string; qty: number; condition: HandoverCondition; }
export interface HandoverRecord {
  id: string; code: string; kind: HandoverKind; date: string; ref: string;
  from: string; to: string; items: HandoverLine[];
  receivedBy: string; handedBy?: string; note?: string; checksum: string;
}

export interface WorkOrder { id: string; wo: string; eqId: string; type: "PREVENTIVE" | "CORRECTIVE"; techId: string; scheduled: string; status: "SCHEDULED" | "IN_PROGRESS" | "CLOSED"; note: string; laborCost: number; }
export interface CalibrationRecord { id: string; eqId: string; date: string; result: "PASS" | "FAIL"; cert: string; nextDue: string; cost: number; }
export interface Complaint { id: string; code: string; eqId: string; date: string; reporter: string; priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"; description: string; status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"; slaHours: number; }
export interface Supplier { id: string; name: string; service: string; contractUntil: string; }
export interface Technician { id: string; name: string; specialty: string; cert: string; }
export interface AuditEntry { id: string; date: string; actor: string; role: string; action: string; entity: string; entityId: string; reason?: string; }
export interface Notif { id: string; kind: string; msg: string; refId: string; date: string; read: boolean; }
export interface Toast { id: string; msg: string; kind: "ok" | "warn" | "err" | "info"; }
export interface TimelineEvent { id: string; eqId: string; type: string; date: string; title: string; detail: string; actor: string; cost?: number; }

export type PermLevel = "full" | "view" | "none";

/* ── reference data ── */
export const DAY = 86_400_000;
export const now = () => Date.now();
export const d = (offsetDays: number, hour = 9) => {
  const t = new Date(now() + offsetDays * DAY);
  t.setHours(hour, Math.abs((offsetDays * 17) % 60), 0, 0);
  return t.toISOString();
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const fmtDate = (iso: string) => { const t = new Date(iso); return `${String(t.getDate()).padStart(2, "0")} ${MONTHS[t.getMonth()]} ${t.getFullYear()}`; };
export const fmtIDR = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");
export const fmtIDRCompact = (n: number) => {
  if (n >= 1e9) return "Rp " + (n / 1e9).toLocaleString("id-ID", { maximumFractionDigits: 2 }) + " M";
  if (n >= 1e6) return "Rp " + (n / 1e6).toLocaleString("id-ID", { maximumFractionDigits: 1 }) + " jt";
  if (n >= 1e3) return "Rp " + (n / 1e3).toLocaleString("id-ID", { maximumFractionDigits: 0 }) + " rb";
  return fmtIDR(n);
};
export const daysUntil = (iso: string) => Math.ceil((new Date(iso).getTime() - now()) / DAY);
export const uid = () => Math.random().toString(36).slice(2, 9).toUpperCase();
export const relTime = (iso: string) => {
  const m = Math.floor((now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m} mnt lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hr lalu`;
};
export const initialsOf = (name: string) =>
  name.replace(/[,.]/g, "").split(/\s+/).filter((w) => w.length > 0).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

/* ── RBAC ── */

export const ROLES: Role[] = ["Direksi", "COO", "Finance", "Umum", "Pengelola Aset", "Pengelola Inventory", "Kepala Gudang", "Petugas Gudang", "Kepala Unit", "Teknisi", "Kepala Teknisi", "IT Administrator", "Auditor"];

export const ROLE_USER: Record<Role, { name: string; initials: string }> = {
  "Direksi": { name: "dr. Hartono Wibowo", initials: "HW" },
  "COO": { name: "dr. H. Ahmad Fauzi, MARS", initials: "AF" },
  "Finance": { name: "Ratna Dewi, S.E.", initials: "RD" },
  "Umum": { name: "Bambang Prasetyo", initials: "BP" },
  "Pengelola Aset": { name: "Rina Kusuma, S.T.", initials: "RK" },
  "Pengelola Inventory": { name: "Galih Saputra", initials: "GS" },
  "Kepala Gudang": { name: "Bambang Prasetyo", initials: "BP" },
  "Petugas Gudang": { name: "Sari Melati", initials: "SM" },
  "Kepala Unit": { name: "Ns. Dewi Lestari", initials: "DL" },
  "Teknisi": { name: "Agus Firmansyah", initials: "AF" },
  "Kepala Teknisi": { name: "Hendra Wijaya", initials: "HW" },
  "IT Administrator": { name: "Dian Pratiwi", initials: "DP" },
  "Auditor": { name: "Yusuf Ramadhan", initials: "YR" },
};

/* Modul izin (kolom). Urutan harus konsisten dengan ROLE_PERMS. */
export const PERM_MODULES = [
  "Dashboard & Analytics", "Equipment 360°", "Inventory & Ledger", "Procurement", "Maintenance & Kalibrasi",
  "Lokasi & Organisasi", "Persetujuan", "Master Data", "Audit Trail", "Pelaporan", "RBAC & Konfigurasi",
];

/* View → index modul di PERM_MODULES (-1 = selalu terbuka). Untuk filter menu per role. */
export const VIEW_PERM: Record<View, number> = {
  login: -1,
  command: 0, dashboard: 0,
  equipment: 1, "equipment-detail": 1,
  inventory: 2,
  procurement: 3,
  maintenance: 4,
  locations: 5,
  approvals: 6,
  master: 7,
  audit: 8,
  rbac: 10, config: 10,
};

export const ROLE_PERMS: Record<Role, PermLevel[]> = {
  "Direksi":            ["full", "view", "view", "view", "view", "view", "full", "view", "view", "full", "view"],
  "COO":                ["full", "view", "view", "full", "view", "view", "full", "view", "view", "full", "view"],
  "Finance":            ["view", "none", "view", "full", "none", "none", "full", "none", "view", "full", "none"],
  "Umum":               ["view", "view", "view", "full", "none", "full", "full", "full", "view", "view", "none"],
  "Pengelola Aset":     ["full", "full", "view", "full", "full", "full", "full", "full", "view", "view", "none"],
  "Pengelola Inventory":["view", "view", "full", "full", "none", "view", "view", "full", "view", "view", "none"],
  "Kepala Gudang":      ["view", "view", "full", "view", "none", "view", "view", "view", "none", "none", "none"],
  "Petugas Gudang":     ["view", "view", "view", "none", "none", "view", "none", "none", "none", "none", "none"],
  "Kepala Unit":        ["view", "view", "view", "full", "view", "none", "view", "none", "none", "none", "none"],
  "Teknisi":            ["view", "view", "view", "none", "full", "view", "none", "view", "none", "none", "none"],
  "Kepala Teknisi":     ["view", "full", "view", "view", "full", "view", "view", "full", "view", "view", "none"],
  "IT Administrator":   ["view", "view", "view", "view", "none", "full", "none", "full", "view", "view", "full"],
  "Auditor":            ["view", "view", "view", "view", "view", "view", "view", "view", "full", "full", "none"],
};

export const ROLE_SCOPE: Record<Role, string> = {
  "Direksi": "Seluruh organisasi (multi-cabang)",
  "COO": "Seluruh operasional RS",
  "Finance": "Keuangan, anggaran & approval nilai",
  "Umum": "Aset umum, pengadaan non-IT & lokasi",
  "Pengelola Aset": "Seluruh aset & gedung RS",
  "Pengelola Inventory": "Semua gudang + ledger",
  "Kepala Gudang": "Semua gudang (WH-01 s.d. WH-04)",
  "Petugas Gudang": "Hanya Gudang BHP Medis (WH-01)",
  "Kepala Unit": "Aset & stok di unit sendiri",
  "Teknisi": "Work order & equipment yg ditugaskan",
  "Kepala Teknisi": "Seluruh WO, kalibrasi & teknisi",
  "IT Administrator": "Konfigurasi, RBAC & integrasi",
  "Auditor": "Read-only global + audit trail penuh",
};

export const SLA_BY_PRIORITY: Record<string, number> = { CRITICAL: 4, HIGH: 8, MEDIUM: 24, LOW: 72 };
export const ADJ_APPROVAL_THRESHOLD = 2_000_000;
