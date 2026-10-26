export class AppError extends Error {
  constructor(status, code, message, fields = {}) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export function validationError(fields) {
  return new AppError(400, "VALIDATION_FAILED", "Du lieu khong hop le", fields);
}
