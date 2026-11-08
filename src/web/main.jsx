import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { authApi } from "./api/auth.api.js";
import { getToken, SESSION_EXPIRED_EVENT } from "./api/client.js";
import { Layout } from "./components/Layout.jsx";
import { CreateTicketPage } from "./pages/CreateTicketPage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { TicketDetailPage } from "./pages/TicketDetailPage.jsx";
import { TicketListPage } from "./pages/TicketListPage.jsx";
import "./styles.css";

function App() {
  const [staff, setStaff] = useState(null);
  const [checking, setChecking] = useState(Boolean(getToken()));
  const [expired, setExpired] = useState(false);
  const [view, setView] = useState("create");
  const [selectedId, setSelectedId] = useState(null);

  // Tai lai trang ma token con han thi khoi phai dang nhap lai.
  useEffect(() => {
    if (getToken()) authApi.me().then(setStaff).catch(() => setStaff(null)).finally(() => setChecking(false));
    const onExpired = () => { setStaff(null); setExpired(true); };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  function logout() { authApi.logout(); setStaff(null); setExpired(false); setView("create"); }
  function openDetail(ticketId) { setSelectedId(ticketId); setView("detail"); }

  if (checking) return <div className="login-shell"><div className="spinner"></div></div>;
  if (!staff) return <LoginPage expired={expired} onLoggedIn={(member) => { setStaff(member); setExpired(false); }} />;

  return <Layout view={view} setView={setView} staff={staff} onLogout={logout}>
    {view === "create" && <CreateTicketPage goDetail={(ticket) => openDetail(ticket.ticket_id)} />}
    {view === "tickets" && <TicketListPage onDetail={openDetail} onCreate={() => setView("create")} />}
    {view === "detail" && <TicketDetailPage ticketId={selectedId} staff={staff} goBack={() => setView("tickets")} />}
  </Layout>;
}

createRoot(document.getElementById("root")).render(<App />);
