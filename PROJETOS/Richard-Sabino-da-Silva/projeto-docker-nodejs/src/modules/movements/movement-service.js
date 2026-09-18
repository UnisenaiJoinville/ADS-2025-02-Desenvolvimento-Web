import { AppError, NotFoundError } from "../../shared/errors/app-error.js";

import * as repository from "./movement-repository.js";
import { validateMovementInput } from "./movement-validator.js";

export async function listMovements(filters) {
  return repository.findAll(filters);
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

  return repository.findById(result.movementId);
}