import React, { createContext, useContext, useMemo, useReducer } from "react";
import {
  ADJ_APPROVAL_THRESHOLD, Accessory, ApprovalMatrix, AuditEntry, BizContract, Complaint, Connector, DEPR_SALVAGE,
  DepreciationTx, DisposalRecord, Equipment, EventEnvelope, FormResult, Inspection, InventoryItem, isITSku, LedgerEntry, Loan,
  mkPendingStages, MobileTask, Notif, NotifChannel, NotifKind, OpnameSession, PRLine, Priority, PurchaseOrder,
  Rental, Repair, Role, ROLE_USER, SLA_BY_PRIORITY, StageDecision, SyncEntry, SystemConfig, TimelineEvent, Toast,
  TransferRecord, TxType, View, WorkOrder, FormTemplate, d, daysUntil, fmtIDR, lifeYears, lineActiveStage, lineState,
  lineTotal, monthlyDep, periodKey, prStageLabels, prStageRole, prState, uid,
} from "./types";
import {
  ACCESSORIES, APPROVALS, AUDIT, BUILDINGS, CALIBRATIONS, COMPLAINTS, CONFIG_DEFAULT, CONNECTORS, CONTRACTS,
  DEMAND_PLANS, DEPR_POSTED, DISPOSALS, EQUIPMENT, FORM_TEMPLATES, INSPECTIONS, ISSUES, ITEMS, LEDGER_INIT, LOANS,
  MOBILE_TASKS, NOTIFS, OPNAMES, PURCHASE_ORDERS, PURCHASE_REQUESTS, RECEIPTS, RENTALS, REPAIRS, SPARE_PARTS,
  SUPPLIERS, SYNC_LOG, TECHNICIANS, TIMELINE, TRANSFERS, UTIL_SERIES, WORK_ORDERS,
} from "./data";

export interface AppState {
  view: View; eqId: string | null; role: Role; searchQuery: string;
  equipment: Equipment[]; timeline: TimelineEvent[]; items: InventoryItem[]; ledger: LedgerEntry[];
  spareParts: typeof SPARE_PARTS; workOrders: WorkOrder[]; calibrations: typeof CALIBRATIONS;
  inspections: Inspection[]; formTemplates: FormTemplate[]; formResults: FormResult[];
  complaints: Complaint[]; repairs: Repair[]; approvals: typeof APPROVALS;
  demandPlans: typeof DEMAND_PLANS; purchaseRequests: typeof PURCHASE_REQUESTS; purchaseOrders: PurchaseOrder[];
  receipts: typeof RECEIPTS; issues: typeof ISSUES; opnames: OpnameSession[]; transfers: TransferRecord[];
  technicians: typeof TECHNICIANS; suppliers: typeof SUPPLIERS; accessories: Accessory[];
  loans: Loan[]; rentals: Rental[]; contracts: BizContract[];
  deprPosted: Record<string, string[]>; utilSeries: Record<string, number[]>;
  disposals: DisposalRecord[]; connectors: Connector[]; mobileTasks: MobileTask[]; syncLog: SyncEntry[];
  config: SystemConfig;
  events: EventEnvelope[];
  audit: AuditEntry[]; notifs: Notif[]; toasts: Toast[];
}

const INIT: AppState = {
  view: "command", eqId: null, role: "Pengelola Aset", searchQuery: "",
  equipment: EQUIPMENT, timeline: TIMELINE, items: ITEMS, ledger: LEDGER_INIT,
  spareParts: SPARE_PARTS, workOrders: WORK_ORDERS, calibrations: CALIBRATIONS,
  inspections: INSPECTIONS, formTemplates: FORM_TEMPLATES, formResults: [],
  complaints: COMPLAINTS, repairs: REPAIRS, approvals: APPROVALS,
  demandPlans: DEMAND_PLANS, purchaseRequests: PURCHASE_REQUESTS, purchaseOrders: PURCHASE_ORDERS,
  receipts: RECEIPTS, issues: ISSUES, opnames: OPNAMES, transfers: TRANSFERS,
  technicians: TECHNICIANS, suppliers: SUPPLIERS, accessories: ACCESSORIES,
  loans: LOANS, rentals: RENTALS, contracts: CONTRACTS,
  deprPosted: DEPR_POSTED, utilSeries: UTIL_SERIES,
  disposals: DISPOSALS, connectors: CONNECTORS, mobileTasks: MOBILE_TASKS, syncLog: SYNC_LOG,
  config: CONFIG_DEFAULT,
  events: [
    { event_id: "evt_S01", event_type: "asset.complaint.created", aggregate_type: "complaint", aggregate_id: "EQ-12", timestamp: d(0, 6), actor: "Perawat HD shift pagi", payload: "prioritas HIGH · alarm conductivity intermiten…", correlation_id: "corr-8F2K1" },
    { event_id: "evt_S02", event_type: "maintenance.overdue", aggregate_type: "work_order", aggregate_id: "EQ-06", timestamp: d(0, 7), actor: "scheduler", payload: "WO-2608 melewati jadwal PM", correlation_id: "corr-8F2K2" },
    { event_id: "evt_S03", event_type: "asset.calibration.expired", aggregate_type: "calibration", aggregate_id: "EQ-08", timestamp: d(0, 7), actor: "scheduler", payload: "KAL-AUT-2025-092 kedaluwarsa 25 hari", correlation_id: "corr-8F2K3" },
    { event_id: "evt_S04", event_type: "inventory.issued", aggregate_type: "inventory", aggregate_id: "BHP-0031", timestamp: d(-1, 9), actor: "Sari Melati", payload: "−210 → ICU (FEFO)", correlation_id: "corr-8F1A9" },
    { event_id: "evt_S05", event_type: "asset.transfer.requested", aggregate_type: "asset", aggregate_id: "EQ-04", timestamp: d(-1, 15), actor: "Ns. Dewi Lestari", payload: "→ Gedung D · ICCU Bed 02", correlation_id: "corr-8F1B2" },
    { event_id: "evt_S06", event_type: "inventory.stock_opname.completed", aggregate_type: "inventory", aggregate_id: "SO-2608-002", timestamp: d(-2, 10), actor: "Bambang Prasetyo", payload: "4 SKU diverifikasi · 1 selisih via approval", correlation_id: "corr-8E9C4" },
    { event_id: "evt_S07", event_type: "asset.maintenance.completed", aggregate_type: "work_order", aggregate_id: "WO-2605", timestamp: d(-25, 14), actor: "Rudi Hartawan", payload: "1 spare part via ledger", correlation_id: "corr-8D4E7" },
    { event_id: "evt_S08", event_type: "procurement.po.created", aggregate_type: "procurement", aggregate_id: "PR-2608-009", timestamp: d(-7, 11), actor: "UPBJ Pengadaan", payload: "supplier S-03 · SpO2 cable ×10", correlation_id: "corr-8D2F8" },
  ],
  audit: AUDIT, notifs: NOTIFS, toasts: [],
};

type Act =
  | { t: "NAV"; view: View; eqId?: string }
  | { t: "ROLE"; role: Role }
  | { t: "SEARCH"; q: string }
  | { t: "TOAST"; msg: string; kind: Toast["kind"] }
  | { t: "TOAST_DROP"; id: string }
  | { t: "NOTIFS_READ" }
  | { t: "COMPLAINT"; eqId: string; priority: Priority; description: string; reporter: string }
  | { t: "CALIBRATE"; eqId: string; result: "PASS" | "FAIL" | "ADJUSTED"; cert: string; techId: string; cost: number; nextDue: string }
  | { t: "TRANSFER_REQ"; eqId: string; toBuilding: string; toFloor: string; toRoom: string; reason: string }
  | { t: "ASSIGN"; eqId: string; custodian: string; pic: string; unit: string }
  | { t: "REGISTER_EQ"; name: string; category: string; brand: string; model: string; serial: string; cost: number; supplierId: string; building: string; floor: string; room: string; unit: string; custodian: string; pic: string; calRequired: boolean }
  | { t: "PRINT_QR"; eqId: string }
  | { t: "WO_CREATE"; eqId: string; type: WorkOrder["type"]; note: string; templateId: string }
  | { t: "WO_START"; woId: string }
  | { t: "WO_SUBMIT"; woId: string; note: string; parts: { id: string; qty: number }[]; values: Record<string, string> }
  | { t: "INSPECT"; eqId: string; inspector: string; checklist: { item: string; pass: boolean }[]; result: "PASS" | "FAIL" | "CONDITIONAL"; note: string; nextDue: string }
  | { t: "CMP_STATUS"; id: string; to: Complaint["status"]; resolution?: string }
  | { t: "REPAIR_PROGRESS"; id: string }
  | { t: "REPAIR_CLOSE"; id: string; result: string }
  | { t: "APPROVE"; id: string; ok: boolean; note: string }
  | { t: "ADJUST"; sku: string; delta: number; reason: string }
  | { t: "RECEIVE"; sku: string; qty: number; supplierId: string; batch: string; expiry: string; poRef: string }
  | { t: "DISTRIBUTE"; sku: string; qty: number; dest: string; strategy: "FIFO" | "FEFO" }
  | { t: "OPNAME_CREATE" }
  | { t: "OPNAME_COUNT"; id: string; sku: string; counted: number }
  | { t: "OPNAME_FINALIZE"; id: string }
  | { t: "DEMAND_SUBMIT"; kind: "BHP" | "ASET"; item: string; category?: string; brand?: string; model?: string; qty: number; uom: string; estCost: number; unit: string; needBy: string }
  | { t: "DEMAND_REVIEW"; id: string }
  | { t: "DEMAND_CONSOLIDATE"; id: string }
  | { t: "PO_CREATE"; prId: string; supplierId: string; eta: string }
  | { t: "PO_RECEIVE"; poId: string }
  | { t: "PR_DECIDE"; prId: string; lineId: string; ok: boolean; note: string }
  | { t: "PR_DECIDE_ALL"; prId: string; ok: boolean; note: string }
  | { t: "PR_REVISE"; prId: string; lineId: string; qty: number }
  | { t: "ADD_TECH"; name: string; specialty: string; cert: string; phone: string; vendor: boolean }
  | { t: "ADD_SUPPLIER"; name: string; service: string; contractUntil: string; contact: string }
  | { t: "ADD_ACCESSORY"; name: string; eqId: string; qty: number; condition: Equipment["condition"]; note: string }
  | { t: "LOAN_REQUEST"; eqId: string; toUnit: string; borrower: string; due: string; note: string }
  | { t: "LOAN_ADVANCE"; id: string }
  | { t: "LOAN_RETURN"; id: string; condition: string }
  | { t: "LOAN_CLOSE"; id: string }
  | { t: "RENTAL_CREATE"; eqId: string; party: string; perDay: number; days: number }
  | { t: "RENTAL_END"; id: string }
  | { t: "DEPRECIATE_POST" }
  | { t: "LOG_USAGE"; eqId: string; hours: number }
  | { t: "INTEL_AUDIT"; action: string; entity: string; entityId: string; reason?: string; delta?: string }
  | { t: "AUTO_PR"; lines: { sku: string; name: string; qty: number; estCost: number }[] }
  | { t: "APPLY_REC"; sku: string; min: number; reorder: number; max: number }
  | { t: "RETIRE_REQUEST"; eqId: string; reason: string; method: DisposalRecord["method"]; residual: number }
  | { t: "DISPOSE_CONFIRM"; eqId: string; method: DisposalRecord["method"]; proceeds: number; note: string }
  | { t: "MOBILE_DOWNLOAD"; taskId: string }
  | { t: "MOBILE_QUEUE"; taskId: string }
  | { t: "MOBILE_SYNC"; taskId: string; conflictResolved?: "SERVER" | "FIELD" }
  | { t: "CONNECTOR_TOGGLE"; id: string }
  | { t: "CONNECTOR_RETRY"; id: string }
  | { t: "CFG_PATCH"; patch: Partial<SystemConfig> }
  | { t: "CFG_MATRIX"; matrix: ApprovalMatrix }
  | { t: "NOTIF_READ"; id: string }
  | { t: "NOTIF_ALL_READ" }
  | { t: "NOTIF_TEST"; kind: NotifKind; channel: NotifChannel }
  | { t: "FORM_SAVE"; template: FormTemplate }
  | { t: "FORM_DELETE"; id: string };

const now = () => new Date().toISOString();
const mkAudit = (actor: string, role: string, action: string, entity: string, entityId: string, reason?: string, delta?: string): AuditEntry => ({ id: "AUD-" + uid(), date: now(), actor, role, action, entity, entityId, reason, delta });
const mkNotif = (kind: NotifKind, msg: string, refId: string): Notif => ({ id: "N-" + uid(), kind, msg, refId, date: now(), read: false });
const mkTimeline = (eqId: string, type: TimelineEvent["type"], title: string, detail: string, actor: string, cost?: number, status?: string): TimelineEvent => ({ id: uid(), eqId, type, date: now(), title, detail, actor, cost, status });
const mkLedger = (sku: string, type: TxType, qty: number, balance: number, actor: string, ref: string, reason?: string): LedgerEntry => ({ id: uid(), date: now(), sku, type, qty, balance, actor, ref, reason });
const okToast = (msg: string, kind: Toast["kind"] = "ok"): Toast => ({ id: uid(), msg, kind });

