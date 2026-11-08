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

// Token dang nhap giu trong sessionStorage: dong tab la phai dang nhap lai.
// Trinh duyet chan storage (che do rieng tu...) thi van chay, chi la mat phien khi tai lai trang.
const TOKEN_KEY = "warranty.token";
let memoryToken = null;

export function getToken() {
  try { return sessionStorage.getItem(TOKEN_KEY) ?? memoryToken; } catch { return memoryToken; }
}

export function setToken(token) {
  memoryToken = token;
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch { /* chi dung bien trong bo nho */ }
}

// Bao cho App biet phien da het han de quay ve trang dang nhap.
export const SESSION_EXPIRED_EVENT = "warranty:session-expired";

export async function request(path, options = {}) {
  const token = getToken();
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {})
      }
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Không thể kết nối máy chủ. Hãy kiểm tra backend đang chạy.");
  }
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && token) {
      setToken(null);
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    throw new ApiError(
      response.status,
      payload.error?.code,
      payload.error?.message ?? "Không thể kết nối máy chủ",
      payload.error?.fields ?? {}
    );
  }
  return payload;
}
