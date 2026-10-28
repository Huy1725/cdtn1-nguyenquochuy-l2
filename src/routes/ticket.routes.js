import {
  validateCreateTicket,
  validateListQuery,
  validateStatusChange,
  validateTicketId
} from "../validators/ticket.validator.js";

export function ticketRoutes({ ticketService }) {
  return [
    {
      method: "POST",
      path: "/api/tickets",
      handle: async ({ json }) => ({ status: 201, body: await ticketService.create(validateCreateTicket(await json())) })
    },
    {
      method: "GET",
      path: "/api/tickets",
      handle: async ({ query }) => ({ body: await ticketService.list(validateListQuery(Object.fromEntries(query))) })
    },
    {
      method: "GET",
      path: "/api/tickets/:id",
      handle: async ({ params }) => ({ body: await ticketService.get(validateTicketId(params.id)) })
    },
    {
      method: "PATCH",
      path: "/api/tickets/:id/status",
      handle: async ({ params, json }) => ({
        body: await ticketService.changeStatus(validateTicketId(params.id), validateStatusChange(await json()))
      })
    }
  ];
}
