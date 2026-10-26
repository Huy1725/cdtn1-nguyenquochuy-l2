import { request } from "./client.js";

export const ticketsApi = {
  findCustomer: (phone) => request(`/api/customers?phone=${encodeURIComponent(phone)}`),
  createCustomer: (data) => request("/api/customers", {
    method: "POST",
    body: JSON.stringify(data)
  }),
  create: (data) => request("/api/tickets", {
    method: "POST",
    body: JSON.stringify(data)
  }),
  list: (params = {}) => {
    const query = new URLSearchParams({ page: "1", size: "100", ...params });
    return request(`/api/tickets?${query}`);
  },
  get: (id) => request(`/api/tickets/${id}`),
  updateStatus: (id, status) => request(`/api/tickets/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, actor: "nhan_vien_tiep_nhan" })
  })
};