/* Aset yang lahir dari pengadaan (GRN) — acquisition tertelusur ke PO/supplier (PRD §5) */
const CAL_CATS = ["Imaging", "Life Support", "Laboratorium", "Monitoring", "Sterilisasi", "Infusion"];
const mkEquipmentFromPo = (seq: number, name: string, category: string, price: number, supplierId: string, poCode: string, actor: string, brand?: string, model?: string): Equipment => {
  const high = category === "Life Support" || category === "Imaging";
  return {
    id: "EQ-" + uid(), code: `AST-RS-2026-${String(seq).padStart(6, "0")}`, name, category,
    brand: brand ?? "—", model: model ?? "—", serial: "SN-" + uid(), manufacturer: brand ?? "—",
    prodYear: new Date().getFullYear(), acqDate: now(), acqCost: price, supplierId, warrantyUntil: d(365),
    building: "Gedung C", floor: "Lantai 2", room: "Gudang Aset · Menunggu Distribusi", unit: "Pengelola Aset",
    custodian: "Rina Kusuma, S.T.", pic: "Rina Kusuma, S.T.", condition: "EXCELLENT", opStatus: "IN_SERVICE",
    risk: high ? "HIGH" : "MEDIUM", criticality: high ? "HIGH" : "MEDIUM",
    calRequired: CAL_CATS.includes(category), calStatus: CAL_CATS.includes(category) ? "VALID" : "NOT_REQUIRED",
    calLast: null, calDue: CAL_CATS.includes(category) ? d(365) : null,
    maintStrategy: "PREVENTIVE", lastMaint: now(), nextMaint: d(180), lifecycle: 6, utilization: 0, mtbfHours: 800,
    poRef: poCode, invoiceNo: `INV-${poCode.slice(-3)}-${String(seq).padStart(2, "0")}`,
    docs: [
      { name: `BAST-${poCode}.pdf`, size: "420 KB", kind: "application/pdf", checksum: "sha256:" + uid() + uid(), date: now() },
      { name: `Invoice-INV-${poCode.slice(-3)}-${String(seq).padStart(2, "0")}.pdf`, size: "180 KB", kind: "application/pdf", checksum: "sha256:" + uid() + uid(), date: now() },
    ],
  };
};

