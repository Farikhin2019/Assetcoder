import {
  AuditEntry, Building, CalibrationRecord, Complaint, Delivery, Equipment, Floor, HandoverRecord, Hospital,
  InventoryItem, LedgerEntry, Notif, PRLine, PurchaseOrder, PurchaseRequest, RoomInfo, StageDecision, Supplier,
  Technician, TimelineEvent, UserAccount, UnitNode, WorkOrder, d, uid,
} from "./types";

/* ── users (untuk login) ── */
export const USERS: UserAccount[] = [
  { id: "US-01", name: "dr. H. Ahmad Fauzi, MARS", role: "COO", unit: null, email: "ahmad.fauzi@rs-harapan.id", active: true },
  { id: "US-02", name: "Ratna Dewi, S.E.", role: "Finance", unit: "Keuangan", email: "ratna.dewi@rs-harapan.id", active: true },
  { id: "US-03", name: "Bambang Prasetyo", role: "Umum", unit: "Umum", email: "bambang.prasetyo@rs-harapan.id", active: true },
  { id: "US-04", name: "Ns. Dewi Lestari", role: "Kepala Unit", unit: "ICU", email: "dewi.lestari@rs-harapan.id", active: true },
  { id: "US-05", name: "dr. Bimo Prasetyo", role: "Kepala Unit", unit: "IGD", email: "bimo.prasetyo@rs-harapan.id", active: true },
  { id: "US-06", name: "Agus Firmansyah", role: "Teknisi", unit: "Teknik", email: "agus.firmansyah@rs-harapan.id", active: true },
  { id: "US-07", name: "Dian Pratiwi", role: "IT Administrator", unit: "IT", email: "dian.pratiwi@rs-harapan.id", active: true },
  { id: "US-08", name: "Rina Kusuma, S.T.", role: "Pengelola Aset", unit: null, email: "rina.kusuma@rs-harapan.id", active: true },
  { id: "US-09", name: "Galih Saputra", role: "Pengelola Inventory", unit: "Gudang", email: "galih.saputra@rs-harapan.id", active: true },
  { id: "US-10", name: "Sari Melati", role: "Petugas Gudang", unit: "Gudang", email: "sari.melati@rs-harapan.id", active: true },
  { id: "US-11", name: "Hendra Wijaya", role: "Kepala Teknisi", unit: "Teknik", email: "hendra.wijaya@rs-harapan.id", active: true },
  { id: "US-12", name: "Yusuf Ramadhan", role: "Auditor", unit: null, email: "yusuf.ramadhan@rs-harapan.id", active: true },
  { id: "US-13", name: "dr. Hartono Wibowo", role: "Direksi", unit: null, email: "hartono.wibowo@rs-harapan.id", active: true },
];

/* ── organisasi & lokasi ── */
export const HOSPITALS: Hospital[] = [
  { id: "H-01", code: "RS-HM", name: "RS Harapan Medika", kind: "RS Umum · Kelas B", status: "AKTIF", address: "Jl. Melati Raya No. 17, Bandung", main: true },
  { id: "H-02", code: "KSC", name: "Klinik Satelit Cempaka", kind: "Klinik Pratama · Jejaring", status: "AKTIF", address: "Jl. Cempaka No. 4, Bandung", main: false },
];

export const BUILDINGS: Building[] = [
  { id: "B-01", hospitalId: "H-01", name: "Gedung A", label: "IGD & Emergensi", status: "ACTIVE", year: 2016, note: "IGD resusitasi & triase 24 jam di L1." },
  { id: "B-02", hospitalId: "H-01", name: "Gedung B", label: "Rawat Jalan & HD", status: "ACTIVE", year: 2019, note: "Poliklinik, gigi & hemodialisa." },
  { id: "B-03", hospitalId: "H-01", name: "Gedung C", label: "Penunjang Medis", status: "ACTIVE", year: 2018, note: "Radiologi, CSSD & laboratorium." },
  { id: "B-04", hospitalId: "H-01", name: "Gedung D", label: "Rawat Inap & ICU", status: "ACTIVE", year: 2012, note: "ICU / ICCU di L2, perinatologi di L3." },
  { id: "B-05", hospitalId: "H-01", name: "Gedung E", label: "Onkologi (rencana)", status: "PLANNED", year: 2027, note: "Perencanaan LINAC — procurement Q1 2027." },
];

