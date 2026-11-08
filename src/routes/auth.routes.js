import { validateLogin } from "../validators/auth.validator.js";

export function authRoutes({ authService }) {
  return [
    {
      method: "POST",
      path: "/api/auth/login",
      public: true, // endpoint duy nhat duoi /api khong can token
      handle: async ({ json }) => ({ body: await authService.login(validateLogin(await json())) })
    },
    {
      method: "GET",
      path: "/api/auth/me",
      handle: async ({ actor }) => ({ body: actor })
    }
  ];
}
