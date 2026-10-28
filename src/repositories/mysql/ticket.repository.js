import { fromSqlDateTime, toSqlDateTime } from "./pool.js";

function fromRow(row) {
  if (!row) return row;
  return { ...row, received_at: fromSqlDateTime(row.received_at), due_date: fromSqlDateTime(row.due_date) };
}

function logFromRow(row) {
  return { ...row, changed_at: fromSqlDateTime(row.changed_at) };
}

// Cung giao dien voi InMemoryTicketRepository. KHONG chua quy tac nghiep vu (QT-04, QT-13 nam o service).
export class MysqlTicketRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async existsForCustomer(customerId) {
    const [rows] = await this.pool.query("SELECT 1 FROM ticket WHERE customer_id = ? LIMIT 1", [Number(customerId)]);
    return rows.length > 0;
  }

  // Phieu moi: chen truoc voi ma tam (UNIQUE nhung chac chan khong trung), roi dat ma that
  // theo dung ticket_id vua duoc MySQL cap phat (AUTO_INCREMENT), tranh dua tranh giua cac request.
  async save(ticket) {
    if (ticket.ticket_id) {
      await this.pool.query(
        "UPDATE ticket SET customer_id=?, device_id=?, category_id=?, issue_desc=?, priority=?, status=?, received_at=?, due_date=? WHERE ticket_id=?",
        [
          ticket.customer_id, ticket.device_id, ticket.category_id, ticket.issue_desc, ticket.priority,
          ticket.status, toSqlDateTime(ticket.received_at), toSqlDateTime(ticket.due_date), ticket.ticket_id
        ]
      );
      return this.findById(ticket.ticket_id);
    }
    const placeholder = `BH-TMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const [result] = await this.pool.query(
      "INSERT INTO ticket (ticket_code, customer_id, device_id, category_id, issue_desc, priority, status, received_at, due_date) VALUES (?,?,?,?,?,?,?,?,?)",
      [
        placeholder, ticket.customer_id, ticket.device_id, ticket.category_id, ticket.issue_desc,
        ticket.priority, ticket.status, toSqlDateTime(ticket.received_at), toSqlDateTime(ticket.due_date)
      ]
    );
    const ticketId = result.insertId;
    const ticketCode = `BH-${String(ticketId).padStart(6, "0")}/${new Date(ticket.received_at).getUTCFullYear()}`;
    await this.pool.query("UPDATE ticket SET ticket_code = ? WHERE ticket_id = ?", [ticketCode, ticketId]);
    return this.findById(ticketId);
  }

  async findById(id) {
    const [rows] = await this.pool.query("SELECT * FROM ticket WHERE ticket_id = ? LIMIT 1", [Number(id)]);
    return rows[0] ? fromRow(rows[0]) : null;
  }

  async list({ status, page = 1, size = 20 } = {}) {
    const where = status ? "WHERE status = ?" : "";
    const params = status ? [status] : [];
    const [countRows] = await this.pool.query(`SELECT COUNT(*) AS total FROM ticket ${where}`, params);
    const [rows] = await this.pool.query(
      `SELECT * FROM ticket ${where} ORDER BY ticket_id DESC LIMIT ? OFFSET ?`,
      [...params, size, (page - 1) * size]
    );
    return { items: rows.map(fromRow), total: countRows[0].total, page, size };
  }

  // Nhat ky chi them moi, khong co ham sua/xoa (QT-13, NFR3).
  async appendStatusLog(ticketId, entry) {
    await this.pool.query(
      "INSERT INTO ticket_status_log (ticket_id, from_status, to_status, note, changed_by) VALUES (?,?,?,?,?)",
      [Number(ticketId), entry.from_status ?? null, entry.to_status, entry.note ?? null, entry.changed_by]
    );
  }

  async statusLog(ticketId) {
    const [rows] = await this.pool.query(
      "SELECT * FROM ticket_status_log WHERE ticket_id = ? ORDER BY log_id",
      [Number(ticketId)]
    );
    return rows.map(logFromRow);
  }
}
