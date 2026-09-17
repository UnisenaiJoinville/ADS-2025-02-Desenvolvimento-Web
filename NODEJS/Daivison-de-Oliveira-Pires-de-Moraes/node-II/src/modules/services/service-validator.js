import { ValidationError } from "../../shared/errors/application-error.js";

const MIN_SERVICE_DURATION_MINUTES = 1;

function normalizeName(rawName) {
  if (typeof rawName !== "string") return "";
  return rawName.trim().replace(/\s+/g, " ");
}

export function validateServiceInput(input) {
  const name = normalizeName(input?.name);
  const durationMinutes = Number(input?.durationMinutes);
  const price = Number(input?.price);

  if (!name) {
    throw new ValidationError("Nome é obrigatório.");
  }

  if (!Number.isFinite(durationMinutes) || durationMinutes < MIN_SERVICE_DURATION_MINUTES) {
    throw new ValidationError("Duração deve ser um número maior que zero.");
  }

  if (!Number.isFinite(price) || price < 0) {
    throw new ValidationError("Preço não pode ser negativo.");
  }

  return { name, durationMinutes, price };
}
