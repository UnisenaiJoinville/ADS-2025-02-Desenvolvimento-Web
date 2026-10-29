import { AppError } from "../../shared/errors/app-error.js";

import * as service from "./dashboard-service.js";

// Lista branca de periodos (Aula 68). O grafico so oferece estes,
// e a API nao precisa aceitar outros.
const ALLOWED_DAYS = [7, 30, 90];

export async function index(request, response) {
  const dashboard = await service.getDashboard();

  response.json(dashboard);
}

export async function movementsByDay(request, response) {
  const days = request.query.days === undefined ? 30 : Number(request.query.days);

  if (!ALLOWED_DAYS.includes(days)) {
    throw new AppError(`O parametro days deve ser um destes: ${ALLOWED_DAYS.join(", ")}`);
  }

  const rows = await service.getDailyMovements(days);

  response.json(rows);
}
