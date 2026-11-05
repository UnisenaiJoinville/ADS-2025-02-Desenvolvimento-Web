import bcrypt from "bcryptjs";

import { env } from "../../config/env.js";
import { generateToken } from "../../shared/auth/token.js";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../../shared/errors/app-error.js";

import * as repository from "./user-repository.js";
import {
  validateLoginInput,
  validateRegisterInput,
} from "./user-validator.js";

function toPublicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

export async function registerUser(input) {
  const data = validateRegisterInput(input);

  const existing = await repository.findByEmail(data.email);

  if (existing) {
    throw new ConflictError("Ja existe uma conta com esse e-mail");
  }

  const passwordHash = await bcrypt.hash(data.password, env.auth.saltRounds);

  const created = await repository.create({
    name: data.name,
    email: data.email,
    passwordHash,
  });

  const user = toPublicUser(created);

  return { user, token: generateToken(user) };
}

export async function loginUser(input) {
  const data = validateLoginInput(input);

  const found = await repository.findByEmailWithPassword(data.email);

  const invalidCredentials = new UnauthorizedError("E-mail ou senha invalidos");

  if (!found) {
    throw invalidCredentials;
  }

  const passwordMatches = await bcrypt.compare(data.password, found.passwordHash);

  if (!passwordMatches) {
    throw invalidCredentials;
  }

  if (!found.active) {
    throw new UnauthorizedError("Esta conta esta desativada");
  }

  const user = toPublicUser(found);

  return { user, token: generateToken(user) };
}

export async function getProfile(id) {
  const user = await repository.findById(id);

  if (!user) {
    throw new NotFoundError("Usuario nao encontrado");
  }

  return user;
}
