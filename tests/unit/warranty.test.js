// Bo kiem thu KHONG can MySQL: repository bo nho + server HTTP that mo o cong ngau nhien.
// Ma TC-xx khop voi docs/test-report.md. Chay rieng mot TC: npm test -- --test-name-pattern="TC-04"
import test from "node:test";
import assert from "node:assert/strict";
import { calculateDueDate, warrantyStatus } from "../../src/domain/warranty.js";
import { createApplication } from "../../src/app.js";
import { TOKEN_TTL_SECONDS } from "../../src/services/auth-service.js";
import { validateCreateCustomer, validatePhoneQuery } from "../../src/validators/customer.validator.js";
import { validateCreateTicket, validateStatusChange } from "../../src/validators/ticket.validator.js";

const RECEIVED_AT = new Date("2026-10-10T09:00:00.000Z"); // thu Bay 16:00 gio Viet Nam

async function setup() {
  const app = createApplication({ clock: () => RECEIVED_AT });
  const customer = await app.customerService.create({ phone: "0901234567", full_name: "Nguyen AB" });
  const device = await app.customerRepository.saveDevice({
    customer_id: customer.customer_id, serial_no: "A001", purchase_date: "2026-01-15", warranty_months: 12
  });
  // actor = nhan vien nv01 (staff_id 1, tai khoan demo co san trong repository bo nho)
  return { app, customer, device, actor: { staff_id: 1 } };
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

async function api(base, method, path, { body, token, raw } = {}) {
  const headers = { "content-type": "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  const response = await fetch(`${base}${path}`, {
    method,
    headers,
    body: raw ?? (body === undefined ? undefined : JSON.stringify(body))
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null, text };
}

const DEMO_PASSWORDS = { nv01: "matkhau01", nv02: "matkhau02" };

async function login(base, username = "nv01") {
  const res = await api(base, "POST", "/api/auth/login", { body: { username, password: DEMO_PASSWORDS[username] } });
  assert.equal(res.status, 200, `dang nhap ${username} that bai: ${res.text}`);
  return res.body.token;
}

const NO_STACK_TRACE = /stack|\.js:\d+|\bat\s+\S+\s*\(/;

// ================= TEST CASE TRONG BAO CAO (docs/test-report.md) =================

test("TC-01 [happy] QT-04/US5/US6: tao phieu cho thiet bi con bao hanh qua API", async () => {
  const ctx = await setup();
  await withServer(ctx.app, async (base) => {
    const token = await login(base, "nv01");
    const res = await api(base, "POST", "/api/tickets", {
      token,
      body: {
        customer_id: ctx.customer.customer_id,
        device_id: ctx.device.device_id,
        issue_desc: "May bi vao nuoc khong len nguon",
        priority: "TRUNG_BINH"
      }
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.status, "MOI");
    assert.match(res.body.ticket_code, /^BH-\d{6}\/2026$/);
    assert.equal(res.body.due_date, "2026-10-14T09:00:00.000Z"); // +72h, bo qua Chu Nhat 11/10
    assert.equal(res.body.category_id, 3);
    assert.equal(res.body.warranty_status, "CON_BAO_HANH");
    assert.equal(res.body.status_log.length, 1);
    assert.equal(res.body.received_by, 1);
  });
});

test("TC-02 [happy] QT-01: so dien thoai da ton tai -> 409, khong tao them ho so", async () => {
  const ctx = await setup();
  await withServer(ctx.app, async (base) => {
    const token = await login(base, "nv01");
    const created = await api(base, "POST", "/api/customers", {
      token, body: { phone: "0912345678", full_name: "Tran Moi" }
    });
    assert.equal(created.status, 201);
    const duplicate = await api(base, "POST", "/api/customers", {
      token, body: { phone: "0901234567", full_name: "Trung Lap" }
    });
    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.body.error.code, "CUSTOMER_EXISTS");
    assert.ok(duplicate.body.error.fields.phone);
    const lookup = await api(base, "GET", "/api/customers?phone=0901234567", { token });
    assert.equal(lookup.body.full_name, "Nguyen AB");
  });
});

test("TC-03 [happy] QT-13: huy phieu giu nguyen phieu, trang thai HUY, them mot dong nhat ky", async () => {
  const ctx = await setup();
  const ticket = await ctx.app.ticketService.create(validTicket(ctx), ctx.actor);
  await withServer(ctx.app, async (base) => {
    const token = await login(base, "nv01");
    const res = await api(base, "PATCH", `/api/tickets/${ticket.ticket_id}/status`, {
      token, body: { status: "HUY", note: "Khach doi y" }
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "HUY");
    assert.equal(res.body.status_log.length, 2);
    assert.deepEqual(
      [res.body.status_log[1].from_status, res.body.status_log[1].to_status, res.body.status_log[1].note],
      ["MOI", "HUY", "Khach doi y"]
    );
    const list = await api(base, "GET", "/api/tickets", { token });
    assert.equal(list.body.total, 1);
  });
});

test("TC-04 [boundary] US5: ngay cuoi cung con bao hanh (15/01/2027 23:59 gio VN) -> CON_BAO_HANH", () => {
  assert.equal(warrantyStatus("2026-01-15", 12, new Date("2027-01-15T16:59:00Z")), "CON_BAO_HANH");
});

test("TC-05 [boundary] US5: ngay dau tien het bao hanh (16/01/2027 00:00 gio VN) -> HET_BAO_HANH", () => {
  assert.equal(warrantyStatus("2026-01-15", 12, new Date("2027-01-15T17:00:00Z")), "HET_BAO_HANH");
});

test("TC-06 [bad-data] thieu issue_desc -> 400 neu ro truong, khong lo stack, khong tao phieu", async () => {
  const ctx = await setup();
  await withServer(ctx.app, async (base) => {
    const token = await login(base, "nv01");
    const bad = await api(base, "POST", "/api/tickets", {
      token, body: { customer_id: ctx.customer.customer_id, device_id: ctx.device.device_id, priority: "CAO" }
    });
    assert.equal(bad.status, 400);
    assert.equal(bad.body.error.code, "VALIDATION_FAILED");
    assert.ok(bad.body.error.fields.issue_desc);
    assert.doesNotMatch(bad.text, NO_STACK_TRACE);
    const list = await api(base, "GET", "/api/tickets", { token });
    assert.equal(list.body.total, 0);
  });
});

test("TC-07 [bad-data] phieu khong ton tai -> 404 TICKET_NOT_FOUND, khong phai 500", async () => {
  const ctx = await setup();
  await withServer(ctx.app, async (base) => {
    const res = await api(base, "GET", "/api/tickets/999", { token: await login(base, "nv01") });
    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, "TICKET_NOT_FOUND");
    assert.equal(res.body.error.message, "Khong tim thay phieu");
  });
});

test("TC-08 [security] A07: doi trang thai phieu khi khong co token / token gia -> 401, phieu khong doi", async () => {
  const ctx = await setup();
  const ticket = await ctx.app.ticketService.create(validTicket(ctx), ctx.actor);
  await withServer(ctx.app, async (base) => {
    const noToken = await api(base, "PATCH", `/api/tickets/${ticket.ticket_id}/status`, { body: { status: "HUY" } });
    assert.equal(noToken.status, 401);
    assert.equal(noToken.body.error.code, "UNAUTHORIZED");
    const fakeToken = await api(base, "PATCH", `/api/tickets/${ticket.ticket_id}/status`, {
      body: { status: "HUY" }, token: "abc.def.ghi"
    });
    assert.equal(fakeToken.status, 401);
  });
  assert.equal((await ctx.app.ticketService.get(ticket.ticket_id)).status, "MOI");
});


test("TC-09 [security] A01: nhan vien khac doi trang thai phieu khong phai cua minh -> 403", async () => {
  const ctx = await setup();
  await withServer(ctx.app, async (base) => {
    const owner = await api(base, "POST", "/api/auth/login", { body: { username: "nv01", password: "matkhau01" } });
    assert.equal(owner.status, 200);
    const other = await api(base, "POST", "/api/auth/login", { body: { username: "nv02", password: "matkhau02" } });
    assert.equal(other.status, 200);
    const created = await api(base, "POST", "/api/tickets", { token: owner.body.token, body: validTicket(ctx) });
    assert.equal(created.status, 201);
    const forbidden = await api(base, "PATCH", `/api/tickets/${created.body.ticket_id}/status`, {
      token: other.body.token, body: { status: "HUY" }
    });
    assert.equal(forbidden.status, 403);
    assert.equal(forbidden.body.error.code, "FORBIDDEN");
    const allowed = await api(base, "PATCH", `/api/tickets/${created.body.ticket_id}/status`, {
      token: owner.body.token, body: { status: "DANG_XU_LY" }
    });
    assert.equal(allowed.status, 200);
    assert.equal(allowed.body.status_log.length, 2);
  });
});

test("TC-11 [happy] US6: mo ta viet HOA co chu D-gach (VA DAP) van phan dung nhom 3", async () => {
  const ctx = await setup();
  assert.equal(await ctx.app.classifyService.suggest("may bi va đập"), 3);
  assert.equal(await ctx.app.classifyService.suggest("MÁY BỊ VA ĐẬP MẠNH"), 3);
});

// ================= TEST HOI QUY (tu BT2, khong nam trong 12 TC cua bao cao) =================

test("[regression] QT-04 bo qua Chu Nhat khi cong thoi han cam ket", () => {
  const saturday = new Date("2026-10-10T09:00:00.000Z");
  assert.equal(calculateDueDate(saturday, "CAO").toISOString(), "2026-10-12T09:00:00.000Z");
  assert.equal(calculateDueDate(saturday, "TRUNG_BINH").toISOString(), "2026-10-14T09:00:00.000Z");
});

test("[regression] QT-04 xac dinh Chu Nhat theo UTC+7, khong theo UTC", () => {
  const sundayLocal = new Date("2026-10-10T18:00:00.000Z"); // Chu Nhat 01:00 gio Viet Nam
  assert.equal(calculateDueDate(sundayLocal, "CAO").toISOString(), "2026-10-12T18:00:00.000Z");
});

test("[regression] QT-01 so dien thoai dung 10 chu so", () => {
  assert.equal(validatePhoneQuery("0901234567"), "0901234567");
  assert.throws(() => validatePhoneQuery("090123456"), { code: "VALIDATION_FAILED" });
  assert.throws(() => validatePhoneQuery("09012345678"), { code: "VALIDATION_FAILED" });
});

test("[regression] QT-01 sua/xoa khach hang: khong trung SDT, khong xoa khach dang co du lieu", async () => {
  const ctx = await setup();
  const other = await ctx.app.customerService.create({ phone: "0912345678", full_name: "Khac" });
  assert.equal((await ctx.app.customerService.update(other.customer_id, { full_name: "Khac 2" })).full_name, "Khac 2");
  await assert.rejects(ctx.app.customerService.update(other.customer_id, { phone: "0901234567" }), { code: "CUSTOMER_EXISTS" });
  await assert.rejects(ctx.app.customerService.delete(ctx.customer.customer_id), { code: "CUSTOMER_IN_USE" });
  assert.equal((await ctx.app.customerService.delete(other.customer_id)).deleted, true);
  await assert.rejects(ctx.app.customerService.get(other.customer_id), { code: "CUSTOMER_NOT_FOUND" });
});

test("[regression] QT-13 nhat ky chi them, ban sao tra ve khong sua duoc ban goc", async () => {
  const ctx = await setup();
  const ticket = await ctx.app.ticketService.create(validTicket(ctx), ctx.actor);
  await ctx.app.ticketService.changeStatus(
    ticket.ticket_id, validateStatusChange({ status: "HUY", note: "Khach doi y" }), ctx.actor
  );
  const [entry] = await ctx.app.ticketRepository.statusLog(ticket.ticket_id);
  entry.note = "sua";
  assert.equal((await ctx.app.ticketRepository.statusLog(ticket.ticket_id))[0].note, null);
});

test("[regression] validator neu ten MOI truong thieu thay vi sap", () => {
  assert.throws(() => validateCreateTicket({ customer_id: 1, device_id: 1, priority: "CAO" }), (e) =>
    e.code === "VALIDATION_FAILED" && Boolean(e.fields.issue_desc));
  assert.throws(() => validateCreateCustomer({ phone: "abc" }), (e) =>
    Boolean(e.fields.phone) && Boolean(e.fields.full_name));
});

test("[regression] US3-AC2 thiet bi ngoai bat buoc nhap tay serial va nguon goc", async () => {
  const { app, customer, actor } = await setup();
  const base = { customer_id: customer.customer_id, issue_desc: "Loi man hinh", priority: "CAO", external_device: true };
  assert.throws(() => validateCreateTicket({ ...base, serial_no: "EXT-1" }), (e) => Boolean(e.fields.source_note));
  assert.throws(() => validateCreateTicket({ ...base, source_note: "Mua cho khac" }), (e) => Boolean(e.fields.serial_no));
  const ticket = await app.ticketService.create(
    validateCreateTicket({ ...base, serial_no: "EXT-1", source_note: "Mua cho khac" }), actor
  );
  assert.equal(ticket.warranty_status, "KHONG_XAC_DINH");
  assert.match(ticket.status_log[0].note, /Mua cho khac/);
  assert.equal((await app.customerService.devices(customer.customer_id)).length, 2);
});

test("[regression] thiet bi cua khach khac va nhom su co khong ton tai bi tu choi", async () => {
  const ctx = await setup();
  const other = await ctx.app.customerService.create({ phone: "0912345678", full_name: "Khac" });
  const foreign = await ctx.app.customerRepository.saveDevice({ customer_id: other.customer_id, serial_no: "B002" });
  await assert.rejects(ctx.app.ticketService.create(validTicket(ctx, { device_id: foreign.device_id }), ctx.actor), (e) =>
    Boolean(e.fields.device_id));
  await assert.rejects(ctx.app.ticketService.create(validTicket(ctx, { category_id: 99 }), ctx.actor), (e) =>
    Boolean(e.fields.category_id));
});

test("[regression] JSON hong va SDT sai dinh dang -> 400", async () => {
  const ctx = await setup();
  await withServer(ctx.app, async (base) => {
    const token = await login(base, "nv01");
    assert.equal((await api(base, "POST", "/api/tickets", { token, raw: "{oops" })).status, 400);
    assert.equal((await api(base, "GET", "/api/customers?phone=abc", { token })).status, 400);
  });
});

test("[regression] BUG-10 sai mat khau va sai ten dang nhap tra CUNG mot loi 401, khong lo stack", async () => {
  const ctx = await setup();
  await withServer(ctx.app, async (base) => {
    const wrongPassword = await api(base, "POST", "/api/auth/login", { body: { username: "nv01", password: "sai" } });
    const wrongUser = await api(base, "POST", "/api/auth/login", { body: { username: "khongco", password: "sai" } });
    for (const res of [wrongPassword, wrongUser]) {
      assert.equal(res.status, 401);
      assert.equal(res.body.error.code, "INVALID_CREDENTIALS");
      assert.doesNotMatch(res.text, NO_STACK_TRACE);
    }
    assert.equal(wrongPassword.body.error.message, wrongUser.body.error.message);
    const empty = await api(base, "POST", "/api/auth/login", { body: {} });
    assert.equal(empty.status, 400);
    assert.ok(empty.body.error.fields.username && empty.body.error.fields.password);
  });
});

test("[regression] BUG-10 token het han hoac bi sua noi dung -> 401; moi API nghiep vu deu can token", async () => {
  const ctx = await setup();
  await withServer(ctx.app, async (base) => {
    const token = await login(base, "nv01");
    const [header, payload, signature] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ sub: 2, iat: 0, exp: 4102444800 })).toString("base64url");
    assert.equal((await api(base, "GET", "/api/auth/me", { token: `${header}.${forged}.${signature}` })).status, 401);
    assert.equal((await api(base, "GET", "/api/auth/me", { token })).body.username, "nv01");
    for (const path of ["/api/tickets", "/api/tickets/1", "/api/customers?phone=0901234567", "/api/categories"]) {
      assert.equal((await api(base, "GET", path)).status, 401, path);
    }
  });
  // Cung khoa ky, chi khac dong ho: 1 giay truoc het han van dung duoc, 1 giay sau thi bi tu choi.
  const jwtSecret = "khoa-ky-dung-rieng-cho-test-0123456789";
  const at = (ms) => createApplication({ jwtSecret, clock: () => new Date(RECEIVED_AT.getTime() + ms) });
  const { token } = await at(0).authService.login({ username: "nv01", password: "matkhau01" });
  assert.equal((await at(TOKEN_TTL_SECONDS * 1000 - 1000).authService.authenticate(token)).username, "nv01");
  await assert.rejects(at(TOKEN_TTL_SECONDS * 1000 + 1000).authService.authenticate(token), { code: "UNAUTHORIZED" });
});