function coreReducer(s: AppState, a: Act): AppState {
  const me = ROLE_USER[s.role];
  switch (a.t) {
    case "NAV": return { ...s, view: a.view, eqId: a.eqId ?? s.eqId, searchQuery: a.view === "equipment" ? s.searchQuery : "" };
    case "ROLE": return { ...s, role: a.role, toasts: [...s.toasts, okToast(`Role aktif: ${a.role} — izin & data scope disesuaikan`, "info")] };
    case "SEARCH": return { ...s, searchQuery: a.q, view: a.q ? "equipment" : s.view };
    case "TOAST": return { ...s, toasts: [...s.toasts, okToast(a.msg, a.kind)] };
    case "TOAST_DROP": return { ...s, toasts: s.toasts.filter((t) => t.id !== a.id) };
    case "NOTIFS_READ": return { ...s, notifs: s.notifs.map((n) => ({ ...n, read: true })) };

    case "COMPLAINT": {
      const eq = s.equipment.find((e) => e.id === a.eqId)!;
      const code = "CMP-" + (2612 + s.complaints.length);
      const cmp: Complaint = { id: "CMP-" + uid(), code, eqId: a.eqId, date: now(), reporter: a.reporter, priority: a.priority, description: a.description, status: "OPEN", slaHours: s.config.slaByPriority[a.priority] ?? SLA_BY_PRIORITY[a.priority] };
      return {
        ...s, complaints: [cmp, ...s.complaints],
        timeline: [mkTimeline(a.eqId, "COMPLAINT", `Keluhan ${code} — ${a.priority}`, a.description, a.reporter, undefined, "OPEN"), ...s.timeline],
        audit: [mkAudit(a.reporter, s.role, "COMPLAINT.CREATE", "complaint", code, `SLA ${cmp.slaHours} jam (BR-014)`), ...s.audit],
        notifs: [mkNotif("COMPLAINT_CREATED", `${code} (${eq.name}) — prioritas ${a.priority}, SLA ${cmp.slaHours} jam.`, a.eqId), ...s.notifs],
        toasts: [...s.toasts, okToast(`Complaint ${code} tercatat · SLA ${cmp.slaHours} jam`)],
      };
    }

    case "CALIBRATE": {
      const eq = s.equipment.find((e) => e.id === a.eqId)!;
      const ok = a.result !== "FAIL";
      const rec = { id: "CAL-" + uid(), eqId: a.eqId, date: now(), result: a.result, cert: a.cert, techId: a.techId, nextDue: a.nextDue, cost: a.cost };
      return {
        ...s, calibrations: [rec, ...s.calibrations],
        equipment: s.equipment.map((e) => e.id === a.eqId ? { ...e, calStatus: ok ? "VALID" : "FAILED", calLast: now(), calDue: a.nextDue, opStatus: ok && e.opStatus === "CALIBRATION" ? "IN_SERVICE" : e.opStatus } : e),
        timeline: [mkTimeline(a.eqId, "CALIBRATION", `Kalibrasi ${a.result} — ${a.cert}`, ok ? `Sertifikat terbit; jadwal berikutnya ${a.nextDue.slice(0, 10)} (BR-011).` : "Gagal kalibrasi — perlu tindakan korektif.", a.techId, a.cost, ok ? "VALID" : "FAILED"), ...s.timeline],
        audit: [mkAudit(me.name, s.role, ok ? "CALIBRATION.COMPLETE" : "CALIBRATION.FAIL", "calibration", rec.id, undefined, `${eq.code} calStatus → ${ok ? "VALID" : "FAILED"}`), ...s.audit],
        notifs: ok ? s.notifs : [mkNotif("CALIBRATION_EXPIRED", `${eq.name} GAGAL kalibrasi — equipment ditahan dari layanan.`, a.eqId), ...s.notifs],
        toasts: [...s.toasts, okToast(ok ? `Kalibrasi ${eq.name} tercatat (${a.cert})` : "Kalibrasi gagal — status FAILED", ok ? "ok" : "err")],
      };
    }

    case "TRANSFER_REQ": {
      const eq = s.equipment.find((e) => e.id === a.eqId)!;
      const ref = "TRF-2608-" + String(4 + s.approvals.filter((x) => x.type === "TRANSFER").length).padStart(3, "0");
      const apr = { id: "APR-" + uid(), type: "TRANSFER" as const, ref, requester: me.name, value: eq.acqCost, risk: eq.risk, summary: `${eq.name} · ${eq.room} → ${a.toRoom}`, matrix: ["Kepala Unit asal", "Pengelola Aset", "Kepala Unit tujuan"], status: "PENDING" as const, date: now(), meta: { eqId: a.eqId, toBuilding: a.toBuilding, toFloor: a.toFloor, toRoom: a.toRoom, reason: a.reason } };
      const tr: TransferRecord = { id: ref, ref, eqId: a.eqId, date: now(), requester: me.name, fromRoom: eq.room, toBuilding: a.toBuilding, toFloor: a.toFloor, toRoom: a.toRoom, reason: a.reason, status: "PENDING" };
      return {
        ...s, approvals: [apr, ...s.approvals], transfers: [tr, ...s.transfers],
        timeline: [mkTimeline(a.eqId, "TRANSFER", `Permintaan transfer ${ref}`, `${eq.room} → ${a.toRoom}. Menunggu persetujuan (BR-006).`, me.name, undefined, "PENDING"), ...s.timeline],
        audit: [mkAudit(me.name, s.role, "TRANSFER.REQUEST", "asset_transfer", ref, a.reason, `${eq.code}: ${eq.room} → ${a.toRoom}`), ...s.audit],
        notifs: [mkNotif("APPROVAL_PENDING", `Persetujuan transfer ${ref} — ${eq.name} ke ${a.toRoom}.`, a.eqId), ...s.notifs],
        toasts: [...s.toasts, okToast(`Transfer ${ref} masuk antrian persetujuan`, "info")],
      };
    }

    case "ASSIGN": {
      const eq = s.equipment.find((e) => e.id === a.eqId)!;
      return {
        ...s,
        equipment: s.equipment.map((e) => (e.id === a.eqId ? { ...e, custodian: a.custodian, pic: a.pic, unit: a.unit } : e)),
        timeline: [mkTimeline(a.eqId, "ASSIGNMENT", `Penugasan diperbarui`, `Custodian: ${a.custodian} · PIC: ${a.pic} · ${a.unit}. (satu custodian aktif)`, me.name), ...s.timeline],
        audit: [mkAudit(me.name, s.role, "ASSET.ASSIGN", "asset_assignment", eq.code, undefined, `custodian ${eq.custodian} → ${a.custodian}`), ...s.audit],
        toasts: [...s.toasts, okToast(`${eq.name} ditugaskan ke ${a.custodian}`)],
      };
    }

    case "REGISTER_EQ": {
      const num = String(s.equipment.length + 1).padStart(6, "0");
      const code = `AST-RS-2026-${num}`;
      const eq: Equipment = {
        id: "EQ-" + uid(), code, name: a.name, category: a.category, brand: a.brand, model: a.model, serial: a.serial,
        manufacturer: a.brand, prodYear: new Date().getFullYear(), acqDate: now(), acqCost: a.cost, supplierId: a.supplierId,
        warrantyUntil: d(365), building: a.building, floor: a.floor, room: a.room, unit: a.unit, custodian: a.custodian, pic: a.pic,
        condition: "EXCELLENT", opStatus: "IN_SERVICE", risk: "MEDIUM", criticality: "MEDIUM",
        calRequired: a.calRequired, calStatus: a.calRequired ? "VALID" : "NOT_REQUIRED", calLast: a.calRequired ? now() : null, calDue: a.calRequired ? d(365) : null,
        maintStrategy: "PREVENTIVE", lastMaint: now(), nextMaint: d(90), lifecycle: 4, utilization: 0, mtbfHours: 0, docs: [],
      };
      return {
        ...s, equipment: [eq, ...s.equipment],
        timeline: [mkTimeline(eq.id, "LIFECYCLE", `Registrasi aset — ${code}`, `BR-001/002: Asset ID unik & imutabel. ${a.name} · ${a.room}.${a.calRequired ? " Jadwal kalibrasi aktif dibuat (BR-011)." : ""}`, me.name), ...s.timeline],
        audit: [mkAudit(me.name, s.role, "ASSET.REGISTER", "asset", code, undefined, `${a.name} · ${a.serial} · ${fmtIDR(a.cost)}`), ...s.audit],
        notifs: s.notifs,
        toasts: [...s.toasts, okToast(`Aset ${code} terdaftar — ${a.name}`)],
      };
    }

    case "PRINT_QR": {
      const eq = s.equipment.find((e) => e.id === a.eqId)!;
      return { ...s, audit: [mkAudit(me.name, s.role, "QR.PRINT", "asset", eq.code, undefined, "Label QR dicetak"), ...s.audit], toasts: [...s.toasts, okToast(`Label QR ${eq.code} dikirim ke printer`)] };
    }

    case "WO_CREATE": {
      const eq = s.equipment.find((e) => e.id === a.eqId)!;
      const wo: WorkOrder = { id: "WO-" + uid(), wo: "WO-" + (2611 + s.workOrders.length), eqId: a.eqId, type: a.type, techId: "T-01", scheduled: d(3), status: "SCHEDULED", note: a.note, laborCost: 500_000, templateId: a.templateId };
      return {
        ...s, workOrders: [wo, ...s.workOrders],
        timeline: [mkTimeline(a.eqId, "MAINTENANCE", `WO ${wo.wo} dijadwalkan (${a.type})`, a.note, me.name), ...s.timeline],
        audit: [mkAudit(me.name, s.role, "MAINTENANCE.SCHEDULE", "work_order", wo.wo, undefined, `${eq.code} · ${a.type}`), ...s.audit],
        toasts: [...s.toasts, okToast(`Work order ${wo.wo} dijadwalkan`)],
      };
    }

    case "WO_START": {
      const wo = s.workOrders.find((w) => w.id === a.woId)!;
      return {
        ...s, workOrders: s.workOrders.map((w) => (w.id === a.woId ? { ...w, status: "IN_PROGRESS" } : w)),
        equipment: s.equipment.map((e) => (e.id === wo.eqId ? { ...e, opStatus: "MAINTENANCE" } : e)),
        timeline: [mkTimeline(wo.eqId, "MAINTENANCE", `WO ${wo.wo} dikerjakan`, wo.note, me.name), ...s.timeline],
        audit: [mkAudit(me.name, s.role, "MAINTENANCE.START", "work_order", wo.wo, undefined, `opStatus → MAINTENANCE`), ...s.audit],
        toasts: [...s.toasts, okToast(`${wo.wo} dimulai — equipment berstatus MAINTENANCE`, "info")],
      };
    }

    case "WO_SUBMIT": {
      const wo = s.workOrders.find((w) => w.id === a.woId)!;
      const eq = s.equipment.find((e) => e.id === wo.eqId)!;
      const partRows = a.parts.flatMap((p) => {
        const part = s.spareParts.find((x) => x.id === p.id)!;
        const newBal = part.stock - p.qty;
        return { part, p, ledger: mkLedger(part.code, "CONSUMPTION", -p.qty, newBal, me.name, wo.wo, `Dipakai pada ${wo.wo} (BR-016)`), audit: mkAudit(me.name, s.role, "SPARE_PART.CONSUME", "spare_part", part.id, undefined, `stock ${part.stock} → ${newBal} · ref ${wo.wo}`) };
      });
      const partsCost = partRows.reduce((x, r) => x + r.part.unitCost * r.p.qty, 0);
      const total = wo.laborCost + partsCost;
      const fr: FormResult = { id: "FR-" + uid(), woId: wo.id, templateId: wo.templateId, values: a.values, actor: me.name, date: now() };
      return {
        ...s,
        workOrders: s.workOrders.map((w) => (w.id === a.woId ? { ...w, status: "CLOSED" } : w)),
        formResults: [fr, ...s.formResults],
        equipment: s.equipment.map((e) => (e.id === wo.eqId ? { ...e, opStatus: "IN_SERVICE", lastMaint: now(), nextMaint: d(90), condition: e.condition === "POOR" ? "FAIR" : e.condition } : e)),
        spareParts: s.spareParts.map((sp) => { const used = a.parts.find((p) => p.id === sp.id); return used ? { ...sp, stock: Math.max(0, sp.stock - used.qty) } : sp; }),
        ledger: [...partRows.map((r) => r.ledger), ...s.ledger],
        timeline: [
          mkTimeline(wo.eqId, "MAINTENANCE", `WO ${wo.wo} selesai (${wo.type})`, a.note + (partRows.length ? ` · Spare part: ${partRows.map((r) => r.part.name).join(", ")}.` : "") + " Form hasil tersimpan.", me.name, total),
          ...s.timeline,
        ],
        audit: [...partRows.map((r) => r.audit), mkAudit(me.name, s.role, "MAINTENANCE.COMPLETE", "work_order", wo.wo, a.note, `opStatus → IN_SERVICE · biaya ${fmtIDR(total)}`), ...s.audit],
        toasts: [...s.toasts, okToast(`${wo.wo} ditutup · ${fmtIDR(total)} · equipment kembali IN_SERVICE`)],
      };
    }

    case "INSPECT": {
      const eq = s.equipment.find((e) => e.id === a.eqId)!;
      const code = "INS-2608-" + String(6 + s.inspections.length).padStart(3, "0");
      const ins: Inspection = { id: "INS-" + uid(), code, eqId: a.eqId, date: now(), nextDue: a.nextDue, inspector: a.inspector, checklist: a.checklist, result: a.result, note: a.note };
      const cond = a.result === "PASS" ? (eq.condition === "POOR" ? "FAIR" : eq.condition) : a.result === "FAIL" ? "POOR" : eq.condition;
      return {
        ...s, inspections: [ins, ...s.inspections],
        equipment: s.equipment.map((e) => (e.id === a.eqId ? { ...e, condition: cond as Equipment["condition"] } : e)),
        timeline: [mkTimeline(a.eqId, "INSPECTION", `Inspeksi ${code} — ${a.result}`, a.note || `Checklist ${a.checklist.filter((c) => c.pass).length}/${a.checklist.length} lolos. Kondisi dicatat (BR-017).`, a.inspector, undefined, a.result), ...s.timeline],
        audit: [mkAudit(me.name, s.role, "INSPECTION.COMPLETE", "inspection", code, a.note, `${eq.code} result ${a.result}`), ...s.audit],
        notifs: a.result === "FAIL" ? [mkNotif("INSPECTION_DUE", `${eq.name} GAGAL inspeksi — tindak lanjut wajib.`, a.eqId), ...s.notifs] : s.notifs,
        toasts: [...s.toasts, okToast(`Inspeksi ${code} tercatat — ${a.result}`, a.result === "FAIL" ? "warn" : "ok")],
      };
    }

    case "CMP_STATUS": {
      const cmp = s.complaints.find((c) => c.id === a.id)!;
      const closed = a.to === "CLOSED";
      return {
        ...s,
        complaints: s.complaints.map((c) => (c.id === a.id ? { ...c, status: a.to, resolution: a.resolution ?? c.resolution } : c)),
        timeline: [mkTimeline(cmp.eqId, "COMPLAINT", `${cmp.code} → ${a.to}`, a.to === "RESOLVED" ? `Resolusi: ${a.resolution}` : `Status diperbarui menjadi ${a.to}.`, me.name, undefined, a.to), ...s.timeline],
        audit: [mkAudit(me.name, s.role, "COMPLAINT.UPDATE", "complaint", cmp.code, undefined, `status ${cmp.status} → ${a.to}`), ...s.audit],
        equipment: closed ? s.equipment.map((e) => (e.id === cmp.eqId && e.opStatus === "DOWN" ? { ...e, opStatus: "IN_SERVICE" } : e)) : s.equipment,
        toasts: [...s.toasts, okToast(`${cmp.code} → ${a.to}`, closed ? "ok" : "info")],
      };
    }

    case "REPAIR_PROGRESS": {
      const r = s.repairs.find((x) => x.id === a.id)!;
      return {
        ...s, repairs: s.repairs.map((x) => (x.id === a.id ? { ...x, status: "IN_PROGRESS" } : x)),
        timeline: [mkTimeline(r.eqId, "REPAIR", `${r.code} dikerjakan`, "Diagnosis: " + r.diagnosis, me.name), ...s.timeline],
        audit: [mkAudit(me.name, s.role, "REPAIR.START", "repair", r.code, r.diagnosis), ...s.audit],
        toasts: [...s.toasts, okToast(`${r.code} dimulai`, "info")],
      };
    }

    case "REPAIR_CLOSE": {
      const r = s.repairs.find((x) => x.id === a.id)!;
      const partCost = r.partsUsed.reduce((x, pu) => x + (s.spareParts.find((p) => p.id === pu.partId)?.unitCost ?? 0) * pu.qty, 0);
      return {
        ...s, repairs: s.repairs.map((x) => (x.id === a.id ? { ...x, status: "CLOSED" } : x)),
        equipment: s.equipment.map((e) => (e.id === r.eqId ? { ...e, opStatus: "IN_SERVICE" } : e)),
        timeline: [mkTimeline(r.eqId, "REPAIR", `${r.code} ditutup — testing PASS`, `Hasil: ${a.result}. Total ${fmtIDR(partCost + r.laborCost)}.`, me.name, partCost + r.laborCost, "CLOSED"), ...s.timeline],
        audit: [mkAudit(me.name, s.role, "REPAIR.COMPLETE", "repair", r.code, a.result, `${r.code} → CLOSED`), ...s.audit],
        toasts: [...s.toasts, okToast(`${r.code} ditutup · equipment kembali layanan`)],
      };
    }

    case "APPROVE": {
      const ap = s.approvals.find((x) => x.id === a.id)!;
      let next: AppState = {
        ...s,
        approvals: s.approvals.map((x) => (x.id === a.id ? { ...x, status: a.ok ? "APPROVED" : "REJECTED" } : x)),
        transfers: s.transfers.map((tr) => (tr.ref === ap.ref ? { ...tr, status: a.ok ? "APPROVED" : "REJECTED", decidedBy: me.name, decidedAt: now() } : tr)),
        audit: [mkAudit(me.name, s.role, a.ok ? "APPROVAL.APPROVE" : "APPROVAL.REJECT", "approval", ap.ref, a.note || undefined), ...s.audit],
        toasts: [...s.toasts, okToast(`${ap.ref} ${a.ok ? "disetujui" : "ditolak"}`, a.ok ? "ok" : "warn")],
      };
      if (!a.ok) {
        if (ap.type === "LOAN") {
          const loanId = String((ap.meta ?? {}).loanId);
          next = { ...next, loans: next.loans.map((x) => (x.id === loanId ? { ...x, status: "REJECTED" } : x)) };
        }
        return next;
      }
      const meta = (ap.meta ?? {}) as Record<string, string | number>;
      if (ap.type === "TRANSFER") {
        const eq = s.equipment.find((e) => e.id === String(meta.eqId))!;
        next = {
          ...next,
          equipment: next.equipment.map((e) => (e.id === eq.id ? { ...e, building: String(meta.toBuilding), floor: String(meta.toFloor), room: String(meta.toRoom) } : e)),
          timeline: [mkTimeline(eq.id, "TRANSFER", `Transfer ${ap.ref} dieksekusi`, `${eq.room} → ${String(meta.toRoom)}. Serah terima digital tercatat.`, me.name, undefined, "APPROVED"), ...next.timeline],
        };
      }
      if (ap.type === "ADJUSTMENT") {
        const sku = String(meta.sku); const delta = Number(meta.delta);
        const item = s.items.find((i) => i.sku === sku)!;
        const newBal = item.stock + delta;
        next = {
          ...next,
          items: next.items.map((i) => (i.sku === sku ? { ...i, stock: i.stock + delta } : i)),
          ledger: [mkLedger(sku, "ADJUSTMENT", delta, newBal, me.name, ap.ref, String(meta.reason)), ...next.ledger],
          audit: [mkAudit(me.name, s.role, "INVENTORY.ADJUST", "inventory_transaction", ap.ref, String(meta.reason), `${sku} ${delta > 0 ? "+" : ""}${delta} → ${newBal}`), ...next.audit],
        };
      }
      if (ap.type === "REPAIR") {
        const eqId = String(meta.eqId);
        next = {
          ...next,
          repairs: next.repairs.map((r) => (r.eqId === eqId && r.status === "AWAITING_APPROVAL" ? { ...r, status: "APPROVED" } : r)),
          timeline: [mkTimeline(eqId, "REPAIR", `Repair disetujui (${ap.ref})`, "Perbaikan dapat dieksekusi sesuai diagnosis.", me.name), ...next.timeline],
        };
      }
      if (ap.type === "LOAN") {
        const loanId = String(meta.loanId);
        const ln = s.loans.find((x) => x.id === loanId);
        if (ln) {
          next = {
            ...next,
            loans: next.loans.map((x) => (x.id === loanId ? { ...x, status: "APPROVED" } : x)),
            timeline: [mkTimeline(ln.eqId, "UTILIZATION", `Pinjaman ${ln.code} disetujui`, "Aset siap diserahterimakan ke peminjam.", me.name, undefined, "APPROVED"), ...next.timeline],
          };
        }
      }
      if (ap.type === "DISPOSAL") {
        const eqId = String(meta.eqId);
        const eq = s.equipment.find((e) => e.id === eqId);
        if (eq) {
          next = {
            ...next,
            equipment: next.equipment.map((e) => (e.id === eqId ? { ...e, opStatus: "RETIRED", lifecycle: 7 } : e)),
            timeline: [mkTimeline(eqId, "LIFECYCLE", `Pensiun disetujui (${ap.ref})`, `${eq.name} ditarik dari layanan (RETIRED). Lanjutkan eksekusi pelepasan di modul Disposal.`, me.name, undefined, "RETIRED"), ...next.timeline],
            notifs: [mkNotif("DISPOSAL", `${eq.name} resmi RETIRED — siap dieksekusi pelepasannya.`, eqId), ...next.notifs],
          };
        }
      }
      return next;
    }

    case "ADJUST": {
      const item = s.items.find((i) => i.sku === a.sku)!;
      const value = Math.abs(a.delta) * item.unitCost;
      const adjMatrix = s.config.approvalMatrix.ADJUSTMENT.map((x) => x.label);
      if (value > s.config.adjThreshold) {
        const ref = "ADJ-2608-" + String(8 + s.approvals.filter((x) => x.type === "ADJUSTMENT").length).padStart(3, "0");
        const apr = { id: "APR-" + uid(), type: "ADJUSTMENT" as const, ref, requester: me.name, value, risk: "MEDIUM" as const, summary: `Adjust ${item.name} ${a.delta > 0 ? "+" : ""}${a.delta} ${item.uom} (${fmtIDR(value)})`, matrix: adjMatrix, status: "PENDING" as const, date: now(), meta: { sku: a.sku, delta: a.delta, reason: a.reason } };
        return {
          ...s, approvals: [apr, ...s.approvals],
          audit: [mkAudit(me.name, s.role, "ADJUSTMENT.REQUEST", "approval", ref, a.reason, `nilai ${fmtIDR(value)} > threshold`), ...s.audit],
          notifs: [mkNotif("APPROVAL_PENDING", `Adjustment ${ref} menunggu persetujuan (BR-005).`, a.sku), ...s.notifs],
          toasts: [...s.toasts, okToast(`Nilai ${fmtIDR(value)} > threshold — butuh persetujuan (BR-005)`, "warn")],
        };
      }
      const newBal = item.stock + a.delta;
      const ref = "ADJ-2608-" + uid().slice(0, 3);
      return {
        ...s,
        items: s.items.map((i) => (i.sku === a.sku ? { ...i, stock: i.stock + a.delta } : i)),
        ledger: [mkLedger(a.sku, "ADJUSTMENT", a.delta, newBal, me.name, ref, a.reason), ...s.ledger],
        audit: [mkAudit(me.name, s.role, "INVENTORY.ADJUST", "inventory_transaction", ref, a.reason, `${a.sku} ${a.delta > 0 ? "+" : ""}${a.delta} → ${newBal}`), ...s.audit],
        toasts: [...s.toasts, okToast(`Stok ${item.name} disesuaikan → ${newBal} ${item.uom}`)],
      };
    }

    case "RECEIVE": {
      const item = s.items.find((i) => i.sku === a.sku)!;
      const newBal = item.stock + a.qty;
      const ref = "GRN-2608-" + String(7 + s.receipts.length).padStart(3, "0");
      const rec = { id: ref, ref, date: now(), supplierId: a.supplierId, sku: a.sku, qty: a.qty, batch: a.batch || item.batch, expiry: a.expiry || item.expiry, poRef: a.poRef, by: me.name };
      return {
        ...s, receipts: [rec, ...s.receipts],
        items: s.items.map((i) => (i.sku === a.sku ? { ...i, stock: newBal, batch: a.batch || i.batch, expiry: a.expiry || i.expiry } : i)),
        ledger: [mkLedger(a.sku, "RECEIPT", a.qty, newBal, me.name, ref, `Penerimaan ${a.poRef}`), ...s.ledger],
        audit: [mkAudit(me.name, s.role, "INVENTORY.RECEIVE", "goods_receipt", ref, undefined, `${a.sku} +${a.qty} → ${newBal}`), ...s.audit],
        toasts: [...s.toasts, okToast(`${ref}: ${item.name} +${a.qty} ${item.uom} diterima`)],
      };
    }

    case "DISTRIBUTE": {
      const item = s.items.find((i) => i.sku === a.sku)!;
      const newBal = item.stock - a.qty;
      const ref = "DIST-2608-" + String(26 + s.issues.length).padStart(3, "0");
      const iss = { id: ref, ref, date: now(), sku: a.sku, qty: a.qty, dest: a.dest, strategy: a.strategy, by: me.name };
      const low = newBal <= item.reorder;
      return {
        ...s, issues: [iss, ...s.issues],
        items: s.items.map((i) => (i.sku === a.sku ? { ...i, stock: newBal } : i)),
        ledger: [mkLedger(a.sku, "ISSUE", -a.qty, newBal, me.name, `${ref} · ${a.dest}`, `Alokasi ${a.strategy}`), ...s.ledger],
        audit: [mkAudit(me.name, s.role, "INVENTORY.ISSUE", "inventory_transaction", ref, undefined, `${a.sku} −${a.qty} → ${newBal}`), ...s.audit],
        notifs: low ? [mkNotif("LOW_STOCK", `${item.name} menyentuh reorder point (${newBal} ≤ ${item.reorder}).`, a.sku), ...s.notifs] : s.notifs,
        toasts: [...s.toasts, okToast(`${ref}: ${a.qty} ${item.uom} → ${a.dest}${low ? " · stok rendah!" : ""}`, low ? "warn" : "ok")],
      };
    }

    case "OPNAME_CREATE": {
      const code = "SO-2608-" + String(4 + s.opnames.length).padStart(3, "0");
      const so: OpnameSession = { id: "SO-" + uid(), code, date: now(), status: "COUNTING", by: me.name, items: s.items.map((i) => ({ sku: i.sku, name: i.name, uom: i.uom, system: i.stock, counted: null })) };
      return {
        ...s, opnames: [so, ...s.opnames],
        audit: [mkAudit(me.name, s.role, "STOCK_OPNAME.CREATE", "stock_opname", code, undefined, `${s.items.length} SKU di-snapshot & freeze`), ...s.audit],
        toasts: [...s.toasts, okToast(`Sesi ${code} dibuat — ${s.items.length} SKU snapshot`, "info")],
      };
    }

    case "OPNAME_COUNT":
      return { ...s, opnames: s.opnames.map((o) => (o.id === a.id ? { ...o, items: o.items.map((i) => (i.sku === a.sku ? { ...i, counted: a.counted } : i)) } : o)) };

    case "OPNAME_FINALIZE": {
      const so = s.opnames.find((o) => o.id === a.id)!;
      const diffs = so.items.filter((i) => i.counted !== null && i.counted !== i.system);
      let next: AppState = { ...s, opnames: s.opnames.map((o) => (o.id === a.id ? { ...o, status: "CLOSED" } : o)) };
      const entries: LedgerEntry[] = [];
      const audits: AuditEntry[] = [];
      const approvals = [...next.approvals];
      const notifs = [...next.notifs];
      for (const df of diffs) {
        const delta = df.counted! - df.system;
        const item = s.items.find((i) => i.sku === df.sku)!;
        const val = Math.abs(delta) * item.unitCost;
        if (val > s.config.adjThreshold) {
          const ref = "ADJ-2608-" + String(8 + approvals.filter((x) => x.type === "ADJUSTMENT").length).padStart(3, "0");
          approvals.unshift({ id: "APR-" + uid(), type: "ADJUSTMENT", ref, requester: me.name, value: val, risk: "MEDIUM", summary: `Stock opname: ${item.name} ${delta > 0 ? "+" : ""}${delta} ${item.uom} (${fmtIDR(val)} > threshold)`, matrix: s.config.approvalMatrix.ADJUSTMENT.map((x) => x.label), status: "PENDING", date: now(), meta: { sku: df.sku, delta, reason: `Selisih stock opname ${so.code}` } });
          notifs.unshift(mkNotif("APPROVAL_PENDING", `Selisih opname ${item.name} dirutekan ke approval (${fmtIDR(val)}).`, df.sku));
          audits.unshift(mkAudit(me.name, s.role, "ADJUSTMENT.REQUEST", "approval", ref, `Selisih ${so.code}`, `${df.sku} ${delta}`));
        } else {
          const newBal = item.stock + delta;
          entries.push(mkLedger(df.sku, "STOCK_OPNAME", delta, newBal, me.name, so.code, `Hasil hitung fisik ${so.code}`));
          audits.unshift(mkAudit(me.name, s.role, "INVENTORY.ADJUST", "inventory_transaction", so.code, `Hasil hitung fisik`, `${df.sku} ${delta > 0 ? "+" : ""}${delta} → ${newBal}`));
          next = { ...next, items: next.items.map((i) => (i.sku === df.sku ? { ...i, stock: i.stock + delta } : i)) };
        }
      }
      return {
        ...next, approvals, ledger: [...entries, ...next.ledger], audit: [...audits, ...next.audit], notifs,
        timeline: next.timeline,
        toasts: [...next.toasts, okToast(`${so.code} ditutup — ${diffs.length} selisih diproses (${diffs.filter((x) => { const it = s.items.find((i) => i.sku === x.sku); return it && Math.abs(x.counted! - x.system) * it.unitCost > s.config.adjThreshold; }).length} via approval)`)],
      };
    }

    case "DEMAND_SUBMIT": {
      const code = "DP-2609-" + String(6 + s.demandPlans.length).padStart(3, "0");
      const dp = { id: "DP-" + uid(), code, kind: a.kind, item: a.item, category: a.category, brand: a.brand, model: a.model, qty: a.qty, uom: a.uom, estCost: a.estCost, unit: a.unit, needBy: a.needBy, status: "SUBMITTED" as const, by: me.name };
      return {
        ...s, demandPlans: [dp, ...s.demandPlans],
        audit: [mkAudit(me.name, s.role, "DEMAND.SUBMIT", "demand_plan", code, undefined, `${a.kind} · ${a.item} ${a.qty} ${a.uom}`), ...s.audit],
        toasts: [...s.toasts, okToast(`Demand plan ${code} (${a.kind === "ASET" ? "aset/CAPEX" : "BHP"}) diajukan`)],
      };
    }

    case "DEMAND_REVIEW": {
      const dp = s.demandPlans.find((x) => x.id === a.id)!;
      return {
        ...s, demandPlans: s.demandPlans.map((x) => (x.id === a.id ? { ...x, status: "REVIEWED" } : x)),
        audit: [mkAudit(me.name, s.role, "DEMAND.REVIEW", "demand_plan", dp.code), ...s.audit],
        toasts: [...s.toasts, okToast(`${dp.code} ditandai REVIEWED`, "info")],
      };
    }

    case "DEMAND_CONSOLIDATE": {
      const dp = s.demandPlans.find((x) => x.id === a.id)!;
      const isAsset = dp.kind === "ASET";
      const item = isAsset ? undefined : s.items.find((i) => i.name === dp.item);
      const sku = isAsset ? undefined : item?.sku ?? "NEW-" + uid().slice(0, 4);
      const code = "PR-2608-" + String(12 + s.purchaseRequests.length).padStart(3, "0");
      const displayName = isAsset && dp.brand ? `${dp.item} — ${dp.brand} ${dp.model ?? ""}`.trim() : dp.item;
      const line: PRLine = { id: "LN-" + uid(), kind: isAsset ? "ASSET" : "ITEM", sku, name: displayName, category: dp.category, brand: dp.brand, model: dp.model, qty: dp.qty, unitCost: Math.round(dp.estCost / dp.qty), isIT: isAsset ? (dp.category === "IT & Komputer") : isITSku(sku ?? ""), stages: mkPendingStages(), revision: 0 };
      const pr = { id: "PR-" + uid(), code, date: now(), requester: me.name, unit: dp.unit, needBy: dp.needBy, lines: [line], status: "IN_APPROVAL" as const };
      return {
        ...s,
        demandPlans: s.demandPlans.map((x) => (x.id === a.id ? { ...x, status: "CONSOLIDATED" } : x)),
        purchaseRequests: [pr, ...s.purchaseRequests],
        audit: [mkAudit(me.name, s.role, "PROCUREMENT.PR", "purchase_request", code, `Dari demand plan ${dp.code} (${dp.kind})`, fmtIDR(dp.estCost)), ...s.audit],
        notifs: [mkNotif("APPROVAL_PENDING", `PR ${code} (${isAsset ? "ASET/CAPEX" : "BHP"}) menunggu persetujuan 3 tahap (${line.isIT ? "IT" : "UMUM"} → Keuangan → COO).`, sku ?? dp.code), ...s.notifs],
        toasts: [...s.toasts, okToast(`PR ${code} dibuat dari ${dp.code} — masuk persetujuan 3 tahap`)],
      };
    }

    case "PO_CREATE": {
      const pr = s.purchaseRequests.find((p) => p.id === a.prId)!;
      const approved = pr.lines.filter((l) => lineState(l) === "APPROVED");
      const code = "PO-2608-" + String(91 + s.purchaseOrders.length).padStart(3, "0");
      const total = approved.reduce((x, l) => x + lineTotal(l), 0);
      const po: PurchaseOrder = { id: "PO-" + uid(), code, date: now(), supplierId: a.supplierId, items: approved.map((l) => ({ kind: l.kind, sku: l.sku, name: l.name, category: l.category, brand: l.brand, model: l.model, qty: l.qty, price: l.unitCost })), total, eta: a.eta, status: "SENT", prRef: pr.code };
      return {
        ...s, purchaseOrders: [po, ...s.purchaseOrders],
        purchaseRequests: s.purchaseRequests.map((p) => (p.id === a.prId ? { ...p, status: "PO_CREATED" } : p)),
        audit: [mkAudit(me.name, s.role, "PROCUREMENT.PO", "purchase_order", code, `${approved.length} baris disetujui`, `${pr.code} → ${code} · ${fmtIDR(total)}`), ...s.audit],
        toasts: [...s.toasts, okToast(`PO ${code} dikirim ke supplier (${approved.length} baris)`)],
      };
    }

    case "PO_RECEIVE": {
      const po = s.purchaseOrders.find((p) => p.id === a.poId)!;
      let next: AppState = { ...s, purchaseOrders: s.purchaseOrders.map((p) => (p.id === a.poId ? { ...p, status: "RECEIVED" } : p)) };
      const entries: LedgerEntry[] = [];
      const receipts = [...next.receipts];
      const newEquipment: Equipment[] = [];
      const newTimeline: TimelineEvent[] = [];
      for (const it of po.items) {
        /* ── Barang inventori (BHP) → ledger + stok ── */
        if (it.kind !== "ASSET") {
          const item = s.items.find((i) => i.sku === it.sku);
          if (!item) continue;
          const newBal = item.stock + it.qty;
          const ref = "GRN-2608-" + String(7 + receipts.length).padStart(3, "0");
          receipts.unshift({ id: ref, ref, date: now(), supplierId: po.supplierId, sku: it.sku!, qty: it.qty, batch: "PO" + po.code.slice(-3), expiry: null, poRef: po.code, by: me.name });
          entries.push(mkLedger(it.sku!, "RECEIPT", it.qty, newBal, me.name, ref, `Penerimaan ${po.code}`));
          next = { ...next, items: next.items.map((i) => (i.sku === it.sku ? { ...i, stock: newBal } : i)) };
          continue;
        }
        /* ── Aset (CAPEX) → daftarkan equipment, tertelusur ke PO (BR-001/002) ── */
        for (let u = 0; u < it.qty; u++) {
          const seq = s.equipment.length + newEquipment.length + 1;
          const eq = mkEquipmentFromPo(seq, it.name, it.category ?? "Monitoring", it.price, po.supplierId, po.code, me.name, it.brand, it.model);
          newEquipment.push(eq);
          newTimeline.push(
            mkTimeline(eq.id, "LIFECYCLE", `Registrasi aset dari pengadaan — ${eq.code}`, `${it.name} diterima via ${po.code} · ${fmtIDR(it.price)} · supplier tercantum di acquisition record.`, me.name, undefined, "REGISTERED"),
            mkTimeline(eq.id, "PROCUREMENT", `GRN ${po.code} — aset diterima`, `PO ${po.code} (PR ${po.prRef}) · menunggu distribusi/assignment ke unit.`, me.name, it.price),
          );
        }
      }
      const assetCount = newEquipment.length;
      return {
        ...next, receipts, ledger: [...entries, ...next.ledger],
        equipment: [...next.equipment, ...newEquipment],
        timeline: [...newTimeline, ...next.timeline],
        notifs: assetCount > 0 ? [mkNotif("REMINDER", `${assetCount} aset baru dari ${po.code} menunggu distribusi ke unit (Gudang Aset).`, newEquipment[0].id), ...next.notifs] : next.notifs,
        audit: [
          ...(assetCount > 0 ? newEquipment.map((eq) => mkAudit(me.name, s.role, "ASSET.REGISTER", "asset", eq.code, `Dari pengadaan ${po.code}`, `${eq.name} · ${fmtIDR(eq.acqCost)}`)) : []),
          mkAudit(me.name, s.role, "PROCUREMENT.GRN", "goods_receipt", po.code, undefined, `${po.items.length} line diterima${assetCount ? ` · ${assetCount} aset didaftarkan` : ""}`), ...next.audit,
        ],
        toasts: [...next.toasts, okToast(assetCount > 0 ? `${po.code} diterima — ${assetCount} aset didaftarkan (Equipment 360°)` : `${po.code} diterima — GRN & ledger diposting`)],
      };
    }

    /* ── PR approval 3 tahap (IT/UMUM → Keuangan → COO), per-barang ── */
    case "PR_DECIDE": {
      const pr = s.purchaseRequests.find((p) => p.id === a.prId);
      if (!pr) return s;
      const line = pr.lines.find((l) => l.id === a.lineId);
      if (!line) return s;
      const idx = lineActiveStage(line);
      if (idx < 0) return s;
      const stages = line.stages.map((st, i) => (i === idx ? { status: (a.ok ? "APPROVED" : "REJECTED") as StageDecision["status"], approver: me.name, note: a.note, date: now() } : st));
      const upd: PRLine = { ...line, stages };
      const lines = pr.lines.map((l) => (l.id === a.lineId ? upd : l));
      const newPr = { ...pr, lines, status: prState({ ...pr, lines }) };
      const stageLabel = prStageLabels(line.isIT)[idx];
      return {
        ...s, purchaseRequests: s.purchaseRequests.map((p) => (p.id === a.prId ? newPr : p)),
        audit: [mkAudit(me.name, s.role, a.ok ? "PROCUREMENT.APPROVE" : "PROCUREMENT.REJECT", "purchase_request", `${pr.code}/${line.sku ?? line.id}`, a.note || undefined, `${line.kind === "ASSET" ? "ASET" : "BHP"} · Tahap ${idx + 1} ${stageLabel}: ${a.ok ? "APPROVED" : "REJECTED"}`), ...s.audit],
        toasts: [...s.toasts, okToast(`${a.ok ? "Disetujui" : "Ditolak"}: ${line.name} — tahap ${stageLabel}`, a.ok ? "ok" : "warn")],
      };
    }

    case "PR_DECIDE_ALL": {
      const pr = s.purchaseRequests.find((p) => p.id === a.prId);
      if (!pr) return s;
      let changed = 0;
      const lines = pr.lines.map((l) => {
        const idx = lineActiveStage(l);
        if (idx < 0 || prStageRole(l.isIT, idx) !== s.role) return l;
        changed++;
        const stages = l.stages.map((st, i) => (i === idx ? { status: (a.ok ? "APPROVED" : "REJECTED") as StageDecision["status"], approver: me.name, note: a.note, date: now() } : st));
        return { ...l, stages };
      });
      if (changed === 0) return { ...s, toasts: [...s.toasts, okToast("Tidak ada baris yang menunggu di tahap Anda", "info")] };
      const newPr = { ...pr, lines, status: prState({ ...pr, lines }) };
      return {
        ...s, purchaseRequests: s.purchaseRequests.map((p) => (p.id === a.prId ? newPr : p)),
        audit: [mkAudit(me.name, s.role, a.ok ? "PROCUREMENT.APPROVE_ALL" : "PROCUREMENT.REJECT_ALL", "purchase_request", pr.code, a.note || undefined, `${changed} baris pada tahap Anda`), ...s.audit],
        toasts: [...s.toasts, okToast(`${changed} baris ${a.ok ? "disetujui" : "ditolak"} sekaligus`, a.ok ? "ok" : "warn")],
      };
    }

    case "PR_REVISE": {
      const pr = s.purchaseRequests.find((p) => p.id === a.prId);
      if (!pr) return s;
      const line = pr.lines.find((l) => l.id === a.lineId);
      if (!line) return s;
      const upd: PRLine = { ...line, qty: a.qty, revision: line.revision + 1, stages: mkPendingStages() };
      const lines = pr.lines.map((l) => (l.id === a.lineId ? upd : l));
      const newPr = { ...pr, lines, status: prState({ ...pr, lines }) };
      return {
        ...s, purchaseRequests: s.purchaseRequests.map((p) => (p.id === a.prId ? newPr : p)),
        audit: [mkAudit(me.name, s.role, "PROCUREMENT.REVISE", "purchase_request", `${pr.code}/${line.sku ?? line.id}`, "Revisi sesuai saran approver", `qty → ${a.qty} (revisi ke-${upd.revision})`), ...s.audit],
        notifs: [mkNotif("APPROVAL_PENDING", `PR ${pr.code} direvisi (${line.name} qty ${a.qty}) — approval diulang dari tahap 1.`, line.sku ?? pr.code), ...s.notifs],
        toasts: [...s.toasts, okToast(`${line.name} direvisi (qty ${a.qty}) — kembali ke tahap 1`)],
      };
    }

    /* ── Phase 3: loan, rental, depreciation, usage ── */

    case "LOAN_REQUEST": {
      const eq = s.equipment.find((e) => e.id === a.eqId)!;
      const code = "LOAN-2608-" + String(4 + s.loans.length).padStart(3, "0");
      const ln: Loan = { id: "LN-" + uid(), code, eqId: a.eqId, toUnit: a.toUnit, borrower: a.borrower, requested: now(), due: a.due, status: "REQUESTED", note: a.note };
      const apr = { id: "APR-" + uid(), type: "LOAN" as const, ref: code, requester: me.name, value: eq.acqCost, risk: eq.risk, summary: `Pinjaman ${eq.name} → ${a.toUnit} (s.d. ${a.due.slice(0, 10)})`, matrix: ["Kepala Unit asal", "Pengelola Aset"], status: "PENDING" as const, date: now(), meta: { loanId: ln.id, eqId: a.eqId } };
      return {
        ...s, loans: [ln, ...s.loans], approvals: [apr, ...s.approvals],
        timeline: [mkTimeline(a.eqId, "UTILIZATION", `Permintaan pinjaman ${code}`, `${eq.room} → ${a.toUnit} (peminjam: ${a.borrower}). Menunggu persetujuan.`, me.name, undefined, "REQUESTED"), ...s.timeline],
        audit: [mkAudit(me.name, s.role, "LOAN.REQUEST", "asset_loan", code, a.note, `${eq.code} → ${a.toUnit}`), ...s.audit],
        notifs: [mkNotif("APPROVAL_PENDING", `Persetujuan pinjaman ${code} — ${eq.name} ke ${a.toUnit}.`, a.eqId), ...s.notifs],
        toasts: [...s.toasts, okToast(`Pinjaman ${code} masuk antrian persetujuan`, "info")],
      };
    }

    case "LOAN_ADVANCE": {
      const ln = s.loans.find((x) => x.id === a.id)!;
      const eq = s.equipment.find((e) => e.id === ln.eqId)!;
      return {
        ...s, loans: s.loans.map((x) => (x.id === a.id ? { ...x, status: "ON_LOAN" } : x)),
        timeline: [mkTimeline(ln.eqId, "UTILIZATION", `${ln.code} diserahterimakan`, `${eq.name} diterima ${ln.toUnit}; peminjam ${ln.borrower}.`, me.name, undefined, "ON_LOAN"), ...s.timeline],
        audit: [mkAudit(me.name, s.role, "LOAN.HANDOVER", "asset_loan", ln.code, undefined, "status APPROVED → ON_LOAN"), ...s.audit],
        toasts: [...s.toasts, okToast(`${ln.code} serah terima selesai — aset berstatus pinjaman`)],
      };
    }

    case "LOAN_RETURN": {
      const ln = s.loans.find((x) => x.id === a.id)!;
      return {
        ...s, loans: s.loans.map((x) => (x.id === a.id ? { ...x, status: "RETURNED", returnCondition: a.condition } : x)),
        timeline: [mkTimeline(ln.eqId, "UTILIZATION", `${ln.code} dikembalikan`, `Kondisi saat kembali: ${a.condition}. Menunggu inspeksi penutup.`, me.name, undefined, "RETURNED"), ...s.timeline],
        audit: [mkAudit(me.name, s.role, "LOAN.RETURN", "asset_loan", ln.code, a.condition, "status ON_LOAN → RETURNED"), ...s.audit],
        toasts: [...s.toasts, okToast(`${ln.code} dikembalikan — lanjut inspeksi & tutup`, "info")],
      };
    }

    case "LOAN_CLOSE": {
      const ln = s.loans.find((x) => x.id === a.id)!;
      return {
        ...s, loans: s.loans.map((x) => (x.id === a.id ? { ...x, status: "CLOSED" } : x)),
        timeline: [mkTimeline(ln.eqId, "UTILIZATION", `${ln.code} ditutup`, "Inspeksi pengembalian lolos; aset kembali ke pool unit asal.", me.name, undefined, "CLOSED"), ...s.timeline],
        audit: [mkAudit(me.name, s.role, "LOAN.CLOSE", "asset_loan", ln.code, "Inspeksi pengembalian"), ...s.audit],
        toasts: [...s.toasts, okToast(`${ln.code} ditutup — pinjaman selesai`)],
      };
    }

    case "RENTAL_CREATE": {
      const eq = s.equipment.find((e) => e.id === a.eqId)!;
      const code = "RENT-2608-" + String(2 + s.rentals.length).padStart(3, "0");
      const end = new Date(Date.now() + a.days * 864e5).toISOString();
      const revenue = a.perDay * a.days;
      const rt: Rental = { id: "RT-" + uid(), code, eqId: a.eqId, party: a.party, start: now(), end, perDay: a.perDay, status: "ACTIVE" };
      const ct: BizContract = { id: "CT-" + uid(), code: "RTL-" + code.slice(5), kind: "RENTAL", name: `Sewa ${eq.name} — ${a.party}`, party: a.party, value: revenue, start: now(), until: end, status: "ACTIVE", note: `${a.days} hari × ${fmtIDR(a.perDay)}/hari` };
      return {
        ...s, rentals: [rt, ...s.rentals], contracts: [ct, ...s.contracts],
        timeline: [mkTimeline(a.eqId, "FINANCE", `Sewa ${code} aktif`, `${a.party} · ${a.days} hari × ${fmtIDR(a.perDay)} = ${fmtIDR(revenue)}.`, me.name, revenue, "ACTIVE"), ...s.timeline],
        audit: [mkAudit(me.name, s.role, "UTILIZATION.RENTAL", "asset_rental", code, a.party, fmtIDR(revenue)), ...s.audit],
        toasts: [...s.toasts, okToast(`Sewa ${code} aktif — potensi pendapatan ${fmtIDR(revenue)}`)],
      };
    }

    case "RENTAL_END": {
      const rt = s.rentals.find((x) => x.id === a.id)!;
      return {
        ...s,
        rentals: s.rentals.map((x) => (x.id === a.id ? { ...x, status: "COMPLETED" } : x)),
        contracts: s.contracts.map((c) => (c.code === "RTL-" + rt.code.slice(5) ? { ...c, status: "EXPIRED" } : c)),
        timeline: [mkTimeline(rt.eqId, "FINANCE", `Sewa ${rt.code} selesai`, `${rt.party} — aset kembali ke rumah sakit & diperiksa.`, me.name, undefined, "COMPLETED"), ...s.timeline],
        audit: [mkAudit(me.name, s.role, "UTILIZATION.RENTAL.END", "asset_rental", rt.code), ...s.audit],
        toasts: [...s.toasts, okToast(`${rt.code} ditutup — pendapatan direalisasikan`)],
      };
    }

    case "DEPRECIATE_POST": {
      const period = periodKey(new Date());
      const targets = s.equipment.filter((e) => e.opStatus !== "RETIRED" && !(s.deprPosted[e.id] ?? []).includes(period));
      if (targets.length === 0) return { ...s, toasts: [...s.toasts, okToast(`Depresiasi ${period} sudah diposting untuk semua aset`, "warn")] };
      const deprPosted = { ...s.deprPosted };
      const timelines: TimelineEvent[] = [];
      let total = 0; let count = 0;
      for (const e of targets) {
        const monthly = monthlyDep(e.acqCost, e.category);
        const lifeM = lifeYears(e.category) * 12;
        const posted = (deprPosted[e.id] ?? []).length;
        if (posted >= lifeM) continue;
        const remaining = e.acqCost * (1 - DEPR_SALVAGE) - posted * monthly;
        const amount = Math.min(monthly, Math.max(0, remaining));
        const accum = posted * monthly + amount;
        deprPosted[e.id] = [...(deprPosted[e.id] ?? []), period];
        total += amount; count++;
        timelines.push(mkTimeline(e.id, "FINANCE", `Depresiasi ${period} diposting`, `Metode garis lurus · bulan ke-${posted + 1}/${lifeM} · ${fmtIDR(amount)} · NBV ${fmtIDR(e.acqCost - accum)}.`, "system", amount));
      }
      return {
        ...s, deprPosted,
        timeline: [...timelines, ...s.timeline],
        audit: [mkAudit(me.name, s.role, "DEPRECIATION.POST", "depreciation_schedule", period, "Posting bulanan (job terjadwal)", `${count} aset · total ${fmtIDR(total)}`), ...s.audit],
        toasts: [...s.toasts, okToast(`Depresiasi ${period} diposting — ${count} aset · ${fmtIDR(total)}`)],
      };
    }

    case "LOG_USAGE": {
      const eq = s.equipment.find((e) => e.id === a.eqId)!;
      const arr = s.utilSeries[a.eqId] ?? [];
      const nextArr = arr.length ? [...arr.slice(0, -1), arr[arr.length - 1] + a.hours] : [a.hours];
      return {
        ...s, utilSeries: { ...s.utilSeries, [a.eqId]: nextArr },
        timeline: [mkTimeline(a.eqId, "UTILIZATION", `Pemakaian +${a.hours} jam dicatat`, "Sinkron dari lapangan (mobile/PWA offline queue).", me.name), ...s.timeline],
        toasts: [...s.toasts, okToast(`+${a.hours} jam pemakaian ${eq.name} tercatat`)],
      };
    }

    case "ADD_TECH": {
      const t = { id: "T-" + String(6 + s.technicians.length).padStart(2, "0"), name: a.name, specialty: a.specialty, cert: a.cert, phone: a.phone, vendor: a.vendor };
      return { ...s, technicians: [...s.technicians, t], audit: [mkAudit(me.name, s.role, "MASTER.CREATE", "technician", t.id, undefined, a.name), ...s.audit], toasts: [...s.toasts, okToast(`Teknisi ${a.name} ditambahkan`)] };
    }
    case "ADD_SUPPLIER": {
      const sp = { id: "S-" + String(6 + s.suppliers.length).padStart(2, "0"), name: a.name, service: a.service, contractUntil: a.contractUntil, contact: a.contact };
      return { ...s, suppliers: [...s.suppliers, sp], audit: [mkAudit(me.name, s.role, "MASTER.CREATE", "supplier", sp.id, undefined, a.name), ...s.audit], toasts: [...s.toasts, okToast(`Supplier ${a.name} ditambahkan`)] };
    }
    case "ADD_ACCESSORY": {
      const ac: Accessory = { id: "AC-" + uid(), code: "ACC-" + uid(), name: a.name, eqId: a.eqId, qty: a.qty, condition: a.condition, note: a.note };
      const eq = s.equipment.find((e) => e.id === a.eqId);
      return {
        ...s, accessories: [...s.accessories, ac],
        timeline: eq ? [mkTimeline(a.eqId, "DOCUMENT", `Aksesori dicatat — ${a.name}`, `Qty ${a.qty} · kondisi ${a.condition}. ${a.note}`, me.name), ...s.timeline] : s.timeline,
        audit: [mkAudit(me.name, s.role, "MASTER.CREATE", "equipment_accessory", ac.code, undefined, `${a.name} → ${eq?.code ?? ""}`), ...s.audit],
        toasts: [...s.toasts, okToast(`Aksesori ${a.name} ditambahkan`)],
      };
    }

    /* ── Phase 4: intelligence actions ── */
    case "INTEL_AUDIT":
      return {
        ...s,
        audit: [mkAudit(me.name, s.role, a.action, a.entity, a.entityId, a.reason, a.delta), ...s.audit],
        toasts: [...s.toasts, okToast("Tercatat di audit trail (intelligence event)", "info")],
      };

    case "AUTO_PR": {
      const code = "PR-2608-" + String(12 + s.purchaseRequests.length).padStart(3, "0");
      const lines: PRLine[] = a.lines.map((l) => ({ id: "LN-" + uid(), kind: "ITEM", sku: l.sku, name: l.name, qty: l.qty, unitCost: l.estCost, isIT: isITSku(l.sku), stages: mkPendingStages(), revision: 0 }));
      const total = lines.reduce((x, l) => x + lineTotal(l), 0);
      const pr = { id: "PR-" + uid(), code, date: now(), requester: "AI Procurement Engine", unit: "Multi-Unit (AI)", needBy: d(30), lines, status: "IN_APPROVAL" as const };
      return {
        ...s,
        purchaseRequests: [pr, ...s.purchaseRequests],
        audit: [mkAudit(me.name, s.role, "PROCUREMENT.AUTO_PR", "purchase_request", code, "Rekomendasi AI Procurement Engine (forecast + coverage)", fmtIDR(total)), ...s.audit],
        notifs: [mkNotif("APPROVAL_PENDING", `PR otomatis ${code} (${fmtIDR(total)}) menunggu persetujuan 3 tahap.`, a.lines[0]?.sku ?? "AI"), ...s.notifs],
        toasts: [...s.toasts, okToast(`PR ${code} dibuat otomatis oleh AI — masuk persetujuan 3 tahap`)],
      };
    }

    case "APPLY_REC": {
      const item = s.items.find((i) => i.sku === a.sku)!;
      return {
        ...s,
        items: s.items.map((i) => (i.sku === a.sku ? { ...i, min: a.min, reorder: a.reorder, max: a.max } : i)),
        audit: [mkAudit(me.name, s.role, "CONFIG.OPTIMIZE", "item", a.sku, "Rekomendasi AI Inventory Optimization (SS + ROP + EOQ)", `min ${item.min}→${a.min} · ROP ${item.reorder}→${a.reorder} · max ${item.max}→${a.max}`), ...s.audit],
        toasts: [...s.toasts, okToast(`Parameter ${item.name} dioptimalkan (min ${a.min} · ROP ${a.reorder})`)],
      };
    }

    /* ── Phase 5: retirement, disposal, mobile ops, integrations ── */
    case "RETIRE_REQUEST": {
      const eq = s.equipment.find((e) => e.id === a.eqId)!;
      const ref = "RTR-2608-" + String(1 + s.approvals.filter((x) => x.type === "DISPOSAL").length).padStart(3, "0");
      const apr = { id: "APR-" + uid(), type: "DISPOSAL" as const, ref, requester: me.name, value: a.residual, risk: "LOW" as const, summary: `Pensiun & pelepasan: ${eq.name} (${eq.code}) — metode ${a.method}`, matrix: ["Kepala Unit", "Pengelola Aset", "Direksi"], status: "PENDING" as const, date: now(), meta: { eqId: a.eqId, method: a.method, residual: a.residual, reason: a.reason } };
      return {
        ...s, approvals: [apr, ...s.approvals],
        timeline: [mkTimeline(a.eqId, "LIFECYCLE", `Pengajuan pensiun ${ref}`, `${a.reason} · metode ${a.method}, estimasi residu ${fmtIDR(a.residual)}. Menunggu approval (BR-007).`, me.name, undefined, "PENDING"), ...s.timeline],
        audit: [mkAudit(me.name, s.role, "ASSET.RETIRE_REQUEST", "asset_lifecycle", ref, a.reason, `${eq.code} lifecycle 6 → pending pensiun`), ...s.audit],
        notifs: [mkNotif("DISPOSAL", `Pengajuan pensiun ${ref} — ${eq.name}.`, a.eqId), ...s.notifs],
        toasts: [...s.toasts, okToast(`Pengajuan pensiun ${ref} masuk antrian persetujuan (BR-007)`, "info")],
      };
    }

    case "DISPOSE_CONFIRM": {
      const eq = s.equipment.find((e) => e.id === a.eqId)!;
      const code = "DSP-2608-" + String(3 + s.disposals.length).padStart(3, "0");
      const rec: DisposalRecord = { id: "DSP-" + uid(), code, eqId: a.eqId, date: now(), method: a.method, residual: eq.acqCost * 0.1, proceeds: a.proceeds, approver: me.name, note: a.note };
      const evs: TimelineEvent[] = [mkTimeline(a.eqId, "LIFECYCLE", `Aset dilepaskan — ${code}`, `Metode ${a.method}. ${a.note}`, me.name, undefined, "DISPOSED")];
      if (a.proceeds > 0) evs.unshift(mkTimeline(a.eqId, "FINANCE", `Hasil pelepasan ${fmtIDR(a.proceeds)}`, `Penerimaan ${a.method} diposting ke Finance/Accounting.`, me.name, a.proceeds));
      return {
        ...s, disposals: [rec, ...s.disposals],
        equipment: s.equipment.map((e) => (e.id === a.eqId ? { ...e, opStatus: "DISPOSED", lifecycle: 8 } : e)),
        timeline: [...evs, ...s.timeline],
        audit: [mkAudit(me.name, s.role, "ASSET.DISPOSE", "asset_disposal", code, a.note, `${eq.code} RETIRED → DISPOSED · ${fmtIDR(a.proceeds)}`), ...s.audit],
        notifs: [mkNotif("DISPOSAL", `${eq.name} resmi dilepaskan (${a.method}) — ${code}.`, a.eqId), ...s.notifs],
        toasts: [...s.toasts, okToast(`${eq.name} dilepaskan via ${a.method} · ${code}`)],
      };
    }

    case "MOBILE_DOWNLOAD":
      return {
        ...s, mobileTasks: s.mobileTasks.map((t) => (t.id === a.taskId ? { ...t, status: "DOWNLOADED" } : t)),
        toasts: [...s.toasts, okToast("Tugas diunduh untuk operasi offline", "info")],
      };

    case "MOBILE_QUEUE": {
      const t = s.mobileTasks.find((x) => x.id === a.taskId)!;
      return {
        ...s, mobileTasks: s.mobileTasks.map((x) => (x.id === a.taskId ? { ...x, status: "QUEUED" } : x)),
        toasts: [...s.toasts, okToast(`${t.code} masuk antrian offline (local-first)`, "warn")],
      };
    }

    case "MOBILE_SYNC": {
      const t = s.mobileTasks.find((x) => x.id === a.taskId)!;
      const eq = s.equipment.find((e) => e.id === t.eqId)!;
      const corr = "corr-" + uid().toLowerCase();
      let next: AppState = { ...s, mobileTasks: s.mobileTasks.map((x) => (x.id === a.taskId ? { ...x, status: "SYNCED" } : x)) };
      let event = "asset.inspected";
      let note = `${eq.name} — hasil lapangan tersinkron`;
      let auditAct = "SYNC.PUSH";
      let auditEnt = "sync";

      if (t.kind === "INSPECTION" && a.conflictResolved !== "SERVER") {
        const insp: Inspection = { id: "INS-" + uid(), code: "INS-2608-" + String(6 + s.inspections.length).padStart(3, "0"), eqId: t.eqId, date: now(), nextDue: new Date(Date.now() + 90 * 864e5).toISOString(), inspector: me.name, checklist: [{ item: "Grounding resistance", pass: true }, { item: "Leakage current", pass: true }, { item: "Kabel & plug", pass: true }, { item: "Label & QR", pass: true }], result: "PASS", note: "Dikerjakan offline via PWA — sinkron" };
        next = { ...next, inspections: [insp, ...next.inspections], timeline: [mkTimeline(t.eqId, "INSPECTION", `Inspeksi lapangan ${insp.code} PASS`, "Hasil input offline tersinkron ke server.", me.name), ...next.timeline] };
        event = "asset.inspected"; auditAct = "ASSET.INSPECT"; auditEnt = "inspection";
      } else if (t.kind === "PM" && t.woId) {
        next = { ...next, workOrders: next.workOrders.map((w) => (w.id === t.woId ? { ...w, status: "IN_PROGRESS" } : w)), equipment: next.equipment.map((e) => (e.id === t.eqId ? { ...e, opStatus: "MAINTENANCE" } : e)), timeline: [mkTimeline(t.eqId, "MAINTENANCE", "WO dimulai dari lapangan", "Eksekusi PM via mobile PWA.", me.name), ...next.timeline] };
        event = "asset.maintenance.started"; auditAct = "MAINTENANCE.START"; auditEnt = "work_order";
      } else if (t.kind === "CALIBRATION") {
        const cert = "KAL-2608-" + String(70 + s.calibrations.length);
        next = { ...next, calibrations: [{ id: "CAL-" + uid(), eqId: t.eqId, date: now(), result: "PASS", cert, techId: "T-01", nextDue: new Date(Date.now() + 365 * 864e5).toISOString(), cost: 900_000 }, ...next.calibrations], equipment: next.equipment.map((e) => (e.id === t.eqId ? { ...e, calStatus: "VALID", calDue: new Date(Date.now() + 365 * 864e5).toISOString() } : e)), timeline: [mkTimeline(t.eqId, "CALIBRATION", `Kalibrasi PASS — ${cert}`, "Sertifikat terbit via sinkron mobile.", "T-01", 900_000, "VALID"), ...next.timeline] };
        event = "asset.calibration.completed"; auditAct = "CALIBRATION.COMPLETE"; auditEnt = "calibration";
      }
      if (a.conflictResolved === "SERVER") note = "Konflik versi — dipakai versi server";

      return {
        ...next,
        syncLog: [{ id: "SY-" + uid(), ts: now(), taskCode: t.code, event, correlationId: corr, status: a.conflictResolved ? "CONFLICT" : "OK", note }, ...next.syncLog],
        audit: [mkAudit(me.name, s.role, auditAct, auditEnt, t.code, `Sinkron mobile (${event}) · ${corr}`), ...next.audit],
        notifs: [mkNotif("SYNC", `${t.code} tersinkron → ${event}.`, t.eqId), ...next.notifs],
        toasts: [...next.toasts, okToast(`${t.code} tersinkron · ${event}`)],
      };
    }

    case "CONNECTOR_TOGGLE": {
      const c = s.connectors.find((x) => x.id === a.id)!;
      const to: Connector["status"] = c.status === "OFFLINE" ? "CONNECTED" : "OFFLINE";
      return {
        ...s, connectors: s.connectors.map((x) => (x.id === a.id ? { ...x, status: to, lastSync: to === "CONNECTED" ? now() : x.lastSync } : x)),
        audit: [mkAudit(me.name, s.role, to === "CONNECTED" ? "INTEGRATION.CONNECT" : "INTEGRATION.DISCONNECT", "integration", c.name, undefined, `${c.status} → ${to}`), ...s.audit],
        toasts: [...s.toasts, okToast(`${c.name} ${to === "CONNECTED" ? "tersambung" : "diputus"}`, to === "CONNECTED" ? "ok" : "warn")],
      };
    }

    case "CONNECTOR_RETRY": {
      const c = s.connectors.find((x) => x.id === a.id)!;
      return {
        ...s, connectors: s.connectors.map((x) => (x.id === a.id ? { ...x, status: "CONNECTED", retries: 0, lastSync: now() } : x)),
        audit: [mkAudit(me.name, s.role, "INTEGRATION.RETRY", "integration", c.name, `${c.retries} retry diproses ulang`, `${c.status} → CONNECTED`), ...s.audit],
        toasts: [...s.toasts, okToast(`${c.retries} event retry ${c.name} dikirim ulang (idempoten)`)],
      };
    }

    /* ── Phase 6: configuration & notification governance ── */

    case "CFG_PATCH": {
      const summary = Object.keys(a.patch).join(", ");
      return {
        ...s,
        config: { ...s.config, ...a.patch },
        audit: [mkAudit(me.name, s.role, "CONFIG.UPDATE", "configuration", "system", undefined, summary), ...s.audit],
        toasts: [...s.toasts, okToast(`Konfigurasi disimpan (${summary})`)],
      };
    }

    case "CFG_MATRIX":
      return {
        ...s,
        config: { ...s.config, approvalMatrix: a.matrix },
        audit: [mkAudit(me.name, s.role, "CONFIG.MATRIX", "approval_matrix", "matrix", "Ubah rantai persetujuan", Object.entries(a.matrix).map(([k, v]) => `${k}: ${v.length} tahap`).join(" · ")), ...s.audit],
        toasts: [...s.toasts, okToast("Approval matrix diperbarui — berlaku untuk transaksi baru")],
      };

    case "NOTIF_READ":
      return { ...s, notifs: s.notifs.map((n) => (n.id === a.id ? { ...n, read: true } : n)) };

    case "NOTIF_ALL_READ":
      return { ...s, notifs: s.notifs.map((n) => ({ ...n, read: true })) };

    case "NOTIF_TEST": {
      const kindMsg: Record<string, string> = {
        LOW_STOCK: "Uji event: stok menyentuh reorder point.",
        CALIBRATION_DUE: "Uji event: kalibrasi akan jatuh tempo.",
        MAINTENANCE_OVERDUE: "Uji event: PM melewati jadwal.",
        COMPLAINT_SLA_BREACH: "Uji event: keluhan melewati SLA.",
        CONTRACT_EXPIRING: "Uji event: kontrak akan berakhir.",
        ASSET_IDLE: "Uji event: utilisasi aset rendah.",
        STOCK_VARIANCE: "Uji event: selisih stock opname.",
      };
      return {
        ...s,
        notifs: [mkNotif(a.kind, kindMsg[a.kind] ?? `Uji event: ${a.kind}.`, "TEST"), ...s.notifs],
        audit: [mkAudit(me.name, s.role, "NOTIFY.TEST", "notification", a.kind, `Kanal ${a.channel}`, undefined), ...s.audit],
        toasts: [...s.toasts, okToast(`Event ${a.kind} dikirim via ${a.channel}`, "info")],
      };
    }

    /* ── Form builder (maintenance template authoring) ── */
    case "FORM_SAVE": {
      const exists = s.formTemplates.some((t) => t.id === a.template.id);
      const templates = exists
        ? s.formTemplates.map((t) => (t.id === a.template.id ? a.template : t))
        : [...s.formTemplates, a.template];
      return {
        ...s,
        formTemplates: templates,
        audit: [mkAudit(me.name, s.role, exists ? "FORM.UPDATE" : "FORM.CREATE", "maintenance_template", a.template.id, `${a.template.fields.length} field`, a.template.name), ...s.audit],
        toasts: [...s.toasts, okToast(`Template "${a.template.name}" ${exists ? "diperbarui" : "dibuat"} (${a.template.fields.length} field)`)],
      };
    }

    case "FORM_DELETE": {
      const tpl = s.formTemplates.find((t) => t.id === a.id);
      const inUse = s.workOrders.some((w) => w.templateId === a.id);
      if (inUse) {
        return { ...s, toasts: [...s.toasts, okToast("Template dipakai work order aktif — tidak bisa dihapus", "err")] };
      }
      return {
        ...s,
        formTemplates: s.formTemplates.filter((t) => t.id !== a.id),
        audit: [mkAudit(me.name, s.role, "FORM.DELETE", "maintenance_template", a.id, undefined, tpl?.name), ...s.audit],
        toasts: [...s.toasts, okToast(`Template "${tpl?.name}" dihapus`, "warn")],
      };
    }

    default: return s;
  }
}

