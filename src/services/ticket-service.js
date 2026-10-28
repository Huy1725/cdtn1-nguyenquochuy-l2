import { AppError, invalidReference } from "../errors/AppError.js";
import { calculateDueDate, warrantyStatus } from "../domain/warranty.js";

const DEFAULT_STAFF_ID = 1;

function notFound() {
  return new AppError("TICKET_NOT_FOUND", "Khong tim thay phieu");
}

// Service chi chua quy tac nghiep vu; du lieu vao da duoc validators kiem tra dinh dang.
export class TicketService {
  constructor({ ticketRepository, customerRepository, classifyService, clock = () => new Date() }) {
    this.tickets = ticketRepository;
    this.customers = customerRepository;
    this.classifier = classifyService;
    this.clock = clock;
  }

  async create(input) {
    if (!(await this.customers.findById(input.customer_id))) {
      throw invalidReference("customer_id", "Khach hang khong ton tai");
    }
    let categoryId = input.category_id ?? null;
    if (categoryId === null) {
      categoryId = await this.classifier.suggest(input.issue_desc);
    } else if (!(await this.classifier.exists(categoryId))) {
      throw invalidReference("category_id", "Nhom su co khong ton tai");
    }
    const device = await this.#resolveDevice(input);

    const receivedAt = this.clock();
    const saved = await this.tickets.save({
      customer_id: input.customer_id,
      device_id: device.device_id,
      category_id: categoryId,
      issue_desc: input.issue_desc,
      priority: input.priority,
      status: "MOI",
      received_at: receivedAt.toISOString(),
      due_date: calculateDueDate(receivedAt, input.priority).toISOString()
    });
    const note = input.external_device ? `Thiet bi ngoai - nguon goc: ${input.source_note}` : null;
    await this.tickets.appendStatusLog(saved.ticket_id, {
      from_status: null,
      to_status: "MOI",
      note,
      changed_by: input.changed_by ?? DEFAULT_STAFF_ID
    });
    return this.#detail(saved, device);
  }

  async list({ status, page, size }) {
    return this.tickets.list({ status, page, size });
  }

  async get(id) {
    const ticket = await this.tickets.findById(id);
    if (!ticket) throw notFound();
    return this.#detail(ticket, await this.customers.findDeviceById(ticket.device_id));
  }

  // QT-13: huy phieu la doi status sang HUY + ghi log, khong xoa du lieu.
  async changeStatus(id, { status, note = null, changed_by: changedBy }) {
    const ticket = await this.tickets.findById(id);
    if (!ticket) throw notFound();
    if (ticket.status === status) return this.#detail(ticket, await this.customers.findDeviceById(ticket.device_id));
    const updated = await this.tickets.save({ ...ticket, status });
    await this.tickets.appendStatusLog(updated.ticket_id, {
      from_status: ticket.status,
      to_status: status,
      note,
      changed_by: changedBy ?? DEFAULT_STAFF_ID
    });
    return this.#detail(updated, await this.customers.findDeviceById(updated.device_id));
  }

  async #resolveDevice(input) {
    if (input.external_device) {
      if (await this.customers.findDeviceBySerial(input.serial_no)) {
        throw new AppError("DEVICE_EXISTS", "Serial da ton tai trong he thong", {
          serial_no: "Serial da ton tai trong he thong"
        });
      }
      return this.customers.saveDevice({
        customer_id: input.customer_id,
        serial_no: input.serial_no,
        purchase_date: null,
        warranty_months: null
      });
    }
    const device = await this.customers.findDeviceById(input.device_id);
    if (!device || device.customer_id !== input.customer_id) {
      throw invalidReference("device_id", "Thiet bi khong thuoc khach hang nay");
    }
    return device;
  }

  // Trang thai bao hanh duoc tinh tu thiet bi, khong luu trong bang ticket.
  async #detail(ticket, device) {
    return {
      ...ticket,
      serial_no: device?.serial_no ?? null,
      warranty_status: warrantyStatus(device?.purchase_date, device?.warranty_months, ticket.received_at),
      status_log: await this.tickets.statusLog(ticket.ticket_id)
    };
  }
}