test("[regression] S3 mat khau chi luu dang bam scrypt, khong luu ban ro", async () => {
  const ctx = await setup();
  const staff = await ctx.app.staffRepository.findByUsername("nv01");
  assert.match(staff.password_hash, /^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
  assert.ok(!staff.password_hash.includes("matkhau01"));
  const { staff: publicInfo } = await ctx.app.authService.login({ username: "nv01", password: "matkhau01" });
  assert.equal(publicInfo.password_hash, undefined);
});

test("[regression] US7 lich su ghi dung nguoi thuc hien tu token, client khong gia mao duoc changed_by", async () => {
  const ctx = await setup();
  await withServer(ctx.app, async (base) => {
    const token = await login(base, "nv01");
    const created = await api(base, "POST", "/api/tickets", {
      token, body: { ...validTicket(ctx), changed_by: 2, received_by: 2 }
    });
    assert.equal(created.status, 201);
    assert.equal(created.body.received_by, 1);
    assert.equal(created.body.received_by_name, "Nguyen Van An");
    assert.deepEqual(
      [created.body.status_log[0].changed_by, created.body.status_log[0].changed_by_name],
      [1, "Nguyen Van An"]
    );
  });
});

test("[regression] tang services khong co dau vet HTTP hay SQL (C2/S2)", async () => {
  const { readFile, readdir } = await import("node:fs/promises");
  const dir = new URL("../../src/services/", import.meta.url);
  for (const name of await readdir(dir)) {
    const source = await readFile(new URL(name, dir), "utf8");
    assert.doesNotMatch(source, /\b(req|res)\b|status\(|\bSELECT\b|\b(?:400|401|403|404|409|422|500)\b/, name);
  }
});
