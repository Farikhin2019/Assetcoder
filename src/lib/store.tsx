import React, { createContext, useContext, useMemo, useReducer } from "react";
import {
  AuditEntry, Building, CalibrationRecord, Complaint, Delivery, Equipment, Floor, HandoverLine, HandoverRecord,
  Hospital, InventoryItem, LedgerEntry, Notif, PRLine, PermLevel, PurchaseOrder, PurchaseRequest, ROLE_PERMS,
  RoomInfo, Role, ROLE_USER, SLA_BY_PRIORITY, StageDecision, Supplier, Technician, TimelineEvent, Toast, UnitNode,
  UserAccount, View, VIEW_PERM, WorkOrder, d, fmtIDR, uid,
} from "./types";
import {
  AUDIT, BUILDINGS, CALIBRATIONS, COMPLAINTS, DELIVERIES, EQUIPMENT, FLOORS, HANDOVERS, HOSPITALS, ITEMS,
  LEDGER_INIT, NOTIFS, PURCHASE_ORDERS, PURCHASE_REQUESTS, ROOMS, SUPPLIERS, TECHNICIANS, TIMELINE, UNITS, USERS,
  WORK_ORDERS,
} from "./data";

export interface AppState {
  view: View; eqId: string | null;
  userId: string; userName: string; role: Role; userUnit: string | null; loggedIn: boolean;
  users: UserAccount[];
  hospitals: Hospital[]; buildings: Building[]; floors: Floor[]; rooms: RoomInfo[]; units: UnitNode[];
  equipment: Equipment[]; timeline: TimelineEvent[];
  items: InventoryItem[]; ledger: LedgerEntry[];
  purchaseRequests: PurchaseRequest[]; purchaseOrders: PurchaseOrder[]; deliveries: Delivery[];
  handovers: HandoverRecord[];
  workOrders: WorkOrder[]; calibrations: CalibrationRecord[]; complaints: Complaint[];
  suppliers: Supplier[]; technicians: Technician[];
  audit: AuditEntry[]; notifs: Notif[]; toasts: Toast[];
}

type LocKind = "hospital" | "building" | "floor" | "room" | "unit";

type Act =
  | { t: "NAV"; view: View; eqId?: string }
  | { t: "LOGIN_USER"; id: string } | { t: "LOGOUT" }
  | { t: "TOAST"; msg: string; kind?: Toast["kind"] } | { t: "TOAST_DROP"; id: string }
  | { t: "NOTIFS_READ" }
  | { t: "ADJUST"; sku: string; delta: number; reason: string }
  | { t: "PR_CREATE"; lines: { kind: "ITEM" | "ASSET"; sku?: string; name: string; category?: string; qty: number; unitCost: number }[]; needBy: string }
  | { t: "PR_DECIDE"; prId: string; lineId: string; ok: boolean; note: string }
  | { t: "PR_DECIDE_ALL"; prId: string; ok: boolean; note: string }
  | { t: "PR_REVISE"; prId: string; lineId: string; qty: number }
  | { t: "PO_CREATE"; prId: string; supplierId: string }
  | { t: "PO_RECEIVE"; poId: string; lines: HandoverLine[]; note: string }
  | { t: "DELIVER"; id: string }
  | { t: "UNIT_RECEIVE"; id: string; lines: HandoverLine[]; note: string }
  | { t: "WO_START"; id: string } | { t: "WO_SUBMIT"; id: string; note: string }
  | { t: "CALIBRATE"; eqId: string; result: "PASS" | "FAIL"; cert: string; cost: number; nextDue: string }
  | { t: "CMP_STATUS"; id: string; status: Complaint["status"] }
  | { t: "LOC_SAVE"; kind: LocKind; id?: string; data: Record<string, string> }
  | { t: "LOC_DELETE"; kind: LocKind; id: string };

const now = () => new Date().toISOString();
const mkAudit = (actor: string, role: string, action: string, entity: string, entityId: string, reason?: string, delta?: string): AuditEntry =>
  ({ id: "AUD-" + uid(), date: now(), actor, role, action, entity, entityId, reason: delta ? `${reason ?? ""}${reason ? " · " : ""}${delta}` : reason });
const mkNotif = (kind: string, msg: string, refId: string): Notif => ({ id: "N-" + uid(), kind, msg, refId, date: now(), read: false });
const mkTimeline = (eqId: string, type: string, title: string, detail: string, actor: string, cost?: number): TimelineEvent =>
  ({ id: uid(), eqId, type, date: now(), title, detail, actor, cost });
const mkLedger = (sku: string, type: LedgerEntry["type"], qty: number, balance: number, actor: string, ref: string): LedgerEntry =>
  ({ id: uid(), date: now(), sku, type, qty, balance, actor, ref });
const okToast = (msg: string, kind: Toast["kind"] = "ok"): Toast => ({ id: uid(), msg, kind });

