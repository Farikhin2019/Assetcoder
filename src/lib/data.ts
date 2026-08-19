import {
  Accessory, Approval, AuditEntry, BizContract, Building, CalibrationRecord, Complaint, Connector, DemandPlan,
  DisposalRecord, Equipment, FormTemplate, Inspection, InventoryItem, IssueRec, LedgerEntry, Loan, MobileTask,
  Notif, OpnameSession, PermLevel, PRLine, PRStageStatus, PurchaseOrder, PurchaseRequest, Receipt, Rental, Repair,
  Role, RoomInfo, SparePart, StageDecision, Supplier, SyncEntry, Technician, TimelineEvent, TransferRecord, TxType,
  Warehouse, WorkOrder, d, isITSku, mkPendingStages, periodKey, uid,
} from "./types";

/* ── people & partners ── */
export const TECHNICIANS: Technician[] = [
  { id: "T-01", name: "Agus Firmansyah", specialty: "Life-support & ICU devices", cert: "CRES/BME-2 · Dräger certified", phone: "0812-3345-1102", vendor: false },
  { id: "T-02", name: "Siti Nurhaliza", specialty: "Imaging (CT / X-Ray / USG)", cert: "BAPETEN radiographer license", phone: "0813-9921-4471", vendor: false },
  { id: "T-03", name: "Rudi Hartawan", specialty: "Laboratory analyzers", cert: "Sysmex & Abbott field service", phone: "0857-1108-2236", vendor: true },
  { id: "T-04", name: "Maya Anggraini", specialty: "Sterilization & CSSD", cert: "Getinge service partner", phone: "0819-2210-8843", vendor: true },
  { id: "T-05", name: "Fajar Nugroho", specialty: "Electrical safety & general", cert: "K3 Listrik · Elektro Medik", phone: "0812-8890-3345", vendor: false },
];

export const SUPPLIERS: Supplier[] = [
  { id: "S-01", name: "PT GE Healthcare Indonesia", service: "CT, USG, incubator — parts & service", contractUntil: d(210), contact: "cs@gehealthcare.id" },
  { id: "S-02", name: "Siemens Healthineers", service: "MRI & imaging service contract", contractUntil: d(96), contact: "support@siemens-healthineers.com" },
  { id: "S-03", name: "PT Medika Distrindo", service: "BHP medis distribution", contractUntil: d(300), contact: "order@medikadistrindo.co.id" },
  { id: "S-04", name: "Dräger Indonesia", service: "Ventilator & anesthesia service", contractUntil: d(41), contact: "service@draeger.co.id" },
  { id: "S-05", name: "PT Instrumedia Lab", service: "Lab reagents & analyzers", contractUntil: d(-6), contact: "sales@instrumedia.id" },
];

/* ── equipment registry ── */
type EqSeed = Omit<Equipment, "docs"> & { docs?: Equipment["docs"] };
const doc = (name: string, size: string, kind: string, days: number) => ({ name, size, kind, checksum: "sha256:" + uid() + uid(), date: d(days) });

