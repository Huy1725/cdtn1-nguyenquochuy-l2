import { createApplication } from "./app.js";
import { createMysqlRepositories } from "./repositories/mysql/index.js";

// npm start doc/ghi MySQL that (migrations/ + seeds/). Kiem thu KHONG dung file nay,
// xem tests/unit/ - luon chay bang repository bo nho, khong can MySQL.
async function main() {
  // Khoa ky token phai do nguoi trien khai dat; thieu hoac qua ngan thi tu choi khoi dong.
  if ((process.env.JWT_SECRET ?? "").length < 32) {
    throw new Error("JWT_SECRET trong .env phai co it nhat 32 ky tu (xem .env.example)");
  }
  const port = Number(process.env.PORT ?? 3000);
  const { pool, ...repositories } = await createMysqlRepositories();
  const app = createApplication(repositories);
  app.server.listen(port, () => {
    console.log(`Warranty API listening on http://localhost:${port}`);
    console.log(`CSDL: MySQL ${process.env.DB_NAME ?? "warranty_l2"}@${process.env.DB_HOST ?? "localhost"}:${process.env.DB_PORT ?? 3306}`);
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