/* Halaman awal per role setelah login */
const homeView = (r: Role): View =>
  r === "Direksi" || r === "COO" ? "command"
  : r === "Finance" ? "procurement"
  : r === "Kepala Unit" ? "procurement"
  : r === "Teknisi" || r === "Kepala Teknisi" ? "maintenance"
  : r === "Kepala Gudang" || r === "Petugas Gudang" || r === "Pengelola Inventory" ? "inventory"
  : r === "Auditor" ? "audit"
  : r === "IT Administrator" ? "config"
  : "dashboard";

export const canSeeView = (r: Role, v: View): boolean => {
  const idx = VIEW_PERM[v];
  if (idx === -1) return true;
  return (ROLE_PERMS[r]?.[idx] ?? "none") !== "none";
};

/* Aset yang lahir dari pengadaan (GRN) — acquisition tertelusur ke PO/supplier */
const CAL_CATS = ["Imaging", "Life Support", "Laboratorium", "Monitoring", "Sterilisasi"];
const mkEquipmentFromPo = (seq: number, name: string, category: string, price: number, supplierId: string, poCode: string, actor: string): Equipment => ({
  id: "EQ-" + uid(), code: `AST-RS-2026-${String(seq).padStart(6, "0")}`, name, category,
  brand: "—", model: "—", serial: "SN-" + uid(), acqDate: now(), acqCost: price, supplierId,
  building: "Gedung C", floor: "Lantai 1", room: "Gudang Aset", unit: "Belum Ditugaskan", custodian: actor,
  condition: "EXCELLENT", opStatus: "IN_SERVICE", risk: CAL_CATS.includes(category) ? "HIGH" : "MEDIUM",
  calStatus: CAL_CATS.includes(category) ? "VALID" : "NOT_REQUIRED",
  nextMaint: d(180), utilization: 0, poRef: poCode,
});

const INIT: AppState = {
  view: "login", eqId: null,
  userId: "", userName: "", role: "Pengelola Aset", userUnit: null, loggedIn: false,
  users: USERS,
  hospitals: HOSPITALS, buildings: BUILDINGS, floors: FLOORS, rooms: ROOMS, units: UNITS,
  equipment: EQUIPMENT, timeline: TIMELINE,
  items: ITEMS, ledger: LEDGER_INIT,
  purchaseRequests: PURCHASE_REQUESTS, purchaseOrders: PURCHASE_ORDERS, deliveries: DELIVERIES,
  handovers: HANDOVERS,
  workOrders: WORK_ORDERS, calibrations: CALIBRATIONS, complaints: COMPLAINTS,
  suppliers: SUPPLIERS, technicians: TECHNICIANS,
  audit: AUDIT, notifs: NOTIFS, toasts: [],
};

const lineState = (l: PRLine): "IN_APPROVAL" | "APPROVED" | "REJECTED" => {
  if (l.stages.some((x) => x.status === "REJECTED")) return "REJECTED";
  if (l.stages.every((x) => x.status === "APPROVED")) return "APPROVED";
  return "IN_APPROVAL";
};
const prState = (pr: PurchaseRequest): PurchaseRequest["status"] => {
  if (pr.status === "PO_CREATED") return "PO_CREATED";
  const states = pr.lines.map(lineState);
  if (states.some((x) => x === "REJECTED")) return "REJECTED";
  if (states.every((x) => x === "APPROVED")) return "APPROVED";
  return "IN_APPROVAL";
};
const prTotal = (pr: PurchaseRequest) => pr.lines.reduce((a, l) => a + l.qty * l.unitCost, 0);
const activeStage = (l: PRLine) => l.stages.findIndex((x) => x.status === "PENDING");
/* approver role untuk tiap tahap: 0=IT/Umum, 1=Keuangan, 2=COO */
const stageRole: Role[] = ["Umum", "Finance", "COO"];
const canDecideStage = (role: Role, stageIdx: number) =>
  stageIdx === 0 ? role === "Umum" || role === "IT Administrator" || role === "Pengelola Aset"
  : role === stageRole[stageIdx];

