export function categoryRoutes({ classifyService }) {
  return [{ method: "GET", path: "/api/categories", handle: () => ({ body: classifyService.list() }) }];
}
