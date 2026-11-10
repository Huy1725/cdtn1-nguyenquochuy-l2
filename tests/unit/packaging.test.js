// Test hoi quy cho phan DONG GOI (khong nam trong 12 TC cua bao cao): /health, phuc vu giao dien, kiem tra cau hinh.
import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApplication } from "../../src/app.js";
import { loadConfig } from "../../src/config.js";

async function withServer(app, run) {
  await new Promise((resolve) => app.server.listen(0, resolve));
  const port = app.server.address().port;
  try {
    await run(port);
  } finally {
    await new Promise((resolve) => app.server.close(resolve));
  }
}

// Goi HTTP THO: http.request gui nguyen duong dan, khong chuan hoa "../" nhu fetch.
function rawGet(port, path) {
  return new Promise((resolve, reject) => {
    http.get({ host: "127.0.0.1", port, path }, (response) => {
      let body = "";
      response.on("data", (chunk) => { body += chunk; });
      response.on("end", () => resolve({ status: response.statusCode, headers: response.headers, body }));
    }).on("error", reject);
  });
}

test("[regression] /health: CSDL song -> 200 {status:ok, db:up}, khong can dang nhap", async () => {
  const app = createApplication({ checkDb: async () => {} });
  await withServer(app, async (port) => {
    const res = await rawGet(port, "/health");
    assert.equal(res.status, 200);
    assert.deepEqual(JSON.parse(res.body), { status: "ok", db: "up" });
  });
});

test("[regression] /health: CSDL loi -> 503 degraded, khong lo thong tin ket noi", async () => {
  const app = createApplication({
    checkDb: async () => { throw new Error("connect ECONNREFUSED 172.18.0.2:3306 user=root password=hunter2"); }
  });
  await withServer(app, async (port) => {
    const res = await rawGet(port, "/health");
    assert.equal(res.status, 503);
    assert.deepEqual(JSON.parse(res.body), { status: "degraded", db: "down" });
    assert.doesNotMatch(res.body, /ECONNREFUSED|hunter2|172\.18|3306/);
  });
});

test("[regression] giao dien tinh: phuc vu index/asset, SPA fallback, chan path traversal", async () => {
  const root = await mkdtemp(join(tmpdir(), "warranty-static-"));
  const site = join(root, "dist");
  await mkdir(join(site, "assets"), { recursive: true });
  await writeFile(join(site, "index.html"), "<!doctype html><title>UI</title>");
  await writeFile(join(site, "assets", "app-abc123.js"), "console.log('ui')");
  await writeFile(join(root, "secret.txt"), "TOP-SECRET-OUTSIDE-ROOT");

  const app = createApplication({ staticDir: site });
  await withServer(app, async (port) => {
    const index = await rawGet(port, "/");
    assert.equal(index.status, 200);
    assert.match(index.headers["content-type"], /text\/html/);
    assert.match(index.body, /<title>UI<\/title>/);

    const fallback = await rawGet(port, "/tickets"); // duong dan trang cua React -> index.html
    assert.equal(fallback.status, 200);
    assert.match(fallback.body, /<title>UI<\/title>/);

    const asset = await rawGet(port, "/assets/app-abc123.js");
    assert.equal(asset.status, 200);
    assert.match(asset.headers["content-type"], /javascript/);
    assert.match(asset.headers["cache-control"], /immutable/);
    assert.equal(asset.headers["x-content-type-options"], "nosniff");

    assert.equal((await rawGet(port, "/assets/missing.js")).status, 404); // thieu tep tinh khong tra index.html

    for (const attack of ["/../secret.txt", "/%2e%2e/secret.txt", "/..%2fsecret.txt", "/assets/..%2f..%2fsecret.txt", "/%00"]) {
      const res = await rawGet(port, attack);
      assert.ok([400, 404].includes(res.status), `${attack} -> ${res.status}`);
      assert.doesNotMatch(res.body, /TOP-SECRET/, attack);
    }

    const unknownApi = await rawGet(port, "/api/does-not-exist"); // /api khong bao gio roi vao index.html
    assert.equal(unknownApi.status, 404);
    assert.doesNotMatch(unknownApi.body, /<title>/);
  });
});

test("[regression] cau hinh: thieu bien -> chi in TEN bien, JWT_SECRET ngan bi tu choi", () => {
  const full = {
    DB_HOST: "db", DB_NAME: "warranty_l2", DB_USER: "root", DB_PASSWORD: "p@ss-sample",
    JWT_SECRET: "x".repeat(32)
  };
  assert.throws(() => loadConfig({ DB_PASSWORD: "p@ss-sample" }), (error) =>
    /DB_HOST, DB_NAME, DB_USER, JWT_SECRET/.test(error.message) && !error.message.includes("p@ss-sample"));
  assert.throws(() => loadConfig({ ...full, JWT_SECRET: "ngan" }), /JWT_SECRET/);
  const config = loadConfig(full);
  assert.equal(config.port, 3000);
  assert.equal(config.db.port, 3306);
  assert.equal(config.db.name, "warranty_l2");
});

test("[regression] loi 500 duoc ghi log co cau truc nhung khong lo so dien thoai hay noi dung loi", async () => {
  const lines = [];
  const app = createApplication({
    logError: (line) => lines.push(line),
    ticketRepository: {
      list: async () => { throw new Error("Duplicate entry '0901234567' for key 'customer.phone' password=hunter2"); }
    }
  });
  await withServer(app, async (port) => {
    const login = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "nv01", password: "matkhau01" })
    });
    const { token } = await login.json();
    const res = await fetch(`http://127.0.0.1:${port}/api/tickets?status=MOI&token=abc`, {
      headers: { authorization: `Bearer ${token}` }
    });
    assert.equal(res.status, 500);
    assert.equal(lines.length, 1);
    const entry = JSON.parse(lines[0]);
    assert.deepEqual(Object.keys(entry).sort(), ["code", "level", "method", "path"]);
    assert.equal(entry.path, "/api/tickets"); // query bi bo, khong lo token
    assert.doesNotMatch(lines[0], /0901234567|hunter2|Duplicate|abc/);
  });
});
