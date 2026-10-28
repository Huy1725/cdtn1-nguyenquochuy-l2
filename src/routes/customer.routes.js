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
      handle: async ({ query }) => ({ body: await customerService.findByPhone(validatePhoneQuery(query.get("phone"))) })
    },
    {
      method: "POST",
      path: "/api/customers",
      handle: async ({ json }) => ({
        status: 201,
        body: await customerService.create(validateCreateCustomer(await json()))
      })
    },
    {
      method: "PATCH",
      path: "/api/customers/:id",
      handle: async ({ params, json }) => ({
        body: await customerService.update(validateCustomerId(params.id), validateUpdateCustomer(await json()))
      })
    },
    {
      method: "DELETE",
      path: "/api/customers/:id",
      handle: async ({ params }) => ({ body: await customerService.delete(validateCustomerId(params.id)) })
    },
    {
      method: "GET",
      path: "/api/customers/:id/devices",
      handle: async ({ params }) => ({ body: await customerService.devices(validateCustomerId(params.id)) })
    }
  ];
}
