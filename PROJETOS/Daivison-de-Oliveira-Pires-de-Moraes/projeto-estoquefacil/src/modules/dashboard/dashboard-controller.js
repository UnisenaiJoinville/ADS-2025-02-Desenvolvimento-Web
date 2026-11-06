import { AppError } from "../../shared/errors/app-error.js";
import * as service from "./dashboard-service.js";

export async function index(request, response) {
  const dashboard = await service.getDashboard();

  response.json(dashboard);
}

export async function daily(req, res) {
  const days = Number(req.query.days ?? 7);
  if (typeof req.query.days === "object" || ![7, 30, 90].includes(days))
    throw new AppError("days deve ser 7, 30 ou 90");
  res.json(await service.getDailyMovements(days));
}
