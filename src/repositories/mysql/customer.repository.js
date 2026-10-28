// Cung giao dien voi InMemoryCustomerRepository (xem src/repositories/in-memory.js);
// chi khac o cho doc/ghi that vao MySQL. KHONG chua quy tac nghiep vu (QT-01 nam o service).
export class MysqlCustomerRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async findByPhone(phone) {
    const [rows] = await this.pool.query("SELECT * FROM customer WHERE phone = ? LIMIT 1", [phone]);
    return rows[0] ?? null;
  }

  async findById(id) {
    const [rows] = await this.pool.query("SELECT * FROM customer WHERE customer_id = ? LIMIT 1", [Number(id)]);
    return rows[0] ?? null;
  }

  async save(customer) {
    const [result] = await this.pool.query(
      "INSERT INTO customer (full_name, phone, email, segment) VALUES (?, ?, ?, ?)",
      [customer.full_name, customer.phone, customer.email ?? null, customer.segment ?? null]
    );
    return this.findById(result.insertId);
  }

  async update(customerId, changes) {
    const fields = Object.keys(changes).filter((key) => changes[key] !== undefined);
    if (fields.length === 0) return this.findById(customerId);
    const setClause = fields.map((key) => `${key} = ?`).join(", ");
    await this.pool.query(`UPDATE customer SET ${setClause} WHERE customer_id = ?`, [
      ...fields.map((key) => changes[key]),
      Number(customerId)
    ]);
    return this.findById(customerId);
  }

  async delete(customerId) {
    const [result] = await this.pool.query("DELETE FROM customer WHERE customer_id = ?", [Number(customerId)]);
    return result.affectedRows > 0;
  }

  async findDeviceById(id) {
    if (id === null || id === undefined) return null;
    const [rows] = await this.pool.query("SELECT * FROM device WHERE device_id = ? LIMIT 1", [Number(id)]);
    return rows[0] ?? null;
  }

  async findDeviceBySerial(serialNo) {
    const [rows] = await this.pool.query("SELECT * FROM device WHERE serial_no = ? LIMIT 1", [serialNo]);
    return rows[0] ?? null;
  }

  async listDevices(customerId) {
    const [rows] = await this.pool.query("SELECT * FROM device WHERE customer_id = ? ORDER BY device_id", [Number(customerId)]);
    return rows;
  }

  async saveDevice(device) {
    const [result] = await this.pool.query(
      "INSERT INTO device (customer_id, serial_no, purchase_date, warranty_months) VALUES (?, ?, ?, ?)",
      [device.customer_id, device.serial_no, device.purchase_date ?? null, device.warranty_months ?? null]
    );
    const [rows] = await this.pool.query("SELECT * FROM device WHERE device_id = ?", [result.insertId]);
    return rows[0];
  }
}