/* ── event bus (§11): setiap aksi transaksi memancarkan envelope imutabel ── */

function emitEvent(a: Act, s: AppState): EventEnvelope | null {
  const me = ROLE_USER[s.role];
  let et = ""; let agg: EventEnvelope["aggregate_type"] = "asset"; let id = ""; let pl = "";
  switch (a.t) {
    case "COMPLAINT": et = "asset.complaint.created"; agg = "complaint"; id = a.eqId; pl = `prioritas ${a.priority} · ${a.description.slice(0, 52)}…`; break;
    case "CALIBRATE": et = a.result === "FAIL" ? "asset.calibration.expired" : "asset.calibration.completed"; agg = "calibration"; id = a.eqId; pl = `${a.result} · sertifikat ${a.cert}`; break;
    case "WO_CREATE": et = "asset.maintenance.started"; agg = "work_order"; id = a.eqId; pl = `${a.type} · ${a.note.slice(0, 44)}…`; break;
    case "WO_SUBMIT": et = "asset.maintenance.completed"; agg = "work_order"; id = a.woId; pl = `${a.parts.length} spare part via ledger`; break;
    case "INSPECT": et = "asset.inspected"; agg = "asset"; id = a.eqId; pl = `hasil ${a.result} · ${a.checklist.filter((c) => c.pass).length}/${a.checklist.length} item lolos`; break;
    case "TRANSFER_REQ": et = "asset.transfer.requested"; agg = "asset"; id = a.eqId; pl = `→ ${a.toBuilding} · ${a.toRoom}`; break;
    case "ASSIGN": et = "asset.assigned"; agg = "asset"; id = a.eqId; pl = `custodian ${a.custodian} · ${a.unit}`; break;
    case "REGISTER_EQ": et = "asset.created"; agg = "asset"; id = a.serial; pl = `${a.name} (${a.category})`; break;
    case "REPAIR_PROGRESS": et = "asset.repair.started"; agg = "repair"; id = a.id; pl = "diagnosis dikonfirmasi"; break;
    case "REPAIR_CLOSE": et = "asset.repair.completed"; agg = "repair"; id = a.id; pl = a.result.slice(0, 52); break;
    case "RETIRE_REQUEST": et = "asset.retired"; agg = "asset"; id = a.eqId; pl = `rencana pelepasan ${a.method}`; break;
    case "DISPOSE_CONFIRM": et = "asset.disposed"; agg = "asset"; id = a.eqId; pl = `${a.method} · hasil ${a.proceeds.toLocaleString("id-ID")}`; break;
    case "ADJUST": et = "inventory.adjusted"; agg = "inventory"; id = a.sku; pl = `Δ ${a.delta > 0 ? "+" : ""}${a.delta} · ${a.reason.slice(0, 36)}`; break;
    case "RECEIVE": et = "inventory.received"; agg = "inventory"; id = a.sku; pl = `+${a.qty} · GRN ${a.poRef}`; break;
    case "DISTRIBUTE": et = "inventory.issued"; agg = "inventory"; id = a.sku; pl = `−${a.qty} → ${a.dest} (${a.strategy})`; break;
    case "OPNAME_FINALIZE": et = "inventory.stock_opname.completed"; agg = "inventory"; id = a.id; pl = "sesi diverifikasi & diposting"; break;
    case "APPROVE": et = a.ok ? "approval.granted" : "approval.rejected"; agg = "approval"; id = a.id; pl = a.note || (a.ok ? "disetujui tanpa catatan" : "ditolak"); break;
    case "PO_CREATE": et = "procurement.po.created"; agg = "procurement"; id = a.prId; pl = `supplier ${a.supplierId} · ETA ${a.eta}`; break;
    case "PR_DECIDE": et = a.ok ? "procurement.line.approved" : "procurement.line.rejected"; agg = "procurement"; id = a.lineId; pl = a.note.slice(0, 52) || (a.ok ? "lolos tahap" : "ditolak tahap"); break;
    case "PO_RECEIVE": et = "procurement.goods.received"; agg = "procurement"; id = a.poId; pl = "GRN diposting"; break;
    case "FORM_SAVE": et = "config.form.saved"; agg = "asset"; id = a.template.id; pl = `${a.template.name} · ${a.template.fields.length} field`; break;
    default: return null;
  }
  return { event_id: "evt_" + uid(), event_type: et, aggregate_type: agg, aggregate_id: id, timestamp: now(), actor: me.name, payload: pl, correlation_id: "corr-" + uid() };
}

