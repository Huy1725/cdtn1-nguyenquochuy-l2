import { createHttpServer } from "./routes/index.js";
import { InMemoryCategoryRepository, InMemoryCustomerRepository, InMemoryTicketRepository } from "./repositories/in-memory.js";
import { ClassifyService } from "./services/classify-service.js";
import { CustomerService } from "./services/customer-service.js";
import { TicketService } from "./services/ticket-service.js";

// Ghep cac tang lai voi nhau, khong chua logic.
export function createApplication(options = {}) {
  const customerRepository = options.customerRepository ?? new InMemoryCustomerRepository();
  const ticketRepository = options.ticketRepository ?? new InMemoryTicketRepository();
  const categoryRepository = options.categoryRepository ?? new InMemoryCategoryRepository();
  const classifyService = new ClassifyService(categoryRepository);
  const customerService = new CustomerService({ customerRepository, ticketRepository });
  const ticketService = new TicketService({
    customerRepository,
    ticketRepository,
    classifyService,
    clock: options.clock
  });
  const corsOrigin = options.corsOrigin ?? process.env.CORS_ORIGIN ?? "http://localhost:5173";
  return {
    customerRepository,
    ticketRepository,
    categoryRepository,
    classifyService,
    customerService,
    ticketService,
    server: createHttpServer({ customerService, ticketService, classifyService }, { corsOrigin })
  };
}