export const FLOORS: Floor[] = [
  { id: "FL-01", buildingId: "B-01", name: "Lantai 1" }, { id: "FL-02", buildingId: "B-01", name: "Lantai 2" },
  { id: "FL-03", buildingId: "B-02", name: "Lantai 1" }, { id: "FL-04", buildingId: "B-02", name: "Lantai 2" }, { id: "FL-05", buildingId: "B-02", name: "Lantai 3" },
  { id: "FL-06", buildingId: "B-03", name: "Lantai 1" }, { id: "FL-07", buildingId: "B-03", name: "Lantai 2" }, { id: "FL-08", buildingId: "B-03", name: "Lantai 3" },
  { id: "FL-09", buildingId: "B-04", name: "Lantai 1" }, { id: "FL-10", buildingId: "B-04", name: "Lantai 2" }, { id: "FL-11", buildingId: "B-04", name: "Lantai 3" },
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
];

export const UNITS: UnitNode[] = [
  { id: "UN-01", name: "IGD", head: "dr. Bimo Prasetyo" }, { id: "UN-02", name: "ICU", head: "Ns. Dewi Lestari" },
  { id: "UN-03", name: "ICCU", head: "Ns. Dewi Lestari" }, { id: "UN-04", name: "NICU", head: "dr. Ratna Dewi, Sp.A" },
  { id: "UN-05", name: "Kamar Operasi", head: "dr. Surya, Sp.B" }, { id: "UN-06", name: "Hemodialisa", head: "Ns. Yuli Astuti" },
  { id: "UN-07", name: "Radiologi", head: "dr. Anton Wijaya, Sp.Rad" }, { id: "UN-08", name: "Laboratorium", head: "dr. Lina Kartika, Sp.PK" },
  { id: "UN-09", name: "CSSD", head: "Rina Kusuma, S.T." }, { id: "UN-10", name: "Rawat Inap", head: "Ns. Sari Wulandari" },
  { id: "UN-11", name: "Poli Gigi", head: "drg. Fani Rahma" }, { id: "UN-12", name: "Farmasi", head: "apt. Lina Marlina" },
];

/* ── people & partners ── */
export const TECHNICIANS: Technician[] = [
  { id: "T-01", name: "Agus Firmansyah", specialty: "Life-support & ICU devices", cert: "CRES/BME-2 · Dräger certified" },
  { id: "T-02", name: "Siti Nurhaliza", specialty: "Imaging (CT / X-Ray / USG)", cert: "BAPETEN radiographer license" },
  { id: "T-03", name: "Rudi Hartawan", specialty: "Laboratory analyzers", cert: "Sysmex & Abbott field service" },
  { id: "T-04", name: "Fajar Nugroho", specialty: "Electrical safety & general", cert: "K3 Listrik · Elektro Medik" },
];

export const SUPPLIERS: Supplier[] = [
  { id: "S-01", name: "PT GE Healthcare Indonesia", service: "CT, USG, incubator — parts & service", contractUntil: d(210) },
  { id: "S-02", name: "Siemens Healthineers", service: "MRI & imaging service contract", contractUntil: d(96) },
  { id: "S-03", name: "PT Medika Distrindo", service: "BHP medis distribution", contractUntil: d(300) },
  { id: "S-04", name: "Dräger Indonesia", service: "Ventilator & anesthesia service", contractUntil: d(41) },
  { id: "S-05", name: "PT Instrumedia Lab", service: "Lab reagents & analyzers", contractUntil: d(-6) },
];

