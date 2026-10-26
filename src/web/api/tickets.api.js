import { request } from "./client.js";

export const ticketsApi = {
  findCustomer: (phone) => request(`/api/customers?phone=${encodeURIComponent(phone)}`),
  createCustomer: (data) => request("/api/customers", {
    method: "POST",
    body: JSON.stringify(data)
  }),
  devices: (customerId) => request(`/api/customers/${customerId}/devices`),
  categories: () => request("/api/categories"),
  create: (data) => request("/api/tickets", {
    method: "POST",
    body: JSON.stringify({ changed_by: 1, ...data })
  }),
  list: (params = {}) => {
    const query = new URLSearchParams({ page: "1", size: "100", ...params });
    return request(`/api/tickets?${query}`);
  },
  get: (id) => request(`/api/tickets/${id}`),
  updateStatus: (id, status, note) => request(`/api/tickets/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, note, changed_by: 1 })
  })
};
