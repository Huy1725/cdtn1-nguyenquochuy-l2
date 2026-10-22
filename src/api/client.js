export class ApiError extends Error {
  constructor(status, code, message, fields = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: { "content-type": "application/json", ...(options.headers ?? {}) },
    ...options
  });
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
  return payload?.data ?? payload;
}