function reducer(s: AppState, a: Act): AppState {
  const next = coreReducer(s, a);
  const env = emitEvent(a, s);
  if (!env) return next;
  return { ...next, events: [env, ...next.events].slice(0, 140) };
}

/* ── context ── */
interface Api {
  s: AppState;
  nav: (view: View, eqId?: string) => void; setRole: (r: Role) => void; search: (q: string) => void;
  toast: (msg: string, kind?: Toast["kind"]) => void; dropToast: (id: string) => void; markNotifsRead: () => void;
  logComplaint: (eqId: string, priority: Priority, description: string, reporter: string) => void;
  recordCalibration: (eqId: string, result: "PASS" | "FAIL" | "ADJUSTED", cert: string, techId: string, cost: number, nextDue: string) => void;
  requestTransfer: (eqId: string, toBuilding: string, toFloor: string, toRoom: string, reason: string) => void;
  assignEquipment: (eqId: string, custodian: string, pic: string, unit: string) => void;
  registerEquipment: (p: { name: string; category: string; brand: string; model: string; serial: string; cost: number; supplierId: string; building: string; floor: string; room: string; unit: string; custodian: string; pic: string; calRequired: boolean }) => void;
  printQr: (eqId: string) => void;
  createWorkOrder: (eqId: string, type: WorkOrder["type"], note: string, templateId: string) => void;
  startWorkOrder: (woId: string) => void;
  submitWorkOrder: (woId: string, note: string, parts: { id: string; qty: number }[], values: Record<string, string>) => void;
  addInspection: (eqId: string, inspector: string, checklist: { item: string; pass: boolean }[], result: "PASS" | "FAIL" | "CONDITIONAL", note: string, nextDue: string) => void;
  setComplaintStatus: (id: string, to: Complaint["status"], resolution?: string) => void;
  progressRepair: (id: string) => void; closeRepair: (id: string, result: string) => void;
  decide: (id: string, ok: boolean, note: string) => void;
  adjustStock: (sku: string, delta: number, reason: string) => void;
  receive: (sku: string, qty: number, supplierId: string, batch: string, expiry: string, poRef: string) => void;
  distribute: (sku: string, qty: number, dest: string, strategy: "FIFO" | "FEFO") => void;
  createOpname: () => void; countOpname: (id: string, sku: string, counted: number) => void; finalizeOpname: (id: string) => void;
  submitDemand: (p: { kind: "BHP" | "ASET"; item: string; category?: string; brand?: string; model?: string; qty: number; uom: string; estCost: number; unit: string; needBy: string }) => void;
  reviewDemand: (id: string) => void; consolidateDemand: (id: string) => void;
  createPo: (prId: string, supplierId: string, eta: string) => void; receivePo: (poId: string) => void;
  prDecide: (prId: string, lineId: string, ok: boolean, note: string) => void;
  prDecideAll: (prId: string, ok: boolean, note: string) => void;
  prRevise: (prId: string, lineId: string, qty: number) => void;
  addTechnician: (p: { name: string; specialty: string; cert: string; phone: string; vendor: boolean }) => void;
  addSupplier: (p: { name: string; service: string; contractUntil: string; contact: string }) => void;
  addAccessory: (p: { name: string; eqId: string; qty: number; condition: Equipment["condition"]; note: string }) => void;
  requestLoan: (eqId: string, toUnit: string, borrower: string, due: string, note: string) => void;
  advanceLoan: (id: string) => void; returnLoan: (id: string, condition: string) => void; closeLoan: (id: string) => void;
  createRental: (eqId: string, party: string, perDay: number, days: number) => void; endRental: (id: string) => void;
  postDepreciation: () => void; logUsage: (eqId: string, hours: number) => void;
  intelAudit: (action: string, entity: string, entityId: string, reason?: string, delta?: string) => void;
  autoPr: (lines: { sku: string; name: string; qty: number; estCost: number }[]) => void;
  applyRec: (sku: string, min: number, reorder: number, max: number) => void;
  retireRequest: (eqId: string, reason: string, method: DisposalRecord["method"], residual: number) => void;
  confirmDisposal: (eqId: string, method: DisposalRecord["method"], proceeds: number, note: string) => void;
  mobileDownload: (taskId: string) => void; mobileQueue: (taskId: string) => void;
  mobileSync: (taskId: string, conflictResolved?: "SERVER" | "FIELD") => void;
  toggleConnector: (id: string) => void; retryConnector: (id: string) => void;
  cfgPatch: (patch: Partial<SystemConfig>) => void;
  cfgMatrix: (matrix: ApprovalMatrix) => void;
  markNotif: (id: string) => void; markAllNotif: () => void;
  testNotify: (kind: NotifKind, channel: NotifChannel) => void;
  saveForm: (template: FormTemplate) => void;
  deleteForm: (id: string) => void;
}

