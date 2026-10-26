// Ba loai kiem thu theo de BT2: luong dung (happy), gia tri bien (boundary), du lieu sai (bad-data).
import test from "node:test";
import assert from "node:assert/strict";
import { calculateDueDate, warrantyStatus } from "../src/domain/warranty.js";
import { createApplication } from "../src/app.js";
import { validateCreateCustomer, validatePhoneQuery } from "../src/validators/customer.validator.js";
import { validateCreateTicket, validateStatusChange } from "../src/validators/ticket.validator.js";

const RECEIVED_AT = new Date("2026-10-10T09:00:00.000Z");

function setup() {
  const app = createApplication({ clock: () => RECEIVED_AT });
  const customer = app.customerService.create({ phone: "0901234567", full_name: "Nguyen AB" });
  const device = app.customerRepository.saveDevice({
    customer_id: customer.customer_id, serial_no: "A001", purchase_date: "2026-01-15", warranty_months: 12
  });
  return { app, customer, device };
}

function validTicket({ customer, device }, extra = {}) {
  return validateCreateTicket({
    customer_id: customer.customer_id,
    device_id: device.device_id,
    issue_desc: "May bi vao nuoc khong len nguon",
    priority: "TRUNG_BINH",
    ...extra
  });
}

async function withServer(app, run) {
  await new Promise((resolve) => app.server.listen(0, resolve));
  const base = `http://127.0.0.1:${app.server.address().port}`;
  try {
    await run(base);
  } finally {
    await new Promise((resolve) => app.server.close(resolve));
  }
}

