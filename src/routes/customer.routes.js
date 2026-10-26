import {
  validateCreateCustomer,
  validateCustomerId,
  validatePhoneQuery,
  validateUpdateCustomer
} from "../validators/customer.validator.js";

export function customerRoutes({ customerService }) {
  return [
    {
      method: "GET",
      path: "/api/customers",
      handle: ({ query }) => ({ body: customerService.findByPhone(validatePhoneQuery(query.get("phone"))) })
    },
    {
      method: "POST",
      path: "/api/customers",
      handle: async ({ json }) => ({
        status: 201,
        body: customerService.create(validateCreateCustomer(await json()))
      })
    },
    {
      method: "PATCH",
      path: "/api/customers/:id",
      handle: async ({ params, json }) => ({
        body: customerService.update(validateCustomerId(params.id), validateUpdateCustomer(await json()))
      })
    },
    {
      method: "DELETE",
      path: "/api/customers/:id",
      handle: ({ params }) => ({ body: customerService.delete(validateCustomerId(params.id)) })
    },
    {
      method: "GET",
      path: "/api/customers/:id/devices",
      handle: ({ params }) => ({ body: customerService.devices(validateCustomerId(params.id)) })
    }
  ];
}
