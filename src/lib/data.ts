import {
  AssetDoc, AssetPhoto, AuditEntry, Building, CalibrationRecord, Complaint, Delivery, Equipment, Floor,
  HandoverRecord, Hospital, InventoryItem, LedgerEntry, Notif, PRLine, PurchaseOrder, PurchaseRequest, RoomInfo,
  StageDecision, Supplier, Technician, TimelineEvent, UnitNode, UserAccount, VendorReturn, WorkOrder, d, uid,
} from "./types";

/* ── user & struktur organisasi-lokasi ── */
export const USERS: UserAccount[] = [
  { id: "US-01", name: "dr. Hartono Wibowo", role: "Direksi", unit: null, email: "hartono.wibowo@rs-harapan.id", active: true },
  { id: "US-02", name: "dr. H. Ahmad Fauzi, MARS", role: "COO", unit: null, email: "ahmad.fauzi@rs-harapan.id", active: true },
  { id: "US-03", name: "Bambang Prasetyo", role: "Umum", unit: "Umum", email: "bambang.prasetyo@rs-harapan.id", active: true },
  { id: "US-04", name: "Ratna Dewi, S.E.", role: "Finance", unit: "Keuangan", email: "ratna.dewi@rs-harapan.id", active: true },
  { id: "US-05", name: "Rina Kusuma, S.T.", role: "Pengelola Aset", unit: null, email: "rina.kusuma@rs-harapan.id", active: true },
  { id: "US-06", name: "Galih Saputra", role: "Pengelola Inventory", unit: "Gudang", email: "galih.saputra@rs-harapan.id", active: true },
  { id: "US-07", name: "Sari Melati", role: "Petugas Gudang", unit: "Gudang", email: "sari.melati@rs-harapan.id", active: true },
  { id: "US-08", name: "Ns. Dewi Lestari", role: "Kepala Unit", unit: "ICU", email: "dewi.lestari@rs-harapan.id", active: true },
  { id: "US-09", name: "Agus Firmansyah", role: "Teknisi", unit: "Teknik", email: "agus.firmansyah@rs-harapan.id", active: true },
  { id: "US-10", name: "Hendra Wijaya", role: "Kepala Teknisi", unit: "Teknik", email: "hendra.wijaya@rs-harapan.id", active: true },
  { id: "US-11", name: "Dian Pratiwi", role: "IT Administrator", unit: "IT", email: "dian.pratiwi@rs-harapan.id", active: true },
  { id: "US-12", name: "Yusuf Ramadhan", role: "Auditor", unit: null, email: "yusuf.ramadhan@rs-harapan.id", active: true },
];

export const HOSPITALS: Hospital[] = [
  { id: "H-01", code: "RS-HM", name: "RS Harapan Medika", kind: "RS Umum · Kelas B", status: "AKTIF", address: "Jl. Melati Raya No. 17, Bandung", main: true },
  { id: "H-02", code: "KSC", name: "Klinik Satelit Cempaka", kind: "Klinik Pratama · Jejaring", status: "AKTIF", address: "Jl. Cempaka No. 4, Bandung", main: false },
];

export const BUILDINGS: Building[] = [
  { id: "B-01", hospitalId: "H-01", name: "Gedung A", label: "IGD & Emergensi", status: "ACTIVE", year: 2016, note: "IGD resusitasi & triase 24 jam di L1." },
  { id: "B-02", hospitalId: "H-01", name: "Gedung B", label: "Rawat Jalan & HD", status: "ACTIVE", year: 2019, note: "Poliklinik gigi & kebidanan, unit hemodialisa di L2." },
  { id: "B-03", hospitalId: "H-01", name: "Gedung C", label: "Penunjang Medis", status: "ACTIVE", year: 2018, note: "Radiologi & CSSD di L1–L2, laboratorium di L3." },
  { id: "B-04", hospitalId: "H-01", name: "Gedung D", label: "Rawat Inap & ICU", status: "ACTIVE", year: 2012, note: "ICU / ICCU di L2, perinatologi di L3." },
  { id: "B-05", hospitalId: "H-01", name: "Gedung E", label: "Onkologi (rencana)", status: "PLANNED", year: 2027, note: "Perencanaan LINAC & kemoterapi — pengadaan Q1 2027." },
];