const RAW_EQUIPMENT: EqSeed[] = [
  { id: "EQ-01", code: "AST-RS-2026-000001", name: "CT-Scan 128 Slice", category: "Imaging", brand: "GE Healthcare", model: "Revolution EVO", serial: "GE-CT-88213", manufacturer: "GE Healthcare", prodYear: 2022, acqDate: d(-420), acqCost: 9_800_000_000, supplierId: "S-01", warrantyUntil: d(310), building: "Gedung C", floor: "Lantai 1", room: "CT-01 · Radiologi", unit: "Instalasi Radiologi", custodian: "dr. Anton Wijaya, Sp.Rad", pic: "Siti Nurhaliza", condition: "EXCELLENT", opStatus: "IN_SERVICE", risk: "HIGH", criticality: "CRITICAL", calRequired: true, calStatus: "DUE_SOON", calLast: d(-330), calDue: d(12), maintStrategy: "PREVENTIVE", lastMaint: d(-30), nextMaint: d(60), lifecycle: 6, utilization: 81, mtbfHours: 720, docs: [doc("BAST-CT-2025.pdf", "1.2 MB", "application/pdf", -420), doc("Manual-Revolution-EVO.pdf", "18.4 MB", "application/pdf", -418)] },
  { id: "EQ-02", code: "AST-RS-2026-000002", name: "MRI 1.5 Tesla", category: "Imaging", brand: "Siemens", model: "Magnetom Altea", serial: "SI-MR-77021", manufacturer: "Siemens Healthineers", prodYear: 2023, acqDate: d(-300), acqCost: 14_500_000_000, supplierId: "S-02", warrantyUntil: d(430), building: "Gedung C", floor: "Lantai 1", room: "MRI-01 · Radiologi", unit: "Instalasi Radiologi", custodian: "dr. Anton Wijaya, Sp.Rad", pic: "Siti Nurhaliza", condition: "EXCELLENT", opStatus: "IN_SERVICE", risk: "HIGH", criticality: "CRITICAL", calRequired: true, calStatus: "VALID", calLast: d(-120), calDue: d(245), maintStrategy: "PREVENTIVE", lastMaint: d(-15), nextMaint: d(75), lifecycle: 6, utilization: 74, mtbfHours: 810 },
  { id: "EQ-03", code: "AST-RS-2026-000003", name: "Ventilator Savina 300", category: "Life Support", brand: "Dräger", model: "Savina 300 Select", serial: "DR-VN-30417", manufacturer: "Drägerwerk AG", prodYear: 2021, acqDate: d(-610), acqCost: 685_000_000, supplierId: "S-04", warrantyUntil: d(-245), building: "Gedung D", floor: "Lantai 2", room: "ICU Bed 04", unit: "Instalasi ICU", custodian: "Ns. Dewi Lestari", pic: "Agus Firmansyah", condition: "FAIR", opStatus: "MAINTENANCE", risk: "HIGH", criticality: "CRITICAL", calRequired: true, calStatus: "VALID", calLast: d(-200), calDue: d(165), maintStrategy: "PREVENTIVE", lastMaint: d(-6), nextMaint: d(4), lifecycle: 6, utilization: 93, mtbfHours: 310, docs: [doc("Sertifikat-KAL-VNT-2025-309.pdf", "640 KB", "application/pdf", -200)] },
  { id: "EQ-04", code: "AST-RS-2026-000004", name: "Patient Monitor MX450", category: "Monitoring", brand: "Philips", model: "IntelliVue MX450", serial: "PH-PM-11908", manufacturer: "Philips Healthcare", prodYear: 2023, acqDate: d(-260), acqCost: 215_000_000, supplierId: "S-01", warrantyUntil: d(470), building: "Gedung D", floor: "Lantai 2", room: "ICU Bed 07", unit: "Instalasi ICU", custodian: "Ns. Dewi Lestari", pic: "Agus Firmansyah", condition: "GOOD", opStatus: "IN_SERVICE", risk: "MEDIUM", criticality: "HIGH", calRequired: true, calStatus: "VALID", calLast: d(-90), calDue: d(275), maintStrategy: "PREVENTIVE", lastMaint: d(-45), nextMaint: d(45), lifecycle: 6, utilization: 88, mtbfHours: 1150 },
  { id: "EQ-05", code: "AST-RS-2026-000005", name: "USG 4D Voluson", category: "Imaging", brand: "GE Healthcare", model: "Voluson S10", serial: "GE-US-55320", manufacturer: "GE Healthcare", prodYear: 2020, acqDate: d(-720), acqCost: 940_000_000, supplierId: "S-01", warrantyUntil: d(-355), building: "Gedung B", floor: "Lantai 3", room: "Poli Kebidanan 2", unit: "Poliklinik Obsgyn", custodian: "dr. Maya Safitri, Sp.OG", pic: "Siti Nurhaliza", condition: "GOOD", opStatus: "IN_SERVICE", risk: "MEDIUM", criticality: "HIGH", calRequired: true, calStatus: "VALID", calLast: d(-150), calDue: d(215), maintStrategy: "PREVENTIVE", lastMaint: d(-60), nextMaint: d(30), lifecycle: 6, utilization: 66, mtbfHours: 900 },
  { id: "EQ-06", code: "AST-RS-2026-000006", name: "EKG 12 Kanal", category: "Monitoring", brand: "Nihon Kohden", model: "ECG-2550", serial: "NK-EK-20871", manufacturer: "Nihon Kohden", prodYear: 2019, acqDate: d(-900), acqCost: 78_000_000, supplierId: "S-03", warrantyUntil: d(-535), building: "Gedung A", floor: "Lantai 1", room: "IGD Resusitasi", unit: "Instalasi IGD", custodian: "dr. Bimo Prasetyo", pic: "Fajar Nugroho", condition: "FAIR", opStatus: "IN_SERVICE", risk: "MEDIUM", criticality: "HIGH", calRequired: true, calStatus: "VALID", calLast: d(-260), calDue: d(105), maintStrategy: "PREVENTIVE", lastMaint: d(-200), nextMaint: d(-1), lifecycle: 6, utilization: 57, mtbfHours: 640 },
  { id: "EQ-07", code: "AST-RS-2026-000007", name: "Defibrillator R Series", category: "Life Support", brand: "Zoll", model: "R Series Plus", serial: "ZL-DF-66140", manufacturer: "Zoll Medical", prodYear: 2022, acqDate: d(-380), acqCost: 320_000_000, supplierId: "S-01", warrantyUntil: d(350), building: "Gedung A", floor: "Lantai 1", room: "IGD Resusitasi", unit: "Instalasi IGD", custodian: "dr. Bimo Prasetyo", pic: "Agus Firmansyah", condition: "EXCELLENT", opStatus: "IN_SERVICE", risk: "HIGH", criticality: "CRITICAL", calRequired: true, calStatus: "VALID", calLast: d(-60), calDue: d(305), maintStrategy: "PREVENTIVE", lastMaint: d(-30), nextMaint: d(60), lifecycle: 6, utilization: 22, mtbfHours: 1400 },
  { id: "EQ-08", code: "AST-RS-2026-000008", name: "Autoclave GE46", category: "Sterilisasi", brand: "Getinge", model: "GE46-2", serial: "GT-AC-40913", manufacturer: "Getinge AB", prodYear: 2018, acqDate: d(-1050), acqCost: 1_450_000_000, supplierId: "S-04", warrantyUntil: d(-685), building: "Gedung C", floor: "Lantai 2", room: "CSSD · Dekontaminasi", unit: "Instalasi CSSD", custodian: "Rina Kusuma, S.T.", pic: "Maya Anggraini", condition: "FAIR", opStatus: "IN_SERVICE", risk: "HIGH", criticality: "HIGH", calRequired: true, calStatus: "EXPIRED", calLast: d(-390), calDue: d(-25), maintStrategy: "CORRECTIVE", lastMaint: d(-20), nextMaint: d(40), lifecycle: 6, utilization: 71, mtbfHours: 420, docs: [doc("Sertifikat-KAL-AUT-2025-092.pdf", "512 KB", "application/pdf", -390), doc("Laporan-kebocoran-door-seal.pdf", "220 KB", "application/pdf", -21)] },
  { id: "EQ-09", code: "AST-RS-2026-000009", name: "X-Ray Digital", category: "Imaging", brand: "Shimadzu", model: "RADspeed Pro", serial: "SH-XR-31209", manufacturer: "Shimadzu Corp", prodYear: 2021, acqDate: d(-540), acqCost: 1_120_000_000, supplierId: "S-02", warrantyUntil: d(190), building: "Gedung C", floor: "Lantai 1", room: "XR-02 · Radiologi", unit: "Instalasi Radiologi", custodian: "dr. Anton Wijaya, Sp.Rad", pic: "Siti Nurhaliza", condition: "GOOD", opStatus: "IN_SERVICE", risk: "MEDIUM", criticality: "HIGH", calRequired: true, calStatus: "VALID", calLast: d(-100), calDue: d(265), maintStrategy: "PREDICTIVE", lastMaint: d(-50), nextMaint: d(40), lifecycle: 6, utilization: 63, mtbfHours: 860 },
  { id: "EQ-10", code: "AST-RS-2026-000010", name: "Hematology Analyzer XN-1000", category: "Laboratorium", brand: "Sysmex", model: "XN-1000", serial: "SY-HA-90312", manufacturer: "Sysmex Corp", prodYear: 2022, acqDate: d(-330), acqCost: 1_850_000_000, supplierId: "S-05", warrantyUntil: d(400), building: "Gedung C", floor: "Lantai 3", room: "Lab Hematologi", unit: "Instalasi Laboratorium", custodian: "dr. Lina Kartika, Sp.PK", pic: "Rudi Hartawan", condition: "GOOD", opStatus: "IN_SERVICE", risk: "MEDIUM", criticality: "HIGH", calRequired: true, calStatus: "VALID", calLast: d(-45), calDue: d(320), maintStrategy: "PREVENTIVE", lastMaint: d(-25), nextMaint: d(65), lifecycle: 6, utilization: 85, mtbfHours: 690 },
  { id: "EQ-11", code: "AST-RS-2026-000011", name: "Infant Incubator", category: "Life Support", brand: "GE Healthcare", model: "Giraffe OmniBed", serial: "GE-IN-41827", manufacturer: "GE Healthcare", prodYear: 2023, acqDate: d(-200), acqCost: 560_000_000, supplierId: "S-01", warrantyUntil: d(530), building: "Gedung D", floor: "Lantai 3", room: "Perinatologi · Box 2", unit: "Instalasi Perinatologi", custodian: "dr. Ratna Dewi, Sp.A", pic: "Agus Firmansyah", condition: "EXCELLENT", opStatus: "IN_SERVICE", risk: "HIGH", criticality: "CRITICAL", calRequired: true, calStatus: "VALID", calLast: d(-170), calDue: d(195), maintStrategy: "PREVENTIVE", lastMaint: d(-40), nextMaint: d(50), lifecycle: 6, utilization: 77, mtbfHours: 980 },
  { id: "EQ-12", code: "AST-RS-2026-000012", name: "Hemodialisa DBB-EXA", category: "Life Support", brand: "Nikkiso", model: "DBB-EXA Essencia", serial: "NK-HD-18230", manufacturer: "Nikkiso Co", prodYear: 2020, acqDate: d(-700), acqCost: 420_000_000, supplierId: "S-03", warrantyUntil: d(-335), building: "Gedung B", floor: "Lantai 2", room: "HD · Station 5", unit: "Unit Hemodialisa", custodian: "Ns. Yuli Astuti", pic: "Fajar Nugroho", condition: "FAIR", opStatus: "IN_SERVICE", risk: "HIGH", criticality: "CRITICAL", calRequired: true, calStatus: "DUE_SOON", calLast: d(-352), calDue: d(13), maintStrategy: "PREVENTIVE", lastMaint: d(-18), nextMaint: d(12), lifecycle: 6, utilization: 69, mtbfHours: 510 },
  { id: "EQ-13", code: "AST-RS-2026-000013", name: "Syringe Pump SP-7", category: "Infusion", brand: "Terumo", model: "Terufusion SP-7", serial: "TM-SP-72014", manufacturer: "Terumo Corp", prodYear: 2024, acqDate: d(-90), acqCost: 38_500_000, supplierId: "S-03", warrantyUntil: d(640), building: "Gedung D", floor: "Lantai 2", room: "ICU Bed 02", unit: "Instalasi ICU", custodian: "Ns. Dewi Lestari", pic: "Agus Firmansyah", condition: "EXCELLENT", opStatus: "IN_SERVICE", risk: "LOW", criticality: "MEDIUM", calRequired: true, calStatus: "VALID", calLast: d(-80), calDue: d(285), maintStrategy: "PREVENTIVE", lastMaint: d(-20), nextMaint: d(70), lifecycle: 6, utilization: 54, mtbfHours: 1600 },
  { id: "EQ-14", code: "AST-RS-2026-000014", name: "Dental Unit", category: "Poliklinik", brand: " Belmont", model: "Clesta II", serial: "BL-DU-50182", manufacturer: "Belmont Takara", prodYear: 2017, acqDate: d(-1200), acqCost: 245_000_000, supplierId: "S-03", warrantyUntil: d(-835), building: "Gedung B", floor: "Lantai 1", room: "Poli Gigi 1", unit: "Poliklinik Gigi", custodian: "drg. Fani Rahma", pic: "Fajar Nugroho", condition: "FAIR", opStatus: "IN_SERVICE", risk: "LOW", criticality: "LOW", calRequired: false, calStatus: "NOT_REQUIRED", calLast: null, calDue: null, maintStrategy: "CORRECTIVE", lastMaint: d(-200), nextMaint: d(60), lifecycle: 6, utilization: 31, mtbfHours: 460 },
  { id: "EQ-15", code: "AST-RS-2026-000015", name: "Infant Warmer (2014)", category: "Life Support", brand: "GE Healthcare", model: "Lullaby Warmer", serial: "GE-IW-10427", manufacturer: "GE Healthcare", prodYear: 2014, acqDate: d(-4300), acqCost: 85_000_000, supplierId: "S-01", warrantyUntil: d(-3900), building: "Gedung C", floor: "Lantai 2", room: "Gudang Aset Non-Aktif", unit: "Instalasi Perinatologi", custodian: "Rina Kusuma, S.T.", pic: "Agus Firmansyah", condition: "POOR", opStatus: "RETIRED", risk: "LOW", criticality: "LOW", calRequired: false, calStatus: "NOT_REQUIRED", calLast: null, calDue: null, maintStrategy: "CORRECTIVE", lastMaint: d(-900), nextMaint: d(9999), lifecycle: 7, utilization: 0, mtbfHours: 120 },
  { id: "EQ-16", code: "AST-RS-2026-000016", name: "EKG 3 Kanal (2013)", category: "Monitoring", brand: "Nihon Kohden", model: "ECG-2530", serial: "NK-EK-08113", manufacturer: "Nihon Kohden", prodYear: 2013, acqDate: d(-4700), acqCost: 42_000_000, supplierId: "S-03", warrantyUntil: d(-4300), building: "Gedung C", floor: "Lantai 2", room: "Gudang Aset Non-Aktif", unit: "Instalasi IGD", custodian: "Rina Kusuma, S.T.", pic: "Fajar Nugroho", condition: "POOR", opStatus: "DISPOSED", risk: "LOW", criticality: "LOW", calRequired: false, calStatus: "NOT_REQUIRED", calLast: null, calDue: null, maintStrategy: "CORRECTIVE", lastMaint: d(-1400), nextMaint: d(9999), lifecycle: 8, utilization: 0, mtbfHours: 90 },
];
export const EQUIPMENT: Equipment[] = RAW_EQUIPMENT.map(({ docs, ...e }) => ({ ...e, docs: docs ?? [] }));

