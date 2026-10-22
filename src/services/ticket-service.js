import { AppError, validationError } from "../domain/errors.js";
import { calculateDueDate, PRIORITIES, TICKET_STATUSES, warrantyStatus } from "../domain/warranty.js";

function requiredString(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw validationError({ [field]: "Truong bat buoc, khong duoc de trong" });
  }
  return value.trim();
}

export class TicketService {
  constructor({ ticketRepository, customerRepository, clock = () => new Date() }) {
    this.tickets = ticketRepository;
    this.customers = customerRepository;
    this.clock = clock;
  }

  create(input) {
    const customerId = Number(input?.customer_id);
    if (!Number.isInteger(customerId) || !this.customers.findById(customerId)) {
      throw validationError({ customer_id: "Khach hang khong ton tai" });
    }
    const priority = input?.priority;
    if (!Object.hasOwn(PRIORITIES, priority)) throw validationError({ priority: "Muc uu tien khong hop le" });
    const issueDesc = requiredString(input?.issue_desc, "issue_desc");
    const isExternal = Boolean(input?.external_device);
    const serial = requiredString(input?.serial, "serial");
    if (isExternal && !requiredString(input?.source_note, "source_note")) return null;

    const receivedAt = this.clock();
    const ticket = {
      ticket_code: `BH-${String(Date.now()).slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`,
      customer_id: customerId,
      device_id: input?.device_id ?? null,
      serial,
      source_note: input?.source_note?.trim() ?? null,
      center_id: input?.center_id ?? null,
      issue_desc: issueDesc,
      priority,
      accessories: Array.isArray(input?.accessories) ? [...input.accessories] : [],
      category_id: input?.category_id ?? null,
      warranty_status: warrantyStatus(input?.purchased_at, input?.warranty_months, receivedAt),
      status: "MOI",
      received_at: receivedAt.toISOString(),
      due_date: calculateDueDate(receivedAt, priority).toISOString(),
      deleted_at: null
    };
    const saved = this.tickets.save(ticket);
    this.tickets.appendStatusLog(saved.id, { from_status: null, to_status: "MOI", actor: input?.actor ?? "system" });
    return { ...saved, status_log: this.tickets.statusLog(saved.id) };
  }

  list(query) {
    const page = Math.max(1, Number(query?.page ?? 1));
    const size = Math.min(100, Math.max(1, Number(query?.size ?? 20)));
    return this.tickets.list({ ...query, page, size });
  }

  changeStatus(id, status, actor = "system") {
    if (!TICKET_STATUSES.includes(status)) throw validationError({ status: "Trang thai khong hop le" });
    const ticket = this.tickets.findById(id);
    if (!ticket || ticket.deleted_at) throw new AppError(404, "TICKET_NOT_FOUND", "Khong tim thay phieu");
    if (ticket.status === status) return ticket;
    const updated = this.tickets.save({ ...ticket, status });
    this.tickets.appendStatusLog(updated.id, { from_status: ticket.status, to_status: status, actor });
    return { ...updated, status_log: this.tickets.statusLog(updated.id) };
  }

  get(id) {
    const ticket = this.tickets.findById(id);
    if (!ticket || ticket.deleted_at) throw new AppError(404, "TICKET_NOT_FOUND", "Khong tim thay phieu");
    return { ...ticket, status_log: this.tickets.statusLog(ticket.id) };
  }

  softDelete(id, actor = "system") {
    const ticket = this.get(id);
    const deleted = this.tickets.save({ ...ticket, deleted_at: this.clock().toISOString() });
    this.tickets.appendStatusLog(id, { from_status: ticket.status, to_status: "DA_HUY", actor });
    return deleted;
  }
}