export const FLOORS: Floor[] = [
  { id: "FL-01", buildingId: "B-01", name: "Lantai 1" }, { id: "FL-02", buildingId: "B-01", name: "Lantai 2" },
  { id: "FL-03", buildingId: "B-02", name: "Lantai 1" }, { id: "FL-04", buildingId: "B-02", name: "Lantai 2" }, { id: "FL-05", buildingId: "B-02", name: "Lantai 3" },
  { id: "FL-06", buildingId: "B-03", name: "Lantai 1" }, { id: "FL-07", buildingId: "B-03", name: "Lantai 2" }, { id: "FL-08", buildingId: "B-03", name: "Lantai 3" },
  { id: "FL-09", buildingId: "B-04", name: "Lantai 1" }, { id: "FL-10", buildingId: "B-04", name: "Lantai 2" }, { id: "FL-11", buildingId: "B-04", name: "Lantai 3" },
  { id: "FL-12", buildingId: "B-05", name: "Lantai 1 (rencana)" },
];

export const ROOMS: RoomInfo[] = [
  { id: "RM-01", buildingId: "B-04", floorId: "FL-10", name: "ICU", unit: "Instalasi ICU" },
  { id: "RM-02", buildingId: "B-04", floorId: "FL-10", name: "ICCU", unit: "Instalasi ICU" },
  { id: "RM-03", buildingId: "B-04", floorId: "FL-11", name: "Perinatologi", unit: "Instalasi Perinatologi" },
  { id: "RM-04", buildingId: "B-03", floorId: "FL-06", name: "Radiologi", unit: "Instalasi Radiologi" },
  { id: "RM-05", buildingId: "B-03", floorId: "FL-08", name: "Lab Hematologi", unit: "Instalasi Laboratorium" },
  { id: "RM-06", buildingId: "B-03", floorId: "FL-07", name: "CSSD", unit: "Instalasi CSSD" },
  { id: "RM-07", buildingId: "B-01", floorId: "FL-01", name: "IGD Resusitasi", unit: "Instalasi IGD" },
  { id: "RM-08", buildingId: "B-02", floorId: "FL-03", name: "Poli Gigi", unit: "Poliklinik Gigi" },
  { id: "RM-09", buildingId: "B-02", floorId: "FL-05", name: "Poli Kebidanan", unit: "Poliklinik Obsgyn" },
  { id: "RM-10", buildingId: "B-02", floorId: "FL-04", name: "HD", unit: "Unit Hemodialisa" },
];

export const UNITS: UnitNode[] = [
  { id: "UN-01", name: "ICU", head: "Ns. Dewi Lestari" },
  { id: "UN-02", name: "IGD", head: "dr. Bimo Prasetyo" },
  { id: "UN-03", name: "Radiologi", head: "dr. Anton Wijaya, Sp.Rad" },
  { id: "UN-04", name: "Laboratorium", head: "dr. Lina Kartika, Sp.PK" },
  { id: "UN-05", name: "Hemodialisa", head: "Ns. Yuli Astuti" },
  { id: "UN-06", name: "Poliklinik Gigi", head: "drg. Fani Rahma" },
  { id: "UN-07", name: "CSSD", head: "Rina Kusuma, S.T." },
  { id: "UN-08", name: "Gudang", head: "Bambang Prasetyo" },
];