/* ── equipment ── */
export const EQUIPMENT: Equipment[] = [
  { id: "EQ-01", code: "AST-RS-2026-000001", name: "CT-Scan 128 Slice", category: "Imaging", brand: "GE Healthcare", model: "Revolution EVO", serial: "GE-CT-88213", acqDate: d(-420), acqCost: 9_800_000_000, supplierId: "S-01", building: "Gedung C", floor: "Lantai 1", room: "Radiologi", unit: "Instalasi Radiologi", custodian: "dr. Anton Wijaya, Sp.Rad", condition: "EXCELLENT", opStatus: "IN_SERVICE", risk: "HIGH", calStatus: "DUE_SOON", nextMaint: d(60), utilization: 81, poRef: "PO-2024-011" },
  { id: "EQ-02", code: "AST-RS-2026-000002", name: "MRI 1.5 Tesla", category: "Imaging", brand: "Siemens", model: "Magnetom Altea", serial: "SI-MR-77021", acqDate: d(-300), acqCost: 14_500_000_000, supplierId: "S-02", building: "Gedung C", floor: "Lantai 1", room: "Radiologi", unit: "Instalasi Radiologi", custodian: "dr. Anton Wijaya, Sp.Rad", condition: "EXCELLENT", opStatus: "IN_SERVICE", risk: "HIGH", calStatus: "VALID", nextMaint: d(75), utilization: 74 },
  { id: "EQ-03", code: "AST-RS-2026-000003", name: "Ventilator Savina 300", category: "Life Support", brand: "Dräger", model: "Savina 300 Select", serial: "DR-VN-30417", acqDate: d(-610), acqCost: 685_000_000, supplierId: "S-04", building: "Gedung D", floor: "Lantai 2", room: "ICU", unit: "Instalasi ICU", custodian: "Ns. Dewi Lestari", condition: "FAIR", opStatus: "MAINTENANCE", risk: "HIGH", calStatus: "VALID", nextMaint: d(4), utilization: 93 },
  { id: "EQ-04", code: "AST-RS-2026-000004", name: "Patient Monitor MX450", category: "Monitoring", brand: "Philips", model: "IntelliVue MX450", serial: "PH-PM-11908", acqDate: d(-260), acqCost: 215_000_000, supplierId: "S-01", building: "Gedung D", floor: "Lantai 2", room: "ICU", unit: "Instalasi ICU", custodian: "Ns. Dewi Lestari", condition: "GOOD", opStatus: "IN_SERVICE", risk: "MEDIUM", calStatus: "VALID", nextMaint: d(45), utilization: 88 },
  { id: "EQ-05", code: "AST-RS-2026-000005", name: "USG 4D Voluson", category: "Imaging", brand: "GE Healthcare", model: "Voluson S10", serial: "GE-US-55320", acqDate: d(-720), acqCost: 940_000_000, supplierId: "S-01", building: "Gedung B", floor: "Lantai 3", room: "Poli Kebidanan", unit: "Poliklinik Obsgyn", custodian: "dr. Maya Safitri, Sp.OG", condition: "GOOD", opStatus: "IN_SERVICE", risk: "MEDIUM", calStatus: "VALID", nextMaint: d(30), utilization: 66 },
  { id: "EQ-06", code: "AST-RS-2026-000006", name: "EKG 12 Kanal", category: "Monitoring", brand: "Nihon Kohden", model: "ECG-2550", serial: "NK-EK-20871", acqDate: d(-900), acqCost: 78_000_000, supplierId: "S-03", building: "Gedung A", floor: "Lantai 1", room: "IGD Resusitasi", unit: "Instalasi IGD", custodian: "dr. Bimo Prasetyo", condition: "FAIR", opStatus: "IN_SERVICE", risk: "MEDIUM", calStatus: "VALID", nextMaint: d(-1), utilization: 57 },
  { id: "EQ-07", code: "AST-RS-2026-000007", name: "Defibrillator R Series", category: "Life Support", brand: "Zoll", model: "R Series Plus", serial: "ZL-DF-66140", acqDate: d(-380), acqCost: 320_000_000, supplierId: "S-01", building: "Gedung A", floor: "Lantai 1", room: "IGD Resusitasi", unit: "Instalasi IGD", custodian: "dr. Bimo Prasetyo", condition: "EXCELLENT", opStatus: "IN_SERVICE", risk: "HIGH", calStatus: "VALID", nextMaint: d(60), utilization: 22 },
  { id: "EQ-08", code: "AST-RS-2026-000008", name: "Autoclave GE46", category: "Sterilisasi", brand: "Getinge", model: "GE46-2", serial: "GT-AC-40913", acqDate: d(-1050), acqCost: 1_450_000_000, supplierId: "S-04", building: "Gedung C", floor: "Lantai 2", room: "CSSD", unit: "Instalasi CSSD", custodian: "Rina Kusuma, S.T.", condition: "FAIR", opStatus: "IN_SERVICE", risk: "HIGH", calStatus: "EXPIRED", nextMaint: d(40), utilization: 71 },
  { id: "EQ-09", code: "AST-RS-2026-000009", name: "X-Ray Digital", category: "Imaging", brand: "Shimadzu", model: "RADspeed Pro", serial: "SH-XR-31209", acqDate: d(-540), acqCost: 1_120_000_000, supplierId: "S-02", building: "Gedung C", floor: "Lantai 1", room: "Radiologi", unit: "Instalasi Radiologi", custodian: "dr. Anton Wijaya, Sp.Rad", condition: "GOOD", opStatus: "IN_SERVICE", risk: "MEDIUM", calStatus: "VALID", nextMaint: d(40), utilization: 63 },
  { id: "EQ-10", code: "AST-RS-2026-000010", name: "Hematology Analyzer XN-1000", category: "Laboratorium", brand: "Sysmex", model: "XN-1000", serial: "SY-HA-90312", acqDate: d(-330), acqCost: 1_850_000_000, supplierId: "S-05", building: "Gedung C", floor: "Lantai 3", room: "Lab Hematologi", unit: "Instalasi Laboratorium", custodian: "dr. Lina Kartika, Sp.PK", condition: "GOOD", opStatus: "IN_SERVICE", risk: "MEDIUM", calStatus: "VALID", nextMaint: d(65), utilization: 85 },
  { id: "EQ-11", code: "AST-RS-2026-000011", name: "Infant Incubator", category: "Life Support", brand: "GE Healthcare", model: "Giraffe OmniBed", serial: "GE-IN-41827", acqDate: d(-200), acqCost: 560_000_000, supplierId: "S-01", building: "Gedung D", floor: "Lantai 3", room: "Perinatologi", unit: "Instalasi Perinatologi", custodian: "dr. Ratna Dewi, Sp.A", condition: "EXCELLENT", opStatus: "IN_SERVICE", risk: "HIGH", calStatus: "VALID", nextMaint: d(50), utilization: 77 },
  { id: "EQ-12", code: "AST-RS-2026-000012", name: "Ventilator Transport Oxylog", category: "Life Support", brand: "Dräger", model: "Oxylog 3000 Plus", serial: "DR-VT-51820", acqDate: d(-45), acqCost: 445_000_000, supplierId: "S-04", building: "Gedung D", floor: "Lantai 2", room: "ICU", unit: "Instalasi ICU", custodian: "Ns. Dewi Lestari", condition: "EXCELLENT", opStatus: "IN_SERVICE", risk: "HIGH", calStatus: "VALID", nextMaint: d(80), utilization: 64, poRef: "PO-2607-086" },
];

