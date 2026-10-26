import React, { useEffect, useState } from "react";
import { ticketsApi } from "../api/tickets.api.js";
import { ErrorNotice } from "../components/ErrorNotice.jsx";
import { formatDate, isDueSoon, priorityLabels, statuses } from "../components/labels.js";

export function TicketListPage({ onDetail, onCreate }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");

  async function load() {
    setError(null); setData(null);
    try {
      setData(await ticketsApi.list(filter ? { status: filter } : {}));
    } catch (err) { setError(err); }
  }
  useEffect(() => { load(); }, [filter]);

  const closed = (ticket) => ticket.status === "HUY" || ticket.status === "HOAN_TAT";

  return <section>
    <div className="page-heading"><div><p className="eyebrow">L2 / THEO DÕI</p><h1>Theo dõi phiếu bảo hành</h1><p className="subheading">Theo dõi trạng thái xử lý và hạn cam kết trả máy.</p></div><button className="primary" onClick={onCreate}>＋ Tạo phiếu mới</button></div>
    <ErrorNotice error={error} onRetry={load} />
    <div className="toolbar"><div className="tabs"><button className={!filter ? "tab active" : "tab"} onClick={() => setFilter("")}>Tất cả</button>{Object.entries(statuses).map(([key, value]) => <button className={filter === key ? "tab active" : "tab"} onClick={() => setFilter(key)} key={key}>{value}</button>)}</div><button className="secondary small" onClick={load}>↻ Làm mới</button></div>
    {error ? null : !data
      ? <div className="card empty"><div className="spinner"></div><p>Đang tải danh sách phiếu...</p></div>
      : data.items.length === 0
        ? <div className="card empty"><span className="empty-icon">▤</span><h3>{filter ? "Không có phiếu phù hợp" : "Chưa có phiếu bảo hành"}</h3><p>{filter ? "Hãy thử thay đổi bộ lọc trạng thái." : "Tạo phiếu đầu tiên để bắt đầu theo dõi."}</p>{filter && <button className="secondary" onClick={() => setFilter("")}>Xóa bộ lọc</button>}</div>
        : <div className="card table-wrap"><table><thead><tr><th>Mã phiếu</th><th>Khách hàng</th><th>Sự cố / thiết bị</th><th>Ưu tiên</th><th>Hạn cam kết</th><th>Trạng thái</th><th></th></tr></thead><tbody>{data.items.map((ticket) => <tr key={ticket.ticket_id}><td><button className="ticket-link" onClick={() => onDetail(ticket.ticket_id)}>{ticket.ticket_code}</button><small>{formatDate(ticket.received_at)}</small></td><td>KH-{String(ticket.customer_id).padStart(5, "0")}</td><td><strong>TB-{ticket.device_id}</strong><small>{ticket.issue_desc}</small></td><td><span className={`priority-pill ${ticket.priority.toLowerCase()}`}>{priorityLabels[ticket.priority]}</span></td><td className={isDueSoon(ticket.due_date) && !closed(ticket) ? "due-soon" : ""}>{formatDate(ticket.due_date)}</td><td><span className={`status ${ticket.status.toLowerCase()}`}>{statuses[ticket.status]}</span></td><td><button className="icon-button" onClick={() => onDetail(ticket.ticket_id)}>›</button></td></tr>)}</tbody></table></div>}
  </section>;
}