const TL: TimelineEvent[] = [
  { id: "TL-01", eqId: "EQ-03", type: "COMPLAINT", date: d(-25, 22), title: "Keluhan CMP-2609 — CRITICAL", detail: "Alarm low tidal volume berulang; deviasi VT >12%. Unit dikarantina.", actor: "Ns. Dewi Lestari", status: "IN_PROGRESS" },
  { id: "TL-02", eqId: "EQ-03", type: "MAINTENANCE", date: d(-6), title: "WO-2607 dikerjakan (CORRECTIVE)", detail: "Penggantian flow sensor ekshalasi + leak test.", actor: "Agus Firmansyah", cost: 6_800_000 },
  { id: "TL-03", eqId: "EQ-03", type: "REPAIR", date: d(-5), title: "RPR-2604 dimulai", detail: "Diagnosis: flow sensor drift >12% — kontaminasi uap nebulizer.", actor: "Agus Firmansyah" },
  { id: "TL-04", eqId: "EQ-03", type: "SPARE_PART", date: d(-5, 14), title: "Spare part dipakai — Flow Sensor", detail: "SP-DRG-8841845 ×1 via ledger CONSUMPTION (BR-016).", actor: "Agus Firmansyah", cost: 6_800_000 },
  { id: "TL-05", eqId: "EQ-03", type: "CALIBRATION", date: d(-200), title: "Kalibrasi PASS — KAL-VNT-2025-309", detail: "Selanjutnya jatuh tempo dalam 165 hari.", actor: "Agus Firmansyah", cost: 950_000 },
  { id: "TL-06", eqId: "EQ-08", type: "CALIBRATION", date: d(-390), title: "Kalibrasi PASS — KAL-AUT-2025-092", detail: "Sertifikat kini EXPIRED — CSSD menahan rilis batch.", actor: "Maya Anggraini", cost: 2_750_000, status: "EXPIRED" },
  { id: "TL-07", eqId: "EQ-08", type: "COMPLAINT", date: d(-2, 8), title: "Keluhan CMP-2610 — HIGH", detail: "Kalibrasi kedaluwarsa 25 hari; batch steril ditahan.", actor: "Rina Kusuma", status: "ACKNOWLEDGED" },
  { id: "TL-08", eqId: "EQ-08", type: "REPAIR", date: d(-21), title: "RPR-2602 ditutup", detail: "Door gasket diganti; leak 2.1 → 0.4 kPa/min.", actor: "Maya Anggraini", cost: 3_900_000 },
  { id: "TL-09", eqId: "EQ-01", type: "LIFECYCLE", date: d(-420), title: "Registrasi aset — AST-RS-2026-000001", detail: "PO-2025-011 · diterima & commissioning selesai.", actor: "Rina Kusuma, S.T." },
  { id: "TL-10", eqId: "EQ-01", type: "MAINTENANCE", date: d(-30), title: "PM triwulan selesai", detail: "Tube output check 98.2% — AEC normal.", actor: "Siti Nurhaliza", cost: 1_500_000 },
  { id: "TL-11", eqId: "EQ-07", type: "COST", date: d(-69), title: "Battery pack diganti", detail: "RPR-2601 · total Rp 4,74 jt termasuk jasa.", actor: "Agus Firmansyah", cost: 4_740_000 },
  { id: "TL-12", eqId: "EQ-12", type: "COMPLAINT", date: d(-1, 14), title: "Keluhan CMP-2611 — HIGH", detail: "Alarm conductivity intermiten station 5.", actor: "Perawat HD shift siang", status: "OPEN" },
  { id: "TL-13", eqId: "EQ-04", type: "TRANSFER", date: d(-1, 15), title: "Permintaan transfer TRF-2608-003", detail: "ICU Bed 07 → ICCU Bed 02. Menunggu persetujuan.", actor: "Ns. Dewi Lestari", status: "PENDING" },
  { id: "TL-14", eqId: "EQ-13", type: "ASSIGNMENT", date: d(-8, 9), title: "Ditugaskan ke ICU Bed 02", detail: "Custodian: Ns. Dewi Lestari — pasca transfer TRF-2607-009.", actor: "Rina Kusuma, S.T." },
  { id: "TL-15", eqId: "EQ-10", type: "INSPECTION", date: d(-25), title: "Inspeksi keselamatan listrik PASS", detail: "Grounding 0.18 Ω; leakage 42 µA.", actor: "Fajar Nugroho" },
];
export const TIMELINE: TimelineEvent[] = TL.sort((a, b) => +new Date(b.date) - +new Date(a.date));

/* ── inventory ── */
export const ITEMS: InventoryItem[] = [
  { sku: "BHP-0012", name: "Handscoon Nitrile M", category: "Alkes Habis Pakai", uom: "box", warehouse: "Gudang BHP Medis", batch: "LT260514", expiry: d(540), stock: 14, min: 40, max: 200, reorder: 50, unitCost: 68_000, method: "FEFO" },
  { sku: "BHP-0031", name: "Spuit 3 cc Terumo", category: "Alkes Habis Pakai", uom: "pcs", warehouse: "Gudang BHP Medis", batch: "TR260420", expiry: d(720), stock: 1840, min: 500, max: 4000, reorder: 800, unitCost: 2_350, method: "FEFO" },
  { sku: "BHP-0038", name: "Infus Set Dewasa", category: "Alkes Habis Pakai", uom: "set", warehouse: "Gudang BHP Medis", batch: "OD260102", expiry: d(410), stock: 620, min: 300, max: 1500, reorder: 400, unitCost: 11_500, method: "FEFO" },
  { sku: "FAR-1102", name: "NaCl 0.9% 500 ml", category: "Infus & Cairan", uom: "flabot", warehouse: "Gudang Farmasi", batch: "WL260315", expiry: d(95), stock: 96, min: 150, max: 800, reorder: 200, unitCost: 14_800, method: "FEFO" },
  { sku: "FAR-1287", name: "Reagen Hematologi DCL", category: "Reagen Lab", uom: "pack", warehouse: "Gudang Farmasi", batch: "DCL26A", expiry: d(38), stock: 22, min: 10, max: 60, reorder: 15, unitCost: 1_240_000, method: "FEFO" },
  { sku: "BHP-0045", name: "Kassa Steril 16×16", category: "Alkes Habis Pakai", uom: "pack", warehouse: "Gudang BHP Medis", batch: "KS260610", expiry: null, stock: 1420, min: 400, max: 3000, reorder: 600, unitCost: 4_100, method: "FIFO" },
  { sku: "BHP-0052", name: "Alcohol Swab", category: "Alkes Habis Pakai", uom: "box", warehouse: "Gudang BHP Medis", batch: "AS260221", expiry: d(300), stock: 88, min: 60, max: 400, reorder: 80, unitCost: 24_500, method: "FEFO" },
  { sku: "BHP-0067", name: "Masker Bedah 3-Ply", category: "Alkes Habis Pakai", uom: "box", warehouse: "Gudang Umum", batch: "MK260701", expiry: null, stock: 2350, min: 500, max: 5000, reorder: 900, unitCost: 28_000, method: "FIFO" },
  { sku: "BHP-0071", name: "IV Catheter 22G", category: "Alkes Habis Pakai", uom: "pcs", warehouse: "Gudang BHP Medis", batch: "BD260518", expiry: d(620), stock: 310, min: 250, max: 2000, reorder: 400, unitCost: 9_700, method: "FEFO" },
  { sku: "BHP-0089", name: "ECG Electrode Dewasa", category: "Alkes Habis Pakai", uom: "pcs", warehouse: "Gudang BHP Medis", batch: "EL260330", expiry: d(240), stock: 760, min: 300, max: 2400, reorder: 450, unitCost: 3_900, method: "FEFO" },
  { sku: "FAR-1301", name: "Suction Catheter CH14", category: "Alkes Habis Pakai", uom: "pcs", warehouse: "Gudang Farmasi", batch: "SC260411", expiry: d(480), stock: 415, min: 200, max: 1200, reorder: 300, unitCost: 6_200, method: "FEFO" },
  { sku: "UMU-0211", name: "Kertas EKG 80 mm", category: "ATK Medis", uom: "roll", warehouse: "Gudang Umum", batch: null, expiry: null, stock: 42, min: 30, max: 200, reorder: 40, unitCost: 32_000, method: "FIFO" },
  { sku: "FAR-1340", name: "Citrate Tube 3.2% (CTAD)", category: "Reagen Lab", uom: "pack", warehouse: "Gudang Farmasi", batch: "GR260222", expiry: d(21), stock: 12, min: 8, max: 40, reorder: 12, unitCost: 385_000, method: "FEFO" },
  { sku: "IT-0901", name: "PC Workstation Radiologi (PACS)", category: "IT & Komputer", uom: "unit", warehouse: "Gudang Umum", batch: null, expiry: null, stock: 2, min: 1, max: 8, reorder: 2, unitCost: 18_500_000, method: "FIFO" },
  { sku: "IT-0902", name: "Printer Gelang Pasien", category: "IT & Komputer", uom: "unit", warehouse: "Gudang Umum", batch: null, expiry: null, stock: 3, min: 2, max: 12, reorder: 3, unitCost: 4_200_000, method: "FIFO" },
];

const stockOf = Object.fromEntries(ITEMS.map((i) => [i.sku, i.stock]));
const LEDGER: LedgerEntry[] = [];
const series = (sku: string, rows: [number, TxType, number, string, string?][]) => {
  const net = rows.reduce((a, r) => a + r[2], 0);
  let bal = stockOf[sku] - net;
  LEDGER.push({ id: uid(), date: d(-62, 7), sku, type: "OPENING_BALANCE", qty: bal, balance: bal, actor: "system", ref: "OB-2026-07" });
  rows.forEach((r) => {
    bal += r[2];
    LEDGER.push({ id: uid(), date: d(r[0], 8 + (Math.abs(r[2]) % 9)), sku, type: r[1], qty: r[2], balance: bal, actor: r[3], ref: r[4] ?? "TRX-" + uid(), reason: r[1] === "ADJUSTMENT" ? "Cycle count reconciliation" : undefined });
  });
};
series("BHP-0012", [[-30, "RECEIPT", 120, "Kepala Gudang", "GR-2607-114"], [-18, "ISSUE", -86, "Petugas Gudang", "DIST-2607-091 · IGD"], [-9, "ISSUE", -38, "Petugas Gudang", "DIST-2608-012 · ICU"], [-3, "ADJUSTMENT", 6, "Kepala Gudang", "ADJ-2608-004"]]);
series("FAR-1102", [[-26, "ISSUE", -140, "Petugas Gudang", "DIST-2607-102 · Rawat Inap"], [-12, "RECEIPT", 96, "Kepala Gudang", "GR-2608-006"], [-4, "ISSUE", -60, "Petugas Gudang", "DIST-2608-021 · IGD"]]);
series("FAR-1287", [[-40, "RECEIPT", 24, "Kepala Gudang", "GR-2607-090"], [-21, "ISSUE", -14, "Petugas Gudang", "DIST-2607-118 · Lab"], [-6, "ISSUE", -9, "Petugas Gudang", "DIST-2608-009 · Lab"]]);
series("BHP-0031", [[-33, "RECEIPT", 2000, "Kepala Gudang", "GR-2607-098"], [-15, "ISSUE", -950, "Petugas Gudang", "DIST-2608-002 · multi-unit"], [-2, "ISSUE", -210, "Petugas Gudang", "DIST-2608-025 · ICU"]]);
series("BHP-0052", [[-20, "RECEIPT", 90, "Kepala Gudang", "GR-2607-121"], [-7, "ISSUE", -62, "Petugas Gudang", "DIST-2608-011 · Poli"]]);
series("BHP-0071", [[-16, "ISSUE", -180, "Petugas Gudang", "DIST-2608-004 · IGD"], [-1, "RETURN", 8, "Petugas Gudang", "RET-2608-002"]]);
series("UMU-0211", [[-10, "ISSUE", -18, "Petugas Gudang", "DIST-2608-016"], [-5, "STOCK_OPNAME", 2, "Kepala Gudang", "SO-2608-001"]]);
series("FAR-1340", [[-28, "RECEIPT", 16, "Kepala Gudang", "GR-2607-101"], [-8, "ISSUE", -7, "Petugas Gudang", "DIST-2608-013 · Lab"]]);
series("BHP-0038", [[-22, "RECEIPT", 300, "Kepala Gudang", "GR-2607-117"], [-5, "ISSUE", -120, "Petugas Gudang", "DIST-2608-019"]]);
series("BHP-0045", [[-19, "RECEIPT", 800, "Kepala Gudang", "GR-2608-001"], [-3, "ISSUE", -340, "Petugas Gudang", "DIST-2608-023 · OK"]]);
series("BHP-0067", [[-31, "RECEIPT", 1500, "Kepala Gudang", "GR-2607-095"], [-11, "ISSUE", -650, "Petugas Gudang", "DIST-2608-007"]]);
series("BHP-0089", [[-14, "RECEIPT", 500, "Kepala Gudang", "GR-2608-005"], [-2, "ISSUE", -190, "Petugas Gudang", "DIST-2608-024 · ICCU"]]);
series("FAR-1301", [[-17, "RECEIPT", 240, "Kepala Gudang", "GR-2608-003"], [-6, "ISSUE", -95, "Petugas Gudang", "DIST-2608-018 · ICU"]]);
export const LEDGER_INIT: LedgerEntry[] = LEDGER.sort((a, b) => +new Date(b.date) - +new Date(a.date));

