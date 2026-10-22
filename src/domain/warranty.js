import { validationError } from "./errors.js";

export const PRIORITIES = Object.freeze({
  CAO: 24,
  TRUNG_BINH: 72,
  THAP: 120
});

export const TICKET_STATUSES = Object.freeze(["MOI", "DANG_XU_LY", "HOAN_TAT", "DA_HUY"]);

export function normalizePhone(phone) {
  return typeof phone === "string" ? phone.trim() : "";
}

export function validatePhone(phone) {
  const normalized = normalizePhone(phone);
  if (!/^\d{10}$/.test(normalized)) {
    throw validationError({ phone: "So dien thoai phai gom dung 10 chu so" });
  }
  return normalized;
}

function isSunday(date) {
  return date.getUTCDay() === 0;
}

export function addBusinessHours(start, hours) {
  if (!Number.isInteger(hours) || hours <= 0) {
    throw new RangeError("hours must be a positive integer");
  }

  const result = new Date(start);
  let remaining = hours;
  while (remaining > 0) {
    if (isSunday(result)) {
      result.setUTCDate(result.getUTCDate() + 1);
      continue;
    }

    const midnight = new Date(result);
    midnight.setUTCHours(24, 0, 0, 0);
    const available = Math.max(1, Math.ceil((midnight - result) / 3_600_000));
    const consumed = Math.min(remaining, available);
    result.setTime(result.getTime() + consumed * 3_600_000);
    remaining -= consumed;
  }
  return result;
}

export function calculateDueDate(receivedAt, priority) {
  if (!Object.hasOwn(PRIORITIES, priority)) {
    throw validationError({ priority: "Muc uu tien khong hop le" });
  }
  return addBusinessHours(new Date(receivedAt), PRIORITIES[priority]);
}

export function warrantyStatus(purchasedAt, warrantyMonths, at = new Date()) {
  if (!purchasedAt || !Number.isInteger(warrantyMonths) || warrantyMonths < 0) {
    return "KHONG_XAC_DINH";
  }
  const expiresAt = new Date(purchasedAt);
  expiresAt.setUTCMonth(expiresAt.getUTCMonth() + warrantyMonths);
  return new Date(at) <= expiresAt ? "CON_BAO_HANH" : "HET_BAO_HANH";
}
