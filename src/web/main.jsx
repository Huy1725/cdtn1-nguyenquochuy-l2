import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { ticketsApi } from "../api/tickets.api.js";
import "../styles.css";

const priorities = [
  ["THAP", "Thấp"],
  ["TRUNG_BINH", "Trung bình"],
  ["CAO", "Cao"]
];
const statuses = { MOI: "Mới tiếp nhận", DANG_XU_LY: "Đang xử lý", HOAN_TAT: "Hoàn tất", DA_HUY: "Đã hủy" };
const priorityLabels = Object.fromEntries(priorities);

function ErrorNotice({ error, onRetry }) {
  if (!error) return null;
  return <div className="notice error"><strong>Không thể hoàn tất thao tác.</strong> {error.message}
    {onRetry && <button className="link-button" onClick={onRetry}>Thử lại</button>}</div>;
}

function Field({ label, required, error, children }) {
  return <label className="field"><span>{label}{required && <b> *</b>}</span>{children}{error && <small className="field-error">{error}</small>}</label>;
}

function Layout({ view, setView, children }) {
  return <div className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark">M</span><span><strong>Mekong Mobile</strong><small>Warranty service</small></span></div><div className="staff">NV tiếp nhận <span className="avatar">AB</span></div></header>
    <div className="workspace">
      <aside className="sidebar"><div className="side-caption">QUẢN LÝ BẢO HÀNH</div>
        <button className={view === "create" ? "nav active" : "nav"} onClick={() => setView("create")}><span>＋</span> Tiếp nhận phiếu</button>
        <button className={view === "tickets" ? "nav active" : "nav"} onClick={() => setView("tickets")}><span>▤</span> Theo dõi phiếu</button>
        <button className={view === "detail" ? "nav active" : "nav"} disabled><span>◉</span> Chi tiết phiếu</button>
      </aside>
      <main className="content">{children}</main>
    </div>
  </div>;
}

function CreateTicket({ goDetail }) {
  const [phone, setPhone] = useState("0901234567");
  const [customer, setCustomer] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [serial, setSerial] = useState("A001");
  const [issue, setIssue] = useState("Máy bị vào nước không lên nguồn");
  const [priority, setPriority] = useState("TRUNG_BINH");
  const [external, setExternal] = useState(false);
  const [sourceNote, setSourceNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");

  async function lookup() {
    setBusy(true); setError(null); setMessage("");
    try {
      const found = await ticketsApi.findCustomer(phone);
      if (found) { setCustomer(found); setCustomerName(found.full_name); setMessage("Đã tìm thấy hồ sơ khách hàng."); }
      else { setCustomer(null); setCustomerName(""); setMessage("Chưa có hồ sơ. Vui lòng nhập họ tên để tạo khách hàng mới."); }
    } catch (err) { setError(err); } finally { setBusy(false); }
  }

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(null); setMessage("");
    try {
      let current = customer;
      if (!current) current = await ticketsApi.createCustomer({ phone, full_name: customerName });
      const ticket = await ticketsApi.create({
        customer_id: current.id, serial, issue_desc: issue, priority,
        external_device: external, source_note: sourceNote
      });
      goDetail(ticket);
    } catch (err) { setError(err); } finally { setBusy(false); }
  }

  return <section>
    <div className="page-heading"><div><p className="eyebrow">L2 / TIẾP NHẬN</p><h1>Tạo phiếu bảo hành</h1><p className="subheading">Ghi nhận thông tin khách hàng, thiết bị và phân loại sự cố.</p></div><span className="step">Bước 1 / 3</span></div>
    <ErrorNotice error={error} />
    {message && <div className="notice success">{message}</div>}
    <form className="card form-card" onSubmit={submit}>
      <div className="section-title"><span className="number">1</span><div><h2>Tra cứu khách hàng</h2><p>Nhập số điện thoại để tải hồ sơ và lịch sử thiết bị.</p></div></div>
      <div className="lookup-row"><Field label="Số điện thoại" required error={error?.fields?.phone}><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0901234567" /></Field><button type="button" className="secondary" onClick={lookup} disabled={busy}>Tra cứu</button></div>
      <div className="form-grid"><Field label="Họ tên khách hàng" required error={error?.fields?.full_name}><input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nguyễn Văn A" /></Field><Field label="Mã khách hàng"><input value={customer?.id ? `KH-${String(customer.id).padStart(5, "0")}` : "Tạo mới sau khi lưu"} readOnly /></Field></div>
      <hr />
      <div className="section-title"><span className="number">2</span><div><h2>Thông tin thiết bị</h2><p>Ghi nhận thiết bị khách hàng bàn giao.</p></div></div>
      <div className="form-grid"><Field label="Serial thiết bị" required error={error?.fields?.serial}><input value={serial} onChange={(e) => setSerial(e.target.value)} /></Field><Field label="Nguồn thiết bị"><label className="check"><input type="checkbox" checked={external} onChange={(e) => setExternal(e.target.checked)} /> Thiết bị ngoài lịch sử mua hàng</label></Field></div>
      {external && <Field label="Ghi chú nguồn gốc" required><input value={sourceNote} onChange={(e) => setSourceNote(e.target.value)} placeholder="Nhập nguồn gốc thiết bị" /></Field>}
      <Field label="Mô tả sự cố" required error={error?.fields?.issue_desc}><textarea value={issue} onChange={(e) => setIssue(e.target.value)} rows="4" placeholder="Mô tả tình trạng thiết bị..." /></Field>
      <hr />
      <div className="section-title"><span className="number">3</span><div><h2>Phân loại và hạn cam kết</h2><p>Mức ưu tiên quyết định thời gian trả máy tự động.</p></div></div>
      <Field label="Mức ưu tiên" required error={error?.fields?.priority}><div className="priority-group">{priorities.map(([value, label]) => <label className={`priority ${priority === value ? "selected" : ""}`} key={value}><input type="radio" name="priority" value={value} checked={priority === value} onChange={(e) => setPriority(e.target.value)} /><span>{label}</span><small>{value === "CAO" ? "24 giờ" : value === "TRUNG_BINH" ? "72 giờ" : "120 giờ"}</small></label>)}</div></Field>
      <div className="form-actions"><button type="button" className="ghost" onClick={() => window.location.reload()}>Hủy</button><button type="submit" className="primary" disabled={busy}>{busy ? "Đang lưu..." : "Tạo phiếu bảo hành"} <span>→</span></button></div>
    </form>
  </section>;
}

