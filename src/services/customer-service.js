import { AppError, validationError } from "../domain/errors.js";
import { validatePhone } from "../domain/warranty.js";

export class CustomerService {
  constructor(repository) {
    this.repository = repository;
  }

  findByPhone(phone) {
    return this.repository.findByPhone(validatePhone(phone));
  }

  create(input) {
    const phone = validatePhone(input?.phone);
    const fullName = typeof input?.full_name === "string" ? input.full_name.trim() : "";
    if (!fullName) throw validationError({ full_name: "Ho ten la truong bat buoc" });
    if (this.repository.findByPhone(phone)) {
      throw new AppError(409, "CUSTOMER_EXISTS", "So dien thoai da ton tai");
    }
    return this.repository.save({ ...input, phone, full_name: fullName });
  }

  devices(id) {
    const customer = this.repository.findById(id);
    if (!customer) throw new AppError(404, "CUSTOMER_NOT_FOUND", "Khong tim thay khach hang");
    return customer.devices ?? [];
  }

  update(id, input) {
    const current = this.repository.findById(id);
    if (!current || current.deleted_at) throw new AppError(404, "CUSTOMER_NOT_FOUND", "Khong tim thay khach hang");
    const phone = validatePhone(input?.phone ?? current.phone);
    const fullName = typeof (input?.full_name ?? current.full_name) === "string"
      ? (input?.full_name ?? current.full_name).trim()
      : "";
    if (!fullName) throw validationError({ full_name: "Ho ten la truong bat buoc" });
    const other = this.repository.findByPhone(phone);
    if (other && other.id !== Number(id)) throw new AppError(409, "CUSTOMER_EXISTS", "So dien thoai da ton tai");
    return this.repository.save({ ...current, ...input, id: Number(id), phone, full_name: fullName });
  }

  delete(id) {
    const current = this.repository.findById(id);
    if (!current || current.deleted_at) throw new AppError(404, "CUSTOMER_NOT_FOUND", "Khong tim thay khach hang");
    return this.repository.delete(id, new Date().toISOString());
  }
}