export const SPARE_PARTS: SparePart[] = [
  { id: "SP-01", name: "Flow Sensor Savina 300", code: "SP-DRG-8841845", stock: 2, min: 2, unit: "pcs", unitCost: 6_800_000, eqIds: ["EQ-03"] },
  { id: "SP-02", name: "O2 Sensor Fuel Cell", code: "SP-DRG-8418371", stock: 5, min: 3, unit: "pcs", unitCost: 2_950_000, eqIds: ["EQ-03", "EQ-11"] },
  { id: "SP-03", name: "Battery Pack R Series", code: "SP-ZOL-0000-3345", stock: 3, min: 2, unit: "pcs", unitCost: 4_100_000, eqIds: ["EQ-07"] },
  { id: "SP-04", name: "Autoclave Door Gasket GE46", code: "SP-GET-GE46-GSK", stock: 1, min: 1, unit: "set", unitCost: 3_100_000, eqIds: ["EQ-08"] },
  { id: "SP-05", name: "SpO2 Extension Cable", code: "SP-PHL-MX-EXT", stock: 8, min: 4, unit: "pcs", unitCost: 780_000, eqIds: ["EQ-04"] },
  { id: "SP-06", name: "XN-1000 Sampling Valve", code: "SP-SYS-XN-SV2", stock: 0, min: 1, unit: "pcs", unitCost: 5_400_000, eqIds: ["EQ-10"] },
  { id: "SP-07", name: "Incubator Skin Probe", code: "SP-GE-OMB-SP4", stock: 6, min: 3, unit: "pcs", unitCost: 1_150_000, eqIds: ["EQ-11"] },
];

/* ── Phase 2: form templates, work orders, calibrations, inspections ── */
export const FORM_TEMPLATES: FormTemplate[] = [
  {
    id: "FT-PM-VNT", name: "PM Ventilator — Dräger Savina", fields: [
      { id: "f1", type: "instruction", label: "Ikuti urutan: uji kebocoran → akurasi flow → alarm → elektrik. Catat hasil terukur." },
      { id: "f2", type: "measurement", label: "Leak test (kPa/min)", unit: "kPa/min", required: true },
      { id: "f3", type: "measurement", label: "Akurasi tidal volume", unit: "%", required: true },
      { id: "f4", type: "measurement", label: "FiO2 deviasi", unit: "%", required: true },
      { id: "f5", type: "passfail", label: "Uji alarm (low VT / high pressure / apnea)" },
      { id: "f6", type: "passfail", label: "Electrical safety (IEC 60601)" },
      { id: "f7", type: "number", label: "Jam pemakaian total", unit: "jam" },
      { id: "f8", type: "checkbox", label: "Filter & circuit diganti" },
      { id: "f9", type: "text", label: "Catatan teknisi" },
    ],
  },
  {
    id: "FT-PM-IMG", name: "PM Imaging — QC Harian", fields: [
      { id: "f1", type: "passfail", label: "QC phantom image uniformity" },
      { id: "f2", type: "measurement", label: "Tube output", unit: "mGy/100mAs", required: true },
      { id: "f3", type: "passfail", label: "AEC response" },
      { id: "f4", type: "measurement", label: "Collimator alignment", unit: "mm" },
      { id: "f5", type: "radio", label: "Kondisi kolimator", options: ["Baik", "Aus ringan", "Perlu servis"] },
      { id: "f6", type: "text", label: "Catatan" },
    ],
  },
  {
    id: "FT-INS-ELEC", name: "Inspeksi Keselamatan Listrik", fields: [
      { id: "f1", type: "measurement", label: "Grounding resistance", unit: "Ω", required: true },
      { id: "f2", type: "measurement", label: "Leakage current", unit: "µA", required: true },
      { id: "f3", type: "passfail", label: "Visual kondisi kabel & plug" },
      { id: "f4", type: "passfail", label: "Fuse rating sesuai" },
      { id: "f5", type: "select", label: "Kelas alat", options: ["Kelas I", "Kelas II", "Internal power"] },
      { id: "f6", type: "date", label: "Tanggal uji berikutnya" },
    ],
  },
  {
    id: "FT-INS-GEN", name: "Inspeksi Umum Aset", fields: [
      { id: "f1", type: "passfail", label: "Label aset & QR terbaca" },
      { id: "f2", type: "passfail", label: "Fisik & kebersihan unit" },
      { id: "f3", type: "radio", label: "Kondisi umum", options: ["EXCELLENT", "GOOD", "FAIR", "POOR"] },
      { id: "f4", type: "checkbox", label: "Aksesori lengkap sesuai daftar" },
      { id: "f5", type: "text", label: "Temuan" },
    ],
  },
];

export const WORK_ORDERS: WorkOrder[] = [
  { id: "WO-1", wo: "WO-2607", eqId: "EQ-03", type: "CORRECTIVE", techId: "T-01", scheduled: d(-6), status: "IN_PROGRESS", note: "Flow sensor replacement after CMP-2609. Leak test & functional verification pending.", laborCost: 6_800_000, templateId: "FT-PM-VNT" },
  { id: "WO-2", wo: "WO-2608", eqId: "EQ-06", type: "PREVENTIVE", techId: "T-05", scheduled: d(-1), status: "SCHEDULED", note: "Semi-annual PM: leadwire impedance, print head, electrical safety.", laborCost: 420_000, templateId: "FT-INS-ELEC" },
  { id: "WO-3", wo: "WO-2609", eqId: "EQ-13", type: "PREVENTIVE", techId: "T-01", scheduled: d(2), status: "SCHEDULED", note: "Annual flow accuracy verification + battery cycle test.", laborCost: 380_000, templateId: "FT-PM-VNT" },
  { id: "WO-4", wo: "WO-2605", eqId: "EQ-10", type: "PREVENTIVE", techId: "T-03", scheduled: d(-25), status: "CLOSED", note: "Hydraulic & optic cleaning; carryover 0.31%.", laborCost: 1_200_000, templateId: "FT-INS-GEN" },
  { id: "WO-5", wo: "WO-2606", eqId: "EQ-12", type: "PREVENTIVE", techId: "T-05", scheduled: d(-18), status: "CLOSED", note: "Conductivity & UF check passed.", laborCost: 1_450_000, templateId: "FT-INS-ELEC" },
  { id: "WO-6", wo: "WO-2610", eqId: "EQ-09", type: "PREDICTIVE", techId: "T-02", scheduled: d(45), status: "SCHEDULED", note: "Tube output trending + AEC verification.", laborCost: 1_100_000, templateId: "FT-PM-IMG" },
];

export const CALIBRATIONS: CalibrationRecord[] = [
  { id: "CAL-1", eqId: "EQ-01", date: d(-330), result: "PASS", cert: "KAL-CT-2025-114", techId: "T-02", nextDue: d(12), cost: 3_500_000 },
  { id: "CAL-2", eqId: "EQ-02", date: d(-120), result: "PASS", cert: "KAL-MRI-2026-021", techId: "T-02", nextDue: d(245), cost: 4_200_000 },
  { id: "CAL-3", eqId: "EQ-03", date: d(-200), result: "PASS", cert: "KAL-VNT-2025-309", techId: "T-01", nextDue: d(165), cost: 950_000 },
  { id: "CAL-4", eqId: "EQ-04", date: d(-90), result: "PASS", cert: "KAL-PM-2026-077", techId: "T-01", nextDue: d(275), cost: 800_000 },
  { id: "CAL-5", eqId: "EQ-05", date: d(-150), result: "ADJUSTED", cert: "KAL-USG-2026-018", techId: "T-02", nextDue: d(215), cost: 1_350_000 },
  { id: "CAL-6", eqId: "EQ-06", date: d(-260), result: "PASS", cert: "KAL-EKG-2025-276", techId: "T-05", nextDue: d(105), cost: 620_000 },
  { id: "CAL-7", eqId: "EQ-07", date: d(-60), result: "PASS", cert: "KAL-DEF-2026-045", techId: "T-01", nextDue: d(305), cost: 900_000 },
  { id: "CAL-8", eqId: "EQ-08", date: d(-390), result: "PASS", cert: "KAL-AUT-2025-092", techId: "T-04", nextDue: d(-25), cost: 2_750_000 },
  { id: "CAL-9", eqId: "EQ-09", date: d(-100), result: "PASS", cert: "KAL-XR-2026-032", techId: "T-02", nextDue: d(265), cost: 2_100_000 },
  { id: "CAL-10", eqId: "EQ-10", date: d(-45), result: "PASS", cert: "KAL-LAB-2026-061", techId: "T-03", nextDue: d(320), cost: 1_050_000 },
  { id: "CAL-11", eqId: "EQ-11", date: d(-170), result: "PASS", cert: "KAL-INC-2025-288", techId: "T-01", nextDue: d(195), cost: 980_000 },
  { id: "CAL-12", eqId: "EQ-12", date: d(-352), result: "PASS", cert: "KAL-HD-2025-201", techId: "T-05", nextDue: d(13), cost: 1_100_000 },
  { id: "CAL-13", eqId: "EQ-13", date: d(-80), result: "PASS", cert: "KAL-SYP-2026-054", techId: "T-01", nextDue: d(285), cost: 540_000 },
];

