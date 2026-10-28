// Cung giao dien voi cac repository MySQL (xem src/repositories/mysql/); moi ham deu async
// de tang Service goi thong nhat bang await du dang chay repository nao.
export class InMemoryCustomerRepository {
  #customers = new Map();
  #devices = new Map();
  #nextCustomerId = 1;
  #nextDeviceId = 1;

  async findByPhone(phone) {
    const customer = [...this.#customers.values()].find((item) => item.phone === phone);
    return customer ? structuredClone(customer) : null;
  }

  async findById(id) {
    const customer = this.#customers.get(Number(id));
    return customer ? structuredClone(customer) : null;
  }

  async save(customer) {
    const customerId = this.#nextCustomerId++;
    const saved = { ...structuredClone(customer), customer_id: customerId, created_at: new Date().toISOString() };
    this.#customers.set(customerId, saved);
    return structuredClone(saved);
  }

  async update(customerId, changes) {
    const current = this.#customers.get(Number(customerId));
    if (!current) return null;
    const saved = { ...current, ...structuredClone(changes), customer_id: current.customer_id };
    this.#customers.set(saved.customer_id, saved);
    return structuredClone(saved);
  }

  async delete(customerId) {
    return this.#customers.delete(Number(customerId));
  }

  async findDeviceById(id) {
    const device = this.#devices.get(Number(id));
    return device ? structuredClone(device) : null;
  }

  async findDeviceBySerial(serialNo) {
    const device = [...this.#devices.values()].find((item) => item.serial_no === serialNo);
    return device ? structuredClone(device) : null;
  }

  async listDevices(customerId) {
    return structuredClone([...this.#devices.values()].filter((item) => item.customer_id === Number(customerId)));
  }

  async saveDevice(device) {
    const deviceId = this.#nextDeviceId++;
    const saved = { ...structuredClone(device), device_id: deviceId };
    this.#devices.set(deviceId, saved);
    return structuredClone(saved);
  }
}

export const DEFAULT_CATEGORIES = Object.freeze([
  { category_id: 1, category_name: "Pin", description: "Chai pin, phong pin, sac khong vao, loi cong sac" },
  { category_id: 2, category_name: "Man hinh", description: "Vo, soc, mat cam ung, loi hien thi" },
  { category_id: 3, category_name: "Vao nuoc / Hu hong vat ly", description: "Vao nuoc, roi vo, bien dang" },
  { category_id: 4, category_name: "Phan mem", description: "Treo may, loi he dieu hanh, mat du lieu" },
  { category_id: 5, category_name: "Nguon", description: "Khong len nguon, khong khoi dong, tu tat nguon" },
  { category_id: 6, category_name: "Khac", description: "Cac su co chua thuoc nhom nao" }
]);

export class InMemoryCategoryRepository {
  #categories = new Map();

  constructor(categories = DEFAULT_CATEGORIES) {
    for (const category of categories) this.#categories.set(category.category_id, Object.freeze({ ...category }));
  }

  async list() {
    return structuredClone([...this.#categories.values()]);
  }

  async findById(id) {
    const category = this.#categories.get(Number(id));
    return category ? structuredClone(category) : null;
  }
}

export class InMemoryTicketRepository {
  #tickets = new Map();
  #logs = new Map();
  #nextId = 1;

  async existsForCustomer(customerId) {
    return [...this.#tickets.values()].some((ticket) => ticket.customer_id === Number(customerId));
  }

  // Phieu moi (khong co ticket_id) duoc sinh ma ngay tai day, dung ticket_id that vua cap phat
  // de khong bao gio trung ma, giong cach lam voi MySQL (xem mysql/ticket.repository.js).
  async save(ticket) {
    if (ticket.ticket_id) {
      const current = this.#tickets.get(Number(ticket.ticket_id));
      const saved = { ...current, ...structuredClone(ticket) };
      this.#tickets.set(saved.ticket_id, saved);
      return structuredClone(saved);
    }
    const ticketId = this.#nextId++;
    const ticketCode = `BH-${String(ticketId).padStart(6, "0")}/${new Date(ticket.received_at).getUTCFullYear()}`;
    const saved = { ...structuredClone(ticket), ticket_id: ticketId, ticket_code: ticketCode };
    this.#tickets.set(ticketId, saved);
    return structuredClone(saved);
  }

  async findById(id) {
    const ticket = this.#tickets.get(Number(id));
    return ticket ? structuredClone(ticket) : null;
  }

  async list({ status, page = 1, size = 20 } = {}) {
    let values = [...this.#tickets.values()];
    if (status) values = values.filter((ticket) => ticket.status === status);
    const total = values.length;
    const start = (page - 1) * size;
    return { items: structuredClone(values.slice(start, start + size)), total, page, size };
  }

  // Nhat ky chi them moi, khong co ham sua/xoa (QT-13, NFR3).
  async appendStatusLog(ticketId, entry) {
    const entries = this.#logs.get(Number(ticketId)) ?? [];
    entries.push(Object.freeze({
      log_id: entries.length + 1,
      ticket_id: Number(ticketId),
      from_status: entry.from_status ?? null,
      to_status: entry.to_status,
      note: entry.note ?? null,
      changed_at: entry.changed_at ?? new Date().toISOString(),
      changed_by: entry.changed_by
    }));
    this.#logs.set(Number(ticketId), entries);
  }

  async statusLog(ticketId) {
    return structuredClone(this.#logs.get(Number(ticketId)) ?? []);
  }
}