/* ── inventory ── */
export const ITEMS: InventoryItem[] = [
  { sku: "BHP-0012", name: "Handscoon Nitrile M", category: "Alkes Habis Pakai", uom: "box", warehouse: "Gudang BHP Medis", stock: 14, min: 40, reorder: 50, unitCost: 68_000, method: "FEFO" },
  { sku: "BHP-0031", name: "Spuit 3 cc Terumo", category: "Alkes Habis Pakai", uom: "pcs", warehouse: "Gudang BHP Medis", stock: 1840, min: 500, reorder: 800, unitCost: 2_350, method: "FEFO" },
  { sku: "FAR-1102", name: "NaCl 0.9% 500 ml", category: "Infus & Cairan", uom: "flabot", warehouse: "Gudang Farmasi", stock: 96, min: 150, reorder: 200, unitCost: 14_800, method: "FEFO" },
  { sku: "FAR-1287", name: "Reagen Hematologi DCL", category: "Reagen Lab", uom: "pack", warehouse: "Gudang Farmasi", stock: 22, min: 10, reorder: 15, unitCost: 1_240_000, method: "FEFO" },
  { sku: "BHP-0045", name: "Kassa Steril 16×16", category: "Alkes Habis Pakai", uom: "pack", warehouse: "Gudang BHP Medis", stock: 1420, min: 400, reorder: 600, unitCost: 4_100, method: "FIFO" },
  { sku: "BHP-0067", name: "Masker Bedah 3-Ply", category: "Alkes Habis Pakai", uom: "box", warehouse: "Gudang Umum", stock: 2350, min: 500, reorder: 900, unitCost: 28_000, method: "FIFO" },
  { sku: "IT-0901", name: "PC Workstation Radiologi (PACS)", category: "IT & Komputer", uom: "unit", warehouse: "Gudang Umum", stock: 2, min: 1, reorder: 2, unitCost: 18_500_000, method: "FIFO" },
];

