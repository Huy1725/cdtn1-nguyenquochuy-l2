import { validationError } from "../errors/AppError.js";

export const PRIORITIES = Object.freeze({
  CAO: 24,
  TRUNG_BINH: 72,
  THAP: 120
});

export const TICKET_STATUSES = Object.freeze(["MOI", "DANG_XU_LY", "HOAN_TAT", "HUY"]);

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
const LOCAL_OFFSET_MS = 7 * HOUR_MS; // UTC+7, mui gio cua API contract

function localTime(date) {
  return date.getTime() + LOCAL_OFFSET_MS;
}

function isSunday(date) {
  return new Date(localTime(date)).getUTCDay() === 0;
}

function msUntilLocalMidnight(date) {
  return DAY_MS - (((localTime(date) % DAY_MS) + DAY_MS) % DAY_MS);
}

export function addBusinessHours(start, hours) {
  if (!Number.isInteger(hours) || hours <= 0) {
    throw new RangeError("hours must be a positive integer");
  }

  const result = new Date(start);
  let remaining = hours;
  while (remaining > 0) {
    if (isSunday(result)) {
      result.setTime(result.getTime() + DAY_MS);
      continue;
    }

    const available = Math.max(1, Math.ceil(msUntilLocalMidnight(result) / HOUR_MS));
    const consumed = Math.min(remaining, available);
    result.setTime(result.getTime() + consumed * HOUR_MS);
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

export function warrantyStatus(purchaseDate, warrantyMonths, at = new Date()) {
  if (!purchaseDate || !Number.isInteger(warrantyMonths) || warrantyMonths < 0) {
    return "KHONG_XAC_DINH";
  }
  // So sanh theo NGAY lich UTC+7: ngay cuoi cung cua bao hanh van con bao hanh het ngay.
  const purchase = new Date(purchaseDate);
  const monthIndex = purchase.getUTCMonth() + warrantyMonths;
  const year = purchase.getUTCFullYear() + Math.floor(monthIndex / 12);
  const month = monthIndex % 12;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const expiresOn = new Date(Date.UTC(year, month, Math.min(purchase.getUTCDate(), lastDay)));
  const receivedOn = new Date(localTime(new Date(at)));
  const receivedDay = Date.UTC(receivedOn.getUTCFullYear(), receivedOn.getUTCMonth(), receivedOn.getUTCDate());
  return receivedDay <= expiresOn.getTime() ? "CON_BAO_HANH" : "HET_BAO_HANH";
}
