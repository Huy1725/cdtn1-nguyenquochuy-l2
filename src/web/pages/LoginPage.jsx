import React, { useState } from "react";
import { authApi } from "../api/auth.api.js";
import { ErrorNotice } from "../components/ErrorNotice.jsx";
import { Field } from "../components/Field.jsx";

export function LoginPage({ onLoggedIn, expired }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true); setError(null);
    try { onLoggedIn(await authApi.login(username.trim(), password)); } catch (err) { setError(err); } finally { setBusy(false); }
  }

  return <div className="login-shell">
    <form className="card login-card" onSubmit={submit}>
      <div className="brand"><span className="brand-mark">M</span><span><strong>Mekong Mobile</strong><small>Warranty service</small></span></div>
      <h1>Đăng nhập</h1>
      <p className="subheading">Dành cho nhân viên tiếp nhận bảo hành.</p>
      {expired && !error && <div className="notice error">Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.</div>}
      <ErrorNotice error={error} />
      <Field label="Tên đăng nhập" required error={error?.fields?.username}>
        <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus />
      </Field>
      <Field label="Mật khẩu" required error={error?.fields?.password}>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
      </Field>
      <button className="primary login-submit" type="submit" disabled={busy}>{busy ? "Đang đăng nhập..." : "Đăng nhập"}</button>
    </form>
  </div>;
}