export const LEDGER_INIT: LedgerEntry[] = [
  { id: uid(), date: d(-30, 8), sku: "BHP-0012", type: "OPENING_BALANCE", qty: 120, balance: 120, actor: "system", ref: "OB-2026-07" },
  { id: uid(), date: d(-9, 9), sku: "BHP-0012", type: "ISSUE", qty: -86, balance: 34, actor: "Petugas Gudang", ref: "DIST-2607-091" },
  { id: uid(), date: d(-3, 10), sku: "BHP-0012", type: "ISSUE", qty: -20, balance: 14, actor: "Petugas Gudang", ref: "DIST-2608-012" },
  { id: uid(), date: d(-12, 9), sku: "FAR-1102", type: "RECEIPT", qty: 96, balance: 96, actor: "Kepala Gudang", ref: "GRN-2608-006" },
  { id: uid(), date: d(-4, 11), sku: "FAR-1102", type: "ISSUE", qty: -60, balance: 36, actor: "Petugas Gudang", ref: "DIST-2608-021" },
  { id: uid(), date: d(-6, 9), sku: "FAR-1102", type: "RECEIPT", qty: 120, balance: 156, actor: "Kepala Gudang", ref: "GRN-2608-010" },
];

/* ── procurement (3 tahap: IT/Umum → Keuangan → COO) ── */
const st = (status: PRLine["stages"][0]["status"], approver?: string, note?: string, dd?: number): StageDecision =>
  ({ status, approver, note, date: dd !== undefined ? d(dd, 10) : undefined });

export const PURCHASE_REQUESTS: PurchaseRequest[] = [
  {
    id: "PR-1", code: "PR-2608-012", date: d(0, 7), requester: "Ns. Dewi Lestari", unit: "ICU", needBy: d(21), status: "IN_APPROVAL",
    lines: [
      { id: "L-1", kind: "ITEM", sku: "BHP-0012", name: "Handscoon Nitrile M", qty: 600, unitCost: 68_000, stages: [st("APPROVED", "Bambang Prasetyo", "Sesuai ROP", 0), st("PENDING"), st("PENDING")] },
      { id: "L-2", kind: "ASSET", name: "Patient Monitor MX550", category: "Monitoring", qty: 2, unitCost: 285_000_000, stages: [st("PENDING"), st("PENDING"), st("PENDING")] },
    ],
  },
  {
    id: "PR-2", code: "PR-2608-011", date: d(-2, 8), requester: "dr. Bimo Prasetyo", unit: "IGD", needBy: d(30), status: "APPROVED",
    lines: [
      { id: "L-3", kind: "ITEM", sku: "FAR-1102", name: "NaCl 0.9% 500 ml", qty: 400, unitCost: 14_800, stages: [st("APPROVED", "Bambang Prasetyo", "Kebutuhan rutin", -2), st("APPROVED", "Ratna Dewi, S.E.", "Budget tersedia", -2), st("APPROVED", "dr. H. Ahmad Fauzi, MARS", "Setuju", -1)] },
    ],
  },
];

export const PURCHASE_ORDERS: PurchaseOrder[] = [
  { id: "PO-1", code: "PO-2608-090", date: d(-7, 11), supplierId: "S-03", items: [{ kind: "ITEM", sku: "FAR-1102", name: "NaCl 0.9% 500 ml", qty: 96, price: 14_800 }], total: 1_420_800, eta: d(5), status: "SENT", prRef: "PR-2608-011" },
  { id: "PO-2", code: "PO-2607-086", date: d(-50, 10), supplierId: "S-04", items: [{ kind: "ASSET", name: "Ventilator Transport Oxylog", category: "Life Support", qty: 1, price: 445_000_000 }], total: 445_000_000, eta: d(-45), status: "RECEIVED", prRef: "PR-2607-071" },
];

