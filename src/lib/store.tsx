import React, { createContext, useContext, useMemo, useReducer } from "react";
import {
  AssetDoc, AssetPhoto, AuditEntry, Building, CalibrationRecord, Complaint, Delivery, Equipment, Floor, HandoverLine,
  HandoverRecord, Hospital, InventoryItem, LedgerEntry, Notif, PRLine, PurchaseOrder, PurchaseRequest, ROLE_PERMS,
  Role, RoomInfo, StageDecision, Supplier, Technician, TimelineEvent, Toast, UnitNode, UserAccount, VendorReturn,
  View, VIEW_PERM, WorkOrder, d, fmtIDR, nextAssetCode, uid,
} from "./types";
import {
  AUDIT, BUILDINGS, CALIBRATIONS, COMPLAINTS, DELIVERIES, EQUIPMENT, FLOORS, HANDOVERS, HOSPITALS, ITEMS,
  LEDGER_INIT, NOTIFS, PURCHASE_ORDERS, PURCHASE_REQUESTS, ROOMS, SUPPLIERS, TECHNICIANS, TIMELINE, UNITS, USERS,
  VENDOR_RETURNS, WORK_ORDERS,
} from "./data";

export interface AppState {
  view: View; eqId: string | null;
  userId: string; userName: string; role: Role; userUnit: string | null; loggedIn: boolean;
  users: UserAccount[];
  hospitals: Hospital[]; buildings: Building[]; floors: Floor[]; rooms: RoomInfo[]; units: UnitNode[];
  equipment: Equipment[]; timeline: TimelineEvent[];
  items: InventoryItem[]; ledger: LedgerEntry[];
  purchaseRequests: PurchaseRequest[]; purchaseOrders: PurchaseOrder[]; deliveries: Delivery[];
  handovers: HandoverRecord[]; vendorReturns: VendorReturn[];
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
  | { t: "LOC_DELETE"; kind: LocKind; id: string }
  | { t: "EQUIP_ADD_PHOTOS"; eqId: string; photos: AssetPhoto[] }
  | { t: "EQUIP_ADD_DOCS"; eqId: string; docs: AssetDoc[] }
  | { t: "PRINT_LABEL"; eqId: string }
  | { t: "RETURN_SEND"; id: string }
  | { t: "RETURN_RESOLVE"; id: string; mode: "DIGANTI" | "REFUND"; note: string }
  | { t: "RETURN_CLOSE"; id: string };

const INIT: AppState = {
  view: "login", eqId: null,
  userId: "", userName: "", role: "Pengelola Aset", userUnit: null, loggedIn: false,
  users: USERS,
  hospitals: HOSPITALS, buildings: BUILDINGS, floors: FLOORS, rooms: ROOMS, units: UNITS,
  equipment: EQUIPMENT, timeline: TIMELINE,
  items: ITEMS, ledger: LEDGER_INIT,
  purchaseRequests: PURCHASE_REQUESTS, purchaseOrders: PURCHASE_ORDERS, deliveries: DELIVERIES,
  handovers: HANDOVERS, vendorReturns: VENDOR_RETURNS,
  workOrders: WORK_ORDERS, calibrations: CALIBRATIONS, complaints: COMPLAINTS,
  suppliers: SUPPLIERS, technicians: TECHNICIANS,
  audit: AUDIT, notifs: NOTIFS, toasts: [],
};

/* ── RBAC ── */
export const canSeeView = (r: Role, v: View): boolean => {
  const idx = VIEW_PERM[v];
  if (idx === -1) return true;
  return (ROLE_PERMS[r]?.[idx] ?? "none") !== "none";
};

/* ── helper ── */
const now = () => new Date().toISOString();
const mkAudit = (actor: string, role: string, action: string, entity: string, entityId: string, reason?: string, delta?: string): AuditEntry =>
  ({ id: "AUD-" + uid(), date: now(), actor, role, action, entity, entityId, reason: delta ? (reason ? `${reason} · ${delta}` : delta) : reason });
const mkNotif = (kind: string, msg: string, refId: string): Notif =>
  ({ id: "N-" + uid(), kind, msg, refId, date: now(), read: false });
const mkTimeline = (eqId: string, type: string, title: string, detail: string, actor: string, cost?: number): TimelineEvent =>
  ({ id: "TL-" + uid(), eqId, type, date: now(), title, detail, actor, cost });
const mkLedger = (sku: string, type: LedgerEntry["type"], qty: number, balance: number, actor: string, ref: string): LedgerEntry =>
  ({ id: "LED-" + uid(), date: now(), sku, type, qty, balance, actor, ref });
const okToast = (msg: string, kind: Toast["kind"] = "ok"): Toast => ({ id: "T-" + uid(), msg, kind });

const prState = (pr: PurchaseRequest): PurchaseRequest["status"] => {
  const states = pr.lines.map((l) => l.stages.map((s) => s.status));
  if (states.some((st) => st.includes("REJECTED"))) return "REJECTED";
  if (states.every((st) => st.every((s) => s === "APPROVED"))) return "APPROVED";
  return "IN_APPROVAL";
};
const lineState = (l: PRLine): "IN_APPROVAL" | "APPROVED" | "REJECTED" => {
  if (l.stages.some((s) => s.status === "REJECTED")) return "REJECTED";
  if (l.stages.every((s) => s.status === "APPROVED")) return "APPROVED";
  return "IN_APPROVAL";
};
const activeStage = (l: PRLine) => l.stages.findIndex((s) => s.status === "PENDING");
const prTotal = (pr: PurchaseRequest) => pr.lines.reduce((a, l) => a + l.qty * l.unitCost, 0);

/* Persetujuan PR 3 tahap: IT/Umum → Keuangan → COO */
const stageRole: Role[] = ["Umum", "Finance", "COO"];
const canDecideStage = (role: Role, stageIdx: number) =>
  stageIdx === 0 ? role === "Umum" || role === "IT Administrator" || role === "Pengelola Aset"
  : role === stageRole[stageIdx];

function coreReducer(s: AppState, a: Act): AppState {
  const me = { name: s.userName || "sistem", role: s.role };

  switch (a.t) {
    case "NAV": {
      if (s.loggedIn && !canSeeView(s.role, a.view)) {
        return { ...s, toasts: [...s.toasts, okToast("Anda tidak punya akses ke modul ini.", "warn")] };
      }
      return { ...s, view: a.view, eqId: a.eqId ?? null };
    }

    case "LOGIN_USER": {
      const u = s.users.find((x) => x.id === a.id);
      if (!u || !u.active) return { ...s, toasts: [...s.toasts, okToast("User tidak ditemukan.", "err")] };
      const home: View = u.role === "COO" || u.role === "Direksi" ? "dashboard"
        : u.role === "Finance" ? "procurement"
        : u.role === "Kepala Gudang" || u.role === "Petugas Gudang" ? "inventory"
        : u.role === "Teknisi" || u.role === "Kepala Teknisi" ? "maintenance"
        : u.role === "Auditor" ? "audit"
        : u.role === "Kepala Unit" ? "procurement"
        : "dashboard";
      return {
        ...s, userId: u.id, userName: u.name, role: u.role, userUnit: u.unit, loggedIn: true, view: home,
        audit: [mkAudit(u.name, u.role, "SESSION.LOGIN", "user", u.id, `masuk sebagai ${u.role}${u.unit ? " · " + u.unit : ""}`), ...s.audit],
        toasts: [...s.toasts, okToast(`Selamat datang, ${u.name.split(" ")[0]} — ${u.role}`, "info")],
      };
    }

    case "LOGOUT":
      return { ...INIT, toasts: [...s.toasts, okToast("Anda telah keluar.", "info")] };

    case "TOAST":
      return { ...s, toasts: [...s.toasts, okToast(a.msg, a.kind ?? "ok")] };
    case "TOAST_DROP":
      return { ...s, toasts: s.toasts.filter((t) => t.id !== a.id) };
    case "NOTIFS_READ":
      return { ...s, notifs: s.notifs.map((n) => ({ ...n, read: true })) };

    case "ADJUST": {
      const item = s.items.find((i) => i.sku === a.sku)!;
      const newBal = item.stock + a.delta;
      const ledger = [mkLedger(a.sku, "ADJUSTMENT", a.delta, newBal, me.name, "ADJ-" + uid()), ...s.ledger];
      return {
        ...s, ledger, items: s.items.map((i) => (i.sku === a.sku ? { ...i, stock: newBal } : i)),
        audit: [mkAudit(me.name, s.role, "STOCK.ADJUST", "inventory", a.sku, a.reason, `${item.stock} → ${newBal}`), ...s.audit],
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
        ...s, purchaseRequests: [pr, ...s.purchaseRequests],
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
      if (idx < 0 || !canDecideStage(me.role, idx)) return s;
      const stages = line.stages.map((st, i) => (i === idx ? { status: (a.ok ? "APPROVED" : "REJECTED") as StageDecision["status"], approver: me.name, note: a.note, date: now() } : st));
      const upd: PRLine = { ...line, stages };
      const lines = pr.lines.map((l) => (l.id === a.lineId ? upd : l));
      const newPr = { ...pr, lines, status: prState({ ...pr, lines }) };
      return {
        ...s, purchaseRequests: s.purchaseRequests.map((p) => (p.id === a.prId ? newPr : p)),
        audit: [mkAudit(me.name, s.role, a.ok ? "PROCUREMENT.APPROVE" : "PROCUREMENT.REJECT", "purchase_request", `${pr.code}/${line.name}`, a.note || undefined, `Tahap ${idx + 1}: ${a.ok ? "DISETUJUI" : "DITOLAK"}`), ...s.audit],
        notifs: a.ok && idx === 2 ? [mkNotif("APPROVAL_PENDING", `PR ${pr.code} disetujui COO — siap dibuat PO.`, pr.code), ...s.notifs] : s.notifs,
        toasts: [...s.toasts, okToast(`${line.name} ${a.ok ? "disetujui" : "ditolak"} (tahap ${idx + 1})`, a.ok ? "ok" : "warn")],
      };
    }

    case "PR_DECIDE_ALL": {
      const pr = s.purchaseRequests.find((p) => p.id === a.prId);
      if (!pr) return s;
      let s2 = s;
      for (const l of pr.lines) {
        const idx = activeStage(l);
        if (idx >= 0 && canDecideStage(me.role, idx)) {
          s2 = coreReducer(s2, { t: "PR_DECIDE", prId: a.prId, lineId: l.id, ok: a.ok, note: a.note });
        }
      }
      return s2;
    }

    case "PR_REVISE": {
      const pr = s.purchaseRequests.find((p) => p.id === a.prId);
      if (!pr) return s;
      const line = pr.lines.find((l) => l.id === a.lineId);
      if (!line) return s;
      const upd: PRLine = { ...line, qty: a.qty, stages: [{ status: "PENDING" }, { status: "PENDING" }, { status: "PENDING" }] };
      const lines = pr.lines.map((l) => (l.id === a.lineId ? upd : l));
      const newPr = { ...pr, lines, status: prState({ ...pr, lines }) };
      return {
        ...s, purchaseRequests: s.purchaseRequests.map((p) => (p.id === a.prId ? newPr : p)),
        audit: [mkAudit(me.name, s.role, "PROCUREMENT.REVISE", "purchase_request", `${pr.code}/${line.name}`, "Revisi sesuai saran approver", `qty → ${a.qty}`), ...s.audit],
        toasts: [...s.toasts, okToast(`${line.name} direvisi (qty ${a.qty}) — kembali ke tahap 1`)],
      };
    }

    case "PO_CREATE": {
      const pr = s.purchaseRequests.find((p) => p.id === a.prId);
      if (!pr) return s;
      const approved = pr.lines.filter((l) => lineState(l) === "APPROVED");
      const items = approved.map((l) => ({ kind: l.kind, sku: l.sku, name: l.name, category: l.category, qty: l.qty, price: l.unitCost }));
      const total = items.reduce((x, i) => x + i.qty * i.price, 0);
      const po: PurchaseOrder = { id: "PO-" + uid(), code: "PO-2608-" + String(91 + s.purchaseOrders.length), date: now(), supplierId: a.supplierId, items, total, eta: d(7), status: "SENT", prRef: pr.code };
      return {
        ...s, purchaseOrders: [po, ...s.purchaseOrders],
        purchaseRequests: s.purchaseRequests.map((p) => (p.id === a.prId ? { ...p, status: "PO_CREATED" } : p)),
        audit: [mkAudit(me.name, s.role, "PROCUREMENT.PO_CREATE", "purchase_order", po.code, `dari ${pr.code}`, `${items.length} item · ${fmtIDR(total)}`), ...s.audit],
        notifs: [mkNotif("PO_CREATED", `PO ${po.code} dibuat dari ${pr.code} — menunggu penerimaan gudang.`, po.code), ...s.notifs],
        toasts: [...s.toasts, okToast(`PO ${po.code} dibuat (${fmtIDR(total)})`)],
      };
    }

    case "PO_RECEIVE": {
      const po = s.purchaseOrders.find((p) => p.id === a.poId)!;
      const supplier = s.suppliers.find((x) => x.id === po.supplierId);
      /* BAST vendor → gudang */
      const bast: HandoverRecord = {
        id: "HO-" + uid(), code: "BAST-2608-" + String(21 + s.handovers.length), kind: "VENDOR", date: now(), ref: po.code,
        from: supplier?.name ?? "Vendor", to: "Gudang — RS Harapan Medika", items: a.lines,
        receivedBy: me.name, handedBy: `Kurir ${supplier?.name ?? "vendor"}`, note: a.note, checksum: "sha256:" + uid() + uid(),
      };
      let next: AppState = { ...s, purchaseOrders: s.purchaseOrders.map((p) => (p.id === a.poId ? { ...p, status: "RECEIVED" } : p)), handovers: [bast, ...s.handovers] };
      const entries: LedgerEntry[] = [];
      const newEquipment: Equipment[] = [];
      const returnLines: VendorReturn["lines"] = [];

      po.items.forEach((it, i) => {
        const cond = a.lines[i]?.condition ?? "BAIK";
        const recvQty = a.lines[i]?.qty ?? it.qty;
        if (it.kind === "ITEM" && it.sku) {
          const item = next.items.find((x) => x.sku === it.sku);
          if (item) {
            const newBal = item.stock + recvQty;
            entries.push(mkLedger(it.sku, "RECEIPT", recvQty, newBal, me.name, po.code));
            next = { ...next, items: next.items.map((x) => (x.sku === it.sku ? { ...x, stock: newBal } : x)) };
          }
        } else if (it.kind === "ASSET") {
          for (let u = 0; u < recvQty; u++) {
            const code = nextAssetCode([...next.equipment.map((e) => e.code), ...newEquipment.map((e) => e.code)]);
            newEquipment.push({
              id: "EQ-" + uid(), code, name: it.name, category: it.category ?? "Monitoring", brand: "—", model: "—", serial: "SN-" + uid(),
              acqDate: now(), acqCost: it.price, supplierId: po.supplierId, building: "Gudang C", floor: "Lantai 1", room: "Gudang Aset", unit: "Gudang",
              custodian: "Rina Kusuma, S.T.", condition: "EXCELLENT", opStatus: "IN_SERVICE", risk: "MEDIUM",
              calStatus: "NOT_REQUIRED", nextMaint: d(180), utilization: 0, poRef: po.code, photos: [], docs: [],
            });
          }
        }
        if (cond === "KURANG" && it.qty - recvQty > 0)
          returnLines.push({ name: it.name, qty: it.qty - recvQty, reason: "KURANG", kind: it.kind, sku: it.sku, unitCost: it.price });
        else if (cond === "RUSAK" && recvQty > 0)
          returnLines.push({ name: it.name, qty: recvQty, reason: "RUSAK", kind: it.kind, sku: it.sku, unitCost: it.price });
      });

      /* pengiriman ke unit peminta (BHP) */
      const pr = s.purchaseRequests.find((p) => p.code === po.prRef);
      const destUnit = pr?.unit ?? "Gudang";
      let deliveries = next.deliveries;
      const deliveryItems = po.items.filter((it) => it.kind === "ITEM").map((it) => ({ name: it.name, qty: it.qty }));
      if (deliveryItems.length > 0) {
        deliveries = [{ id: "DL-" + uid(), code: "DIST-2608-" + String(30 + s.deliveries.length), date: now(), poRef: po.code, unit: destUnit, items: deliveryItems, status: "PENDING" }, ...deliveries];
      }

      /* retur otomatis untuk baris KURANG/RUSAK */
      let vendorReturns = next.vendorReturns;
      if (returnLines.length > 0) {
        vendorReturns = [{ id: "RT-" + uid(), code: "RET-2608-" + String(4 + s.vendorReturns.length).padStart(3, "0"), date: now(), poRef: po.code, supplierId: po.supplierId, lines: returnLines, status: "DIAJUKAN", note: a.note || "Selisih/rusak saat penerimaan." }, ...vendorReturns];
      }

      return {
        ...next,
        ledger: [...entries, ...next.ledger],
        equipment: [...next.equipment, ...newEquipment],
        deliveries, vendorReturns,
        audit: [
          mkAudit(me.name, s.role, "PROCUREMENT.BAST", "handover", bast.code, `Serah terima ${po.code} dari ${supplier?.name}`, `${a.lines.length} item`),
          ...(newEquipment.length > 0 ? [mkAudit(me.name, s.role, "ASSET.REGISTER", "asset", newEquipment[0].code, `dari ${po.code}`, `${newEquipment.length} aset baru`)] : []),
          ...s.audit,
        ],
        notifs: [
          mkNotif("BAST", `BAST ${bast.code} diterbitkan — serah terima ${po.code}.`, bast.code),
          ...(returnLines.length > 0 ? [mkNotif("VENDOR_RETURN", `${returnLines.length} baris kurang/rusak di ${po.code} — retur dibuat otomatis.`, po.code)] : []),
          ...next.notifs,
        ],
        toasts: [...s.toasts, okToast(`${po.code} diterima — BAST ${bast.code}${newEquipment.length > 0 ? ` & ${newEquipment.length} aset terdaftar` : ""}`)],
      };
    }

    case "DELIVER": {
      const dl = s.deliveries.find((x) => x.id === a.id)!;
      return {
        ...s, deliveries: s.deliveries.map((x) => (x.id === a.id ? { ...x, status: "DELIVERED", courier: me.name } : x)),
        audit: [mkAudit(me.name, s.role, "LOGISTICS.DISPATCH", "delivery", dl.code, undefined, `→ unit ${dl.unit}`), ...s.audit],
        notifs: [mkNotif("DISTRIBUTION", `Pengiriman ${dl.code} menuju unit ${dl.unit}.`, dl.code), ...s.notifs],
        toasts: [...s.toasts, okToast(`${dl.code} dikirim ke unit ${dl.unit}`)],
      };
    }

    case "UNIT_RECEIVE": {
      const dl = s.deliveries.find((x) => x.id === a.id)!;
      const bast: HandoverRecord = {
        id: "HO-" + uid(), code: "BAST-2608-" + String(40 + s.handovers.length), kind: "UNIT", date: now(), ref: dl.code,
        from: "Gudang — RS Harapan Medika", to: `Unit ${dl.unit}`, items: a.lines,
        receivedBy: me.name, handedBy: dl.courier ?? "Gudang", note: a.note, checksum: "sha256:" + uid() + uid(),
      };
      return {
        ...s, deliveries: s.deliveries.map((x) => (x.id === a.id ? { ...x, status: "RECEIVED", receivedBy: me.name } : x)),
        handovers: [bast, ...s.handovers],
        audit: [mkAudit(me.name, s.role, "LOGISTICS.UNIT_RECEIPT", "handover", bast.code, `Serah terima ke unit ${dl.unit}`, `${a.lines.length} item`), ...s.audit],
        notifs: [mkNotif("BAST", `BAST ${bast.code} — unit ${dl.unit} menerima ${dl.code}.`, bast.code), ...s.notifs],
        toasts: [...s.toasts, okToast(`Unit ${dl.unit} menerima ${dl.code} — BAST terbit, alur selesai ✓`)],
      };
    }

    case "RETURN_SEND": {
      const rt = s.vendorReturns.find((x) => x.id === a.id)!;
      const sup = s.suppliers.find((x) => x.id === rt.supplierId)?.name ?? "Vendor";
      return {
        ...s, vendorReturns: s.vendorReturns.map((x) => (x.id === a.id ? { ...x, status: "DIKIRIM", sentAt: now() } : x)),
        audit: [mkAudit(me.name, s.role, "PROCUREMENT.RETURN_SEND", "vendor_return", rt.code, `Dikirim balik ke ${sup}`, `${rt.lines.length} item`), ...s.audit],
        toasts: [...s.toasts, okToast(`Retur ${rt.code} dikirim ke ${sup}`)],
      };
    }

    case "RETURN_RESOLVE": {
      const rt = s.vendorReturns.find((x) => x.id === a.id)!;
      let next: AppState = { ...s, vendorReturns: s.vendorReturns.map((x) => (x.id === a.id ? { ...x, status: a.mode, resolvedAt: now(), resolution: a.note } : x)) };
      if (a.mode === "DIGANTI") {
        const entries: LedgerEntry[] = [];
        for (const ln of rt.lines) {
          if (ln.kind !== "ASSET" && ln.sku) {
            const item = next.items.find((i) => i.sku === ln.sku);
            if (item) {
              const newBal = item.stock + ln.qty;
              entries.push(mkLedger(ln.sku, "RECEIPT", ln.qty, newBal, me.name, rt.code));
              next = { ...next, items: next.items.map((i) => (i.sku === ln.sku ? { ...i, stock: newBal } : i)) };
            }
          }
        }
        next = { ...next, ledger: [...entries, ...next.ledger] };
      }
      const sup = s.suppliers.find((x) => x.id === rt.supplierId)?.name ?? "Vendor";
      const totalRefund = rt.lines.reduce((x, l) => x + l.qty * l.unitCost, 0);
      return {
        ...next,
        audit: [mkAudit(me.name, s.role, a.mode === "DIGANTI" ? "PROCUREMENT.RETURN_REPLACED" : "PROCUREMENT.RETURN_REFUND", "vendor_return", rt.code, a.note, a.mode === "DIGANTI" ? `${rt.lines.length} item pengganti diterima dari ${sup}` : `Refund ${fmtIDR(totalRefund)} dari ${sup}`), ...s.audit],
        toasts: [...s.toasts, okToast(a.mode === "DIGANTI" ? `Pengganti ${rt.code} diterima — stok diperbarui` : `Refund ${rt.code} dicatat ${fmtIDR(totalRefund)}`)],
      };
    }

    case "RETURN_CLOSE": {
      const rt = s.vendorReturns.find((x) => x.id === a.id)!;
      return {
        ...s, vendorReturns: s.vendorReturns.map((x) => (x.id === a.id ? { ...x, status: "DITUTUP" } : x)),
        audit: [mkAudit(me.name, s.role, "PROCUREMENT.RETURN_CLOSE", "vendor_return", rt.code, "Retur diselesaikan & ditutup"), ...s.audit],
        toasts: [...s.toasts, okToast(`Retur ${rt.code} ditutup`)],
      };
    }

    case "WO_START": {
      const wo = s.workOrders.find((w) => w.id === a.id)!;
      return {
        ...s, workOrders: s.workOrders.map((w) => (w.id === a.id ? { ...w, status: "IN_PROGRESS" } : w)),
        equipment: s.equipment.map((e) => (e.id === wo.eqId ? { ...e, opStatus: "MAINTENANCE" } : e)),
        timeline: [mkTimeline(wo.eqId, "MAINTENANCE", `${wo.wo} dimulai`, wo.note, me.name), ...s.timeline],
        audit: [mkAudit(me.name, s.role, "MAINTENANCE.START", "work_order", wo.wo), ...s.audit],
        toasts: [...s.toasts, okToast(`${wo.wo} dikerjakan`)],
      };
    }

    case "WO_SUBMIT": {
      const wo = s.workOrders.find((w) => w.id === a.id)!;
      return {
        ...s, workOrders: s.workOrders.map((w) => (w.id === a.id ? { ...w, status: "CLOSED" } : w)),
        equipment: s.equipment.map((e) => (e.id === wo.eqId ? { ...e, opStatus: "IN_SERVICE", nextMaint: d(90) } : e)),
        timeline: [mkTimeline(wo.eqId, "MAINTENANCE", `${wo.wo} selesai`, a.note, me.name, wo.laborCost), ...s.timeline],
        audit: [mkAudit(me.name, s.role, "MAINTENANCE.COMPLETE", "work_order", wo.wo, a.note), ...s.audit],
        toasts: [...s.toasts, okToast(`${wo.wo} selesai & diverifikasi`)],
      };
    }

    case "CALIBRATE": {
      const rec: CalibrationRecord = { id: "CAL-" + uid(), eqId: a.eqId, date: now(), result: a.result, cert: a.cert, nextDue: a.nextDue, cost: a.cost };
      const eq = s.equipment.find((e) => e.id === a.eqId)!;
      return {
        ...s, calibrations: [rec, ...s.calibrations],
        equipment: s.equipment.map((e) => (e.id === a.eqId ? { ...e, calStatus: a.result === "PASS" ? "VALID" : "EXPIRED", opStatus: "IN_SERVICE" } : e)),
        timeline: [mkTimeline(a.eqId, "CALIBRATION", `Kalibrasi ${a.result === "PASS" ? "LULUS" : "GAGAL"} — ${a.cert}`, `Berlaku s.d. ${a.nextDue}`, me.name, a.cost), ...s.timeline],
        audit: [mkAudit(me.name, s.role, "CALIBRATION.RECORD", "calibration", a.cert, undefined, `${eq.name}: ${a.result}`), ...s.audit],
        toasts: [...s.toasts, okToast(`Kalibrasi ${eq.name} tercatat (${a.result === "PASS" ? "LULUS" : "GAGAL"})`, a.result === "PASS" ? "ok" : "warn")],
      };
    }

    case "CMP_STATUS": {
      const cmp = s.complaints.find((c) => c.id === a.id)!;
      return {
        ...s, complaints: s.complaints.map((c) => (c.id === a.id ? { ...c, status: a.status } : c)),
        timeline: [mkTimeline(cmp.eqId, "COMPLAINT", `Keluhan ${cmp.code} → ${a.status}`, cmp.description, me.name), ...s.timeline],
        audit: [mkAudit(me.name, s.role, "COMPLAINT.STATUS", "complaint", cmp.code, undefined, `→ ${a.status}`), ...s.audit],
        toasts: [...s.toasts, okToast(`Keluhan ${cmp.code} diperbarui (${a.status})`)],
      };
    }

    case "LOC_SAVE": {
      let next = { ...s };
      if (a.kind === "hospital") {
        const id = a.id ?? "H-" + uid();
        const rec: Hospital = { id, code: a.data.code ?? "", name: a.data.name ?? "", kind: a.data.kind ?? "", status: (a.data.status as Hospital["status"]) ?? "AKTIF", address: a.data.address ?? "", main: a.data.main === "true" };
        next = { ...next, hospitals: a.id ? s.hospitals.map((x) => (x.id === id ? rec : x)) : [...s.hospitals, rec] };
      } else if (a.kind === "building") {
        const id = a.id ?? "B-" + uid();
        const rec: Building = { id, hospitalId: a.data.hospitalId ?? "H-01", name: a.data.name ?? "", label: a.data.label ?? "", status: (a.data.status as Building["status"]) ?? "ACTIVE", year: Number(a.data.year) || new Date().getFullYear(), note: a.data.note ?? "" };
        next = { ...next, buildings: a.id ? s.buildings.map((x) => (x.id === id ? rec : x)) : [...s.buildings, rec] };
      } else if (a.kind === "floor") {
        const id = a.id ?? "FL-" + uid();
        const rec: Floor = { id, buildingId: a.data.buildingId ?? "", name: a.data.name ?? "" };
        next = { ...next, floors: a.id ? s.floors.map((x) => (x.id === id ? rec : x)) : [...s.floors, rec] };
      } else if (a.kind === "room") {
        const id = a.id ?? "RM-" + uid();
        const rec: RoomInfo = { id, buildingId: a.data.buildingId ?? "", floorId: a.data.floorId ?? "", name: a.data.name ?? "", unit: a.data.unit ?? "" };
        next = { ...next, rooms: a.id ? s.rooms.map((x) => (x.id === id ? rec : x)) : [...s.rooms, rec] };
      } else {
        const id = a.id ?? "UN-" + uid();
        const rec: UnitNode = { id, name: a.data.name ?? "", head: a.data.head ?? "" };
        next = { ...next, units: a.id ? s.units.map((x) => (x.id === id ? rec : x)) : [...s.units, rec] };
      }
      return {
        ...next,
        audit: [mkAudit(me.name, s.role, a.id ? "LOCATION.UPDATE" : "LOCATION.CREATE", a.kind, a.id ?? "baru", `${a.data.name}`), ...s.audit],
        toasts: [...s.toasts, okToast(`${a.kind === "unit" ? "Unit" : a.kind === "room" ? "Ruangan" : a.kind === "floor" ? "Lantai" : a.kind === "building" ? "Gedung" : "Fasilitas"} ${a.data.name} disimpan`)],
      };
    }

    case "LOC_DELETE": {
      const block = (msg: string) => ({ ...s, toasts: [...s.toasts, okToast(msg, "warn")] });
      const activeEq = s.equipment.filter((e) => e.opStatus !== "RETIRED" && e.opStatus !== "DISPOSED");
      if (a.kind === "hospital") {
        if (s.buildings.some((b) => b.hospitalId === a.id)) return block("Tidak bisa dihapus — masih ada gedung di fasilitas ini.");
        return { ...s, hospitals: s.hospitals.filter((x) => x.id !== a.id), audit: [mkAudit(me.name, s.role, "LOCATION.DELETE", "hospital", a.id), ...s.audit], toasts: [...s.toasts, okToast("Fasilitas dihapus", "warn")] };
      }
      if (a.kind === "building") {
        const bld = s.buildings.find((x) => x.id === a.id);
        if (s.floors.some((f) => f.buildingId === a.id) || s.rooms.some((r) => r.buildingId === a.id) || (bld && activeEq.some((e) => e.building === bld.name)))
          return block("Tidak bisa dihapus — gedung masih punya lantai/ruangan/aset aktif.");
        return { ...s, buildings: s.buildings.filter((x) => x.id !== a.id), audit: [mkAudit(me.name, s.role, "LOCATION.DELETE", "building", a.id), ...s.audit], toasts: [...s.toasts, okToast("Gedung dihapus", "warn")] };
      }
      if (a.kind === "floor") {
        const flr = s.floors.find((x) => x.id === a.id);
        const bld = flr ? s.buildings.find((b) => b.id === flr.buildingId) : undefined;
        if (s.rooms.some((r) => r.floorId === a.id) || (flr && bld && activeEq.some((e) => e.building === bld.name && e.floor === flr.name)))
          return block("Tidak bisa dihapus — lantai masih punya ruangan/aset aktif (satu aset = satu lokasi aktif).");
        return { ...s, floors: s.floors.filter((x) => x.id !== a.id), audit: [mkAudit(me.name, s.role, "LOCATION.DELETE", "floor", a.id), ...s.audit], toasts: [...s.toasts, okToast("Lantai dihapus", "warn")] };
      }
      if (a.kind === "room") {
        const rm = s.rooms.find((x) => x.id === a.id);
        const bld = rm ? s.buildings.find((b) => b.id === rm.buildingId) : undefined;
        if (rm && bld && activeEq.some((e) => e.building === bld.name && e.room === rm.name))
          return block("Tidak bisa dihapus — masih ada aset aktif di ruangan ini (satu aset = satu lokasi aktif).");
        return { ...s, rooms: s.rooms.filter((x) => x.id !== a.id), audit: [mkAudit(me.name, s.role, "LOCATION.DELETE", "room", a.id), ...s.audit], toasts: [...s.toasts, okToast("Ruangan dihapus", "warn")] };
      }
      const un = s.units.find((x) => x.id === a.id);
      if (un && activeEq.some((e) => e.unit === un.name))
        return block("Tidak bisa dihapus — masih ada aset aktif di unit ini.");
      return { ...s, units: s.units.filter((x) => x.id !== a.id), audit: [mkAudit(me.name, s.role, "LOCATION.DELETE", "unit", a.id), ...s.audit], toasts: [...s.toasts, okToast("Unit dihapus", "warn")] };
    }

    case "EQUIP_ADD_PHOTOS": {
      const eq = s.equipment.find((e) => e.id === a.eqId)!;
      return {
        ...s, equipment: s.equipment.map((e) => (e.id === a.eqId ? { ...e, photos: [...a.photos, ...(e.photos ?? [])] } : e)),
        timeline: [mkTimeline(a.eqId, "DOCUMENT", `${a.photos.length} foto diunggah`, `Dokumentasi visual ${eq.name}.`, me.name), ...s.timeline],
        audit: [mkAudit(me.name, s.role, "ASSET.UPLOAD", "asset_attachment", eq.code, `Foto: ${a.photos.map((p) => p.name).join(", ")}`), ...s.audit],
        toasts: [...s.toasts, okToast(`${a.photos.length} foto tersimpan di ${eq.code}`)],
      };
    }

    case "EQUIP_ADD_DOCS": {
      const eq = s.equipment.find((e) => e.id === a.eqId)!;
      return {
        ...s, equipment: s.equipment.map((e) => (e.id === a.eqId ? { ...e, docs: [...a.docs, ...(e.docs ?? [])] } : e)),
        timeline: [mkTimeline(a.eqId, "DOCUMENT", `${a.docs.length} dokumen diunggah`, `${a.docs.map((d) => d.name).join(", ")}.`, me.name), ...s.timeline],
        audit: [mkAudit(me.name, s.role, "ASSET.UPLOAD", "asset_attachment", eq.code, `Dokumen: ${a.docs.map((d) => d.name).join(", ")}`), ...s.audit],
        toasts: [...s.toasts, okToast(`${a.docs.length} dokumen tersimpan di ${eq.code}`)],
      };
    }

    case "PRINT_LABEL": {
      const eq = s.equipment.find((e) => e.id === a.eqId)!;
      return {
        ...s, audit: [mkAudit(me.name, s.role, "ASSET.LABEL_PRINT", "asset", eq.code, "Cetak label aset + QR"), ...s.audit],
        toasts: [...s.toasts, okToast(`Label ${eq.code} dikirim ke printer`)],
      };
    }

    default:
      return s;
  }
}

/* ── API context ── */
export interface Api {
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
  addPhotos: (eqId: string, photos: AssetPhoto[]) => void;
  addDocs: (eqId: string, docs: AssetDoc[]) => void;
  printLabel: (eqId: string) => void;
  returnSend: (id: string) => void;
  returnResolve: (id: string, mode: "DIGANTI" | "REFUND", note: string) => void;
  returnClose: (id: string) => void;
}

const Ctx = createContext<Api | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [s, dispatch] = useReducer(coreReducer, INIT);
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
    addPhotos: (eqId, photos) => dispatch({ t: "EQUIP_ADD_PHOTOS", eqId, photos }),
    addDocs: (eqId, docs) => dispatch({ t: "EQUIP_ADD_DOCS", eqId, docs }),
    printLabel: (eqId) => dispatch({ t: "PRINT_LABEL", eqId }),
    returnSend: (id) => dispatch({ t: "RETURN_SEND", id }),
    returnResolve: (id, mode, note) => dispatch({ t: "RETURN_RESOLVE", id, mode, note }),
    returnClose: (id) => dispatch({ t: "RETURN_CLOSE", id }),
  }), [s]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useApp(): Api {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp harus dipakai di dalam StoreProvider");
  return ctx;
}