/* ── aset ── */
type EqSeed = Omit<Equipment, "photos" | "docs"> & { photos?: AssetPhoto[]; docs?: AssetDoc[] };
const EQUIPMENT_RAW: EqSeed[] = [
  { id: "EQ-01", code: "AST-RS-2026-000001", name: "Ventilator Savina 300", category: "Life Support", brand: "Dräger", model: "Savina 300 Select", serial: "DR-VN-30417", acqDate: d(-610), acqCost: 685_000_000, supplierId: "S-04", building: "Gedung D", floor: "Lantai 2", room: "ICU Bed 04", unit: "ICU", custodian: "Ns. Dewi Lestari", condition: "FAIR", opStatus: "MAINTENANCE", risk: "HIGH", calStatus: "VALID", nextMaint: d(4), utilization: 93, poRef: "PO-2024-011" },
  { id: "EQ-02", code: "AST-RS-2026-000002", name: "CT-Scan 128 Slice", category: "Imaging", brand: "GE Healthcare", model: "Revolution EVO", serial: "GE-CT-88213", acqDate: d(-420), acqCost: 9_800_000_000, supplierId: "S-01", building: "Gedung C", floor: "Lantai 1", room: "Radiologi · CT-01", unit: "Radiologi", custodian: "dr. Anton Wijaya, Sp.Rad", condition: "EXCELLENT", opStatus: "IN_SERVICE", risk: "HIGH", calStatus: "DUE_SOON", nextMaint: d(60), utilization: 81, poRef: "PO-2024-002" },
  { id: "EQ-03", code: "AST-RS-2026-000003", name: "Patient Monitor MX450", category: "Monitoring", brand: "Philips", model: "IntelliVue MX450", serial: "PH-PM-11908", acqDate: d(-260), acqCost: 215_000_000, supplierId: "S-01", building: "Gedung D", floor: "Lantai 2", room: "ICU Bed 07", unit: "ICU", custodian: "Ns. Dewi Lestari", condition: "GOOD", opStatus: "IN_SERVICE", risk: "MEDIUM", calStatus: "VALID", nextMaint: d(45), utilization: 88 },
  { id: "EQ-04", code: "AST-RS-2026-000004", name: "Autoclave GE46", category: "Sterilisasi", brand: "Getinge", model: "GE46-2", serial: "GT-AC-40913", acqDate: d(-1050), acqCost: 1_450_000_000, supplierId: "S-04", building: "Gedung C", floor: "Lantai 2", room: "CSSD · Dekontaminasi", unit: "CSSD", custodian: "Rina Kusuma, S.T.", condition: "FAIR", opStatus: "IN_SERVICE", risk: "HIGH", calStatus: "EXPIRED", nextMaint: d(40), utilization: 71 },
  { id: "EQ-05", code: "AST-RS-2026-000005", name: "USG 4D Voluson", category: "Imaging", brand: "GE Healthcare", model: "Voluson S10", serial: "GE-US-55320", acqDate: d(-720), acqCost: 940_000_000, supplierId: "S-01", building: "Gedung B", floor: "Lantai 3", room: "Poli Kebidanan 2", unit: "Poliklinik", custodian: "dr. Maya Safitri, Sp.OG", condition: "GOOD", opStatus: "IN_SERVICE", risk: "MEDIUM", calStatus: "VALID", nextMaint: d(30), utilization: 66 },
  { id: "EQ-06", code: "AST-RS-2026-000006", name: "Hemodialisa DBB-EXA", category: "Life Support", brand: "Nikkiso", model: "DBB-EXA Essencia", serial: "NK-HD-18230", acqDate: d(-700), acqCost: 420_000_000, supplierId: "S-03", building: "Gedung B", floor: "Lantai 2", room: "HD · Station 5", unit: "Hemodialisa", custodian: "Ns. Yuli Astuti", condition: "FAIR", opStatus: "IN_SERVICE", risk: "HIGH", calStatus: "DUE_SOON", nextMaint: d(12), utilization: 69 },
  { id: "EQ-07", code: "AST-RS-2026-000007", name: "Defibrillator R Series", category: "Life Support", brand: "Zoll", model: "R Series Plus", serial: "ZL-DF-66140", acqDate: d(-380), acqCost: 320_000_000, supplierId: "S-01", building: "Gedung A", floor: "Lantai 1", room: "IGD Resusitasi", unit: "IGD", custodian: "dr. Bimo Prasetyo", condition: "EXCELLENT", opStatus: "IN_SERVICE", risk: "HIGH", calStatus: "VALID", nextMaint: d(60), utilization: 22 },
  { id: "EQ-08", code: "AST-RS-2026-000008", name: "EKG 12 Kanal", category: "Monitoring", brand: "Nihon Kohden", model: "ECG-2550", serial: "NK-EK-20871", acqDate: d(-900), acqCost: 78_000_000, supplierId: "S-03", building: "Gedung A", floor: "Lantai 1", room: "IGD Resusitasi", unit: "IGD", custodian: "dr. Bimo Prasetyo", condition: "FAIR", opStatus: "IN_SERVICE", risk: "MEDIUM", calStatus: "VALID", nextMaint: d(-1), utilization: 57 },
];
export const EQUIPMENT: Equipment[] = EQUIPMENT_RAW.map(({ photos, docs, ...e }) => ({ ...e, photos: photos ?? [], docs: docs ?? [] }));