const Ctx = createContext<Api | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [s, dispatch] = useReducer(reducer, INIT);
  const api = useMemo<Api>(() => ({
    s,
    nav: (view, eqId) => dispatch({ t: "NAV", view, eqId }),
    setRole: (role) => dispatch({ t: "ROLE", role }),
    search: (q) => dispatch({ t: "SEARCH", q }),
    toast: (msg, kind = "ok") => dispatch({ t: "TOAST", msg, kind }),
    dropToast: (id) => dispatch({ t: "TOAST_DROP", id }),
    markNotifsRead: () => dispatch({ t: "NOTIFS_READ" }),
    logComplaint: (eqId, priority, description, reporter) => dispatch({ t: "COMPLAINT", eqId, priority, description, reporter }),
    recordCalibration: (eqId, result, cert, techId, cost, nextDue) => dispatch({ t: "CALIBRATE", eqId, result, cert, techId, cost, nextDue }),
    requestTransfer: (eqId, toBuilding, toFloor, toRoom, reason) => dispatch({ t: "TRANSFER_REQ", eqId, toBuilding, toFloor, toRoom, reason }),
    assignEquipment: (eqId, custodian, pic, unit) => dispatch({ t: "ASSIGN", eqId, custodian, pic, unit }),
    registerEquipment: (p) => dispatch({ t: "REGISTER_EQ", ...p }),
    printQr: (eqId) => dispatch({ t: "PRINT_QR", eqId }),
    createWorkOrder: (eqId, type, note, templateId) => dispatch({ t: "WO_CREATE", eqId, type, note, templateId }),
    startWorkOrder: (woId) => dispatch({ t: "WO_START", woId }),
    submitWorkOrder: (woId, note, parts, values) => dispatch({ t: "WO_SUBMIT", woId, note, parts, values }),
    addInspection: (eqId, inspector, checklist, result, note, nextDue) => dispatch({ t: "INSPECT", eqId, inspector, checklist, result, note, nextDue }),
    setComplaintStatus: (id, to, resolution) => dispatch({ t: "CMP_STATUS", id, to, resolution }),
    progressRepair: (id) => dispatch({ t: "REPAIR_PROGRESS", id }),
    closeRepair: (id, result) => dispatch({ t: "REPAIR_CLOSE", id, result }),
    decide: (id, ok, note) => dispatch({ t: "APPROVE", id, ok, note }),
    adjustStock: (sku, delta, reason) => dispatch({ t: "ADJUST", sku, delta, reason }),
    receive: (sku, qty, supplierId, batch, expiry, poRef) => dispatch({ t: "RECEIVE", sku, qty, supplierId, batch, expiry, poRef }),
    distribute: (sku, qty, dest, strategy) => dispatch({ t: "DISTRIBUTE", sku, qty, dest, strategy }),
    createOpname: () => dispatch({ t: "OPNAME_CREATE" }),
    countOpname: (id, sku, counted) => dispatch({ t: "OPNAME_COUNT", id, sku, counted }),
    finalizeOpname: (id) => dispatch({ t: "OPNAME_FINALIZE", id }),
    submitDemand: (p) => dispatch({ t: "DEMAND_SUBMIT", ...p }),
    reviewDemand: (id) => dispatch({ t: "DEMAND_REVIEW", id }),
    consolidateDemand: (id) => dispatch({ t: "DEMAND_CONSOLIDATE", id }),
    createPo: (prId, supplierId, eta) => dispatch({ t: "PO_CREATE", prId, supplierId, eta }),
    receivePo: (poId) => dispatch({ t: "PO_RECEIVE", poId }),
    prDecide: (prId, lineId, ok, note) => dispatch({ t: "PR_DECIDE", prId, lineId, ok, note }),
    prDecideAll: (prId, ok, note) => dispatch({ t: "PR_DECIDE_ALL", prId, ok, note }),
    prRevise: (prId, lineId, qty) => dispatch({ t: "PR_REVISE", prId, lineId, qty }),
    addTechnician: (p) => dispatch({ t: "ADD_TECH", ...p }),
    addSupplier: (p) => dispatch({ t: "ADD_SUPPLIER", ...p }),
    addAccessory: (p) => dispatch({ t: "ADD_ACCESSORY", ...p }),
    requestLoan: (eqId, toUnit, borrower, due, note) => dispatch({ t: "LOAN_REQUEST", eqId, toUnit, borrower, due, note }),
    advanceLoan: (id) => dispatch({ t: "LOAN_ADVANCE", id }),
    returnLoan: (id, condition) => dispatch({ t: "LOAN_RETURN", id, condition }),
    closeLoan: (id) => dispatch({ t: "LOAN_CLOSE", id }),
    createRental: (eqId, party, perDay, days) => dispatch({ t: "RENTAL_CREATE", eqId, party, perDay, days }),
    endRental: (id) => dispatch({ t: "RENTAL_END", id }),
    postDepreciation: () => dispatch({ t: "DEPRECIATE_POST" }),
    logUsage: (eqId, hours) => dispatch({ t: "LOG_USAGE", eqId, hours }),
    intelAudit: (action, entity, entityId, reason, delta) => dispatch({ t: "INTEL_AUDIT", action, entity, entityId, reason, delta }),
    autoPr: (lines) => dispatch({ t: "AUTO_PR", lines }),
    applyRec: (sku, min, reorder, max) => dispatch({ t: "APPLY_REC", sku, min, reorder, max }),
    retireRequest: (eqId, reason, method, residual) => dispatch({ t: "RETIRE_REQUEST", eqId, reason, method, residual }),
    confirmDisposal: (eqId, method, proceeds, note) => dispatch({ t: "DISPOSE_CONFIRM", eqId, method, proceeds, note }),
    mobileDownload: (taskId) => dispatch({ t: "MOBILE_DOWNLOAD", taskId }),
    mobileQueue: (taskId) => dispatch({ t: "MOBILE_QUEUE", taskId }),
    mobileSync: (taskId, conflictResolved) => dispatch({ t: "MOBILE_SYNC", taskId, conflictResolved }),
    toggleConnector: (id) => dispatch({ t: "CONNECTOR_TOGGLE", id }),
    retryConnector: (id) => dispatch({ t: "CONNECTOR_RETRY", id }),
    cfgPatch: (patch) => dispatch({ t: "CFG_PATCH", patch }),
    cfgMatrix: (matrix) => dispatch({ t: "CFG_MATRIX", matrix }),
    markNotif: (id) => dispatch({ t: "NOTIF_READ", id }),
    markAllNotif: () => dispatch({ t: "NOTIF_ALL_READ" }),
    testNotify: (kind, channel) => dispatch({ t: "NOTIF_TEST", kind, channel }),
    saveForm: (template) => dispatch({ t: "FORM_SAVE", template }),
    deleteForm: (id) => dispatch({ t: "FORM_DELETE", id }),
  }), [s]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp outside provider");
  return v;
}

export const itemHealth = (i: InventoryItem): "ok" | "low" | "expiry" | "critical" => {
  if (i.expiry && daysUntil(i.expiry) < 30) return "expiry";
  if (i.stock <= i.min * 0.4) return "critical";
  if (i.stock <= i.reorder) return "low";
  return "ok";
};

/* utilization % dari series jam pemakaian mingguan (4 minggu terakhir / 168 jam tersedia) */
export const utilOf = (series: Record<string, number[]>, id: string, fallback: number): number => {
  const arr = series[id];
  if (!arr || arr.length === 0) return fallback;
  const last4 = arr.slice(-4);
  return Math.min(99, Math.round((last4.reduce((x, y) => x + y, 0) / last4.length / 168) * 100));
};