export const INSPECTIONS: Inspection[] = [
  { id: "INS-1", code: "INS-2608-004", eqId: "EQ-10", date: d(-25), nextDue: d(65), inspector: "Fajar Nugroho", result: "PASS", note: "Leakage 42 µA; grounding 0.18 Ω.", checklist: [{ item: "Grounding resistance", pass: true }, { item: "Leakage current", pass: true }, { item: "Kabel & plug", pass: true }, { item: "Label & QR", pass: true }] },
  { id: "INS-2", code: "INS-2608-003", eqId: "EQ-06", date: d(-8), nextDue: d(-1), inspector: "Fajar Nugroho", result: "CONDITIONAL", note: "Plug grounding aus — dijadwalkan penggantian pada WO-2608.", checklist: [{ item: "Grounding resistance", pass: true }, { item: "Leakage current", pass: true }, { item: "Kabel & plug", pass: false }, { item: "Label & QR", pass: true }] },
  { id: "INS-3", code: "INS-2608-002", eqId: "EQ-12", date: d(-3), nextDue: d(87), inspector: "Fajar Nugroho", result: "PASS", note: "Semua parameter lolos; conductivity alarm terverifikasi.", checklist: [{ item: "Grounding resistance", pass: true }, { item: "Leakage current", pass: true }, { item: "Kabel & plug", pass: true }, { item: "Label & QR", pass: true }] },
  { id: "INS-4", code: "INS-2608-005", eqId: "EQ-08", date: d(-2), nextDue: d(28), inspector: "Maya Anggraini", result: "FAIL", note: "Door seal gagal uji tekan — tunggu gasket baru, unit dikarantina parsial.", checklist: [{ item: "Uji tekanan chamber", pass: false }, { item: "Safety valve", pass: true }, { item: "Indikator suhu", pass: true }, { item: "Label & QR", pass: true }] },
];

/* ── complaints & repairs ── */
export const COMPLAINTS: Complaint[] = [
  { id: "CMP-1", code: "CMP-2609", eqId: "EQ-03", date: d(-25, 22), reporter: "Ns. Dewi Lestari (ICU)", priority: "CRITICAL", description: "Alarm low tidal volume berulang pada pasien bed 04. Deviasi VT terukur >12% dari setting.", status: "IN_PROGRESS", slaHours: 4, timelineNote: "Corrective WO-2607 dibuka; unit dikarantina, ventilator cadangan dipasang." },
  { id: "CMP-2", code: "CMP-2610", eqId: "EQ-08", date: d(-2, 8), reporter: "Rina Kusuma (CSSD)", priority: "HIGH", description: "Sertifikat kalibrasi autoclave kedaluwarsa 25 hari lalu; CSSD menahan rilis batch steril hingga re-kalibrasi.", status: "ACKNOWLEDGED", slaHours: 8 },
  { id: "CMP-3", code: "CMP-2611", eqId: "EQ-12", date: d(-1, 14), reporter: "Perawat HD shift siang", priority: "HIGH", description: "Alarm conductivity intermiten saat sesi dialisis station 5; pasien dialihkan ke station 3.", status: "OPEN", slaHours: 8 },
  { id: "CMP-4", code: "CMP-2606", eqId: "EQ-01", date: d(-200, 10), reporter: "dr. Anton Wijaya, Sp.Rad", priority: "MEDIUM", description: "Ring artifact pada protokol abdomen, dicurigai kanal detektor.", status: "CLOSED", slaHours: 24, resolution: "Detektor channel 41 diganti bersama penggantian tube; artifact hilang pada QC phantom.", timelineNote: "Ditutup setelah verifikasi QC phantom 3 siklus." },
  { id: "CMP-5", code: "CMP-2607", eqId: "EQ-14", date: d(-1, 11), reporter: "drg. Fani Rahma", priority: "LOW", description: "Kursi dental unit lambat naik; diduga tekanan hidrolik turun.", status: "OPEN", slaHours: 72 },
  { id: "CMP-6", code: "CMP-2605", eqId: "EQ-07", date: d(-70, 19), reporter: "dr. Bimo Prasetyo (IGD)", priority: "CRITICAL", description: "Self-test pagi gagal pada paddle charge — energi tidak tercapai 200J.", status: "CLOSED", slaHours: 4, resolution: "Battery pack diganti dan uji energi biphasic 198.4J — lolos.", timelineNote: "Verifikasi IGD selesai; unit kembali siaga resusitasi." },
];

export const REPAIRS: Repair[] = [
  { id: "RPR-1", code: "RPR-2604", eqId: "EQ-03", complaintId: "CMP-1", diagnosis: "Flow sensor ekshalasi drift >12% — kontaminasi uap nebulizer.", partsUsed: [{ partId: "SP-01", qty: 1 }], laborCost: 1_250_000, status: "IN_PROGRESS", techId: "T-01", started: d(-5) },
  { id: "RPR-2", code: "RPR-2603", eqId: "EQ-10", complaintId: null, diagnosis: "Sampling valve macet pada posisi rinse; carryover naik ke 1.2%.", partsUsed: [{ partId: "SP-06", qty: 1 }], laborCost: 950_000, status: "AWAITING_APPROVAL", techId: "T-03", started: d(-3) },
  { id: "RPR-3", code: "RPR-2601", eqId: "EQ-07", complaintId: "CMP-6", diagnosis: "Battery pack degradasi — internal resistance di atas ambang.", partsUsed: [{ partId: "SP-03", qty: 1 }], laborCost: 640_000, status: "CLOSED", techId: "T-01", started: d(-69) },
  { id: "RPR-4", code: "RPR-2602", eqId: "EQ-08", complaintId: null, diagnosis: "Door seal bocor 2.1 kPa/menit; gasket getas.", partsUsed: [{ partId: "SP-04", qty: 1 }], laborCost: 800_000, status: "CLOSED", techId: "T-04", started: d(-21) },
];

/* ── approvals queue ── */
export const APPROVALS: Approval[] = [
  { id: "APR-1", type: "TRANSFER", ref: "TRF-2608-003", requester: "Ns. Dewi Lestari", value: 0, risk: "MEDIUM", summary: "Patient Monitor MX450 · ICU Bed 07 → ICCU Bed 02", matrix: ["Kepala Unit ICU", "Pengelola Aset", "Kepala Unit ICCU"], status: "PENDING", date: d(-1, 15), meta: { eqId: "EQ-04", toBuilding: "Gedung D", toFloor: "Lantai 2", toRoom: "ICCU · Bed 02" } },
  { id: "APR-2", type: "ADJUSTMENT", ref: "ADJ-2608-007", requester: "Kepala Gudang", value: 7_440_000, risk: "MEDIUM", summary: "Stock opname: Reagen Hematologi DCL −6 pack (selisih −Rp 7,44 jt > threshold)", matrix: ["Kepala Gudang", "Pengelola Inventory", "Manajemen"], status: "PENDING", date: d(-2, 10), meta: { sku: "FAR-1287", delta: -6, reason: "Selisih stock opname SO-2608-002 — investigasi suhu ruang reagen" } },
  { id: "APR-3", type: "REPAIR", ref: "RPR-2603", requester: "Rudi Hartawan (Teknisi)", value: 6_350_000, risk: "MEDIUM", summary: "Repair Hematology Analyzer — sampling valve + jasa (spare part stock 0, perlu pengadaan)", matrix: ["Kepala Teknisi", "Pengelola Aset"], status: "PENDING", date: d(-3, 9), meta: { eqId: "EQ-10" } },
];

/* ── Phase 2: procurement chain ── */
export const DEMAND_PLANS: DemandPlan[] = [
  { id: "DP-1", code: "DP-2609-001", item: "Handscoon Nitrile M", qty: 600, uom: "box", estCost: 40_800_000, unit: "Seluruh Unit", needBy: d(21), status: "REVIEWED", by: "Kepala Gudang" },
  { id: "DP-2", code: "DP-2609-002", item: "XN-1000 Sampling Valve", qty: 2, uom: "pcs", estCost: 10_800_000, unit: "Laboratorium", needBy: d(14), status: "SUBMITTED", by: "Rudi Hartawan" },
  { id: "DP-3", code: "DP-2609-003", item: "NaCl 0.9% 500 ml", qty: 400, uom: "flabot", estCost: 5_920_000, unit: "IGD & Rawat Inap", needBy: d(30), status: "SUBMITTED", by: "Ns. Dewi Lestari" },
  { id: "DP-4", code: "DP-2609-004", item: "Autoclave Door Gasket GE46", qty: 2, uom: "set", estCost: 6_200_000, unit: "CSSD", needBy: d(10), status: "DRAFT", by: "Maya Anggraini" },
  { id: "DP-5", code: "DP-2608-005", item: "SpO2 Extension Cable", qty: 10, uom: "pcs", estCost: 7_800_000, unit: "ICU", needBy: d(-5), status: "CONSOLIDATED", by: "Ns. Dewi Lestari" },
];

const st = (status: PRStageStatus, approver = "", note = "", dd = 0): StageDecision =>
  ({ status, approver, note, date: dd ? d(dd, 10) : "" });
const mkLine = (sku: string, name: string, qty: number, unitCost: number, stages: StageDecision[], revision = 0): PRLine =>
  ({ sku, name, qty, unitCost, isIT: isITSku(sku), stages, revision });

