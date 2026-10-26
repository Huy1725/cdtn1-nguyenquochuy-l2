import React, { useEffect, useState } from "react";
import { ticketsApi } from "../api/tickets.api.js";
import { ErrorNotice } from "../components/ErrorNotice.jsx";
import { Field } from "../components/Field.jsx";
import { priorities } from "../components/labels.js";

const HOURS = { CAO: "24 giờ", TRUNG_BINH: "72 giờ", THAP: "120 giờ" };

export function CreateTicketPage({ goDetail }) {
  const [phone, setPhone] = useState("");
  const [customer, setCustomer] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState("");
  const [serial, setSerial] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [issue, setIssue] = useState("");
  const [priority, setPriority] = useState("TRUNG_BINH");
  const [external, setExternal] = useState(false);
  const [sourceNote, setSourceNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => { ticketsApi.categories().then(setCategories).catch(() => setCategories([])); }, []);

  function changePhone(value) {
    setPhone(value); setCustomer(null); setDevices([]); setDeviceId("");
  }

  async function lookup() {
    setBusy(true); setError(null); setMessage("");
    try {
      const found = await ticketsApi.findCustomer(phone);
      if (found) {
        const list = await ticketsApi.devices(found.customer_id);
        setCustomer(found); setCustomerName(found.full_name); setDevices(list);
        setDeviceId(list[0] ? String(list[0].device_id) : ""); setExternal(list.length === 0);
        setMessage("Đã tìm thấy hồ sơ khách hàng.");
      } else {
        setCustomer(null); setCustomerName(""); setDevices([]); setDeviceId(""); setExternal(true);
        setMessage("Chưa có hồ sơ. Vui lòng nhập họ tên để tạo khách hàng mới.");
      }
    } catch (err) { setError(err); } finally { setBusy(false); }
  }

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(null); setMessage("");
    try {
      const current = customer ?? await ticketsApi.createCustomer({ phone, full_name: customerName });
      const ticket = await ticketsApi.create({
        customer_id: current.customer_id, issue_desc: issue, priority,
        category_id: categoryId ? Number(categoryId) : null,
        ...(external ? { external_device: true, serial_no: serial, source_note: sourceNote } : { device_id: Number(deviceId) })
      });
      goDetail(ticket);
    } catch (err) { setError(err); } finally { setBusy(false); }
  }

  return <section>
    <div className="page-heading"><div><p className="eyebrow">L2 / TIẾP NHẬN</p><h1>Tạo phiếu bảo hành</h1><p className="subheading">Ghi nhận thông tin khách hàng, thiết bị và phân loại sự cố.</p></div></div>
    <ErrorNotice error={error} />
    {message && <div className="notice success">{message}</div>}
    <form className="card form-card" onSubmit={submit}>
      <div className="section-title"><span className="number">1</span><div><h2>Tra cứu khách hàng</h2><p>Nhập số điện thoại để tải hồ sơ và lịch sử thiết bị.</p></div></div>
      <div className="lookup-row"><Field label="Số điện thoại" required error={error?.fields?.phone}><input value={phone} onChange={(e) => changePhone(e.target.value)} placeholder="0901234567" /></Field><button type="button" className="secondary" onClick={lookup} disabled={busy}>Tra cứu</button></div>
      <div className="form-grid"><Field label="Họ tên khách hàng" required error={error?.fields?.full_name}><input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nguyễn Văn A" /></Field><Field label="Mã khách hàng"><input value={customer?.customer_id ? `KH-${String(customer.customer_id).padStart(5, "0")}` : "Tạo mới sau khi lưu"} readOnly /></Field></div>
      <hr />
      <div className="section-title"><span className="number">2</span><div><h2>Thông tin thiết bị</h2><p>Ghi nhận thiết bị khách hàng bàn giao.</p></div></div>
      <div className="form-grid">{external ? <Field label="Serial / IMEI (nhập tay)" required error={error?.fields?.serial_no}><input value={serial} onChange={(e) => setSerial(e.target.value)} /></Field> : <Field label="Thiết bị đã mua" required error={error?.fields?.device_id}><select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>{devices.map((d) => <option key={d.device_id} value={d.device_id}>{d.serial_no}</option>)}</select></Field>}<Field label="Nguồn thiết bị"><label className="check"><input type="checkbox" checked={external} onChange={(e) => setExternal(e.target.checked)} /> Thiết bị ngoài lịch sử mua hàng</label></Field></div>
      {external && <Field label="Ghi chú nguồn gốc" required error={error?.fields?.source_note}><input value={sourceNote} onChange={(e) => setSourceNote(e.target.value)} placeholder="Nhập nguồn gốc thiết bị" /></Field>}
      <Field label="Mô tả sự cố" required error={error?.fields?.issue_desc}><textarea value={issue} onChange={(e) => setIssue(e.target.value)} rows="4" placeholder="Mô tả tình trạng thiết bị..." /></Field>
      <hr />
      <div className="section-title"><span className="number">3</span><div><h2>Phân loại và hạn cam kết</h2><p>Mức ưu tiên quyết định thời gian trả máy tự động.</p></div></div>
      <Field label="Nhóm sự cố" error={error?.fields?.category_id}><select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}><option value="">Tự động đề xuất theo mô tả</option>{categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}</select></Field>
      <Field label="Mức ưu tiên" required error={error?.fields?.priority}><div className="priority-group">{priorities.map(([value, label]) => <label className={`priority ${priority === value ? "selected" : ""}`} key={value}><input type="radio" name="priority" value={value} checked={priority === value} onChange={(e) => setPriority(e.target.value)} /><span>{label}</span><small>{HOURS[value]}</small></label>)}</div></Field>
      <div className="form-actions"><button type="submit" className="primary" disabled={busy}>{busy ? "Đang lưu..." : "Tạo phiếu bảo hành"} <span>→</span></button></div>
    </form>
  </section>;
}
