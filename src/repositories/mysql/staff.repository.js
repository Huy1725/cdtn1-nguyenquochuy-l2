// Cung giao dien voi InMemoryStaffRepository.
export class MysqlStaffRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async findByUsername(username) {
    const [rows] = await this.pool.query("SELECT * FROM staff WHERE username = ? LIMIT 1", [username]);
    return rows[0] ? { ...rows[0], is_active: Boolean(rows[0].is_active) } : null;
  }

  async findById(id) {
    const [rows] = await this.pool.query("SELECT * FROM staff WHERE staff_id = ? LIMIT 1", [Number(id)]);
    return rows[0] ? { ...rows[0], is_active: Boolean(rows[0].is_active) } : null;
  }
}
