import { AppError } from "../../shared/errors/app-error.js";

export function validateCategoryInput(input) {
  const name = String(input?.name ?? "").trim().replace(/\s+/g, " ");

  if (!name) {
    throw new AppError("O nome da categoria e obrigatorio");
  }

  if (name.length > 80) {
    throw new AppError("O nome da categoria deve ter no maximo 80 caracteres");
  }

  return { name };
}