const json = (body) => ({ method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

// ---------- 1. Luong dung ----------
test("[happy] creating a ticket sets MOI, due date, category, warranty and first log", () => {
  const ctx = setup();
  const ticket = ctx.app.ticketService.create(validTicket(ctx));
  assert.equal(ticket.status, "MOI");
  assert.match(ticket.ticket_code, /^BH-\d{6}\/2026$/);
  assert.equal(ticket.due_date, "2026-10-14T09:00:00.000Z");
  assert.equal(ticket.category_id, 3);
  assert.equal(ticket.warranty_status, "CON_BAO_HANH");
  assert.equal(ticket.status_log.length, 1);
});

test("[happy] QT-04 skips Sunday when adding the commitment period", () => {
  const saturday = new Date("2026-10-10T09:00:00.000Z");
  assert.equal(calculateDueDate(saturday, "CAO").toISOString(), "2026-10-12T09:00:00.000Z");
  assert.equal(calculateDueDate(saturday, "TRUNG_BINH").toISOString(), "2026-10-14T09:00:00.000Z");
});

test("[happy] QT-13 cancelling keeps the ticket, sets HUY and appends a log row", () => {
  const ctx = setup();
  const ticket = ctx.app.ticketService.create(validTicket(ctx));
  const cancelled = ctx.app.ticketService.changeStatus(
    ticket.ticket_id,
    validateStatusChange({ status: "HUY", note: "Khach doi y", changed_by: 7 })
  );
  assert.equal(cancelled.status, "HUY");
  assert.deepEqual(
    [cancelled.status_log[1].from_status, cancelled.status_log[1].to_status, cancelled.status_log[1].note, cancelled.status_log[1].changed_by],
    ["MOI", "HUY", "Khach doi y", 7]
  );
  assert.equal(ctx.app.ticketService.list({ page: 1, size: 20 }).total, 1);
  const [entry] = ctx.app.ticketRepository.statusLog(ticket.ticket_id);
  entry.note = "sua";
  assert.equal(ctx.app.ticketRepository.statusLog(ticket.ticket_id)[0].note, null);
});

test("[happy] customer CRUD keeps QT-01 and refuses deleting a customer in use", () => {
  const ctx = setup();
  const other = ctx.app.customerService.create({ phone: "0912345678", full_name: "Khac" });
  assert.equal(ctx.app.customerService.update(other.customer_id, { full_name: "Khac 2" }).full_name, "Khac 2");
  assert.throws(() => ctx.app.customerService.update(other.customer_id, { phone: "0901234567" }), { code: "CUSTOMER_EXISTS" });
  assert.throws(() => ctx.app.customerService.delete(ctx.customer.customer_id), { code: "CUSTOMER_IN_USE" });
  assert.equal(ctx.app.customerService.delete(other.customer_id).deleted, true);
  assert.throws(() => ctx.app.customerService.get(other.customer_id), { code: "CUSTOMER_NOT_FOUND" });
});

// ---------- 2. Gia tri bien ----------
test("[boundary] warranty: last covered day is still valid, next day is expired (UTC+7)", () => {
  // Mua 2026-01-15, bao hanh 12 thang -> het han het ngay 2027-01-15 (gio Viet Nam).
  assert.equal(warrantyStatus("2026-01-15", 12, new Date("2027-01-15T16:59:00Z")), "CON_BAO_HANH");
  assert.equal(warrantyStatus("2026-01-15", 12, new Date("2027-01-15T17:00:00Z")), "HET_BAO_HANH");
});

test("[boundary] QT-04 treats Sunday in UTC+7, not in UTC", () => {
  // 2026-10-10T18:00Z = Chu Nhat 01:00 gio Viet Nam: khong duoc tinh vao gio lam viec.
  const sundayLocal = new Date("2026-10-10T18:00:00.000Z");
  assert.equal(calculateDueDate(sundayLocal, "CAO").toISOString(), "2026-10-12T18:00:00.000Z");
});

test("[boundary] phone has exactly ten digits (QT-01)", () => {
  assert.equal(validatePhoneQuery("0901234567"), "0901234567");
  assert.throws(() => validatePhoneQuery("090123456"), { code: "VALIDATION_FAILED" });
  assert.throws(() => validatePhoneQuery("09012345678"), { code: "VALIDATION_FAILED" });
});

// ---------- 3. Du lieu sai ----------
test("[bad-data] validator names every missing field instead of crashing", () => {
  assert.throws(() => validateCreateTicket({ customer_id: 1, device_id: 1, priority: "CAO" }), (e) =>
    e.code === "VALIDATION_FAILED" && Boolean(e.fields.issue_desc));
  assert.throws(() => validateCreateCustomer({ phone: "abc" }), (e) =>
    Boolean(e.fields.phone) && Boolean(e.fields.full_name));
});

test("[bad-data] external device requires hand-typed serial and source note (US3 AC2)", () => {
  const { app, customer } = setup();
  const base = { customer_id: customer.customer_id, issue_desc: "Loi man hinh", priority: "CAO", external_device: true };
  assert.throws(() => validateCreateTicket({ ...base, serial_no: "EXT-1" }), (e) => Boolean(e.fields.source_note));
  assert.throws(() => validateCreateTicket({ ...base, source_note: "Mua cho khac" }), (e) => Boolean(e.fields.serial_no));
  const ticket = app.ticketService.create(validateCreateTicket({ ...base, serial_no: "EXT-1", source_note: "Mua cho khac" }));
  assert.equal(ticket.warranty_status, "KHONG_XAC_DINH");
  assert.match(ticket.status_log[0].note, /Mua cho khac/);
  assert.equal(app.customerService.devices(customer.customer_id).length, 2);
});

test("[bad-data] device of another customer and unknown category are rejected", () => {
  const ctx = setup();
  const other = ctx.app.customerService.create({ phone: "0912345678", full_name: "Khac" });
  const foreign = ctx.app.customerRepository.saveDevice({ customer_id: other.customer_id, serial_no: "B002" });
  assert.throws(() => ctx.app.ticketService.create(validTicket(ctx, { device_id: foreign.device_id })), (e) =>
    Boolean(e.fields.device_id));
  assert.throws(() => ctx.app.ticketService.create(validTicket(ctx, { category_id: 99 })), (e) =>
    Boolean(e.fields.category_id));
});

test("[bad-data] HTTP: missing issue_desc gives 400 with the field name, no stack trace", async () => {
  const ctx = setup();
  await withServer(ctx.app, async (base) => {
    const bad = await fetch(`${base}/api/tickets`, json({ customer_id: ctx.customer.customer_id, device_id: ctx.device.device_id, priority: "CAO" }));
    assert.equal(bad.status, 400);
    const body = await bad.json();
    assert.equal(body.error.code, "VALIDATION_FAILED");
    assert.ok(body.error.fields.issue_desc);
    assert.doesNotMatch(JSON.stringify(body), /stack|\.js:\d+|\bat\s+\S+\s*\(/);

    const notJson = await fetch(`${base}/api/tickets`, { method: "POST", body: "{oops" });
    assert.equal(notJson.status, 400);
    assert.equal((await fetch(`${base}/api/tickets/999`)).status, 404);
    assert.equal((await fetch(`${base}/api/customers?phone=abc`)).status, 400);
    const duplicate = await fetch(`${base}/api/customers`, json({ phone: "0901234567", full_name: "Trung" }));
    assert.equal(duplicate.status, 409);
  });
});

test("services layer carries no HTTP traces (C2/S2)", async () => {
  const { readFile, readdir } = await import("node:fs/promises");
  const dir = new URL("../src/services/", import.meta.url);
  for (const name of await readdir(dir)) {
    const source = await readFile(new URL(name, dir), "utf8");
    assert.doesNotMatch(source, /\b(req|res)\b|status\(|\bSELECT\b|\b(?:400|404|409|422|500)\b/, name);
  }
});