export const TIMELINE: TimelineEvent[] = [
  { id: "TL-01", eqId: "EQ-01", type: "MAINTENANCE", date: d(-6), title: "WO-2607 dikerjakan (KOREKTIF)", detail: "Penggantian flow sensor ekshalasi + uji kebocoran.", actor: "Agus Firmansyah", cost: 6_800_000 },
  { id: "TL-02", eqId: "EQ-01", type: "CALIBRATION", date: d(-200), title: "Kalibrasi LULUS — KAL-VNT-2025-309", detail: "Berlaku hingga 165 hari ke depan.", actor: "Agus Firmansyah", cost: 950_000 },
  { id: "TL-03", eqId: "EQ-04", type: "CALIBRATION", date: d(-390), title: "Kalibrasi LULUS — KAL-AUT-2025-092", detail: "Sertifikat kini KADALUARSA — CSSD menahan rilis batch.", actor: "Maya Anggraini", cost: 2_750_000 },
  { id: "TL-04", eqId: "EQ-02", type: "MAINTENANCE", date: d(-30), title: "PM triwulan selesai", detail: "Tube output check 98.2% — AEC normal.", actor: "Siti Nurhaliza", cost: 1_500_000 },
  { id: "TL-05", eqId: "EQ-03", type: "DOCUMENT", date: d(-90), title: "Kalibrasi LULUS — KAL-PM-2026-077", detail: "Sertifikat tersimpan di dokumen aset.", actor: "Agus Firmansyah", cost: 800_000 },
];

/* ── inventori (saldo ledger harus = stock) ── */
export const ITEMS: InventoryItem[] = [
  { sku: "BHP-0012", name: "Handscoon Nitrile M", category: "Alkes Habis Pakai", uom: "box", warehouse: "Gudang BHP Medis", stock: 14, min: 40, reorder: 50, unitCost: 68_000, method: "FEFO" },
  { sku: "BHP-0031", name: "Spuit 3 cc Terumo", category: "Alkes Habis Pakai", uom: "pcs", warehouse: "Gudang BHP Medis", stock: 1840, min: 500, reorder: 800, unitCost: 2_350, method: "FEFO" },
  { sku: "FAR-1102", name: "NaCl 0.9% 500 ml", category: "Infus & Cairan", uom: "flabot", warehouse: "Gudang Farmasi", stock: 96, min: 150, reorder: 200, unitCost: 14_800, method: "FEFO" },
  { sku: "BHP-0045", name: "Kassa Steril 16×16", category: "Alkes Habis Pakai", uom: "pack", warehouse: "Gudang BHP Medis", stock: 1420, min: 400, reorder: 600, unitCost: 4_100, method: "FIFO" },
  { sku: "BHP-0067", name: "Masker Bedah 3-Ply", category: "Alkes Habis Pakai", uom: "box", warehouse: "Gudang Umum", stock: 2350, min: 500, reorder: 900, unitCost: 28_000, method: "FIFO" },
  { sku: "BHP-0089", name: "ECG Electrode Dewasa", category: "Alkes Habis Pakai", uom: "pcs", warehouse: "Gudang BHP Medis", stock: 760, min: 300, reorder: 450, unitCost: 3_900, method: "FEFO" },
];

