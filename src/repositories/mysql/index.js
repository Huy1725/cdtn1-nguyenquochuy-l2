import { assertConnection, createPool } from "./pool.js";
import { MysqlCategoryRepository } from "./category.repository.js";
import { MysqlCustomerRepository } from "./customer.repository.js";
import { MysqlTicketRepository } from "./ticket.repository.js";

// Tao 3 repository that doc/ghi MySQL, kiem tra ket noi ngay (bao loi ro rang thay vi ECONNREFUSED
// mo ho o lan truy van dau tien). Dung trong src/server.js; KHONG dung trong test (xem tests/).
export async function createMysqlRepositories() {
  const pool = createPool();
  await assertConnection(pool);
  return {
    pool,
    customerRepository: new MysqlCustomerRepository(pool),
    ticketRepository: new MysqlTicketRepository(pool),
    categoryRepository: new MysqlCategoryRepository(pool)
  };
}

export { createPool } from "./pool.js";
