import test from "node:test";
import assert from "node:assert/strict";
import { calculateDueDate } from "../domain/warranty.js";
import { createApplication } from "../index.js";

test("QT-04 excludes Sunday when adding the commitment period", () => {
  const saturday = new Date("2026-10-10T09:00:00.000Z");
  assert.equal(calculateDueDate(saturday, "CAO").toISOString(), "2026-10-12T09:00:00.000Z");
  assert.equal(calculateDueDate(saturday, "TRUNG_BINH").toISOString(), "2026-10-14T09:00:00.000Z");
});

test("customer phone is unique and must contain ten digits", () => {
  const app = createApplication();
  assert.throws(() => app.customerService.create({ phone: "123", full_name: "A" }));
  app.customerService.create({ phone: "0901234567", full_name: "Nguyen AB" });
  assert.throws(() => app.customerService.create({ phone: "0901234567", full_name: "Other" }));
});

test("creating a ticket calculates due date and appends immutable status history", () => {
  const receivedAt = new Date("2026-10-10T09:00:00.000Z");
  const app = createApplication({ clock: () => receivedAt });
  const customer = app.customerService.create({ phone: "0901234567", full_name: "Nguyen AB" });
  const ticket = app.ticketService.create({
    customer_id: customer.id,
    serial: "A001",
    issue_desc: "May bi vao nuoc khong len nguon",
    priority: "TRUNG_BINH"
  });
  assert.equal(ticket.status, "MOI");
  assert.equal(ticket.due_date, "2026-10-14T09:00:00.000Z");
  const changed = app.ticketService.changeStatus(ticket.id, "DANG_XU_LY", "staff");
  assert.equal(changed.status_log.length, 2);
  assert.equal(app.ticketService.get(ticket.id).status_log.length, 2);
});
