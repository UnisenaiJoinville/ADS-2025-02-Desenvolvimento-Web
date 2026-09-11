import { ValidationError } from "../shared/errors/application-error.js";

const MIN_SERVICE_DURATION_MINUTES = 1;

/**
 * Valida e normaliza a entrada de um serviço na fronteira do sistema.
 * Dados externos (aqui, os argumentos recebidos por createService) não são
 * confiáveis: convertemos tipos explicitamente (Number) e usamos === em vez
 * de == para não depender de coerção implícita.
 *
 * @param {{ name?: unknown, durationMinutes?: unknown, price?: unknown }} input
 * @returns {{ name: string, durationMinutes: number, price: number }}
 */
export function validateServiceInput(input) {
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  const durationMinutes = Number(input?.durationMinutes);
  const price = Number(input?.price);

  if (name === "") {
    throw new ValidationError("O nome do serviço é obrigatório.");
  }

  if (!Number.isInteger(durationMinutes) || durationMinutes < MIN_SERVICE_DURATION_MINUTES) {
    throw new ValidationError(
      "A duração do serviço deve ser um número inteiro maior que zero.",
    );
  }

  if (!Number.isFinite(price) || price < 0) {
    throw new ValidationError("O preço do serviço não pode ser negativo.");
  }

  return { name, durationMinutes, price };
}