export const PURCHASE_REQUESTS: PurchaseRequest[] = [
  {
    id: "PR-3", code: "PR-2608-012", date: d(0, 7), requester: "UPBJ Pengadaan", unit: "Multi-Unit", needBy: d(21), status: "IN_APPROVAL",
    lines: [
      mkLine("BHP-0012", "Handscoon Nitrile M", 600, 68_000, [st("APPROVED", "Galih Saputra", "Sesuai ROP, lanjut", 0), st("PENDING"), st("PENDING")]),
      mkLine("IT-0901", "PC Workstation Radiologi (PACS)", 4, 18_500_000, [st("PENDING"), st("PENDING"), st("PENDING")]),
    ],
  },
  {
    id: "PR-4", code: "PR-2608-013", date: d(-1, 9), requester: "Ns. Dewi Lestari", unit: "ICU", needBy: d(14), status: "REJECTED",
    lines: [
      mkLine("IT-0902", "Printer Gelang Pasien", 10, 4_200_000, [st("APPROVED", "Dian Pratiwi", "Spek OK", -1), st("REJECTED", "Ratna Dewi, S.E.", "Qty terlalu banyak — cukup 6 unit untuk 6 bed", -1), st("PENDING")]),
      mkLine("BHP-0031", "Spuit 3 cc Terumo", 1500, 2_350, [st("APPROVED", "Galih Saputra", "OK", -1), st("APPROVED", "Ratna Dewi, S.E.", "Dalam budget", -1), st("PENDING")]),
    ],
  },
  {
    id: "PR-2", code: "PR-2608-011", date: d(-2, 8), requester: "UPBJ Pengadaan", unit: "IGD & Rawat Inap", needBy: d(30), status: "APPROVED",
    lines: [
      mkLine("FAR-1102", "NaCl 0.9% 500 ml", 400, 14_800, [st("APPROVED", "Galih Saputra", "Kebutuhan rutin", -2), st("APPROVED", "Ratna Dewi, S.E.", "Budget tersedia", -2), st("APPROVED", "dr. H. Ahmad Fauzi, MARS", "Setuju", -1)]),
    ],
  },
  {
    id: "PR-1", code: "PR-2608-009", date: d(-9, 10), requester: "UPBJ Pengadaan", unit: "ICU", needBy: d(-2), status: "PO_CREATED",
    lines: [
      mkLine("SP-PHL-MX-EXT", "SpO2 Extension Cable", 10, 780_000, [st("APPROVED", "Galih Saputra", "", -9), st("APPROVED", "Ratna Dewi, S.E.", "", -8), st("APPROVED", "dr. H. Ahmad Fauzi, MARS", "", -8)], 0),
    ],
  },
];

export const PURCHASE_ORDERS: PurchaseOrder[] = [
  { id: "PO-1", code: "PO-2608-090", date: d(-7, 11), supplierId: "S-03", items: [{ sku: "SP-PHL-MX-EXT", name: "SpO2 Extension Cable", qty: 10, price: 780_000 }], total: 7_800_000, eta: d(5), status: "SENT", prRef: "PR-2608-009" },
  { id: "PO-2", code: "PO-2607-088", date: d(-20, 9), supplierId: "S-03", items: [{ sku: "FAR-1102", name: "NaCl 0.9% 500 ml", qty: 96, price: 14_800 }], total: 1_420_800, eta: d(-12), status: "RECEIVED", prRef: "PR-2607-071" },
  { id: "PO-3", code: "PO-2607-090", date: d(-22, 14), supplierId: "S-03", items: [{ sku: "BHP-0089", name: "ECG Electrode Dewasa", qty: 500, price: 3_900 }], total: 1_950_000, eta: d(-14), status: "RECEIVED", prRef: "PR-2607-068" },
];

/* ── Phase 1: logistics & master ── */
export const RECEIPTS: Receipt[] = [
  { id: "GR-2608-006", ref: "GRN-2608-006", date: d(-12, 9), supplierId: "S-03", sku: "FAR-1102", qty: 96, batch: "WL260315", expiry: d(95), poRef: "PO-2607-088", by: "Bambang Prasetyo" },
  { id: "GR-2608-005", ref: "GRN-2608-005", date: d(-14, 10), supplierId: "S-03", sku: "BHP-0089", qty: 500, batch: "EL260330", expiry: d(240), poRef: "PO-2607-090", by: "Sari Melati" },
  { id: "GR-2608-003", ref: "GRN-2608-003", date: d(-17, 13), supplierId: "S-03", sku: "FAR-1301", qty: 240, batch: "SC260411", expiry: d(480), poRef: "PO-2607-084", by: "Bambang Prasetyo" },
  { id: "GR-2608-001", ref: "GRN-2608-001", date: d(-19, 8), supplierId: "S-03", sku: "BHP-0045", qty: 800, batch: "KS260610", expiry: null, poRef: "PO-2607-079", by: "Sari Melati" },
  { id: "GR-2607-114", ref: "GRN-2607-114", date: d(-30, 9), supplierId: "S-03", sku: "BHP-0012", qty: 120, batch: "LT260514", expiry: d(540), poRef: "PO-2607-071", by: "Bambang Prasetyo" },
  { id: "GR-2607-090", ref: "GRN-2607-090", date: d(-40, 11), supplierId: "S-05", sku: "FAR-1287", qty: 24, batch: "DCL26A", expiry: d(38), poRef: "PO-2607-066", by: "Bambang Prasetyo" },
];

export const ISSUES: IssueRec[] = [
  { id: "DIST-2608-025", ref: "DIST-2608-025", date: d(-2, 9), sku: "BHP-0031", qty: 210, dest: "ICU", strategy: "FEFO", by: "Sari Melati" },
  { id: "DIST-2608-024", ref: "DIST-2608-024", date: d(-2, 14), sku: "BHP-0089", qty: 190, dest: "ICCU", strategy: "FEFO", by: "Sari Melati" },
  { id: "DIST-2608-023", ref: "DIST-2608-023", date: d(-3, 10), sku: "BHP-0045", qty: 340, dest: "Kamar Operasi", strategy: "FIFO", by: "Bambang Prasetyo" },
  { id: "DIST-2608-021", ref: "DIST-2608-021", date: d(-4, 11), sku: "FAR-1102", qty: 60, dest: "IGD", strategy: "FEFO", by: "Sari Melati" },
  { id: "DIST-2608-019", ref: "DIST-2608-019", date: d(-5, 9), sku: "BHP-0038", qty: 120, dest: "Rawat Inap", strategy: "FEFO", by: "Bambang Prasetyo" },
  { id: "DIST-2608-016", ref: "DIST-2608-016", date: d(-10, 13), sku: "UMU-0211", qty: 18, dest: "ICCU", strategy: "FIFO", by: "Sari Melati" },
];

export const OPNAMES: OpnameSession[] = [
  { id: "SO-2", code: "SO-2608-002", date: d(-2, 8), status: "CLOSED", by: "Bambang Prasetyo", items: [
    { sku: "FAR-1287", name: "Reagen Hematologi DCL", uom: "pack", system: 28, counted: 22 },
    { sku: "FAR-1340", name: "Citrate Tube 3.2% (CTAD)", uom: "pack", system: 12, counted: 12 },
    { sku: "BHP-0052", name: "Alcohol Swab", uom: "box", system: 90, counted: 88 },
    { sku: "UMU-0211", name: "Kertas EKG 80 mm", uom: "roll", system: 44, counted: 44 },
  ]},
  { id: "SO-3", code: "SO-2608-003", date: d(0, 8), status: "COUNTING", by: "Sari Melati", items: [
    { sku: "BHP-0012", name: "Handscoon Nitrile M", uom: "box", system: 14, counted: 12 },
    { sku: "BHP-0031", name: "Spuit 3 cc Terumo", uom: "pcs", system: 1840, counted: null },
    { sku: "BHP-0067", name: "Masker Bedah 3-Ply", uom: "box", system: 2350, counted: 2348 },
    { sku: "FAR-1102", name: "NaCl 0.9% 500 ml", uom: "flabot", system: 96, counted: null },
    { sku: "FAR-1340", name: "Citrate Tube 3.2% (CTAD)", uom: "pack", system: 12, counted: 12 },
    { sku: "BHP-0052", name: "Alcohol Swab", uom: "box", system: 88, counted: 88 },
  ]},
];

export const TRANSFERS: TransferRecord[] = [
  { id: "TRF-2608-003", ref: "TRF-2608-003", eqId: "EQ-04", date: d(-1, 15), requester: "Ns. Dewi Lestari", fromRoom: "ICU Bed 07", toBuilding: "Gedung D", toFloor: "Lantai 2", toRoom: "ICCU · Bed 02", reason: "Kebutuhan monitor tambahan ICCU", status: "PENDING" },
  { id: "TRF-2607-009", ref: "TRF-2607-009", eqId: "EQ-13", date: d(-9, 10), requester: "Rina Kusuma, S.T.", fromRoom: "Kamar Operasi", toBuilding: "Gedung D", toFloor: "Lantai 2", toRoom: "ICU Bed 02", reason: "Pasca-operasi butuh syringe pump ganda", status: "APPROVED", decidedBy: "Rina Kusuma, S.T.", decidedAt: d(-8, 9) },
  { id: "TRF-2607-006", ref: "TRF-2607-006", eqId: "EQ-05", date: d(-16, 11), requester: "dr. Anton Wijaya, Sp.Rad", fromRoom: "Radiologi", toBuilding: "Gedung B", toFloor: "Lantai 3", toRoom: "Poli Kebidanan 2", reason: "Poli kebidanan butuh USG dedicated", status: "REJECTED", decidedBy: "Rina Kusuma, S.T.", decidedAt: d(-15, 14) },
];

export const BUILDINGS: Building[] = [
  { id: "B-01", name: "Gedung A", label: "IGD & Emergensi", status: "ACTIVE", floors: ["Lantai 1", "Lantai 2"], year: 2016, note: "IGD resusitasi & triase 24 jam di L1." },
  { id: "B-02", name: "Gedung B", label: "Rawat Jalan & HD", status: "ACTIVE", floors: ["Lantai 1", "Lantai 2", "Lantai 3"], year: 2019, note: "Poliklinik gigi & kebidanan, unit hemodialisa di L2." },
  { id: "B-03", name: "Gedung C", label: "Penunjang Medis", status: "ACTIVE", floors: ["Lantai 1", "Lantai 2", "Lantai 3"], year: 2018, note: "Radiologi & CSSD di L1–L2, laboratorium di L3." },
  { id: "B-04", name: "Gedung D", label: "Rawat Inap & ICU", status: "ACTIVE", floors: ["Lantai 1", "Lantai 2", "Lantai 3"], year: 2012, note: "ICU / ICCU di L2, perinatologi di L3." },
  { id: "B-05", name: "Gedung E", label: "Onkologi (rencana)", status: "PLANNED", floors: ["Lantai 1 (rencana)"], year: 2027, note: "Perencanaan LINAC & kemoterapi — procurement planning Q1 2027." },
];

