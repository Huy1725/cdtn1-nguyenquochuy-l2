export class ApiError extends Error {
  constructor(status, code, message, fields = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

// Dia chi API lay tu bien moi truong (xem .env.example); de trong thi dung proxy cua Vite.
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: { "content-type": "application/json", ...(options.headers ?? {}) },
      ...options
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Không thể kết nối máy chủ. Hãy kiểm tra backend đang chạy.");
  }
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload.error?.code,
      payload.error?.message ?? "Không thể kết nối máy chủ",
      payload.error?.fields ?? {}
    );
  }
  return payload;
}
