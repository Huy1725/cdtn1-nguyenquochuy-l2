import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Layout } from "./components/Layout.jsx";
import { CreateTicketPage } from "./pages/CreateTicketPage.jsx";
import { TicketDetailPage } from "./pages/TicketDetailPage.jsx";
import { TicketListPage } from "./pages/TicketListPage.jsx";
import "./styles.css";

function App() {
  const [view, setView] = useState("create");
  const [selectedId, setSelectedId] = useState(null);
  function openDetail(ticketId) { setSelectedId(ticketId); setView("detail"); }
  return <Layout view={view} setView={setView}>
    {view === "create" && <CreateTicketPage goDetail={(ticket) => openDetail(ticket.ticket_id)} />}
    {view === "tickets" && <TicketListPage onDetail={openDetail} onCreate={() => setView("create")} />}
    {view === "detail" && <TicketDetailPage ticketId={selectedId} goBack={() => setView("tickets")} />}
  </Layout>;
}

createRoot(document.getElementById("root")).render(<App />);
