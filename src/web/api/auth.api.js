import { request, setToken } from "./client.js";

export const authApi = {
  async login(username, password) {
    const result = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });
    setToken(result.token);
    return result.staff;
  },
  me: () => request("/api/auth/me"),
  logout: () => setToken(null)
};
