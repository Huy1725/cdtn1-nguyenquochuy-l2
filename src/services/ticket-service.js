import { AppError, invalidReference } from "../errors/AppError.js";
import { calculateDueDate, warrantyStatus } from "../domain/warranty.js";

function notFound() {
  return new AppError("TICKET_NOT_FOUND", "Khong tim thay phieu");
}

// Nguoi thuc hien (actor) luon lay tu phien dang nhap, khong bao gio tu du lieu client gui len.
function requireActor(actor) {
  if (!actor?.staff_id) throw new AppError("UNAUTHORIZED", "Can dang nhap de thuc hien thao tac nay");
  return actor.staff_id;
}

// Service chi chua quy tac nghiep vu; du lieu vao da duoc validators kiem tra dinh dang.
export class TicketService {
  constructor({ ticketRepository, customerRepository, classifyService, staffRepository, clock = () => new Date() }) {
    this.tickets = ticketRepository;
    this.customers = customerRepository;
    this.classifier = classifyService;
    this.staff = staffRepository;
    this.clock = clock;
  }

  async create(input, actor) {
    const staffId = requireActor(actor);
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
      due_date: calculateDueDate(receivedAt, input.priority).toISOString(),
      received_by: staffId
    });
    const note = input.external_device ? `Thiet bi ngoai - nguon goc: ${input.source_note}` : null;
    // Thoi diem nhat ky lay tu CUNG dong ho voi received_at, khong de CSDL tu dien (BUG-09).
    await this.tickets.appendStatusLog(saved.ticket_id, {
      from_status: null,
      to_status: "MOI",
      note,
      changed_by: staffId,
      changed_at: receivedAt.toISOString()
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
  // Quy tac chu phieu (OWASP A01): chi nhan vien da tiep nhan phieu moi duoc doi trang thai phieu do.
  async changeStatus(id, { status, note = null }, actor) {
    const staffId = requireActor(actor);
    const ticket = await this.tickets.findById(id);
    if (!ticket) throw notFound();
    if (ticket.received_by !== staffId) {
      throw new AppError("FORBIDDEN", "Chi nhan vien tiep nhan phieu nay moi duoc doi trang thai");
    }
    if (ticket.status === status) return this.#detail(ticket, await this.customers.findDeviceById(ticket.device_id));
    const updated = await this.tickets.save({ ...ticket, status });
    await this.tickets.appendStatusLog(updated.ticket_id, {
      from_status: ticket.status,
      to_status: status,
      note,
      changed_by: staffId,
      changed_at: this.clock().toISOString()
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
  // US7: moi dong lich su kem ten nguoi thuc hien.
  async #detail(ticket, device) {
    const log = await this.tickets.statusLog(ticket.ticket_id);
    const names = new Map();
    for (const staffId of new Set([ticket.received_by, ...log.map((entry) => entry.changed_by)])) {
      if (staffId != null) names.set(staffId, (await this.staff.findById(staffId))?.full_name ?? null);
    }
    return {
      ...ticket,
      received_by_name: names.get(ticket.received_by) ?? null,
      serial_no: device?.serial_no ?? null,
      warranty_status: warrantyStatus(device?.purchase_date, device?.warranty_months, ticket.received_at),
      status_log: log.map((entry) => ({ ...entry, changed_by_name: names.get(entry.changed_by) ?? null }))
    };
  }
}