function TicketList({ onDetail }) {
  const [data, setData] = useState(null); const [error, setError] = useState(null); const [filter, setFilter] = useState("");
  async function load() { setError(null); try { setData(await ticketsApi.list(filter ? { status: filter } : {})); } catch (err) { setError(err); } }
  useEffect(() => { load(); }, [filter]);
  return <section><div className="page-heading"><div><p className="eyebrow">L2 / THEO DÕI</p><h1>Theo dõi phiếu bảo hành</h1><p className="subheading">Theo dõi trạng thái xử lý và hạn cam kết trả máy.</p></div><button className="primary" onClick={() => onDetail(null)}>＋ Tạo phiếu mới</button></div>
    <ErrorNotice error={error} onRetry={load} /><div className="toolbar"><div className="tabs"><button className={!filter ? "tab active" : "tab"} onClick={() => setFilter("")}>Tất cả</button>{Object.entries(statuses).slice(0, 3).map(([key, value]) => <button className={filter === key ? "tab active" : "tab"} onClick={() => setFilter(key)} key={key}>{value}</button>)}</div><button className="secondary small" onClick={load}>↻ Làm mới</button></div>
    {!data ? <div className="card empty"><div className="spinner"></div><p>Đang tải danh sách phiếu...</p></div> : data.items.length === 0 ? <div className="card empty"><span className="empty-icon">▤</span><h3>{filter ? "Không có phiếu phù hợp" : "Chưa có phiếu bảo hành"}</h3><p>{filter ? "Hãy thử thay đổi bộ lọc trạng thái." : "Tạo phiếu đầu tiên để bắt đầu theo dõi."}</p></div> : <div className="card table-wrap"><table><thead><tr><th>Mã phiếu</th><th>Khách hàng</th><th>Sự cố / thiết bị</th><th>Ưu tiên</th><th>Hạn cam kết</th><th>Trạng thái</th><th></th></tr></thead><tbody>{data.items.map((ticket) => <tr key={ticket.id}><td><button className="ticket-link" onClick={() => onDetail(ticket)}>{ticket.ticket_code}</button><small>{formatDate(ticket.received_at)}</small></td><td>KH-{String(ticket.customer_id).padStart(5, "0")}</td><td><strong>{ticket.serial}</strong><small>{ticket.issue_desc}</small></td><td><span className={`priority-pill ${ticket.priority.toLowerCase()}`}>{priorityLabels[ticket.priority]}</span></td><td className={isDueSoon(ticket.due_date) ? "due-soon" : ""}>{formatDate(ticket.due_date)}</td><td><span className={`status ${ticket.status.toLowerCase()}`}>{statuses[ticket.status]}</span></td><td><button className="icon-button" onClick={() => onDetail(ticket)}>›</button></td></tr>)}</tbody></table></div>}
  </section>;
}

