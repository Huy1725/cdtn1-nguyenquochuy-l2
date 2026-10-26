import React, { useEffect, useState } from "react";
import { ticketsApi } from "../api/tickets.api.js";
import { ErrorNotice } from "../components/ErrorNotice.jsx";
import { formatDate, priorityLabels, statuses, warrantyLabels } from "../components/labels.js";

export function TicketDetailPage({ ticketId, goBack }) {
  const [ticket, setTicket] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  async function load() {
    setLoadError(null); setTicket(null);
    try { setTicket(await ticketsApi.get(ticketId)); } catch (err) { setLoadError(err); }
  }
  useEffect(() => { load(); }, [ticketId]);

  async function changeStatus(event) {
    setBusy(true); setError(null);
    try { setTicket(await ticketsApi.updateStatus(ticketId, event.target.value, note)); setNote(""); } catch (err) { setError(err); } finally { setBusy(false); }
  }

  const back = <button className="back-link" onClick={goBack}>← Quay lại danh sách</button>;
  if (loadError) return <section>{back}<ErrorNotice error={loadError} onRetry={load} /></section>;
  if (!ticket) return <section>{back}<div className="card empty"><div className="spinner"></div><p>Đang tải chi tiết phiếu...</p></div></section>;

  return <section>
    {back}
    <div className="page-heading"><div><p className="eyebrow">L2 / CHI TIẾT PHIẾU</p><h1>{ticket.ticket_code}</h1><p className="subheading">Thông tin tiếp nhận, phân loại và lịch sử xử lý.</p></div><span className={`status large ${ticket.status.toLowerCase()}`}>{statuses[ticket.status]}</span></div>
    <ErrorNotice error={error} />
    <div className="detail-grid">
      <div className="card detail-card"><h2>Thông tin phiếu</h2><dl><dt>Khách hàng</dt><dd>KH-{String(ticket.customer_id).padStart(5, "0")}</dd><dt>Thiết bị / Serial</dt><dd>{ticket.serial_no}</dd><dt>Sự cố</dt><dd>{ticket.issue_desc}</dd><dt>Mức ưu tiên</dt><dd><span className={`priority-pill ${ticket.priority.toLowerCase()}`}>{priorityLabels[ticket.priority]}</span></dd><dt>Trạng thái bảo hành</dt><dd>{warrantyLabels[ticket.warranty_status]}</dd></dl></div>
      <div className="card detail-card deadline"><h2>Hạn cam kết trả máy</h2><div className="deadline-value">{formatDate(ticket.due_date, true)}</div><p>Tiếp nhận lúc {formatDate(ticket.received_at, true)}</p>
        <label className="field"><span>Ghi chú trao đổi</span><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú đi kèm lần cập nhật (tuỳ chọn)" /></label>
        <label className="field"><span>Cập nhật trạng thái</span><select value={ticket.status} onChange={changeStatus} disabled={busy}>{Object.entries(statuses).map(([key, value]) => <option value={key} key={key}>{key === "HUY" ? "Hủy phiếu" : value}</option>)}</select></label>
        <div className="timeline"><h3>Lịch sử trạng thái</h3>{ticket.status_log.map((log) => <div className="timeline-item" key={log.log_id}><span className="dot"></span><div><strong>{statuses[log.to_status]}</strong><small>{formatDate(log.changed_at, true)} · NV #{log.changed_by}</small>{log.note && <small>{log.note}</small>}</div></div>)}</div>
      </div>
    </div>
  </section>;
}