const bal: Record<string, number> = { "BHP-0012": 26, "BHP-0031": 1190, "FAR-1102": 156, "BHP-0045": 620, "BHP-0067": 850, "BHP-0089": 450 };
const led: LedgerEntry[] = [];
const open = (sku: string) => led.push({ id: uid(), date: d(-40, 7), sku, type: "OPENING_BALANCE", qty: bal[sku], balance: bal[sku], actor: "sistem", ref: "SALDO-AWAL" });
const row = (sku: string, type: LedgerEntry["type"], qty: number, ref: string, actor: string, day: number) => {
  bal[sku] += qty;
  led.push({ id: uid(), date: d(day, 9), sku, type, qty, balance: bal[sku], actor, ref });
};
open("BHP-0012"); row("BHP-0012", "ISSUE", -12, "DIST-2608-024 · ICU", "Sari Melati", -3);
open("BHP-0031"); row("BHP-0031", "RECEIPT", 800, "GRN-2608-005", "Bambang Prasetyo", -20); row("BHP-0031", "ISSUE", -150, "DIST-2608-025 · IGD", "Sari Melati", -2);
open("FAR-1102"); row("FAR-1102", "RECEIPT", 40, "GRN-2607-114", "Bambang Prasetyo", -15); row("FAR-1102", "ISSUE", -100, "DIST-2608-021 · ICU", "Sari Melati", -4);
open("BHP-0045"); row("BHP-0045", "RECEIPT", 800, "GRN-2608-001", "Bambang Prasetyo", -12);
open("BHP-0067"); row("BHP-0067", "RECEIPT", 1500, "GRN-2607-095", "Bambang Prasetyo", -30);
open("BHP-0089"); row("BHP-0089", "RECEIPT", 310, "GRN-2608-005", "Bambang Prasetyo", -8);
export const LEDGER_INIT: LedgerEntry[] = led.sort((a, b) => +new Date(b.date) - +new Date(a.date));

/* ── pengadaan ── */
const st = (status: StageDecision["status"], approver?: string, note?: string, day = -2): StageDecision => ({ status, approver, note, date: status === "PENDING" ? undefined : d(day) });
const line = (kind: PRLine["kind"], name: string, qty: number, unitCost: number, stages: StageDecision[], sku?: string, category?: string): PRLine => ({ id: "L-" + uid(), kind, sku, name, category, qty, unitCost, stages });

export const PURCHASE_REQUESTS: PurchaseRequest[] = [
  {
    id: "PR-01", code: "PR-2608-014", date: d(-1, 13), requester: "Ns. Dewi Lestari", unit: "ICU", needBy: d(10), status: "IN_APPROVAL",
    lines: [line("ITEM", "Spuit 3 cc Terumo", 1000, 2_350, [st("PENDING"), st("PENDING"), st("PENDING")], "BHP-0031")],
  },
  {
    id: "PR-02", code: "PR-2608-012", date: d(-2, 7), requester: "Galih Saputra", unit: "Gudang", needBy: d(21), status: "IN_APPROVAL",
    lines: [
      line("ITEM", "Handscoon Nitrile M", 600, 68_000, [st("APPROVED", "Bambang Prasetyo", "Sesuai ROP"), st("PENDING"), st("PENDING")], "BHP-0012"),
      line("ASSET", "Ventilator Transport Oxylog 3000", 2, 445_000_000, [st("PENDING"), st("PENDING"), st("PENDING")], undefined, "Life Support"),
    ],
  },
  {
    id: "PR-03", code: "PR-2608-011", date: d(-4, 8), requester: "Galih Saputra", unit: "Gudang", needBy: d(5), status: "APPROVED",
    lines: [line("ITEM", "NaCl 0.9% 500 ml", 400, 14_800, [st("APPROVED", "Bambang Prasetyo", "Kebutuhan rutin", -4), st("APPROVED", "Ratna Dewi, S.E.", "Budget tersedia", -4), st("APPROVED", "dr. H. Ahmad Fauzi, MARS", "Setuju", -3)], "FAR-1102")],
  },
];

export const PURCHASE_ORDERS: PurchaseOrder[] = [
  { id: "PO-01", code: "PO-2608-090", date: d(-2, 11), supplierId: "S-03", items: [{ kind: "ITEM", sku: "FAR-1102", name: "NaCl 0.9% 500 ml", qty: 400, price: 14_800 }], total: 5_920_000, eta: d(2), status: "SENT", prRef: "PR-2608-011" },
  { id: "PO-02", code: "PO-2608-088", date: d(-8, 9), supplierId: "S-03", items: [{ kind: "ITEM", sku: "BHP-0031", name: "Spuit 3 cc Terumo", qty: 800, price: 2_350 }], total: 1_880_000, eta: d(-20), status: "RECEIVED", prRef: "PR-2607-101" },
];

