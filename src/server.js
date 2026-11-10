import { fileURLToPath } from "node:url";
import { createApplication } from "./app.js";
import { loadConfig } from "./config.js";
import { createMysqlRepositories } from "./repositories/mysql/index.js";

// npm start doc/ghi MySQL that (migrations/ + seeds/). Kiem thu KHONG dung file nay,
// xem tests/unit/ - luon chay bang repository bo nho, khong can MySQL.
async function main() {
  const config = loadConfig(); // thieu bien bat buoc thi dung ngay, chi in ten bien
  const { pool, ...repositories } = await createMysqlRepositories();
  const app = createApplication({
    ...repositories,
    jwtSecret: config.jwtSecret,
    corsOrigin: config.corsOrigin,
    checkDb: () => pool.query("SELECT 1"),
    // ban build giao dien (npm run build) - Docker dung san trong image, chay tay thi dung npm run dev
    staticDir: fileURLToPath(new URL("../dist", import.meta.url))
  });
  app.server.listen(config.port, () => {
    console.log(`Warranty API listening on http://localhost:${config.port}`);
    console.log(`CSDL: MySQL ${config.db.name}@${config.db.host}:${config.db.port}`);
  });

  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, async () => {
      app.server.close();
      await pool.end();
      process.exit(0);
    });
  }
}

main().catch((error) => {
  console.error(`Khong khoi dong duoc server: ${error.message}`);
  process.exit(1);
});
