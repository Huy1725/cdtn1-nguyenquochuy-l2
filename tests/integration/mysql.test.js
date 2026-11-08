// Kiem thu TICH HOP voi MySQL that: can MySQL dang chay va DB_HOST/DB_PORT/DB_USER/DB_PASSWORD (.env).
// Tu dung CSDL thu rieng TEST_DB_NAME (mac dinh warranty_l2_test) tu trang thai trong, KHONG dung CSDL that.
// Chay: npm run test:integration
import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import mysql from "mysql2/promise";
import { createApplication } from "../../src/app.js";
import { createPool } from "../../src/repositories/mysql/pool.js";
import { MysqlCategoryRepository } from "../../src/repositories/mysql/category.repository.js";
import { MysqlCustomerRepository } from "../../src/repositories/mysql/customer.repository.js";
import { MysqlStaffRepository } from "../../src/repositories/mysql/staff.repository.js";
import { MysqlTicketRepository } from "../../src/repositories/mysql/ticket.repository.js";
import { validateCreateTicket } from "../../src/validators/ticket.validator.js";

const TEST_DB = process.env.TEST_DB_NAME ?? "warranty_l2_test";
if (!/^\w+$/.test(TEST_DB)) throw new Error("TEST_DB_NAME chi duoc gom chu, so, dau gach duoi");

const ROOT = new URL("../../", import.meta.url);
const TABLES = ["customer", "device", "issue_category", "staff", "ticket", "ticket_status_log"];

async function sqlFiles(folderName) {
  const folder = new URL(`${folderName}/`, ROOT);
  const names = (await readdir(folder)).filter((name) => name.endsWith(".sql")).sort();
  return Promise.all(names.map((name) => readFile(new URL(name, folder), "utf8")));
}

async function runMigrationsAndSeeds(connection) {
  for (const sql of [...(await sqlFiles("migrations")), ...(await sqlFiles("seeds"))]) {
    await connection.query(sql);
  }
}

async function countRows(connection) {
  const counts = {};
  for (const table of TABLES) {
    const [[row]] = await connection.query(`SELECT COUNT(*) AS n FROM ${table}`);
    counts[table] = Number(row.n);
  }
  return counts;
}

let admin;

before(async () => {
  admin = await mysql.createConnection({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    multipleStatements: true
  });
  await admin.query(`DROP DATABASE IF EXISTS \`${TEST_DB}\``);
  await admin.query(`CREATE DATABASE \`${TEST_DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await admin.query(`USE \`${TEST_DB}\``);
  await runMigrationsAndSeeds(admin);
});

after(async () => {
  await admin?.end();
});

test("TC-12 [reproducibility] chay lai migration + seed lan hai: khong loi, khong nhan doi du lieu", async () => {
  const first = await countRows(admin);
  assert.equal(first.customer, 101);
  assert.equal(first.device, 139);
  assert.equal(first.issue_category, 6);
  assert.equal(first.staff, 2);
  await runMigrationsAndSeeds(admin);
  const second = await countRows(admin);
  assert.deepEqual(second, first);
});

test("TC-10 [happy] US7/QT-13: thoi diem ghi nhat ky trang thai khop thoi diem nhan phieu (MySQL that)", async () => {
  const pool = createPool({ database: TEST_DB });
  try {
    const app = createApplication({
      customerRepository: new MysqlCustomerRepository(pool),
      ticketRepository: new MysqlTicketRepository(pool),
      categoryRepository: new MysqlCategoryRepository(pool),
      staffRepository: new MysqlStaffRepository(pool)
    });
    const customer = await app.customerRepository.findByPhone("0901234567");
    const [device] = await app.customerRepository.listDevices(customer.customer_id);
    const ticket = await app.ticketService.create(validateCreateTicket({
      customer_id: customer.customer_id,
      device_id: device.device_id,
      issue_desc: "Man hinh bi soc, cam ung loan",
      priority: "CAO"
    }), { staff_id: 1 });
    assert.equal(ticket.received_by, 1);
    assert.equal(ticket.status_log[0].changed_by_name, "Nguyen Van An");
    const receivedAt = new Date(ticket.received_at).getTime();
    const loggedAt = new Date(ticket.status_log[0].changed_at).getTime();
    const gapMinutes = Math.abs(loggedAt - receivedAt) / 60_000;
    assert.ok(
      gapMinutes < 1,
      `received_at=${ticket.received_at} nhung changed_at=${ticket.status_log[0].changed_at} (lech ${gapMinutes.toFixed(1)} phut)`
    );
  } finally {
    await pool.end();
  }
});

test("[regression] BUG-09: moi ket noi cua pool dung gio UTC, CURRENT_TIMESTAMP khop gio UTC", async () => {
  const pool = createPool({ database: TEST_DB, connectionLimit: 2 });
  try {
    const [[row]] = await pool.query(
      "SELECT @@session.time_zone AS tz, TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), CURRENT_TIMESTAMP) AS diff"
    );
    assert.equal(row.tz, "+00:00");
    assert.equal(Number(row.diff), 0);
  } finally {
    await pool.end();
  }
});
