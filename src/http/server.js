import { createServer } from "node:http";
import { AppError } from "../domain/errors.js";

async function readJson(request) {
  let body = "";
  for await (const chunk of request) body += chunk;
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch {
    throw new AppError(400, "INVALID_JSON", "Body phai la JSON hop le");
  }
}

function send(response, status, payload) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "http://localhost:5173",
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS"
  });
  response.end(JSON.stringify(payload));
}

export function createHttpServer({ customerService, ticketService }) {
  return createServer(async (request, response) => {
    try {
      if (request.method === "OPTIONS") {
        send(response, 204, {});
        return;
      }
      const url = new URL(request.url, "http://localhost");
      const segments = url.pathname.split("/").filter(Boolean);
      let result;
      let status = 200;

      if (request.method === "GET" && url.pathname === "/api/customers") {
        result = customerService.findByPhone(url.searchParams.get("phone"));
      } else if (request.method === "POST" && url.pathname === "/api/customers") {
        result = customerService.create(await readJson(request));
        status = 201;
      } else if (request.method === "PATCH" && segments[0] === "api" && segments[1] === "customers" && segments[2]) {
        result = customerService.update(segments[2], await readJson(request));
      } else if (request.method === "DELETE" && segments[0] === "api" && segments[1] === "customers" && segments[2]) {
        result = customerService.delete(segments[2]);
      } else if (request.method === "GET" && segments[0] === "api" && segments[1] === "customers" && segments[3] === "devices") {
        result = customerService.devices(segments[2]);
      } else if (request.method === "POST" && url.pathname === "/api/tickets") {
        result = ticketService.create(await readJson(request));
        status = 201;
      } else if (request.method === "GET" && url.pathname === "/api/tickets") {
        result = ticketService.list(Object.fromEntries(url.searchParams));
      } else if (request.method === "GET" && segments[0] === "api" && segments[1] === "tickets" && segments[2]) {
        result = ticketService.get(segments[2]);
      } else if (request.method === "PATCH" && segments[0] === "api" && segments[1] === "tickets" && segments[3] === "status") {
        const body = await readJson(request);
        result = ticketService.changeStatus(segments[2], body.status, body.actor);
      } else {
        throw new AppError(404, "NOT_FOUND", "Khong tim thay endpoint");
      }
      send(response, status, result);
    } catch (error) {
      const appError = error instanceof AppError
        ? error
        : new AppError(500, "INTERNAL_ERROR", "Loi may chu");
      send(response, appError.status, {
        error: { code: appError.code, message: appError.message, fields: appError.fields }
      });
    }
  });
}
