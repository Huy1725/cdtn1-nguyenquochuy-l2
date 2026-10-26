import React from "react";

export function ErrorNotice({ error, onRetry }) {
  if (!error) return null;
  return <div className="notice error"><strong>Không thể hoàn tất thao tác.</strong> {error.message}
    {onRetry && <button className="link-button" onClick={onRetry}>Thử lại</button>}</div>;
}