export const DELIVERIES: Delivery[] = [
  { id: "DL-1", code: "DIST-2608-029", date: d(-1, 10), poRef: "PO-2608-088", unit: "ICU", items: [{ name: "Spuit 3 cc Terumo", qty: 300 }], status: "DELIVERED", courier: "Sari Melati" },
  { id: "DL-2", code: "DIST-2607-118", date: d(-20, 9), poRef: "PO-2608-088", unit: "IGD", items: [{ name: "Spuit 3 cc Terumo", qty: 150 }], status: "RECEIVED", courier: "Sari Melati", receivedBy: "dr. Bimo Prasetyo" },
];

export const HANDOVERS: HandoverRecord[] = [
  {
    id: "HO-1", code: "BAST-2608-020", kind: "VENDOR", date: d(-8, 10), ref: "PO-2608-088", from: "PT Medika Distrindo", to: "Gudang BHP Medis",
    items: [{ name: "Spuit 3 cc Terumo", qty: 800, condition: "BAIK" }], receivedBy: "Bambang Prasetyo", handedBy: "Kurir PT Medika Distrindo",
    note: "Diterima lengkap sesuai PO.", checksum: "sha256:" + uid() + uid(),
  },
];

export const VENDOR_RETURNS: VendorReturn[] = [
  {
    id: "RT-1", code: "RET-2607-003", date: d(-14, 11), poRef: "PO-2607-101", supplierId: "S-03",
    lines: [{ name: "Handscoon Nitrile M", qty: 8, reason: "KURANG", kind: "ITEM", sku: "BHP-0012", unitCost: 68_000 }],
    status: "DIKIRIM", note: "Segel box kurang 8 saat penerimaan.", sentAt: d(-13, 9),
  },
];

/* ── teknis ── */
export const WORK_ORDERS: WorkOrder[] = [
  { id: "WO-1", wo: "WO-2607", eqId: "EQ-01", type: "CORRECTIVE", techId: "T-01", scheduled: d(-6), status: "IN_PROGRESS", note: "Penggantian flow sensor + uji kebocoran.", laborCost: 6_800_000 },
  { id: "WO-2", wo: "WO-2608", eqId: "EQ-08", type: "PREVENTIVE", techId: "T-05", scheduled: d(-1), status: "SCHEDULED", note: "PM semester: impedansi leadwire, print head, keamanan listrik.", laborCost: 420_000 },
  { id: "WO-3", wo: "WO-2605", eqId: "EQ-02", type: "PREVENTIVE", techId: "T-02", scheduled: d(-30), status: "CLOSED", note: "Tube output check + AEC normal.", laborCost: 1_500_000 },
];

export const CALIBRATIONS: CalibrationRecord[] = [
  { id: "CAL-1", eqId: "EQ-01", date: d(-200), result: "PASS", cert: "KAL-VNT-2025-309", nextDue: d(165), cost: 950_000 },
  { id: "CAL-2", eqId: "EQ-04", date: d(-390), result: "PASS", cert: "KAL-AUT-2025-092", nextDue: d(-25), cost: 2_750_000 },
  { id: "CAL-3", eqId: "EQ-03", date: d(-90), result: "PASS", cert: "KAL-PM-2026-077", nextDue: d(275), cost: 800_000 },
  { id: "CAL-4", eqId: "EQ-06", date: d(-352), result: "PASS", cert: "KAL-HD-2025-201", nextDue: d(13), cost: 1_100_000 },
];