export const DELIVERIES: Delivery[] = [
  { id: "DL-1", code: "DIST-2608-029", date: d(-1, 10), poRef: "PO-2608-090", unit: "IGD", items: [{ name: "NaCl 0.9% 500 ml", qty: 96 }], status: "DELIVERED", courier: "Sari Melati" },
  { id: "DL-2", code: "DIST-2607-118", date: d(-20, 9), poRef: "PO-2607-071", unit: "Poli Gigi", items: [{ name: "Handscoon Nitrile M", qty: 100 }], status: "RECEIVED", courier: "Sari Melati", receivedBy: "drg. Fani Rahma" },
];

/* ── serah terima / BAST ── */
export const HANDOVERS: HandoverRecord[] = [
  {
    id: "HO-1", code: "BAST-2607-041", kind: "VENDOR", date: d(-45, 13), ref: "PO-2607-086",
    from: "PT Dräger Indonesia", to: "Gudang Aset — RS Harapan Medika",
    items: [{ name: "Ventilator Transport Oxylog 3000 Plus", qty: 1, condition: "BAIK" }],
    handedBy: "A. Setiawan (kurir principal)", receivedBy: "Bambang Prasetyo",
    note: "Unit lengkap dengan aksesori standar; segel pabrik utuh; dokumen kalibrasi awal terlampir.",
    checksum: "sha256:9f27c1ae44d0b771",
  },
  {
    id: "HO-2", code: "BAST-2608-007", kind: "UNIT", date: d(-20, 11), ref: "DIST-2607-118",
    from: "Gudang BHP Medis", to: "Poli Gigi",
    items: [{ name: "Handscoon Nitrile M", qty: 100, condition: "BAIK" }],
    handedBy: "Sari Melati (kurir)", receivedBy: "drg. Fani Rahma",
    note: "Diterima lengkap sesuai surat jalan.",
    checksum: "sha256:1c88e3bd02af9645",
  },
];

/* ── technical ── */
export const WORK_ORDERS: WorkOrder[] = [
  { id: "WO-1", wo: "WO-2607", eqId: "EQ-03", type: "CORRECTIVE", techId: "T-01", scheduled: d(-6), status: "IN_PROGRESS", note: "Flow sensor replacement. Leak test pending.", laborCost: 6_800_000 },
  { id: "WO-2", wo: "WO-2608", eqId: "EQ-06", type: "PREVENTIVE", techId: "T-04", scheduled: d(-1), status: "SCHEDULED", note: "Semi-annual PM: leadwire impedance, electrical safety.", laborCost: 420_000 },
  { id: "WO-3", wo: "WO-2609", eqId: "EQ-12", type: "PREVENTIVE", techId: "T-01", scheduled: d(6), status: "SCHEDULED", note: "PM kuartal 1: leak test, O2 cell, battery runtime.", laborCost: 780_000 },
  { id: "WO-4", wo: "WO-2605", eqId: "EQ-10", type: "PREVENTIVE", techId: "T-03", scheduled: d(-25), status: "CLOSED", note: "Hydraulic & optic cleaning; carryover 0.31%.", laborCost: 1_200_000 },
];

export const CALIBRATIONS: CalibrationRecord[] = [
  { id: "CAL-1", eqId: "EQ-01", date: d(-330), result: "PASS", cert: "KAL-CT-2025-114", nextDue: d(12), cost: 3_500_000 },
  { id: "CAL-2", eqId: "EQ-03", date: d(-200), result: "PASS", cert: "KAL-VNT-2025-309", nextDue: d(165), cost: 950_000 },
  { id: "CAL-3", eqId: "EQ-08", date: d(-390), result: "PASS", cert: "KAL-AUT-2025-092", nextDue: d(-25), cost: 2_750_000 },
  { id: "CAL-4", eqId: "EQ-12", date: d(-20), result: "PASS", cert: "KAL-VNT-2026-011", nextDue: d(345), cost: 950_000 },
];

export const COMPLAINTS: Complaint[] = [
  { id: "CMP-1", code: "CMP-2609", eqId: "EQ-03", date: d(-25, 22), reporter: "Ns. Dewi Lestari (ICU)", priority: "CRITICAL", description: "Alarm low tidal volume berulang; deviasi VT >12%.", status: "IN_PROGRESS", slaHours: 4 },
  { id: "CMP-2", code: "CMP-2610", eqId: "EQ-08", date: d(-2, 8), reporter: "Rina Kusuma (CSSD)", priority: "HIGH", description: "Sertifikat kalibrasi autoclave kedaluwarsa 25 hari.", status: "OPEN", slaHours: 8 },
  { id: "CMP-3", code: "CMP-2606", eqId: "EQ-01", date: d(-200, 10), reporter: "dr. Anton Wijaya, Sp.Rad", priority: "MEDIUM", description: "Ring artifact pada protokol abdomen.", status: "CLOSED", slaHours: 24 },
];

