import React from "react";

export function Layout({ view, setView, staff, onLogout, children }) {
  return <div className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark">M</span><span><strong>Mekong Mobile</strong><small>Warranty service</small></span></div>
      <div className="staff"><span className="avatar">{staff.full_name.split(" ").pop().charAt(0)}</span><span>{staff.full_name} · {staff.username}</span><button className="secondary small" onClick={onLogout}>Đăng xuất</button></div></header>
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
