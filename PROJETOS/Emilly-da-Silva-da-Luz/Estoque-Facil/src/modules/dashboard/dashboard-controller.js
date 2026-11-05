import * as service from "./dashboard-service.js";

export async function index(request, response) {
  const dashboard = await service.getDashboard();

  response.json(dashboard);
}

export async function movementsByDay(request,response) { const days = Number(request.query.days ?? 7); if (![7,30,90].includes(days)) return response.status(400).json({error:'Periodo invalido'}); response.json(await service.getDailyMovements(days)); }