/* ── timeline ── */
export const TIMELINE: TimelineEvent[] = [
  { id: "TL-01", eqId: "EQ-03", type: "COMPLAINT", date: d(-25, 22), title: "Keluhan CMP-2609 — CRITICAL", detail: "Alarm low tidal volume berulang. Unit dikarantina.", actor: "Ns. Dewi Lestari" },
  { id: "TL-02", eqId: "EQ-03", type: "MAINTENANCE", date: d(-6), title: "WO-2607 dikerjakan (CORRECTIVE)", detail: "Penggantian flow sensor ekshalasi + leak test.", actor: "Agus Firmansyah", cost: 6_800_000 },
  { id: "TL-03", eqId: "EQ-12", type: "LIFECYCLE", date: d(-45), title: "Registrasi aset dari pengadaan", detail: "Diterima via PO-2607-086 · tertelusur ke supplier Dräger.", actor: "Rina Kusuma, S.T." },
  { id: "TL-04", eqId: "EQ-12", type: "CALIBRATION", date: d(-20), title: "Kalibrasi PASS — KAL-VNT-2026-011", detail: "Selanjutnya jatuh tempo 345 hari.", actor: "Agus Firmansyah", cost: 950_000 },
  { id: "TL-05", eqId: "EQ-08", type: "CALIBRATION", date: d(-390), title: "Kalibrasi PASS — KAL-AUT-2025-092", detail: "Sertifikat kini EXPIRED — CSSD menahan rilis batch.", actor: "Maya Anggraini", cost: 2_750_000 },
];

/* ── audit & notifs ── */
export const AUDIT: AuditEntry[] = [
  { id: "AUD-01", date: d(0, 7), actor: "system", role: "SCHEDULER", action: "CALIBRATION.EXPIRED", entity: "equipment", entityId: "EQ-08", reason: "Sertifikat KAL-AUT-2025-092 kedaluwarsa" },
  { id: "AUD-02", date: d(0, 7), actor: "system", role: "SCHEDULER", action: "MAINTENANCE.OVERDUE", entity: "work_order", entityId: "WO-2608", reason: "PM melewati tanggal rencana" },
  { id: "AUD-03", date: d(-2, 9), actor: "Ratna Dewi, S.E.", role: "Finance", action: "PROCUREMENT.APPROVE", entity: "purchase_request", entityId: "PR-2608-011", reason: "Tahap 2 Keuangan: Budget tersedia" },
  { id: "AUD-04", date: d(-1, 15), actor: "dr. H. Ahmad Fauzi, MARS", role: "COO", action: "PROCUREMENT.APPROVE", entity: "purchase_request", entityId: "PR-2608-011", reason: "Tahap 3 COO: Setuju" },
  { id: "AUD-05", date: d(-25, 22), actor: "Ns. Dewi Lestari", role: "Kepala Unit", action: "COMPLAINT.CREATE", entity: "complaint", entityId: "CMP-2609", reason: "SLA CRITICAL 4 jam" },
];

export const NOTIFS: Notif[] = [
  { id: "N-1", kind: "CALIBRATION_EXPIRED", msg: "Autoclave GE46 — sertifikat kalibrasi EXPIRED 25 hari.", refId: "EQ-08", date: d(0, 7), read: false },
  { id: "N-2", kind: "MAINTENANCE_OVERDUE", msg: "WO-2608 (EKG 12 Kanal) melewati jadwal PM.", refId: "EQ-06", date: d(0, 7), read: false },
  { id: "N-3", kind: "LOW_STOCK", msg: "Handscoon Nitrile M di bawah reorder point (14 ≤ 50).", refId: "BHP-0012", date: d(0, 7), read: false },
  { id: "N-4", kind: "APPROVAL_PENDING", msg: "PR-2608-012 menunggu persetujuan Keuangan.", refId: "PR-1", date: d(0, 8), read: false },
];
