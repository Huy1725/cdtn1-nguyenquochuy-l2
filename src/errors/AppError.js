// Loi nghiep vu: chi mang ma loi, KHONG biet gi ve HTTP (routes moi dich sang status).
export class AppError extends Error {
  constructor(code, message, fields = {}) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.fields = fields;
  }
}

export function validationError(fields) {
  return new AppError("VALIDATION_FAILED", "Du lieu khong hop le", fields);
}

export function invalidReference(field, message) {
  return new AppError("INVALID_REFERENCE", message, { [field]: message });
}