function coreReducer(s: AppState, a: Act): AppState {
  const me = { name: s.userName || "system", role: s.role };

  switch (a.t) {
    case "NAV": {
      if (a.view !== "login" && !canSeeView(s.role, a.view)) {
        return { ...s, toasts: [...s.toasts, okToast(`Role ${s.role} tidak punya akses ke modul itu`, "warn")] };
      }
      return { ...s, view: a.view, eqId: a.eqId ?? s.eqId };
    }

    case "LOGIN_USER": {
      const u = s.users.find((x) => x.id === a.id);
      if (!u || !u.active) return { ...s, toasts: [...s.toasts, okToast("User tidak ditemukan atau non-aktif", "err")] };
      return {
        ...s, userId: u.id, userName: u.name, role: u.role, userUnit: u.unit, loggedIn: true,
        view: homeView(u.role), eqId: null,
        audit: [mkAudit(u.name, u.role, "SESSION.LOGIN", "user", u.id, `role ${u.role}${u.unit ? " · unit " + u.unit : ""}`), ...s.audit],
        toasts: [...s.toasts, okToast(`Masuk sebagai ${u.name} — ${u.role}. Menu disesuaikan hak akses.`, "info")],
      };
    }

    case "LOGOUT":
      return { ...s, loggedIn: false, view: "login", userId: "", userName: "", userUnit: null, toasts: [...s.toasts, okToast("Sesi diakhiri — kembali ke layar masuk", "info")] };

    case "TOAST": return { ...s, toasts: [...s.toasts, okToast(a.msg, a.kind)] };
    case "TOAST_DROP": return { ...s, toasts: s.toasts.filter((t) => t.id !== a.id) };
    case "NOTIFS_READ": return { ...s, notifs: s.notifs.map((n) => ({ ...n, read: true })) };

    case "ADJUST": {
      const item = s.items.find((i) => i.sku === a.sku)!;
      const newBal = item.stock + a.delta;
      return {
        ...s,
        items: s.items.map((i) => (i.sku === a.sku ? { ...i, stock: newBal } : i)),
        ledger: [mkLedger(a.sku, "ADJUSTMENT", a.delta, newBal, me.name, "ADJ-" + uid()), ...s.ledger],
        audit: [mkAudit(me.name, s.role, "INVENTORY.ADJUST", "inventory", a.sku, a.reason, `${item.stock} → ${newBal}`), ...s.audit],
        toasts: [...s.toasts, okToast(`Stok ${item.name} disesuaikan (${a.delta > 0 ? "+" : ""}${a.delta})`)],
      };
    }

    case "PR_CREATE": {
      if (a.lines.length === 0) return s;
      const mk = (): StageDecision[] => [{ status: "PENDING" }, { status: "PENDING" }, { status: "PENDING" }];
      const lines: PRLine[] = a.lines.map((l) => ({ id: "L-" + uid(), kind: l.kind, sku: l.sku, name: l.name, category: l.category, qty: l.qty, unitCost: l.unitCost, stages: mk() }));
      const unit = s.userUnit || "—";
      const pr: PurchaseRequest = { id: "PR-" + uid(), code: "PR-2608-" + String(100 + s.purchaseRequests.length), date: now(), requester: me.name, unit, needBy: a.needBy, status: "IN_APPROVAL", lines };
      const total = lines.reduce((x, l) => x + l.qty * l.unitCost, 0);
      return {
        ...s,
        purchaseRequests: [pr, ...s.purchaseRequests],
        audit: [mkAudit(me.name, s.role, "PROCUREMENT.PR_CREATE", "purchase_request", pr.code, `Permintaan unit ${unit}`, `${lines.length} baris · ${fmtIDR(total)}`), ...s.audit],
        notifs: [mkNotif("APPROVAL_PENDING", `PR baru ${pr.code} dari ${unit} menunggu persetujuan tahap 1 (IT/Umum).`, pr.code), ...s.notifs],
        toasts: [...s.toasts, okToast(`PR ${pr.code} diajukan — menunggu persetujuan IT/Umum`)],
      };
    }

    case "PR_DECIDE": {
      const pr = s.purchaseRequests.find((p) => p.id === a.prId);
      if (!pr) return s;
      const line = pr.lines.find((l) => l.id === a.lineId);
      if (!line) return s;
      const idx = activeStage(line);
      if (idx < 0) return s;
      const stages = line.stages.map((x, i) => (i === idx ? { status: (a.ok ? "APPROVED" : "REJECTED") as StageDecision["status"], approver: me.name, note: a.note, date: now() } : x));
      const lines = pr.lines.map((l) => (l.id === a.lineId ? { ...line, stages } : l));
      const newPr = { ...pr, lines, status: prState({ ...pr, lines }) };
      const stageName = ["IT/Umum", "Keuangan", "COO"][idx];
      return {
        ...s, purchaseRequests: s.purchaseRequests.map((p) => (p.id === a.prId ? newPr : p)),
        audit: [mkAudit(me.name, s.role, a.ok ? "PROCUREMENT.APPROVE" : "PROCUREMENT.REJECT", "purchase_request", pr.code, a.note || undefined, `${line.name} · tahap ${stageName}`), ...s.audit],
        toasts: [...s.toasts, okToast(`${a.ok ? "Disetujui" : "Ditolak"}: ${line.name} — tahap ${stageName}`, a.ok ? "ok" : "warn")],
      };
    }

    case "PR_DECIDE_ALL": {
      const pr = s.purchaseRequests.find((p) => p.id === a.prId);
      if (!pr) return s;
      let next = s;
      for (const l of pr.lines) {
        const idx = activeStage(l);
        if (idx >= 0) next = coreReducer(next, { t: "PR_DECIDE", prId: a.prId, lineId: l.id, ok: a.ok, note: a.note });
      }
      return next;
    }

    case "PR_REVISE": {
      const pr = s.purchaseRequests.find((p) => p.id === a.prId);
      if (!pr) return s;
      const line = pr.lines.find((l) => l.id === a.lineId);
      if (!line) return s;
      const fresh: PRLine = { ...line, qty: a.qty, stages: [{ status: "PENDING" }, { status: "PENDING" }, { status: "PENDING" }] };
      const lines = pr.lines.map((l) => (l.id === a.lineId ? fresh : l));
      const newPr = { ...pr, lines, status: prState({ ...pr, lines }) };
      return {
        ...s, purchaseRequests: s.purchaseRequests.map((p) => (p.id === a.prId ? newPr : p)),
        audit: [mkAudit(me.name, s.role, "PROCUREMENT.REVISE", "purchase_request", pr.code, "Revisi sesuai saran approver", `${line.name} qty → ${a.qty}`), ...s.audit],
        toasts: [...s.toasts, okToast(`${line.name} direvisi (qty ${a.qty}) — kembali ke tahap 1`)],
      };
    }

    case "PO_CREATE": {
      const pr = s.purchaseRequests.find((p) => p.id === a.prId);
      if (!pr) return s;
      const approved = pr.lines.filter((l) => lineState(l) === "APPROVED");
      if (approved.length === 0) return { ...s, toasts: [...s.toasts, okToast("Belum ada baris yang disetujui 3 tahap", "warn")] };
      const items = approved.map((l) => ({ kind: l.kind, sku: l.sku, name: l.name, category: l.category, qty: l.qty, price: l.unitCost }));
      const total = items.reduce((x, i) => x + i.qty * i.price, 0);
      const po: PurchaseOrder = { id: "PO-" + uid(), code: "PO-2608-" + String(90 + s.purchaseOrders.length), date: now(), supplierId: a.supplierId, items, total, eta: d(7), status: "SENT", prRef: pr.code };
      return {
        ...s,
        purchaseOrders: [po, ...s.purchaseOrders],
        purchaseRequests: s.purchaseRequests.map((p) => (p.id === a.prId ? { ...p, status: "PO_CREATED" } : p)),
        audit: [mkAudit(me.name, s.role, "PROCUREMENT.PO", "purchase_order", po.code, undefined, `${approved.length} baris · ${fmtIDR(total)}`), ...s.audit],
        toasts: [...s.toasts, okToast(`PO ${po.code} dibuat (${fmtIDR(total)}) — menunggu penerimaan`)],
      };
    }

    case "PO_RECEIVE": {
      const po = s.purchaseOrders.find((p) => p.id === a.poId);
      if (!po) return s;
      let next: AppState = { ...s, purchaseOrders: s.purchaseOrders.map((p) => (p.id === a.poId ? { ...p, status: "RECEIVED" } : p)) };
      const entries: LedgerEntry[] = [];
      const newEquipment: Equipment[] = [];
      const newTimeline: TimelineEvent[] = [];
      const deliveryItems: { name: string; qty: number }[] = [];
      const supplierName = s.suppliers.find((x) => x.id === po.supplierId)?.name ?? "Vendor";
      const shortQty = a.lines.filter((l) => l.condition === "KURANG" || l.condition === "RUSAK").length;

      /* baris terverifikasi dipetakan berpasangan dengan item PO (urut sama) */
      po.items.forEach((it, i) => {
        const recvQty = a.lines[i]?.qty ?? it.qty;
        if (it.kind !== "ASSET") {
          const item = s.items.find((x) => x.sku === it.sku);
          if (!item || recvQty <= 0) return;
          const newBal = item.stock + recvQty;
          entries.push(mkLedger(it.sku!, "RECEIPT", recvQty, newBal, me.name, po.code));
          next = { ...next, items: next.items.map((x) => (x.sku === it.sku ? { ...x, stock: newBal } : x)) };
          deliveryItems.push({ name: it.name, qty: recvQty });
          return;
        }
        for (let u = 0; u < recvQty; u++) {
          const eq = mkEquipmentFromPo(s.equipment.length + newEquipment.length + 1, it.name, it.category ?? "Monitoring", it.price, po.supplierId, po.code, me.name);
          newEquipment.push(eq);
          newTimeline.push(mkTimeline(eq.id, "LIFECYCLE", `Registrasi aset dari pengadaan — ${eq.code}`, `${it.name} diterima via ${po.code} · ${fmtIDR(it.price)}.`, me.name));
        }
      });

      /* ── BAST vendor → gudang (pencatatan serah terima dari vendor) ── */
      const bastCode = "BAST-2608-" + String(40 + s.handovers.length).padStart(3, "0");
      const bast: HandoverRecord = {
        id: "HO-" + uid(), code: bastCode, kind: "VENDOR", date: now(), ref: po.code,
        from: supplierName, to: "Gudang — RS Harapan Medika",
        items: a.lines, handedBy: supplierName, receivedBy: me.name,
        note: a.note || (shortQty > 0 ? `${shortQty} baris diterima kurang/rusak — tindak lanjut ke vendor.` : "Diterima lengkap sesuai PO."),
        checksum: "sha256:" + uid() + uid(),
      };
      for (const eq of newEquipment) {
        newTimeline.push(mkTimeline(eq.id, "PROCUREMENT", `Serah terima vendor → Gudang (${bastCode})`, `Pihak pertama: ${supplierName} · pihak kedua: ${me.name} (Gudang).`, me.name));
      }

      const pr = s.purchaseRequests.find((p) => p.code === po.prRef);
      const destUnit = pr?.unit ?? "Gudang";
      let deliveries = next.deliveries;
      if (deliveryItems.length > 0) {
        deliveries = [{ id: "DL-" + uid(), code: "DIST-2608-" + String(30 + s.deliveries.length), date: now(), poRef: po.code, unit: destUnit, items: deliveryItems, status: "PENDING" }, ...deliveries];
      }

      return {
        ...next,
        ledger: [...entries, ...next.ledger],
        equipment: [...next.equipment, ...newEquipment],
        timeline: [...newTimeline, ...next.timeline],
        deliveries,
        handovers: [bast, ...next.handovers],
        notifs: [
          mkNotif("BAST", `BAST ${bastCode} diterbitkan — serah terima ${po.code} dari ${supplierName}.`, bastCode),
          ...(newEquipment.length > 0 ? [mkNotif("ASSET_REGISTERED", `${newEquipment.length} aset baru dari ${po.code} terdaftar.`, newEquipment[0].id)] : []),
          ...next.notifs,
        ],
        audit: [
          mkAudit(me.name, s.role, "PROCUREMENT.BAST", "handover", bastCode, `Serah terima vendor → gudang (${po.code})`, `${a.lines.length} baris · penerima ${me.name}`),
          ...newEquipment.map((eq) => mkAudit(me.name, s.role, "ASSET.REGISTER", "asset", eq.code, `Dari pengadaan ${po.code}`, eq.name)),
          mkAudit(me.name, s.role, "PROCUREMENT.GRN", "goods_receipt", po.code, undefined, `${po.items.length} line diterima`), ...next.audit,
        ],
        toasts: [...next.toasts, okToast(newEquipment.length > 0 ? `${po.code} diterima — BAST ${bastCode} & ${newEquipment.length} aset didaftarkan` : `${po.code} diterima — BAST ${bastCode}, GRN & ledger diposting`)],
      };
    }

    case "DELIVER": {
      const dl = s.deliveries.find((x) => x.id === a.id)!;
      return {
        ...s, deliveries: s.deliveries.map((x) => (x.id === a.id ? { ...x, status: "DELIVERED", courier: me.name } : x)),
        audit: [mkAudit(me.name, s.role, "LOGISTICS.DISPATCH", "delivery", dl.code, undefined, `→ unit ${dl.unit}`), ...s.audit],
        notifs: [mkNotif("DISTRIBUTION", `Pengiriman ${dl.code} menuju unit ${dl.unit} — mohon konfirmasi saat tiba.`, dl.unit), ...s.notifs],
        toasts: [...s.toasts, okToast(`${dl.code} dikirim ke unit ${dl.unit}`)],
      };
    }

    case "UNIT_RECEIVE": {
      const dl = s.deliveries.find((x) => x.id === a.id)!;
      /* ── BAST gudang → unit (pencatatan serah terima ke unit peminta) ── */
      const bastCode = "BAST-2608-" + String(40 + s.handovers.length).padStart(3, "0");
      const bast: HandoverRecord = {
        id: "HO-" + uid(), code: bastCode, kind: "UNIT", date: now(), ref: dl.code,
        from: "Gudang — RS Harapan Medika", to: `Unit ${dl.unit}`,
        items: a.lines, handedBy: dl.courier ?? "Gudang", receivedBy: me.name,
        note: a.note || "Diterima lengkap dalam kondisi baik.",
        checksum: "sha256:" + uid() + uid(),
      };
      return {
        ...s,
        deliveries: s.deliveries.map((x) => (x.id === a.id ? { ...x, status: "RECEIVED", receivedBy: me.name } : x)),
        handovers: [bast, ...s.handovers],
        audit: [
          mkAudit(me.name, s.role, "LOGISTICS.HANDOVER", "handover", bastCode, `Serah terima gudang → unit ${dl.unit}`, `${a.lines.length} item · penerima ${me.name}`),
          mkAudit(me.name, s.role, "LOGISTICS.UNIT_RECEIPT", "delivery", dl.code, "Serah terima unit peminta", `${dl.items.length} item diterima ${dl.unit}`), ...s.audit,
        ],
        notifs: [mkNotif("BAST", `BAST ${bastCode} — unit ${dl.unit} menerima ${dl.code}.`, bastCode), ...s.notifs],
        toasts: [...s.toasts, okToast(`Unit ${dl.unit} menerima ${dl.code} — BAST ${bastCode} diterbitkan, alur selesai ✓`)],
      };
    }

    case "WO_START": {
      const wo = s.workOrders.find((w) => w.id === a.id)!;
      const eq = s.equipment.find((e) => e.id === wo.eqId)!;
      return {
        ...s,
        workOrders: s.workOrders.map((w) => (w.id === a.id ? { ...w, status: "IN_PROGRESS" } : w)),
        equipment: s.equipment.map((e) => (e.id === wo.eqId ? { ...e, opStatus: "MAINTENANCE" } : e)),
        timeline: [mkTimeline(wo.eqId, "MAINTENANCE", `${wo.wo} dimulai (${wo.type})`, wo.note, me.name), ...s.timeline],
        audit: [mkAudit(me.name, s.role, "MAINTENANCE.START", "work_order", wo.wo, undefined, eq.name), ...s.audit],
        toasts: [...s.toasts, okToast(`${wo.wo} dimulai — ${eq.name} berstatus MAINTENANCE`)],
      };
    }

    case "WO_SUBMIT": {
      const wo = s.workOrders.find((w) => w.id === a.id)!;
      return {
        ...s,
        workOrders: s.workOrders.map((w) => (w.id === a.id ? { ...w, status: "CLOSED" } : w)),
        equipment: s.equipment.map((e) => (e.id === wo.eqId ? { ...e, opStatus: "IN_SERVICE", nextMaint: d(90) } : e)),
        timeline: [mkTimeline(wo.eqId, "MAINTENANCE", `${wo.wo} selesai`, a.note, me.name, wo.laborCost), ...s.timeline],
        audit: [mkAudit(me.name, s.role, "MAINTENANCE.COMPLETE", "work_order", wo.wo, a.note, fmtIDR(wo.laborCost)), ...s.audit],
        toasts: [...s.toasts, okToast(`${wo.wo} ditutup — aset kembali IN_SERVICE`)],
      };
    }

    case "CALIBRATE": {
      const eq = s.equipment.find((e) => e.id === a.eqId)!;
      const rec: CalibrationRecord = { id: "CAL-" + uid(), eqId: a.eqId, date: now(), result: a.result, cert: a.cert, nextDue: a.nextDue, cost: a.cost };
      return {
        ...s,
        calibrations: [rec, ...s.calibrations],
        equipment: s.equipment.map((e) => (e.id === a.eqId ? { ...e, calStatus: a.result === "PASS" ? "VALID" : "EXPIRED", opStatus: "IN_SERVICE" } : e)),
        timeline: [mkTimeline(a.eqId, "CALIBRATION", `Kalibrasi ${a.result} — ${a.cert}`, `Selanjutnya jatuh tempo sesuai jadwal.`, me.name, a.cost), ...s.timeline],
        audit: [mkAudit(me.name, s.role, "CALIBRATION.COMPLETE", "calibration", a.cert, undefined, `${eq.name} · ${a.result}`), ...s.audit],
        toasts: [...s.toasts, okToast(`Kalibrasi ${eq.name} tercatat (${a.result})`)],
      };
    }

    case "CMP_STATUS": {
      const c = s.complaints.find((x) => x.id === a.id)!;
      return {
        ...s,
        complaints: s.complaints.map((x) => (x.id === a.id ? { ...x, status: a.status } : x)),
        timeline: [mkTimeline(c.eqId, "COMPLAINT", `${c.code} → ${a.status}`, c.description, me.name), ...s.timeline],
        audit: [mkAudit(me.name, s.role, "COMPLAINT.STATUS", "complaint", c.code, undefined, `→ ${a.status}`), ...s.audit],
        toasts: [...s.toasts, okToast(`${c.code} diperbarui → ${a.status}`)],
      };
    }

    /* ── Master Organisasi & Lokasi: Organization → Hospital → Building → Floor → Room → Unit ── */
    case "LOC_SAVE": {
      const dt = a.data;
      const isNew = !a.id;
      const id = a.id ?? "LX-" + uid();
      let next = { ...s };
      let label = "";
      if (a.kind === "hospital") {
        const rec: Hospital = { id, code: dt.code ?? "", name: dt.name ?? "", kind: dt.kind ?? "", status: (dt.status as Hospital["status"]) ?? "AKTIF", address: dt.address ?? "", main: dt.main === "true" };
        next = { ...next, hospitals: isNew ? [...s.hospitals, rec] : s.hospitals.map((x) => (x.id === id ? rec : x)) };
        label = rec.name;
      } else if (a.kind === "building") {
        const old = s.buildings.find((x) => x.id === id);
        const rec: Building = { id, hospitalId: dt.hospitalId ?? "H-01", name: dt.name ?? "", label: dt.label ?? "", status: (dt.status as Building["status"]) ?? "ACTIVE", year: Number(dt.year) || new Date().getFullYear(), note: dt.note ?? "" };
        next = { ...next, buildings: isNew ? [...s.buildings, rec] : s.buildings.map((x) => (x.id === id ? rec : x)) };
        if (old && old.name !== rec.name) next = { ...next, equipment: next.equipment.map((e) => (e.building === old.name ? { ...e, building: rec.name } : e)) };
        label = rec.name;
      } else if (a.kind === "floor") {
        const rec: Floor = { id, buildingId: dt.buildingId ?? "", name: dt.name ?? "" };
        next = { ...next, floors: isNew ? [...s.floors, rec] : s.floors.map((x) => (x.id === id ? rec : x)) };
        label = rec.name;
      } else if (a.kind === "room") {
        const old = s.rooms.find((x) => x.id === id);
        const rec: RoomInfo = { id, buildingId: dt.buildingId ?? "", floorId: dt.floorId ?? "", name: dt.name ?? "", unit: dt.unit ?? "" };
        next = { ...next, rooms: isNew ? [...s.rooms, rec] : s.rooms.map((x) => (x.id === id ? rec : x)) };
        if (old && old.name !== rec.name) next = { ...next, equipment: next.equipment.map((e) => (e.room === old.name ? { ...e, room: rec.name } : e)) };
        label = rec.name;
      } else {
        const rec: UnitNode = { id, name: dt.name ?? "", head: dt.head ?? "" };
        next = { ...next, units: isNew ? [...s.units, rec] : s.units.map((x) => (x.id === id ? rec : x)) };
        label = rec.name;
      }
      return {
        ...next,
        audit: [mkAudit(me.name, s.role, isNew ? "MASTER.LOC_CREATE" : "MASTER.LOC_UPDATE", "organization_structure", id, `${a.kind}: ${label}`), ...s.audit],
        toasts: [...s.toasts, okToast(isNew ? `${label} ditambahkan` : `Perubahan ${label} disimpan`)],
      };
    }

    case "LOC_DELETE": {
      const block = (msg: string) => ({ ...s, toasts: [...s.toasts, okToast(msg, "warn")] });
      const activeEq = s.equipment.filter((e) => e.opStatus !== "RETIRED" && e.opStatus !== "DISPOSED");
      let next: AppState = s;
      let label = a.id;
      if (a.kind === "hospital") {
        const used = s.buildings.filter((b) => b.hospitalId === a.id).length;
        if (used > 0) return block(`Tidak bisa dihapus — masih ada ${used} gedung di fasilitas ini.`);
        label = s.hospitals.find((x) => x.id === a.id)?.name ?? a.id;
        next = { ...s, hospitals: s.hospitals.filter((x) => x.id !== a.id) };
      } else if (a.kind === "building") {
        const bld = s.buildings.find((x) => x.id === a.id);
        const fl = s.floors.filter((f) => f.buildingId === a.id).length;
        const rm = s.rooms.filter((r) => r.buildingId === a.id).length;
        const eq = bld ? activeEq.filter((e) => e.building === bld.name).length : 0;
        if (fl + rm + eq > 0) return block(`Tidak bisa dihapus — ${bld?.name ?? "gedung"} masih punya ${fl} lantai, ${rm} ruangan, ${eq} aset aktif.`);
        label = bld?.name ?? a.id;
        next = { ...s, buildings: s.buildings.filter((x) => x.id !== a.id) };
      } else if (a.kind === "floor") {
        const flr = s.floors.find((x) => x.id === a.id);
        const rm = s.rooms.filter((r) => r.floorId === a.id).length;
        if (rm > 0) return block(`Tidak bisa dihapus — lantai masih punya ${rm} ruangan.`);
        label = flr?.name ?? a.id;
        next = { ...s, floors: s.floors.filter((x) => x.id !== a.id) };
      } else if (a.kind === "room") {
        const rm = s.rooms.find((x) => x.id === a.id);
        const eq = rm ? activeEq.filter((e) => e.room === rm.name).length : 0;
        if (eq > 0) return block(`Tidak bisa dihapus — ${eq} aset aktif berlokasi di ${rm?.name ?? "ruangan ini"} (1 aset = 1 lokasi aktif).`);
        label = rm?.name ?? a.id;
        next = { ...s, rooms: s.rooms.filter((x) => x.id !== a.id) };
      } else {
        const un = s.units.find((x) => x.id === a.id);
        const eq = un ? activeEq.filter((e) => e.unit === un.name).length : 0;
        if (eq > 0) return block(`Tidak bisa dihapus — ${eq} aset aktif masih ditugaskan ke unit ${un?.name ?? "ini"}.`);
        label = un?.name ?? a.id;
        next = { ...s, units: s.units.filter((x) => x.id !== a.id) };
      }
      return {
        ...next,
        audit: [mkAudit(me.name, s.role, "MASTER.LOC_DELETE", "organization_structure", a.id, `${a.kind}: ${label} dihapus`), ...s.audit],
        toasts: [...s.toasts, okToast(`${label} dihapus dari struktur`, "warn")],
      };
    }

    default: return s;
  }
}

