import { AppError } from "../../shared/errors/app-error.js";

const VALID_TYPES = ["IN", "OUT"];

export function validateMovementInput(input) {
  const productId = Number(input?.productId);

  if (!Number.isInteger(productId) || productId <= 0) {
    throw new AppError("Produto invalido");
  }

  const type = String(input?.type ?? "").trim().toUpperCase();

  if (!VALID_TYPES.includes(type)) {
    throw new AppError('O tipo deve ser "IN" (entrada) ou "OUT" (saida)');
  }

  const quantity = Number(input?.quantity);

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new AppError("A quantidade deve ser um numero inteiro maior que zero");
  }

  const note = String(input?.note ?? "").trim().replace(/\s+/g, " ");

  if (note.length > 180) {
    throw new AppError("A observacao deve ter no maximo 180 caracteres");
  }

  return { productId, type, quantity, note: note || null };
}
