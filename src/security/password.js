import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// Mat khau luu dang "scrypt$<salt hex>$<hash hex>" (S3: khong bao gio luu mat khau tho).
const KEY_LENGTH = 64;

// Chuoi bam gia dung khi khong tim thay ten dang nhap: van chay scrypt mot lan de thoi gian
// phan hoi khong tiet lo ten dang nhap co ton tai hay khong.
export const DUMMY_HASH = `scrypt$${"00".repeat(16)}$${"00".repeat(KEY_LENGTH)}`;

export function hashPassword(password) {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString("hex")}$${scryptSync(password, salt, KEY_LENGTH).toString("hex")}`;
}

export function verifyPassword(password, stored) {
  const [scheme, saltHex, hashHex] = String(stored ?? "").split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(String(password), Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}
