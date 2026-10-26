import { validationError } from "../errors/AppError.js";

const REQUIRED = "Truong bat buoc, khong duoc de trong";

export function collect(check) {
  const fields = {};
  const value = check(fields);
  if (Object.keys(fields).length > 0) throw validationError(fields);
  return value;
}

export function requiredString(fields, input, name, max = 255) {
  const value = input?.[name];
  if (typeof value !== "string" || !value.trim()) {
    fields[name] = REQUIRED;
    return undefined;
  }
  if (value.trim().length > max) fields[name] = `Toi da ${max} ky tu`;
  return value.trim();
}

export function optionalString(fields, input, name, max = 255) {
  const value = input?.[name];
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    fields[name] = "Phai la chuoi";
    return null;
  }
  if (value.trim().length > max) fields[name] = `Toi da ${max} ky tu`;
  return value.trim();
}

export function positiveInt(fields, value, name, { required = true } = {}) {
  if (value === undefined || value === null || value === "") {
    if (required) fields[name] = REQUIRED;
    return null;
  }
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    fields[name] = "Phai la so nguyen duong";
    return null;
  }
  return number;
}

export function phoneField(fields, value, name = "phone") {
  const phone = typeof value === "string" ? value.trim() : "";
  if (!/^\d{10}$/.test(phone)) {
    fields[name] = "So dien thoai phai gom dung 10 chu so";
    return undefined;
  }
  return phone;
}
