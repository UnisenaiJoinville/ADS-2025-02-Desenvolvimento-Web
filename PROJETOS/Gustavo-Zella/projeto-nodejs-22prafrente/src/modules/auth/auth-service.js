import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { env } from "../../config/env.js";
import { AppError, ConflictError } from "../../shared/errors/app-error.js";

import * as repository from "./auth-repository.js";
import { validateLoginInput, validateRegisterInput } from "./auth-validator.js";

const SALT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
}

export async function register(input) {
  const data = validateRegisterInput(input);

  const existing = await repository.findByEmail(data.email);

  if (existing) {
    throw new ConflictError("Ja existe um usuario com esse e-mail");
  }

  // NUNCA guardar senha em texto puro. bcrypt gera um hash + salt.
  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  const user = await repository.create({
    name: data.name,
    email: data.email,
    passwordHash,
  });

  return { user, token: signToken(user) };
}

export async function login(input) {
  const data = validateLoginInput(input);

  const user = await repository.findByEmail(data.email);

  // Mensagem generica de proposito: nao revelamos se foi o e-mail ou a
  // senha que estava errada (evita enumeracao de contas existentes).
  if (!user) {
    throw new AppError("E-mail ou senha invalidos", 401);
  }

  const passwordMatches = await bcrypt.compare(data.password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError("E-mail ou senha invalidos", 401);
  }

  return {
    user: { id: user.id, name: user.name, email: user.email },
    token: signToken(user),
  };
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, env.jwt.secret);
  } catch {
    throw new AppError("Token invalido ou expirado", 401);
  }
}