function Detail({ ticket, goBack, refresh }) {
  const [current, setCurrent] = useState(ticket); const [error, setError] = useState(null); const [busy, setBusy] = useState(false);
  useEffect(() => { if (ticket?.id) ticketsApi.get(ticket.id).then(setCurrent).catch(setError); }, [ticket]);
  if (!current) return <CreateTicket goDetail={refresh} />;
  async function changeStatus(event) { setBusy(true); setError(null); try { setCurrent(await ticketsApi.updateStatus(current.id, event.target.value)); } catch (err) { setError(err); } finally { setBusy(false); } }
  return <section><button className="back-link" onClick={goBack}>← Quay lại danh sách</button><div className="page-heading"><div><p className="eyebrow">L2 / CHI TIẾT PHIẾU</p><h1>{current.ticket_code}</h1><p className="subheading">Thông tin tiếp nhận, phân loại và lịch sử xử lý.</p></div><span className={`status large ${current.status.toLowerCase()}`}>{statuses[current.status]}</span></div><ErrorNotice error={error} />
    <div className="detail-grid"><div className="card detail-card"><h2>Thông tin phiếu</h2><dl><dt>Họ tên khách hàng</dt><dd>Khách hàng #{current.customer_id}</dd><dt>Thiết bị / Serial</dt><dd>{current.serial}</dd><dt>Sự cố</dt><dd>{current.issue_desc}</dd><dt>Mức ưu tiên</dt><dd><span className={`priority-pill ${current.priority.toLowerCase()}`}>{priorityLabels[current.priority]}</span></dd><dt>Trạng thái bảo hành</dt><dd>{current.warranty_status === "CON_BAO_HANH" ? "Còn bảo hành" : current.warranty_status === "HET_BAO_HANH" ? "Hết bảo hành" : "Chưa xác minh"}</dd></dl></div><div className="card detail-card deadline"><h2>Hạn cam kết trả máy</h2><div className="deadline-value">{formatDate(current.due_date, true)}</div><p>Tiếp nhận lúc {formatDate(current.received_at)}</p><label className="field"><span>Cập nhật trạng thái</span><select value={current.status} onChange={changeStatus} disabled={busy}>{Object.entries(statuses).map(([key, value]) => <option value={key} key={key}>{value}</option>)}</select></label><div className="timeline"><h3>Lịch sử trạng thái</h3>{(current.status_log ?? []).map((log, index) => <div className="timeline-item" key={`${log.created_at}-${index}`}><span className="dot"></span><div><strong>{statuses[log.to_status]}</strong><small>{formatDate(log.created_at, true)} · {log.actor}</small></div></div>)}</div></div></div>
  </section>;
}

function formatDate(value, withTime = false) { if (!value) return "—"; return new Intl.DateTimeFormat("vi-VN", withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }).format(new Date(value)); }
function isDueSoon(value) { return new Date(value).getTime() - Date.now() < 86_400_000; }

function App() {
  const [view, setView] = useState("create"); const [selected, setSelected] = useState(null);
  function detail(ticket) { setSelected(ticket); setView("detail"); }
  return <Layout view={view} setView={setView}>{view === "create" && <CreateTicket goDetail={(ticket) => detail(ticket)} />}{view === "tickets" && <TicketList onDetail={detail} />}{view === "detail" && <Detail ticket={selected} goBack={() => setView("tickets")} refresh={(ticket) => detail(ticket)} />}</Layout>;
}

createRoot(document.getElementById("root")).render(<App />);