export const COMPLAINTS: Complaint[] = [
  { id: "CMP-1", code: "CMP-2609", eqId: "EQ-01", date: d(-25, 22), reporter: "Ns. Dewi Lestari (ICU)", priority: "CRITICAL", description: "Alarm tidal volume rendah berulang di bed 04.", status: "IN_PROGRESS", slaHours: 4 },
  { id: "CMP-2", code: "CMP-2610", eqId: "EQ-04", date: d(-2, 8), reporter: "Rina Kusuma (CSSD)", priority: "HIGH", description: "Sertifikat kalibrasi autoclave kadaluarsa; batch steril ditahan.", status: "OPEN", slaHours: 8 },
  { id: "CMP-3", code: "CMP-2607", eqId: "EQ-07", date: d(-70, 19), reporter: "dr. Bimo Prasetyo (IGD)", priority: "CRITICAL", description: "Self-test pagi gagal pada paddle charge.", status: "CLOSED", slaHours: 4 },
];

export const SUPPLIERS: Supplier[] = [
  { id: "S-01", name: "PT GE Healthcare Indonesia", service: "CT, USG, inkubator — suku cadang & servis", contractUntil: d(210) },
  { id: "S-03", name: "PT Medika Distrindo", service: "Distribusi BHP medis", contractUntil: d(300) },
  { id: "S-04", name: "Dräger Indonesia", service: "Ventilator & anestesi — servis", contractUntil: d(41) },
  { id: "S-05", name: "PT Instrumedia Lab", service: "Reagen & analyzer lab", contractUntil: d(-6) },
];

export const TECHNICIANS: Technician[] = [
  { id: "T-01", name: "Agus Firmansyah", specialty: "Life-support & perangkat ICU", cert: "CRES/BME-2 · Dräger" },
  { id: "T-02", name: "Siti Nurhaliza", specialty: "Imaging (CT / X-Ray / USG)", cert: "Lisensi radiografer BAPETEN" },
  { id: "T-05", name: "Fajar Nugroho", specialty: "Keamanan listrik & umum", cert: "K3 Listrik · Elektromedik" },
];

/* ── audit, notifikasi ── */
export const AUDIT: AuditEntry[] = [
  { id: "AUD-01", date: d(0, 7), actor: "sistem", role: "PENJADWAL", action: "CALIBRATION.EXPIRED", entity: "equipment", entityId: "EQ-04", reason: "Sertifikat KAL-AUT-2025-092 kadaluarsa" },
  { id: "AUD-02", date: d(-1, 15), actor: "Ns. Dewi Lestari", role: "Kepala Unit", action: "TRANSFER.REQUEST", entity: "asset_transfer", entityId: "TRF-2608-003", reason: "Butuh monitor tambahan ICCU" },
  { id: "AUD-03", date: d(-2, 9), actor: "Fajar Nugroho", role: "Teknisi", action: "INSPECTION.COMPLETE", entity: "inspection", entityId: "INS-2608-005" },
  { id: "AUD-04", date: d(-8, 10), actor: "Bambang Prasetyo", role: "Umum", action: "PROCUREMENT.BAST", entity: "handover", entityId: "BAST-2608-020", reason: "Serah terima PO-2608-088 dari vendor" },
  { id: "AUD-05", date: d(-25, 22), actor: "Ns. Dewi Lestari", role: "Kepala Unit", action: "COMPLAINT.CREATE", entity: "complaint", entityId: "CMP-2609", reason: "SLA KRITIS 4 jam" },
];

export const NOTIFS: Notif[] = [
  { id: "N-1", kind: "CALIBRATION_EXPIRED", msg: "Autoclave GE46 — sertifikat kalibrasi KADALUARSA (CSSD menahan rilis batch).", refId: "EQ-04", date: d(0, 7), read: false },
  { id: "N-2", kind: "MAINTENANCE_OVERDUE", msg: "WO-2608 (EKG 12 Kanal) melewati jadwal perawatan.", refId: "EQ-08", date: d(0, 7), read: false },
  { id: "N-3", kind: "LOW_STOCK", msg: "Handscoon Nitrile M di bawah titik pesan ulang (14 ≤ 50).", refId: "BHP-0012", date: d(0, 7), read: false },
  { id: "N-4", kind: "APPROVAL_PENDING", msg: "2 permintaan pembelian menunggu persetujuan tahap 1.", refId: "PR-01", date: d(-1, 16), read: false },
  { id: "N-5", kind: "BAST", msg: "BAST-2608-020 diterbitkan — serah terima PO-2608-088 dari vendor.", refId: "HO-1", date: d(-8, 10), read: true },
];
