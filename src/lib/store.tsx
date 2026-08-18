import React, { createContext, useContext, useMemo, useReducer } from "react";
import {
  ADJ_APPROVAL_THRESHOLD, Accessory, AuditEntry, Complaint, Equipment, FormResult, Inspection, InventoryItem,
  LedgerEntry, Notif, NotifKind, OpnameSession, Priority, PurchaseOrder, Repair, Role, ROLE_USER, SLA_BY_PRIORITY,
  TimelineEvent, Toast, TransferRecord, TxType, View, WorkOrder, d, daysUntil, fmtIDR, uid,
} from "./types";
import {
  ACCESSORIES, APPROVALS, AUDIT, BUILDINGS, CALIBRATIONS, COMPLAINTS, DEMAND_PLANS, EQUIPMENT, FORM_TEMPLATES,
  INSPECTIONS, ISSUES, ITEMS, LEDGER_INIT, NOTIFS, OPNAMES, PURCHASE_ORDERS, PURCHASE_REQUESTS, RECEIPTS, REPAIRS,
  SPARE_PARTS, SUPPLIERS, TECHNICIANS, TIMELINE, TRANSFERS, WORK_ORDERS,
} from "./data";

export interface AppState {
  view: View; eqId: string | null; role: Role; searchQuery: string;
  equipment: Equipment[]; timeline: TimelineEvent[]; items: InventoryItem[]; ledger: LedgerEntry[];
  spareParts: typeof SPARE_PARTS; workOrders: WorkOrder[]; calibrations: typeof CALIBRATIONS;
  inspections: Inspection[]; formTemplates: typeof FORM_TEMPLATES; formResults: FormResult[];
  complaints: Complaint[]; repairs: Repair[]; approvals: typeof APPROVALS;
  demandPlans: typeof DEMAND_PLANS; purchaseRequests: typeof PURCHASE_REQUESTS; purchaseOrders: PurchaseOrder[];
  receipts: typeof RECEIPTS; issues: typeof ISSUES; opnames: OpnameSession[]; transfers: TransferRecord[];
  technicians: typeof TECHNICIANS; suppliers: typeof SUPPLIERS; accessories: Accessory[];
  audit: AuditEntry[]; notifs: Notif[]; toasts: Toast[];
}

