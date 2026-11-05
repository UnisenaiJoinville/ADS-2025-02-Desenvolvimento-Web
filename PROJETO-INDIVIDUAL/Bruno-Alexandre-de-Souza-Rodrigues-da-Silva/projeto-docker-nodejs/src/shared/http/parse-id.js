import { AppError } from "../errors/app-error.js";

// Parametros de rota chegam SEMPRE como string.
export function parseId(value, label = "id") {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(`Parametro ${label} invalido: ${value}`);
  }

  return id;
}
