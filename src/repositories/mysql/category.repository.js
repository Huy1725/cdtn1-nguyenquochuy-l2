export class MysqlCategoryRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async list() {
    const [rows] = await this.pool.query("SELECT * FROM issue_category ORDER BY category_id");
    return rows;
  }

  async findById(id) {
    if (id === null || id === undefined) return null;
    const [rows] = await this.pool.query("SELECT * FROM issue_category WHERE category_id = ? LIMIT 1", [Number(id)]);
    return rows[0] ?? null;
  }
}
