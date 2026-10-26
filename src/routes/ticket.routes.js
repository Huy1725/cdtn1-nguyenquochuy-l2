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
      handle: async ({ json }) => ({ status: 201, body: ticketService.create(validateCreateTicket(await json())) })
    },
    {
      method: "GET",
      path: "/api/tickets",
      handle: ({ query }) => ({ body: ticketService.list(validateListQuery(Object.fromEntries(query))) })
    },
    {
      method: "GET",
      path: "/api/tickets/:id",
      handle: ({ params }) => ({ body: ticketService.get(validateTicketId(params.id)) })
    },
    {
      method: "PATCH",
      path: "/api/tickets/:id/status",
      handle: async ({ params, json }) => ({
        body: ticketService.changeStatus(validateTicketId(params.id), validateStatusChange(await json()))
      })
    }
  ];
}
