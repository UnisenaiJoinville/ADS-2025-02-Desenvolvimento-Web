import { ValidationError } from "../../shared/errors/application-error.js";

const MIN_SERVICE_DURATION_MINUTES = 1;


export function normalizeName(value) {
  return value.trim().replace(/\s+/g, " ");
}


export function validateServiceInput(input) {
  const rawName = input?.name;
  const name = typeof rawName === "string" ? normalizeName(rawName) : "";
  const durationMinutes = Number(input?.durationMinutes);
  const price = Number(input?.price);

  if (!name) {
    throw new ValidationError("Nome é obrigatório");
  }

  if (!Number.isInteger(durationMinutes) || durationMinutes < MIN_SERVICE_DURATION_MINUTES) {
    throw new ValidationError("durationMinutes deve ser um inteiro maior que zero");
  }

  if (!Number.isFinite(price) || price < 0) {
    throw new ValidationError("price não pode ser negativo");
  }

  return { name, durationMinutes, price };
}
