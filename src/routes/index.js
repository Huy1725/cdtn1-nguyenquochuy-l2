import { createServer } from "node:http";
import { AppError } from "../errors/AppError.js";
import { authRoutes } from "./auth.routes.js";
import { categoryRoutes } from "./category.routes.js";
import { customerRoutes } from "./customer.routes.js";
import { bearerToken, compilePath, readJson, send, toErrorResponse } from "./http.js";
import { ticketRoutes } from "./ticket.routes.js";

const HEALTH_TIMEOUT_MS = 2000;

// true neu CSDL tra loi kip thoi; bat ky loi nao cung chi cho ra "down", khong lo chi tiet.
async function databaseIsUp(checkDb) {
  let timer;
  try {
    await Promise.race([
      checkDb(),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("timeout")), HEALTH_TIMEOUT_MS); })
    ]);
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

// checkDb: ham kiem tra CSDL (server.js truyen SELECT 1); staticHandler: phuc vu ban build giao dien (tuy chon).
export function createHttpServer(
  services,
  { corsOrigin, checkDb = async () => {}, staticHandler = null, logError = console.error }
) {
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

      // /health nam ngoai /api va khong can dang nhap: cong cu giam sat va docker compose goi vao day.
      if (request.method === "GET" && url.pathname === "/health") {
        const up = await databaseIsUp(checkDb);
        send(response, up ? 200 : 503, up ? { status: "ok", db: "up" } : { status: "degraded", db: "down" }, corsOrigin);
        return;
      }

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

      // Ngoai /api: neu co ban build giao dien thi phuc vu tep tinh (GET/HEAD).
      if (staticHandler && !url.pathname.startsWith("/api/") && ["GET", "HEAD"].includes(request.method)) {
        const file = await staticHandler(url.pathname);
        if (file) {
          response.writeHead(file.status, {
            "content-type": file.type,
            "cache-control": file.cache,
            "x-content-type-options": "nosniff"
          });
          response.end(request.method === "HEAD" ? undefined : file.body);
          return;
        }
      }
      throw new AppError("NOT_FOUND", "Khong tim thay endpoint");
    } catch (error) {
      const { status, body } = toErrorResponse(error);
      if (status >= 500) {
        // Loi may chu phai de lai dau vet cho nguoi van hanh, nhung CHI ghi phuong thuc, duong dan (bo query)
        // va ma loi: noi dung loi cua thu vien co the chua so dien thoai hoac cau SQL.
        logError(JSON.stringify({
          level: "error",
          method: request.method,
          path: String(request.url ?? "").split("?")[0],
          code: error.code ?? error.name
        }));
      }
      send(response, status, body, corsOrigin);
    }
  });
}
