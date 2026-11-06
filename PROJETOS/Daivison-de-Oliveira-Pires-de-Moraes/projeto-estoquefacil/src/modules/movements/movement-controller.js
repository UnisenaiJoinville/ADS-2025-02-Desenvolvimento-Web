import { dateRange } from "../../shared/http/input.js";
import { AppError } from "../../shared/errors/app-error.js";
import { parseId } from "../../shared/http/parse-id.js";

import * as service from "./movement-service.js";

export async function index(request, response) {
  const { productId, type, limit } = request.query;
  const period = dateRange(
    request.query.from ?? request.query.startDate,
    request.query.to ?? request.query.endDate,
  );
  if (type && !["IN", "OUT", "ADJUST"].includes(type))
    throw new AppError("Tipo invalido");

  const parsedLimit = limit ? Number(limit) : 100;

  if (!Number.isInteger(parsedLimit) || parsedLimit <= 0 || parsedLimit > 500) {
    throw new AppError("O parametro limit deve ser um inteiro entre 1 e 500");
  }

  const movements = await service.listMovements({
    ...period,
    productId: productId ? parseId(productId, "productId") : null,
    type: type ? String(type).toUpperCase() : null,
    limit: parsedLimit,
  });

  response.json(movements);
}

export async function store(request, response) {
  // request.user foi preenchido pelo ensureAuthenticated (Aula 27).
  const movement = await service.createMovement(request.body, request.user.id);

  response.status(201).json(movement);
}
