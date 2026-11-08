import { createHmac, timingSafeEqual } from "node:crypto";

// Token dang JWT (HS256) tu ky bang node:crypto, khong can thu vien ngoai.
const HEADER = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));

function base64url(text) {
  return Buffer.from(text).toString("base64url");
}

function sign(data, secret) {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

export function signToken(claims, secret, ttlSeconds, now = new Date()) {
  const iat = Math.floor(now.getTime() / 1000);
  const payload = base64url(JSON.stringify({ ...claims, iat, exp: iat + ttlSeconds }));
  return `${HEADER}.${payload}.${sign(`${HEADER}.${payload}`, secret)}`;
}

// Tra ve noi dung token neu chu ky dung va con han; nguoc lai tra ve null (khong nem loi).
export function verifyToken(token, secret, now = new Date()) {
  const parts = String(token ?? "").split(".");
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  const expected = Buffer.from(sign(`${header}.${payload}`, secret));
  const actual = Buffer.from(signature);
  if (header !== HEADER || actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  let claims;
  try {
    claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof claims.exp !== "number" || claims.exp <= Math.floor(now.getTime() / 1000)) return null;
  return claims;
}
