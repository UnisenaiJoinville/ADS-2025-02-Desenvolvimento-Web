import { AppError } from "../../shared/errors/app-error.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLoginInput(input) {
  const email = String(input?.email ?? "").trim().toLowerCase();
  const password = String(input?.password ?? "");

  if (!email || !EMAIL_PATTERN.test(email)) {
    throw new AppError("Informe um e-mail valido");
  }

  if (!password) {
    throw new AppError("Informe a senha");
  }

  return { email, password };
}

export function validateRegisterInput(input) {
  const { email, password } = validateLoginInput(input);

  const name = String(input?.name ?? "").trim().replace(/\s+/g, " ");

  if (!name) {
    throw new AppError("Informe o nome");
  }

  if (password.length < 6) {
    throw new AppError("A senha deve ter no minimo 6 caracteres");
  }

  return { name, email, password };
}