const INIT: AppState = {
  view: "dashboard", eqId: null, role: "Pengelola Aset", searchQuery: "",
  equipment: EQUIPMENT, timeline: TIMELINE, items: ITEMS, ledger: LEDGER_INIT,
  spareParts: SPARE_PARTS, workOrders: WORK_ORDERS, calibrations: CALIBRATIONS,
  inspections: INSPECTIONS, formTemplates: FORM_TEMPLATES, formResults: [],
  complaints: COMPLAINTS, repairs: REPAIRS, approvals: APPROVALS,
  demandPlans: DEMAND_PLANS, purchaseRequests: PURCHASE_REQUESTS, purchaseOrders: PURCHASE_ORDERS,
  receipts: RECEIPTS, issues: ISSUES, opnames: OPNAMES, transfers: TRANSFERS,
  technicians: TECHNICIANS, suppliers: SUPPLIERS, accessories: ACCESSORIES,
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
  | { t: "DEMAND_SUBMIT"; item: string; qty: number; uom: string; estCost: number; unit: string; needBy: string }
  | { t: "DEMAND_REVIEW"; id: string }
  | { t: "DEMAND_CONSOLIDATE"; id: string }
  | { t: "PO_CREATE"; prId: string; supplierId: string; eta: string }
  | { t: "PO_RECEIVE"; poId: string }
  | { t: "ADD_TECH"; name: string; specialty: string; cert: string; phone: string; vendor: boolean }
  | { t: "ADD_SUPPLIER"; name: string; service: string; contractUntil: string; contact: string }
  | { t: "ADD_ACCESSORY"; name: string; eqId: string; qty: number; condition: Equipment["condition"]; note: string };

const now = () => new Date().toISOString();
const mkAudit = (actor: string, role: string, action: string, entity: string, entityId: string, reason?: string, delta?: string): AuditEntry => ({ id: "AUD-" + uid(), date: now(), actor, role, action, entity, entityId, reason, delta });
const mkNotif = (kind: NotifKind, msg: string, refId: string): Notif => ({ id: "N-" + uid(), kind, msg, refId, date: now(), read: false });
const mkTimeline = (eqId: string, type: TimelineEvent["type"], title: string, detail: string, actor: string, cost?: number, status?: string): TimelineEvent => ({ id: uid(), eqId, type, date: now(), title, detail, actor, cost, status });
const mkLedger = (sku: string, type: TxType, qty: number, balance: number, actor: string, ref: string, reason?: string): LedgerEntry => ({ id: uid(), date: now(), sku, type, qty, balance, actor, ref, reason });
const okToast = (msg: string, kind: Toast["kind"] = "ok"): Toast => ({ id: uid(), msg, kind });

function reducer(s: AppState, a: Act): AppState {
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
      const cmp: Complaint = { id: "CMP-" + uid(), code, eqId: a.eqId, date: now(), reporter: a.reporter, priority: a.priority, description: a.description, status: "OPEN", slaHours: SLA_BY_PRIORITY[a.priority] };
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
      if (!a.ok) return next;
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
      if (ap.type === "PURCHASE") {
        const prId = String(meta.prId);
        next = {
          ...next,
          purchaseRequests: next.purchaseRequests.map((p) => (p.id === prId ? { ...p, status: "APPROVED" } : p)),
          toasts: [...next.toasts, okToast(`${ap.ref} disetujui — lanjutkan buat PO di Procurement`, "info")],
        };
      }
      return next;
    }

    case "ADJUST": {
      const item = s.items.find((i) => i.sku === a.sku)!;
      const value = Math.abs(a.delta) * item.unitCost;
      if (value > ADJ_APPROVAL_THRESHOLD) {
        const ref = "ADJ-2608-" + String(8 + s.approvals.filter((x) => x.type === "ADJUSTMENT").length).padStart(3, "0");
        const apr = { id: "APR-" + uid(), type: "ADJUSTMENT" as const, ref, requester: me.name, value, risk: "MEDIUM" as const, summary: `Adjust ${item.name} ${a.delta > 0 ? "+" : ""}${a.delta} ${item.uom} (${fmtIDR(value)})`, matrix: ["Kepala Gudang", "Pengelola Inventory", "Manajemen"], status: "PENDING" as const, date: now(), meta: { sku: a.sku, delta: a.delta, reason: a.reason } };
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
        if (val > ADJ_APPROVAL_THRESHOLD) {
          const ref = "ADJ-2608-" + String(8 + approvals.filter((x) => x.type === "ADJUSTMENT").length).padStart(3, "0");
          approvals.unshift({ id: "APR-" + uid(), type: "ADJUSTMENT", ref, requester: me.name, value: val, risk: "MEDIUM", summary: `Stock opname: ${item.name} ${delta > 0 ? "+" : ""}${delta} ${item.uom} (${fmtIDR(val)} > threshold)`, matrix: ["Kepala Gudang", "Pengelola Inventory", "Manajemen"], status: "PENDING", date: now(), meta: { sku: df.sku, delta, reason: `Selisih stock opname ${so.code}` } });
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
        toasts: [...next.toasts, okToast(`${so.code} ditutup — ${diffs.length} selisih diproses (${diffs.filter((x) => { const it = s.items.find((i) => i.sku === x.sku); return it && Math.abs(x.counted! - x.system) * it.unitCost > ADJ_APPROVAL_THRESHOLD; }).length} via approval)`)],
      };
    }

    case "DEMAND_SUBMIT": {
      const code = "DP-2609-" + String(6 + s.demandPlans.length).padStart(3, "0");
      const dp = { id: "DP-" + uid(), code, item: a.item, qty: a.qty, uom: a.uom, estCost: a.estCost, unit: a.unit, needBy: a.needBy, status: "SUBMITTED" as const, by: me.name };
      return {
        ...s, demandPlans: [dp, ...s.demandPlans],
        audit: [mkAudit(me.name, s.role, "DEMAND.SUBMIT", "demand_plan", code, undefined, `${a.item} ${a.qty} ${a.uom}`), ...s.audit],
        toasts: [...s.toasts, okToast(`Demand plan ${code} diajukan`)],
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
      const item = s.items.find((i) => i.name === dp.item);
      const sku = item?.sku ?? "NEW-" + uid().slice(0, 4);
      const code = "PR-2608-" + String(12 + s.purchaseRequests.length).padStart(3, "0");
      const pr = { id: "PR-" + uid(), code, date: now(), items: [{ sku, name: dp.item, qty: dp.qty, estCost: dp.estCost / dp.qty }], total: dp.estCost, requester: me.name, status: "SUBMITTED" as const };
      const apr = { id: "APR-" + uid(), type: "PURCHASE" as const, ref: code, requester: me.name, value: dp.estCost, risk: dp.estCost > 20_000_000 ? "MEDIUM" as const : "LOW" as const, summary: `Purchase request: ${dp.item} ${dp.qty} ${dp.uom} (${fmtIDR(dp.estCost)})`, matrix: ["Kepala Gudang", "UPBJ", "Manajemen"], status: "PENDING" as const, date: now(), meta: { prId: pr.id, sku } };
      return {
        ...s,
        demandPlans: s.demandPlans.map((x) => (x.id === a.id ? { ...x, status: "CONSOLIDATED" } : x)),
        purchaseRequests: [pr, ...s.purchaseRequests], approvals: [apr, ...s.approvals],
        audit: [mkAudit(me.name, s.role, "PROCUREMENT.PR", "purchase_request", code, `Dari demand plan ${dp.code}`, fmtIDR(dp.estCost)), ...s.audit],
        notifs: [mkNotif("APPROVAL_PENDING", `PR ${code} menunggu persetujuan pengadaan.`, sku), ...s.notifs],
        toasts: [...s.toasts, okToast(`PR ${code} dibuat dari ${dp.code} — menunggu approval`)],
      };
    }

    case "PO_CREATE": {
      const pr = s.purchaseRequests.find((p) => p.id === a.prId)!;
      const code = "PO-2608-" + String(91 + s.purchaseOrders.length).padStart(3, "0");
      const po: PurchaseOrder = { id: "PO-" + uid(), code, date: now(), supplierId: a.supplierId, items: pr.items.map((i) => ({ sku: i.sku, name: i.name, qty: i.qty, price: i.estCost })), total: pr.total, eta: a.eta, status: "SENT", prRef: pr.code };
      return {
        ...s, purchaseOrders: [po, ...s.purchaseOrders],
        purchaseRequests: s.purchaseRequests.map((p) => (p.id === a.prId ? { ...p, status: "PO_CREATED" } : p)),
        audit: [mkAudit(me.name, s.role, "PROCUREMENT.PO", "purchase_order", code, undefined, `${pr.code} → ${code} · ${fmtIDR(pr.total)}`), ...s.audit],
        toasts: [...s.toasts, okToast(`PO ${code} dikirim ke supplier`)],
      };
    }

    case "PO_RECEIVE": {
      const po = s.purchaseOrders.find((p) => p.id === a.poId)!;
      let next: AppState = { ...s, purchaseOrders: s.purchaseOrders.map((p) => (p.id === a.poId ? { ...p, status: "RECEIVED" } : p)) };
      const entries: LedgerEntry[] = [];
      const receipts = [...next.receipts];
      for (const it of po.items) {
        const item = s.items.find((i) => i.sku === it.sku);
        if (!item) continue;
        const newBal = item.stock + it.qty;
        const ref = "GRN-2608-" + String(7 + receipts.length).padStart(3, "0");
        receipts.unshift({ id: ref, ref, date: now(), supplierId: po.supplierId, sku: it.sku, qty: it.qty, batch: "PO" + po.code.slice(-3), expiry: null, poRef: po.code, by: me.name });
        entries.push(mkLedger(it.sku, "RECEIPT", it.qty, newBal, me.name, ref, `Penerimaan ${po.code}`));
        next = { ...next, items: next.items.map((i) => (i.sku === it.sku ? { ...i, stock: newBal } : i)) };
      }
      return {
        ...next, receipts, ledger: [...entries, ...next.ledger],
        audit: [mkAudit(me.name, s.role, "PROCUREMENT.GRN", "goods_receipt", po.code, undefined, `${po.items.length} line item diterima`), ...next.audit],
        toasts: [...next.toasts, okToast(`${po.code} diterima — GRN & ledger diposting`)],
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

    default: return s;
  }
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
  submitDemand: (item: string, qty: number, uom: string, estCost: number, unit: string, needBy: string) => void;
  reviewDemand: (id: string) => void; consolidateDemand: (id: string) => void;
  createPo: (prId: string, supplierId: string, eta: string) => void; receivePo: (poId: string) => void;
  addTechnician: (p: { name: string; specialty: string; cert: string; phone: string; vendor: boolean }) => void;
  addSupplier: (p: { name: string; service: string; contractUntil: string; contact: string }) => void;
  addAccessory: (p: { name: string; eqId: string; qty: number; condition: Equipment["condition"]; note: string }) => void;
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
    submitDemand: (item, qty, uom, estCost, unit, needBy) => dispatch({ t: "DEMAND_SUBMIT", item, qty, uom, estCost, unit, needBy }),
    reviewDemand: (id) => dispatch({ t: "DEMAND_REVIEW", id }),
    consolidateDemand: (id) => dispatch({ t: "DEMAND_CONSOLIDATE", id }),
    createPo: (prId, supplierId, eta) => dispatch({ t: "PO_CREATE", prId, supplierId, eta }),
    receivePo: (poId) => dispatch({ t: "PO_RECEIVE", poId }),
    addTechnician: (p) => dispatch({ t: "ADD_TECH", ...p }),
    addSupplier: (p) => dispatch({ t: "ADD_SUPPLIER", ...p }),
    addAccessory: (p) => dispatch({ t: "ADD_ACCESSORY", ...p }),
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
