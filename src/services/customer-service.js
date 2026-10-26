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

  findByPhone(phone) {
    return this.repository.findByPhone(phone);
  }

  get(id) {
    const customer = this.repository.findById(id);
    if (!customer) throw notFound();
    return customer;
  }

  // QT-01: mot so dien thoai 10 so chi tuong ung mot ho so khach hang.
  create(input) {
    this.#assertPhoneFree(input.phone);
    return this.repository.save({ ...input });
  }

  update(id, changes) {
    const current = this.get(id);
    if (changes.phone !== undefined && changes.phone !== current.phone) this.#assertPhoneFree(changes.phone);
    return this.repository.update(current.customer_id, changes);
  }

  // Khach da co thiet bi hoac phieu thi giu lai de bao toan truy vet (QT-13).
  delete(id) {
    const current = this.get(id);
    if (this.repository.listDevices(id).length > 0 || this.tickets.existsForCustomer(id)) {
      throw new AppError("CUSTOMER_IN_USE", "Khach hang da co thiet bi hoac phieu, khong the xoa");
    }
    this.repository.delete(current.customer_id);
    return { customer_id: current.customer_id, deleted: true };
  }

  devices(id) {
    this.get(id);
    return this.repository.listDevices(id);
  }

  #assertPhoneFree(phone) {
    if (this.repository.findByPhone(phone)) {
      throw new AppError("CUSTOMER_EXISTS", "So dien thoai da ton tai", { phone: "So dien thoai da ton tai" });
    }
  }
}