export const ROOMS: RoomInfo[] = [
  { id: "RM-01", building: "Gedung D", floor: "Lantai 2", name: "ICU", unit: "Instalasi ICU" },
  { id: "RM-02", building: "Gedung D", floor: "Lantai 2", name: "ICCU", unit: "Instalasi ICU" },
  { id: "RM-03", building: "Gedung D", floor: "Lantai 3", name: "Perinatologi", unit: "Instalasi Perinatologi" },
  { id: "RM-04", building: "Gedung C", floor: "Lantai 1", name: "Radiologi", unit: "Instalasi Radiologi" },
  { id: "RM-05", building: "Gedung C", floor: "Lantai 3", name: "Lab Hematologi", unit: "Instalasi Laboratorium" },
  { id: "RM-06", building: "Gedung C", floor: "Lantai 2", name: "CSSD", unit: "Instalasi CSSD" },
  { id: "RM-07", building: "Gedung A", floor: "Lantai 1", name: "IGD Resusitasi", unit: "Instalasi IGD" },
  { id: "RM-08", building: "Gedung B", floor: "Lantai 1", name: "Poli Gigi", unit: "Poliklinik Gigi" },
  { id: "RM-09", building: "Gedung B", floor: "Lantai 3", name: "Poli Kebidanan", unit: "Poliklinik Obsgyn" },
  { id: "RM-10", building: "Gedung B", floor: "Lantai 2", name: "HD", unit: "Unit Hemodialisa" },
];

export const WAREHOUSES: Warehouse[] = [
  { id: "WH-01", name: "Gudang BHP Medis", code: "WH-01", keeper: "Bambang Prasetyo", zones: ["Zona A — Alkes habis pakai", "Zona B — Set steril", "Zona C — Buffer ROP"], capacityLoc: 320, usedLoc: 214, desc: "BHP medis seluruh unit. FEFO untuk item ber-expiry, FIFO umum." },
  { id: "WH-02", name: "Gudang Farmasi", code: "WH-02", keeper: "apt. Lina Marlina", zones: ["Zona A — Infus & cairan", "Zona B — Reagen (2–8°C)", "Zona C — Narkotika (terkunci)"], capacityLoc: 240, usedLoc: 188, desc: "Rantai dingin termonitor 24/7; reagen lab prioritas FEFO." },
  { id: "WH-03", name: "Gudang Umum", code: "WH-03", keeper: "Sari Melati", zones: ["Zona A — ATK & print media", "Zona B — Linen", "Zona C — Masker & APD"], capacityLoc: 180, usedLoc: 96, desc: "Item non-medis & APD; strategi default FIFO." },
  { id: "WH-04", name: "Depo Teknik & Sparepart", code: "WH-04", keeper: "Rudi Hartawan", zones: ["Rak 1 — Life support", "Rak 2 — Imaging", "Rak 3 — Lab & CSSD"], capacityLoc: 120, usedLoc: 83, desc: "Spare part alkes. Konsumsi wajib lewat ledger yang sama (BR-016)." },
];

export const ACCESSORIES: Accessory[] = [
  { id: "AC-01", code: "ACC-DRG-BC30", name: "Breathing circuit dewasa (set)", eqId: "EQ-03", qty: 3, condition: "GOOD", note: "Diganti tiap 72 jam pemakaian pasien" },
  { id: "AC-02", code: "ACC-GE-CT-INJ", name: "Injector head CT 2-syringe", eqId: "EQ-01", qty: 1, condition: "EXCELLENT", note: "Terpasang permanen pada gantry" },
  { id: "AC-03", code: "ACC-PHL-SPO2", name: "Sensor SpO2 reusable MX450", eqId: "EQ-04", qty: 4, condition: "GOOD", note: "2 terpasang di bed 04 & 07, 2 cadangan" },
  { id: "AC-04", code: "ACC-ZOL-PADDLE", name: "Paddle defibrilasi internal", eqId: "EQ-07", qty: 1, condition: "FAIR", note: "Permukaan aus ringan — jadwal poles Q4" },
  { id: "AC-05", code: "ACC-GET-TRAY", name: "Tray instrumen CSSD 48-slot", eqId: "EQ-08", qty: 6, condition: "GOOD", note: "Sirkulasi ±3 tray/hari" },
  { id: "AC-06", code: "ACC-SYS-XN-RCK", name: "Rack sampler XN-1000", eqId: "EQ-10", qty: 2, condition: "EXCELLENT", note: "1 aktif, 1 cadangan" },
  { id: "AC-07", code: "ACC-GE-OMB-PRB", name: "Probe suhu inkubator", eqId: "EQ-11", qty: 2, condition: "GOOD", note: "Kalibrasi mengikuti jadwal induk" },
];

/* ── audit, notifications, RBAC ── */
export const AUDIT: AuditEntry[] = [
  { id: "AUD-01", date: d(0, 7), actor: "system", role: "SCHEDULER", action: "MAINTENANCE.OVERDUE", entity: "work_order", entityId: "WO-2608", reason: "Scheduled PM melewati tanggal rencana" },
  { id: "AUD-02", date: d(0, 7), actor: "system", role: "SCHEDULER", action: "CALIBRATION.EXPIRED", entity: "equipment", entityId: "EQ-08", reason: "Sertifikat KAL-AUT-2025-092 kedaluwarsa", delta: "calStatus VALID → EXPIRED" },
  { id: "AUD-03", date: d(0, 7), actor: "system", role: "SCHEDULER", action: "REMINDER.CADENCE", entity: "calibration", entityId: "EQ-12", reason: "Cadence reminder T-14 hari (90/60/30/14/7)", delta: "notif CALIBRATION_DUE dikirim" },
  { id: "AUD-04", date: d(-1, 15), actor: "Ns. Dewi Lestari", role: "Kepala Unit", action: "TRANSFER.REQUEST", entity: "asset_transfer", entityId: "TRF-2608-003", reason: "Kebutuhan monitor tambahan ICCU", delta: "EQ-04: ICU Bed 07 → ICCU Bed 02" },
  { id: "AUD-05", date: d(-1, 14), actor: "Perawat HD", role: "Petugas Unit", action: "COMPLAINT.CREATE", entity: "complaint", entityId: "CMP-2611", reason: "Alarm conductivity intermiten" },
  { id: "AUD-06", date: d(-2, 10), actor: "Bambang Prasetyo", role: "Kepala Gudang", action: "STOCK_OPNAME.VARIANCE", entity: "stock_opname", entityId: "SO-2608-002", reason: "Selisih FAR-1287 −6 pack", delta: "system 28 → fisik 22" },
  { id: "AUD-07", date: d(-2, 9), actor: "Fajar Nugroho", role: "Teknisi", action: "INSPECTION.COMPLETE", entity: "inspection", entityId: "INS-2608-005", delta: "EQ-08 result FAIL — door seal" },
  { id: "AUD-08", date: d(-3, 9), actor: "Rudi Hartawan", role: "Teknisi", action: "REPAIR.CREATE", entity: "repair", entityId: "RPR-2603", reason: "Sampling valve macet" },
  { id: "AUD-09", date: d(-5, 11), actor: "Agus Firmansyah", role: "Teknisi", action: "REPAIR.START", entity: "repair", entityId: "RPR-2604", reason: "Flow sensor drift CMP-2609" },
  { id: "AUD-10", date: d(-6, 9), actor: "Agus Firmansyah", role: "Teknisi", action: "MAINTENANCE.START", entity: "work_order", entityId: "WO-2607", delta: "EQ-03 opStatus IN_SERVICE → MAINTENANCE" },
  { id: "AUD-11", date: d(-7, 11), actor: "Galih Saputra", role: "Pengelola Inventory", action: "PROCUREMENT.PR", entity: "purchase_request", entityId: "PR-2608-011", reason: "Reorder point breach BHP-0012" },
  { id: "AUD-12", date: d(-25, 22), actor: "Ns. Dewi Lestari", role: "Petugas Unit", action: "COMPLAINT.CREATE", entity: "complaint", entityId: "CMP-2609", reason: "SLA CRITICAL 4 jam" },
];

export const NOTIFS: Notif[] = [
  { id: "N-1", kind: "CALIBRATION_EXPIRED", msg: "Autoclave GE46 — sertifikat kalibrasi EXPIRED 25 hari (CSSD menahan rilis batch).", refId: "EQ-08", date: d(0, 7), read: false },
  { id: "N-2", kind: "MAINTENANCE_OVERDUE", msg: "WO-2608 (EKG 12 Kanal) melewati jadwal PM — IGD memakai unit cadangan.", refId: "EQ-06", date: d(0, 7), read: false },
  { id: "N-3", kind: "LOW_STOCK", msg: "Handscoon Nitrile M di bawah reorder point (14 ≤ 50) — PR-2608-011 dibuat.", refId: "BHP-0012", date: d(0, 7), read: false },
  { id: "N-4", kind: "REMINDER", msg: "Cadence reminder T-14: Hemodialisa DBB-EXA kalibrasi jatuh tempo 13 hari lagi.", refId: "EQ-12", date: d(0, 7), read: false },
  { id: "N-5", kind: "COMPLAINT_SLA_BREACH", msg: "CMP-2611 (Hemodialisa) berisiko breach SLA 8 jam — belum ditugaskan.", refId: "CMP-3", date: d(-1, 14), read: false },
  { id: "N-6", kind: "APPROVAL_PENDING", msg: "4 persetujuan menunggu: transfer, adj. stok, repair, purchase.", refId: "APR-1", date: d(-1, 16), read: true },
  { id: "N-7", kind: "INSPECTION_DUE", msg: "Inspeksi EKG 12 Kanal overdue 1 hari (INS-2608-003 CONDITIONAL).", refId: "EQ-06", date: d(-1, 8), read: true },
  { id: "N-8", kind: "CONTRACT_EXPIRING", msg: "Kontrak PT Instrumedia Lab EXPIRED 6 hari lalu — reagen lab berisiko.", refId: "S-05", date: d(-2, 9), read: true },
  { id: "N-9", kind: "CALIBRATION_DUE", msg: "CT-Scan 128 Slice kalibrasi jatuh tempo 12 hari lagi.", refId: "EQ-01", date: d(-2, 8), read: true },
  { id: "N-10", kind: "ASSET_IDLE", msg: "Defibrillator R Series utilisasi 22% — kandidat redistribusi.", refId: "EQ-07", date: d(-4, 9), read: true },
];

/* ── RBAC matrix ── */
export const PERM_MODULES = ["Dashboard & Analytics", "Equipment 360°", "Inventory & Ledger", "Gudang & Distribusi", "Stock Opname", "Pemeliharaan & Kalibrasi", "Keluhan & Perbaikan", "Procurement", "Pelaporan", "Persetujuan", "Registrasi & Transfer Aset", "Master Data", "Audit Trail", "Konfigurasi & RBAC"];

/* ── Phase 3: utilization series, loan, rental, BGS/SGB, depreciation ── */