/* wrapper: auto-drop toast lama */
function reducer(s: AppState, a: Act): AppState {
  const next = coreReducer(s, a);
  return next.toasts.length > 4 ? { ...next, toasts: next.toasts.slice(-4) } : next;
}

interface Api {
  s: AppState;
  nav: (view: View, eqId?: string) => void;
  login: (id: string) => void; logout: () => void;
  toast: (msg: string, kind?: Toast["kind"]) => void; dropToast: (id: string) => void;
  markNotifsRead: () => void;
  adjust: (sku: string, delta: number, reason: string) => void;
  createPr: (lines: { kind: "ITEM" | "ASSET"; sku?: string; name: string; category?: string; qty: number; unitCost: number }[], needBy: string) => void;
  prDecide: (prId: string, lineId: string, ok: boolean, note: string) => void;
  prDecideAll: (prId: string, ok: boolean, note: string) => void;
  prRevise: (prId: string, lineId: string, qty: number) => void;
  createPo: (prId: string, supplierId: string) => void;
  receivePo: (poId: string, lines: HandoverLine[], note: string) => void;
  deliver: (id: string) => void; unitReceive: (id: string, lines: HandoverLine[], note: string) => void;
  startWo: (id: string) => void; submitWo: (id: string, note: string) => void;
  calibrate: (eqId: string, result: "PASS" | "FAIL", cert: string, cost: number, nextDue: string) => void;
  setCmpStatus: (id: string, status: Complaint["status"]) => void;
  locSave: (kind: LocKind, id: string | undefined, data: Record<string, string>) => void;
  locDelete: (kind: LocKind, id: string) => void;
}

