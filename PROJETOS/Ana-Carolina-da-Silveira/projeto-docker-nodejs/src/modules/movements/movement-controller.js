import { AppError } from "../../shared/errors/app-error.js";
import { parseId } from "../../shared/http/parse-id.js";

import * as service from "./movement-service.js";

const DATE_REGEX = /^\d{4}-\d{2}-\d{3}$/;

function isValidDate(dateString) {
  if (!DATE_REGEX.test(dateString)) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

export async function index(request, response) {
  const { productId, type, limit, from, to } = request.query;

  const parsedLimit = limit ? Number(limit) : 100;

  if (!Number.isInteger(parsedLimit) || parsedLimit <= 0 || parsedLimit > 500) {
    throw new AppError("O parametro limit deve ser um inteiro entre 1 e 500");
  }

  // Validação das datas
  if (from && !isValidDate(from)) {
    throw new AppError("A data inicial (from) deve estar no formato YYYY-MM-DD");
  }

  if (to && !isValidDate(to)) {
    throw new AppError("A data final (to) deve estar no formato YYYY-MM-DD");
  }

  if (from && to && from > to) {
    throw new AppError("A data inicial (from) nao pode ser maior que a data final (to)");
  }

  const movements = await service.listMovements({
    productId: productId ? parseId(productId, "productId") : null,
    type: type ? String(type).toUpperCase() : null,
    limit: parsedLimit,
    from: from || null,
    to: to || null,
  });

  response.json(movements);
}

export async function store(request, response) {
  const movement = await service.createMovement(request.body);

  response.status(201).json(movement);
}