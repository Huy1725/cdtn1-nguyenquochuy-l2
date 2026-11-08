import { createServer } from "node:http";
import { AppError } from "../errors/AppError.js";
import { authRoutes } from "./auth.routes.js";
import { categoryRoutes } from "./category.routes.js";
import { customerRoutes } from "./customer.routes.js";
import { bearerToken, compilePath, readJson, send, toErrorResponse } from "./http.js";
import { ticketRoutes } from "./ticket.routes.js";

export function createHttpServer(services, { corsOrigin }) {
  const routes = [
    ...authRoutes(services),
    ...customerRoutes(services),
    ...ticketRoutes(services),
    ...categoryRoutes(services)
  ].map((route) => ({ ...route, ...compilePath(route.path) }));

  return createServer(async (request, response) => {
    try {
      if (request.method === "OPTIONS") {
        send(response, 204, {}, corsOrigin);
        return;
      }
      const url = new URL(request.url, "http://localhost");
      for (const route of routes) {
        const found = route.regex.exec(url.pathname);
        if (route.method !== request.method || !found) continue;
        const params = Object.fromEntries(route.names.map((name, index) => [name, found[index + 1]]));
        // Mac dinh moi endpoint deu can dang nhap; chi route danh dau public moi bo qua (BUG-10).
        const actor = route.public ? null : await services.authService.authenticate(bearerToken(request));
        const { status = 200, body } = await route.handle({
          params,
          query: url.searchParams,
          json: () => readJson(request),
          actor
        });
        send(response, status, body, corsOrigin);
        return;
      }
      throw new AppError("NOT_FOUND", "Khong tim thay endpoint");
    } catch (error) {
      const { status, body } = toErrorResponse(error);
      send(response, status, body, corsOrigin);
    }
  });
}
