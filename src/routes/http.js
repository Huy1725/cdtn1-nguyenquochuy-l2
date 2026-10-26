import { AppError } from "../errors/AppError.js";

// Routes la noi DUY NHAT biet HTTP: dich ma loi nghiep vu sang status.
const STATUS_BY_CODE = {
  VALIDATION_FAILED: 400,
  INVALID_JSON: 400,
  NOT_FOUND: 404,
  INVALID_REFERENCE: 422
};

export function statusForCode(code) {
  if (STATUS_BY_CODE[code]) return STATUS_BY_CODE[code];
  if (code?.endsWith("_NOT_FOUND")) return 404;
  if (code?.endsWith("_EXISTS") || code?.endsWith("_IN_USE")) return 409;
  return 500;
}

// Phan hoi loi khong bao gio chua stack trace, ten bang hay cau SQL.
export function toErrorResponse(error) {
  const status = error instanceof AppError ? statusForCode(error.code) : 500;
  if (status === 500) {
    return { status, body: { error: { code: "INTERNAL_ERROR", message: "Loi may chu", fields: {} } } };
  }
  return { status, body: { error: { code: error.code, message: error.message, fields: error.fields } } };
}

export async function readJson(request) {
  let body = "";
  for await (const chunk of request) body += chunk;
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch {
    throw new AppError("INVALID_JSON", "Body phai la JSON hop le");
  }
}

export function send(response, status, payload, corsOrigin) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": corsOrigin,
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS"
  });
  response.end(JSON.stringify(payload));
}

// "/api/customers/:id/devices" -> bieu thuc chinh quy + danh sach ten tham so.
export function compilePath(path) {
  const names = [];
  const source = path.replace(/:([a-z_]+)/g, (_, name) => {
    names.push(name);
    return "([^/]+)";
  });
  return { regex: new RegExp(`^${source}$`), names };
}
