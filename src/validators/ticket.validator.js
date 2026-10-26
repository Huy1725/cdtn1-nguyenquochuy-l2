import { PRIORITIES, TICKET_STATUSES } from "../domain/warranty.js";
import { collect, optionalString, positiveInt, requiredString } from "./common.js";

export function validateTicketId(id) {
  return collect((fields) => positiveInt(fields, id, "ticket_id"));
}

export function validateCreateTicket(input) {
  return collect((fields) => {
    const external = Boolean(input?.external_device);
    const priority = input?.priority;
    if (!Object.hasOwn(PRIORITIES, priority)) fields.priority = "Muc uu tien khong hop le";
    const value = {
      customer_id: positiveInt(fields, input?.customer_id, "customer_id"),
      priority,
      issue_desc: requiredString(fields, input, "issue_desc", 2000),
      category_id: positiveInt(fields, input?.category_id, "category_id", { required: false }),
      changed_by: positiveInt(fields, input?.changed_by, "changed_by", { required: false }),
      external_device: external
    };
    // US3 AC2: thiet bi ngoai bat buoc nhap tay serial va ghi chu nguon goc.
    if (external) {
      value.serial_no = requiredString(fields, input, "serial_no", 50);
      value.source_note = requiredString(fields, input, "source_note", 500);
    } else {
      value.device_id = positiveInt(fields, input?.device_id, "device_id");
    }
    return value;
  });
}

export function validateStatusChange(input) {
  return collect((fields) => {
    if (!TICKET_STATUSES.includes(input?.status)) fields.status = "Trang thai khong hop le";
    return {
      status: input?.status,
      note: optionalString(fields, input, "note", 1000),
      changed_by: positiveInt(fields, input?.changed_by, "changed_by", { required: false })
    };
  });
}

export function validateListQuery(query) {
  return collect((fields) => {
    const status = query?.status || undefined;
    if (status !== undefined && !TICKET_STATUSES.includes(status)) fields.status = "Trang thai khong hop le";
    const page = positiveInt(fields, query?.page, "page", { required: false }) ?? 1;
    const size = positiveInt(fields, query?.size, "size", { required: false }) ?? 20;
    return { status, page, size: Math.min(size, 100) };
  });
}
