import { AppError, NotFoundError } from "../../shared/errors/app-error.js";

import * as repository from "./movement-repository.js";
import { validateDateRange, validateMovementInput } from "./movement-validator.js";

export async function listMovements(filters) {
  const { from, to } = validateDateRange(filters.from, filters.to);

  return repository.findAll({ ...filters, from, to });
}

export async function createMovement(input) {
  const data = validateMovementInput(input);

  const result = await repository.createWithStockUpdate(data);

  if (result.status === "PRODUCT_NOT_FOUND") {
    throw new NotFoundError("Produto nao encontrado");
  }

  if (result.status === "INSUFFICIENT_STOCK") {
    throw new AppError(
      `Estoque insuficiente. Disponivel: ${result.available} unidade(s)`
    );
  }

  if (result.status === "NO_CHANGE") {
    throw new AppError("A contagem informada e igual ao estoque atual, nada para ajustar");
  }

  return repository.findById(result.movementId);
}
