import { collect, optionalString, phoneField, positiveInt, requiredString } from "./common.js";

export function validatePhoneQuery(phone) {
  return collect((fields) => phoneField(fields, phone));
}

export function validateCustomerId(id) {
  return collect((fields) => positiveInt(fields, id, "customer_id"));
}

export function validateCreateCustomer(input) {
  return collect((fields) => ({
    phone: phoneField(fields, input?.phone),
    full_name: requiredString(fields, input, "full_name", 120),
    email: optionalString(fields, input, "email", 120),
    segment: optionalString(fields, input, "segment", 20)
  }));
}

export function validateUpdateCustomer(input) {
  return collect((fields) => {
    const changes = {};
    if (input?.phone !== undefined) changes.phone = phoneField(fields, input.phone);
    if (input?.full_name !== undefined) changes.full_name = requiredString(fields, input, "full_name", 120);
    if (input?.email !== undefined) changes.email = optionalString(fields, input, "email", 120);
    if (input?.segment !== undefined) changes.segment = optionalString(fields, input, "segment", 20);
    if (Object.keys(changes).length === 0 && Object.keys(fields).length === 0) {
      fields.body = "Can it nhat mot truong de cap nhat";
    }
    return changes;
  });
}
