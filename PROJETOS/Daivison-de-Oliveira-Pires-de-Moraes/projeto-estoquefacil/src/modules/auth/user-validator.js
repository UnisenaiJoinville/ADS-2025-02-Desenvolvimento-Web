import { AppError } from "../../shared/errors/app-error.js";

// Regra simples e suficiente para a aula: algo@algo.algo,
// sem espacos. Validacao de e-mail perfeita nao existe -
// a prova real e mandar uma mensagem para o endereco.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MIN_PASSWORD_LENGTH = 8;

export function parseName(value) {
  if (typeof value !== "string") throw new AppError("O nome deve ser texto");
  const name = value.trim().replace(/\s+/g, " ");

  if (!name) {
    throw new AppError("O nome e obrigatorio");
  }

  if (name.length < 3) {
    throw new AppError("O nome deve ter pelo menos 3 caracteres");
  }

  if (name.length > 60) {
    throw new AppError("O nome deve ter no maximo 60 caracteres");
  }

  return name;
}

function parseEmail(value) {
  // E-mail sempre em minusculas: "Ana@x.com" e "ana@x.com"
  // sao a MESMA pessoa. Normalizar aqui evita conta duplicada.
  const email = String(value ?? "")
    .trim()
    .toLowerCase();

  if (!email) {
    throw new AppError("O e-mail e obrigatorio");
  }

  if (email.length > 160) {
    throw new AppError("O e-mail deve ter no maximo 160 caracteres");
  }

  if (!EMAIL_PATTERN.test(email)) {
    throw new AppError("Informe um e-mail valido");
  }

  return email;
}

export function parsePassword(value) {
  // Senha NAO leva trim: espaco no inicio ou no fim pode ser
  // proposital. Quem digita a senha decide como ela e.
  if (typeof value !== "string") throw new AppError("A senha deve ser texto");
  const password = value;

  if (!password) {
    throw new AppError("A senha e obrigatoria");
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new AppError(
      `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`,
    );
  }

  if (Buffer.byteLength(password, "utf8") > 72) {
    // Limite do proprio algoritmo bcrypt: ele ignora o que passa disso.
    throw new AppError("A senha deve ter no maximo 72 bytes");
  }

  return password;
}

export function validateRegisterInput(input) {
  const name = parseName(input?.name);
  const email = parseEmail(input?.email);
  const password = parsePassword(input?.password);

  const passwordConfirmation = String(input?.passwordConfirmation ?? "");

  if (password !== passwordConfirmation) {
    throw new AppError("A confirmacao de senha nao confere");
  }

  return { name, email, password };
}

export function validateLoginInput(input) {
  const email = String(input?.email ?? "")
    .trim()
    .toLowerCase();
  const password = String(input?.password ?? "");

  // No login nao detalhamos o que faltou por seguranca:
  // a mensagem e sempre a mesma, para nao entregar pistas.
  if (!email || !password) {
    throw new AppError("Informe e-mail e senha");
  }

  return { email, password };
}
