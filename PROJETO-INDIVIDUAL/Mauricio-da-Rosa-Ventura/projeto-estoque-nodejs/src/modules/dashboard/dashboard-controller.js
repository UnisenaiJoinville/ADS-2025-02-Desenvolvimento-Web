import * as service from "./dashboard-service.js";

export async function index(request, response) {
  const dashboard = await service.getDashboard();

  response.json(dashboard);
}
