export class InMemoryCustomerRepository {
  #customers = new Map();
  #nextId = 1;

  findByPhone(phone) {
    const customer = [...this.#customers.values()].find((item) => item.phone === phone);
    return customer ? structuredClone(customer) : null;
  }

  findById(id) {
    const customer = this.#customers.get(Number(id));
    return customer ? structuredClone(customer) : null;
  }

  save(customer) {
    const id = customer.id ?? this.#nextId++;
    const saved = { ...structuredClone(customer), id };
    this.#customers.set(id, saved);
    return structuredClone(saved);
  }

  delete(id, deletedAt) {
    const customer = this.#customers.get(Number(id));
    if (!customer) return null;
    const deleted = { ...customer, deleted_at: deletedAt };
    this.#customers.set(Number(id), deleted);
    return structuredClone(deleted);
  }
}

export class InMemoryTicketRepository {
  #tickets = new Map();
  #logs = new Map();
  #nextId = 1;

  save(ticket) {
    const id = ticket.id ?? this.#nextId++;
    const saved = { ...structuredClone(ticket), id };
    this.#tickets.set(id, saved);
    return structuredClone(saved);
  }

  findById(id) {
    const ticket = this.#tickets.get(Number(id));
    return ticket ? structuredClone(ticket) : null;
  }

  list({ status, assignee, page = 1, size = 20 } = {}) {
    let values = [...this.#tickets.values()].filter((ticket) => !ticket.deleted_at);
    if (status) values = values.filter((ticket) => ticket.status === status);
    if (assignee) values = values.filter((ticket) => ticket.assignee === assignee);
    const total = values.length;
    const start = (page - 1) * size;
    return { items: structuredClone(values.slice(start, start + size)), total, page, size };
  }

  appendStatusLog(ticketId, entry) {
    const entries = this.#logs.get(Number(ticketId)) ?? [];
    entries.push(Object.freeze({ ...structuredClone(entry), created_at: entry.created_at ?? new Date().toISOString() }));
    this.#logs.set(Number(ticketId), entries);
  }

  statusLog(ticketId) {
    return structuredClone(this.#logs.get(Number(ticketId)) ?? []);
  }
}