export const genSeries = (util: number, seed: number): number[] => {
  const base = (util / 100) * 168; // jam pemakaian per minggu (available 168 jam)
  return Array.from({ length: 8 }, (_, i) => Math.max(0, Math.round(base * (0.78 + ((i * 37 + seed * 13) % 40) / 100))));
};
export const UTIL_SERIES: Record<string, number[]> = Object.fromEntries(
  EQUIPMENT.map((e) => [e.id, genSeries(e.utilization, e.id.charCodeAt(3))])
);

export const LOANS: Loan[] = [
  { id: "LN-1", code: "LOAN-2608-003", eqId: "EQ-05", toUnit: "Klinik Satelit Cempaka", borrower: "drg. Widya Paramita", requested: d(-4), due: d(10), status: "ON_LOAN", note: "USG cadangan untuk program ANC keliling; peminjaman antar-fasilitas jejaring." },
  { id: "LN-2", code: "LOAN-2608-002", eqId: "EQ-13", toUnit: "ICU", borrower: "Ns. Dewi Lestari", requested: d(-12), due: d(-2), status: "RETURNED", note: "Pinjaman syringe pump tambahan saat okupansi ICU puncak.", returnCondition: "Fungsi normal; battery cover aus ringan — masuk daftar PM." },
  { id: "LN-3", code: "LOAN-2607-011", eqId: "EQ-06", toUnit: "Poli Jantung", borrower: "dr. Hendra, Sp.JP", requested: d(-40), due: d(-26), status: "CLOSED", note: "EKG untuk skrining MCU massal karyawan." },
];

export const RENTALS: Rental[] = [
  { id: "RT-1", code: "RENT-2608-001", eqId: "EQ-09", party: "RSUD Kecamatan Cibiru (jejaring)", start: d(-18), end: d(12), perDay: 1_750_000, status: "ACTIVE" },
  { id: "RT-2", code: "RENT-2607-004", eqId: "EQ-14", party: "Klinik Kartika Medika", start: d(-60), end: d(-30), perDay: 450_000, status: "COMPLETED" },
];

export const CONTRACTS: BizContract[] = [
  { id: "CT-1", code: "BGS-2024-001", kind: "BGS", name: "Gedung E — Onkologi (Bangun-Guna-Serah)", party: "PT Graha Medika Investama", value: 48_000_000_000, start: d(-400), until: d(2920), status: "ACTIVE", note: "Investor membangun & mengoperasikan 8 tahun, lalu serah terima. Progres konstruksi 42%." },
  { id: "CT-2", code: "SGB-2025-002", kind: "SGB", name: "MRI Suite — Sewa-Guna-Bangun", party: "Siemens Financial Services", value: 12_500_000_000, start: d(-300), until: d(1460), status: "ACTIVE", note: "Suite + shielding disewa 5 tahun dengan opsi beli di akhir masa sewa." },
  { id: "CT-3", code: "SVC-2607-018", kind: "SERVICE", name: "CT Service Contract Comprehensive", party: "PT GE Healthcare Indonesia", value: 480_000_000, start: d(-200), until: d(165), status: "ACTIVE", note: "Termasuk tube coverage & PM 4×/tahun." },
  { id: "CT-4", code: "SVC-2607-021", kind: "SERVICE", name: "MRI Helium & Coldhead Agreement", party: "Siemens Healthineers", value: 310_000_000, start: d(-260), until: d(45), status: "ACTIVE", note: "Negosiasi perpanjangan berjalan — jatuh tempo 45 hari lagi (CONTRACT_EXPIRING)." },
  { id: "CT-5", code: "RTL-2608-001", kind: "RENTAL", name: "Sewa X-Ray onsite — RSUD Kecamatan", party: "RSUD Kecamatan Cibiru", value: 52_500_000, start: d(-18), until: d(12), status: "ACTIVE", note: "30 hari × Rp 1,75 jt/hari termasuk operator & transport." },
];

/* Periode depresiasi yang sudah diposting (sebulan sekali sejak akuisisi s.d. bulan lalu) */
export const DEPR_POSTED: Record<string, string[]> = Object.fromEntries(EQUIPMENT.map((e) => {
  const periods: string[] = [];
  const cur = new Date(new Date(e.acqDate).getFullYear(), new Date(e.acqDate).getMonth(), 1);
  const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  while (cur < thisMonth) {
    periods.push(periodKey(cur));
    cur.setMonth(cur.getMonth() + 1);
  }
  return [e.id, periods];
}));

/* ── Phase 5: disposal, integrations, mobile field ops ── */

export const DISPOSALS: DisposalRecord[] = [
  { id: "DSP-1", code: "DSP-2606-002", eqId: "EQ-16", date: d(-45), method: "PEMUSNAHAN", residual: 0, proceeds: 0, approver: "dr. Hartono Wibowo", note: "EKG 3 kanal rusak total (PSU & mainboard), biaya perbaikan > 70% nilai buku — dimusnahkan sesuai BA pemusnahan & disaksikan auditor." },
];

export const CONNECTORS: Connector[] = [
  { id: "CN-1", name: "SIMRS Bridge", target: "SIMRS", status: "CONNECTED", p95: 180, lastSync: d(0, 9), evPerMin: 22, retries: 0, desc: "Sinkron pasien, jadwal & billing dua arah." },
  { id: "CN-2", name: "Finance & Accounting", target: "Finance/Accounting", status: "CONNECTED", p95: 240, lastSync: d(0, 8), evPerMin: 9, retries: 0, desc: "Jurnal depresiasi, pengadaan & disposal (GL posting)." },
  { id: "CN-3", name: "HRIS", target: "HR", status: "DEGRADED", p95: 610, lastSync: d(-1, 22), evPerMin: 2, retries: 3, desc: "Data custodian & petugas — p95 di atas SLA 500ms." },
  { id: "CN-4", name: "EMR Gateway", target: "EMR", status: "CONNECTED", p95: 320, lastSync: d(0, 9), evPerMin: 14, retries: 0, desc: "Kaitan aset ke rekam medis (equipment used per encounter)." },
  { id: "CN-5", name: "Supplier Portal", target: "Supplier", status: "CONNECTED", p95: 290, lastSync: d(0, 7), evPerMin: 3, retries: 1, desc: "PO, GRN & katalog harga ke principal/distributor." },
  { id: "CN-6", name: "Payment Gateway", target: "Payment", status: "OFFLINE", p95: 0, lastSync: d(-2, 15), evPerMin: 0, retries: 7, desc: "Retri sewa & BGS — endpoint tidak merespons, retry antrian menumpuk." },
  { id: "CN-7", name: "Notification Hub", target: "Notification", status: "CONNECTED", p95: 150, lastSync: d(0, 9), evPerMin: 31, retries: 0, desc: "In-app, email, WhatsApp & push (multi-channel)." },
  { id: "CN-8", name: "ASPAK Kemenkes", target: "Government Reporting", status: "DEGRADED", p95: 540, lastSync: d(-1, 17), evPerMin: 1, retries: 2, desc: "Pelaporan alat kesehatan ke Kemenkes — rate-limit API pusat." },
];

export const MOBILE_TASKS: MobileTask[] = [
  { id: "MT-0", code: "FLD-2608-011", eqId: "EQ-13", kind: "INSPECTION", due: d(-2), status: "SYNCED" },
  { id: "MT-1", code: "FLD-2608-012", eqId: "EQ-12", kind: "INSPECTION", due: d(1), status: "ASSIGNED" },
  { id: "MT-2", code: "FLD-2608-013", eqId: "EQ-13", kind: "PM", woId: "WO-3", due: d(2), status: "ASSIGNED" },
  { id: "MT-3", code: "FLD-2608-014", eqId: "EQ-01", kind: "CALIBRATION", due: d(3), status: "ASSIGNED" },
  { id: "MT-4", code: "FLD-2608-015", eqId: "EQ-08", kind: "INSPECTION", due: d(0), status: "ASSIGNED" },
];

export const SYNC_LOG: SyncEntry[] = [
  { id: "SY-1", ts: d(-2, 16), taskCode: "FLD-2608-011", event: "asset.inspected", correlationId: "corr-" + uid().toLowerCase(), status: "OK", note: "Syringe Pump SP-7 — inspeksi harian PASS" },
  { id: "SY-2", ts: d(-2, 16), taskCode: "FLD-2608-011", event: "inventory.consumed", correlationId: "corr-" + uid().toLowerCase(), status: "OK", note: "Alcohol swab ×2 terpakai saat inspeksi" },
];

export const ROLE_PERMS: Record<Role, PermLevel[]> = {
  "Direksi": ["full", "view", "view", "view", "view", "view", "view", "view", "full", "full", "view", "view", "view", "none"],
  "Pengelola Aset": ["full", "full", "view", "view", "view", "full", "full", "full", "view", "full", "full", "full", "view", "none"],
  "Pengelola Inventory": ["view", "view", "full", "full", "full", "none", "none", "full", "full", "view", "none", "full", "view", "none"],
  "Kepala Gudang": ["view", "view", "full", "full", "full", "none", "none", "view", "view", "view", "none", "view", "view", "none"],
  "Petugas Gudang": ["view", "view", "view", "full", "view", "none", "none", "none", "none", "none", "none", "none", "none", "none"],
  "Kepala Unit": ["view", "view", "view", "view", "none", "view", "full", "view", "view", "none", "full", "none", "none", "none"],
  "Teknisi": ["view", "view", "view", "view", "none", "full", "full", "none", "none", "none", "none", "view", "none", "none"],
  "Kepala Teknisi": ["view", "full", "view", "view", "none", "full", "full", "view", "view", "view", "none", "full", "view", "none"],
  "Auditor": ["view", "view", "view", "view", "view", "view", "view", "view", "full", "view", "view", "view", "full", "none"],
  "IT Administrator": ["view", "view", "view", "view", "view", "none", "none", "full", "view", "full", "none", "view", "view", "full"],
  "Finance": ["view", "none", "view", "none", "none", "none", "none", "full", "full", "full", "none", "none", "view", "none"],
  "COO": ["view", "view", "view", "none", "none", "none", "none", "full", "full", "full", "view", "none", "view", "none"],
};

export const DEST_UNITS = ["IGD", "ICU", "ICCU", "NICU", "Kamar Operasi", "Hemodialisa", "Radiologi", "Laboratorium", "CSSD", "Rawat Inap", "Poli Gigi", "Farmasi"];
