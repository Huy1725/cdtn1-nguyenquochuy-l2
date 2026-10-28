export function categoryRoutes({ classifyService }) {
  return [{ method: "GET", path: "/api/categories", handle: async () => ({ body: await classifyService.list() }) }];
}
