import { AppError } from "../../shared/errors/app-error.js";

const VALID_TYPES = ["IN", "OUT", "ADJUST"];

// Datas no formato YYYY-MM-DD
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function validateMovementInput(input) {
  const productId = Number(input?.productId);

  if (!Number.isInteger(productId) || productId <= 0) {
    throw new AppError("Produto invalido");
  }

  const type = String(input?.type ?? "").trim().toUpperCase();

  if (!VALID_TYPES.includes(type)) {
    throw new AppError('O tipo deve ser "IN" (entrada), "OUT" (saida) ou "ADJUST" (ajuste)');
  }

  const quantity = Number(input?.quantity);

  // Exercicio 2.3 — no ADJUST, "quantity" e a CONTAGEM ATUAL informada pelo
  // usuario (ex.: "contei e tem 37 unidades"), entao zero e um valor valido.
  // Em IN/OUT continua sendo a quantidade movimentada, que precisa ser > 0.
  if (type === "ADJUST") {
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new AppError("A contagem informada deve ser um numero inteiro maior ou igual a zero");
    }
  } else if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new AppError("A quantidade deve ser um numero inteiro maior que zero");
  }

  const note = String(input?.note ?? "").trim().replace(/\s+/g, " ");

  if (note.length > 180) {
    throw new AppError("A observacao deve ter no maximo 180 caracteres");
  }

  return {
    productId,
    type,
    quantity,
    note: note || null,
  };
}

// Exercicio 2.4 — filtro por periodo.
export function validateDateRange(from, to) {
  if (!from && !to) {
    return { from: null, to: null };
  }

  if (from && !DATE_PATTERN.test(from)) {
    throw new AppError("Parametro from invalido. Use o formato AAAA-MM-DD");
  }

  if (to && !DATE_PATTERN.test(to)) {
    throw new AppError("Parametro to invalido. Use o formato AAAA-MM-DD");
  }

  if (from && to && from > to) {
    throw new AppError("O parametro from nao pode ser posterior ao parametro to");
  }

  return { from: from || null, to: to || null };
}
