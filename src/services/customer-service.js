import { AppError } from "../errors/AppError.js";

function notFound() {
  return new AppError("CUSTOMER_NOT_FOUND", "Khong tim thay khach hang");
}

// Service chi chua quy tac nghiep vu; du lieu vao da duoc validators kiem tra dinh dang.
export class CustomerService {
  constructor({ customerRepository, ticketRepository }) {
    this.repository = customerRepository;
    this.tickets = ticketRepository;
  }

  async findByPhone(phone) {
    return this.repository.findByPhone(phone);
  }

  async get(id) {
    const customer = await this.repository.findById(id);
    if (!customer) throw notFound();
    return customer;
  }

  // QT-01: mot so dien thoai 10 so chi tuong ung mot ho so khach hang.
  async create(input) {
    await this.#assertPhoneFree(input.phone);
    return this.repository.save({ ...input });
  }

  async update(id, changes) {
    const current = await this.get(id);
    if (changes.phone !== undefined && changes.phone !== current.phone) await this.#assertPhoneFree(changes.phone);
    return this.repository.update(current.customer_id, changes);
  }

  // Khach da co thiet bi hoac phieu thi giu lai de bao toan truy vet (QT-13).
  async delete(id) {
    const current = await this.get(id);
    const devices = await this.repository.listDevices(id);
    if (devices.length > 0 || (await this.tickets.existsForCustomer(id))) {
      throw new AppError("CUSTOMER_IN_USE", "Khach hang da co thiet bi hoac phieu, khong the xoa");
    }
    await this.repository.delete(current.customer_id);
    return { customer_id: current.customer_id, deleted: true };
  }

  async devices(id) {
    await this.get(id);
    return this.repository.listDevices(id);
  }

  async #assertPhoneFree(phone) {
    if (await this.repository.findByPhone(phone)) {
      throw new AppError("CUSTOMER_EXISTS", "So dien thoai da ton tai", { phone: "So dien thoai da ton tai" });
    }
  }
}