const Ctx = createContext<Api | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [s, dispatch] = useReducer(reducer, INIT);
  const api = useMemo<Api>(() => ({
    s,
    nav: (view, eqId) => dispatch({ t: "NAV", view, eqId }),
    login: (id) => dispatch({ t: "LOGIN_USER", id }),
    logout: () => dispatch({ t: "LOGOUT" }),
    toast: (msg, kind) => dispatch({ t: "TOAST", msg, kind }),
    dropToast: (id) => dispatch({ t: "TOAST_DROP", id }),
    markNotifsRead: () => dispatch({ t: "NOTIFS_READ" }),
    adjust: (sku, delta, reason) => dispatch({ t: "ADJUST", sku, delta, reason }),
    createPr: (lines, needBy) => dispatch({ t: "PR_CREATE", lines, needBy }),
    prDecide: (prId, lineId, ok, note) => dispatch({ t: "PR_DECIDE", prId, lineId, ok, note }),
    prDecideAll: (prId, ok, note) => dispatch({ t: "PR_DECIDE_ALL", prId, ok, note }),
    prRevise: (prId, lineId, qty) => dispatch({ t: "PR_REVISE", prId, lineId, qty }),
    createPo: (prId, supplierId) => dispatch({ t: "PO_CREATE", prId, supplierId }),
    receivePo: (poId, lines, note) => dispatch({ t: "PO_RECEIVE", poId, lines, note }),
    deliver: (id) => dispatch({ t: "DELIVER", id }),
    unitReceive: (id, lines, note) => dispatch({ t: "UNIT_RECEIVE", id, lines, note }),
    startWo: (id) => dispatch({ t: "WO_START", id }),
    submitWo: (id, note) => dispatch({ t: "WO_SUBMIT", id, note }),
    calibrate: (eqId, result, cert, cost, nextDue) => dispatch({ t: "CALIBRATE", eqId, result, cert, cost, nextDue }),
    setCmpStatus: (id, status) => dispatch({ t: "CMP_STATUS", id, status }),
    locSave: (kind, id, data) => dispatch({ t: "LOC_SAVE", kind, id, data }),
    locDelete: (kind, id) => dispatch({ t: "LOC_DELETE", kind, id }),
  }), [s]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used within StoreProvider");
  return v;
}

export { canDecideStage, activeStage, lineState, prTotal, SLA_BY_PRIORITY };
