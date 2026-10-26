import { InMemoryCustomerRepository, InMemoryTicketRepository } from "./repositories/in-memory.js";
import { CustomerService } from "./services/customer-service.js";
import { TicketService } from "./services/ticket-service.js";
import { createHttpServer } from "./http/server.js";
import { pathToFileURL } from "node:url";

export function createApplication(options = {}) {
  const customerRepository = options.customerRepository ?? new InMemoryCustomerRepository();
  const ticketRepository = options.ticketRepository ?? new InMemoryTicketRepository();
  const customerService = new CustomerService(customerRepository);
  const ticketService = new TicketService({
    customerRepository,
    ticketRepository,
    clock: options.clock
  });
  return {
    customerRepository,
    ticketRepository,
    customerService,
    ticketService,
    server: createHttpServer({ customerService, ticketService })
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT ?? 3000);
  createApplication().server.listen(port, () => {
    console.log(`Warranty API listening on http://localhost:${port}`);
  });
}
