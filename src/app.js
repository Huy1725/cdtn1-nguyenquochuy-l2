import { randomBytes } from "node:crypto";
import { createHttpServer } from "./routes/index.js";
import { createStaticHandler } from "./routes/static.js";
import {
  InMemoryCategoryRepository,
  InMemoryCustomerRepository,
  InMemoryStaffRepository,
  InMemoryTicketRepository
} from "./repositories/in-memory.js";
import { AuthService } from "./services/auth-service.js";
import { ClassifyService } from "./services/classify-service.js";
import { CustomerService } from "./services/customer-service.js";
import { TicketService } from "./services/ticket-service.js";

// Ghep cac tang lai voi nhau, khong chua logic.
export function createApplication(options = {}) {
  const customerRepository = options.customerRepository ?? new InMemoryCustomerRepository();
  const ticketRepository = options.ticketRepository ?? new InMemoryTicketRepository();
  const categoryRepository = options.categoryRepository ?? new InMemoryCategoryRepository();
  const staffRepository = options.staffRepository ?? new InMemoryStaffRepository();
  const classifyService = new ClassifyService(categoryRepository);
  const customerService = new CustomerService({ customerRepository, ticketRepository });
  const ticketService = new TicketService({
    customerRepository,
    ticketRepository,
    classifyService,
    staffRepository,
    clock: options.clock
  });
  // server.js bat buoc JWT_SECRET; khi chay test khong co thi dung khoa ngau nhien cho rieng tien trinh.
  const authService = new AuthService({
    staffRepository,
    secret: options.jwtSecret ?? process.env.JWT_SECRET ?? randomBytes(32).toString("hex"),
    clock: options.clock
  });
  const corsOrigin = options.corsOrigin ?? process.env.CORS_ORIGIN ?? "http://localhost:5173";
  return {
    customerRepository,
    ticketRepository,
    categoryRepository,
    staffRepository,
    classifyService,
    customerService,
    ticketService,
    authService,
    server: createHttpServer(
      { customerService, ticketService, classifyService, authService },
      {
        corsOrigin,
        checkDb: options.checkDb,
        logError: options.logError,
        staticHandler: options.staticDir ? createStaticHandler(options.staticDir) : null
      }
    )
  };
}
