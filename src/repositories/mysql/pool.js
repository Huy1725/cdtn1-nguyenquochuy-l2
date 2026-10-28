import mysql from "mysql2/promise";

// Mot pool dung chung cho ca ung dung; doc config tu bien moi truong (xem .env.example).
export function createPool() {
  return mysql.createPool({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "warranty_l2",
    dateStrings: true, // doc DATE/DATETIME ve dang chuoi, tu quan ly UTC bang tay, tranh lech mui gio
    waitForConnections: true,
    connectionLimit: 10
  });
}

// Luu moi DATETIME trong CSDL theo gio UTC duoi dang chuoi "wall-clock" (xem thay-doi-thiet-ke.md).
export function toSqlDateTime(isoString) {
  if (!isoString) return null;
  return new Date(isoString).toISOString().replace("T", " ").replace(/\.\d+Z$/, "");
}

export function fromSqlDateTime(sqlValue) {
  if (!sqlValue) return null;
  return `${sqlValue.replace(" ", "T")}.000Z`;
}

// Kiem tra ket noi duoc ngay khi khoi dong, thay vi de loi kho hieu roi vao truy van dau tien.
export async function assertConnection(pool) {
  try {
    await pool.query("SELECT 1");
  } catch (error) {
    throw new Error(
      `Khong ket noi duoc MySQL (${process.env.DB_HOST ?? "localhost"}:${process.env.DB_PORT ?? 3306}/${process.env.DB_NAME ?? "warranty_l2"}). ` +
      `Kiem tra MySQL Server da chay, .env dung thong tin, va da chay migrations/001_initial.sql. ` +
      `Loi goc: ${error.code ?? error.message}`
    );
  }
}
