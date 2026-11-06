import { AppError, NotFoundError } from "../../shared/errors/app-error.js";

import * as repository from "./movement-repository.js";
import { validateMovementInput } from "./movement-validator.js";

export async function listMovements(filters) {
  return repository.findAll(filters);
}

// userId vem do token (request.user.id), nunca do corpo da requisicao:
// quem registrou a movimentacao e quem esta logado, e ponto.
export async function createMovement(input, userId = null) {
  const data = validateMovementInput(input);

  const result = await repository.createWithStockUpdate({ ...data, userId });

  if (result.status === "INACTIVE_PRODUCT")
    throw new AppError("Produto inativo nao recebe movimentacoes");
  if (result.status === "STOCK_OVERFLOW")
    throw new AppError("Saldo excede o limite permitido");
  if (result.status === "PRODUCT_NOT_FOUND") {
    throw new NotFoundError("Produto nao encontrado");
  }

  if (result.status === "INSUFFICIENT_STOCK") {
    throw new AppError(
      `Estoque insuficiente. Disponivel: ${result.available} unidade(s)`,
    );
  }

  return repository.findById(result.movementId);
}
