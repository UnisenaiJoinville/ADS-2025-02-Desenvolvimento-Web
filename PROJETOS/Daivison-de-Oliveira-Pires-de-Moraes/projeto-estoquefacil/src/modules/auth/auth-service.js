import { randomBytes, createHash } from "node:crypto";
import { AppError } from "../../shared/errors/app-error.js";
import { parseName, parsePassword } from "./user-validator.js";
import bcrypt from "bcryptjs";

import { env } from "../../config/env.js";
import { generateToken } from "../../shared/auth/token.js";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../../shared/errors/app-error.js";

import * as repository from "./user-repository.js";
import { validateLoginInput, validateRegisterInput } from "./user-validator.js";

// Monta na mao o que pode sair para o cliente.
// Escolher o que INCLUIR e mais seguro do que lembrar de remover.
function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tokenVersion: user.tokenVersion,
    lastLoginAt: user.lastLoginAt,
  };
}

export async function registerUser(input) {
  const data = validateRegisterInput(input);

  const existing = await repository.findByEmail(data.email);

  if (existing) {
    throw new ConflictError("Ja existe uma conta com esse e-mail");
  }

  // A senha em texto puro morre aqui. Do banco para baixo,
  // so existe o hash - e dele nao se volta para a senha.
  const passwordHash = await bcrypt.hash(data.password, env.auth.saltRounds);

  const created = await repository.create({
    name: data.name,
    email: data.email,
    passwordHash,
  });

  const user = toPublicUser(created);

  return issueSession(user);
}

export async function loginUser(input) {
  const data = validateLoginInput(input);

  const found = await repository.findByEmailWithPassword(data.email);

  // Mensagem unica de proposito: se dissessemos "e-mail nao cadastrado",
  // estariamos confirmando quais e-mails existem no sistema.
  const invalidCredentials = new UnauthorizedError("E-mail ou senha invalidos");

  if (!found) {
    throw invalidCredentials;
  }

  if (
    found.lockedUntil &&
    new Date(found.lockedUntil.replace(" ", "T") + "-03:00") > new Date()
  )
    throw new AppError("Muitas tentativas. Aguarde 15 minutos", 429);
  const passwordMatches = await bcrypt.compare(
    data.password,
    found.passwordHash,
  );

  if (!passwordMatches) {
    await repository.recordFailure(found.id);
    throw invalidCredentials;
  }

  // So depois de provar a senha e que dizemos algo sobre a conta.
  if (!found.active) {
    throw new UnauthorizedError("Esta conta esta desativada");
  }

  const user = toPublicUser(await repository.recordLogin(found.id));

  return issueSession(user);
}

export async function getProfile(id) {
  const user = await repository.findById(id);

  if (!user) {
    throw new NotFoundError("Usuario nao encontrado");
  }

  return user;
}

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}
async function issueSession(user) {
  const refreshToken = randomBytes(48).toString("hex");
  await repository.storeToken(
    digest(refreshToken),
    user.id,
    "REFRESH",
    new Date(Date.now() + 7 * 86400000),
  );
  return { user, token: generateToken(user), refreshToken };
}
export async function refreshSession(input) {
  if (
    typeof input?.refreshToken !== "string" ||
    input.refreshToken.length > 200
  )
    throw new UnauthorizedError("Token de renovacao invalido");
  const stored = await repository.consumeToken(
    digest(input.refreshToken),
    "REFRESH",
  );
  const user = stored && (await repository.findById(stored.userId));
  if (!user?.active)
    throw new UnauthorizedError("Token de renovacao invalido ou expirado");
  return issueSession(toPublicUser(user));
}
export async function endSession(input) {
  if (typeof input?.refreshToken === "string")
    await repository.revokeRefresh(digest(input.refreshToken));
}
export async function updateProfile(id, input) {
  return repository.updateName(id, parseName(input?.name));
}
export async function changePassword(id, input) {
  const publicUser = await repository.findById(id);
  const user = await repository.findByEmailWithPassword(publicUser.email);
  if (
    typeof input?.currentPassword !== "string" ||
    !(await bcrypt.compare(input.currentPassword, user.passwordHash))
  )
    throw new UnauthorizedError("Senha atual incorreta");
  const password = parsePassword(input?.newPassword);
  if (await bcrypt.compare(password, user.passwordHash))
    throw new AppError("A nova senha deve ser diferente da atual");
  await repository.updatePassword(
    id,
    await bcrypt.hash(password, env.auth.saltRounds),
  );
}
export async function forgotPassword(input) {
  if (typeof input?.email !== "string") throw new AppError("Informe um e-mail");
  const user = await repository.findByEmail(input.email.trim().toLowerCase());
  if (user?.active) {
    const token = randomBytes(32).toString("hex");
    await repository.storeToken(
      digest(token),
      user.id,
      "RESET",
      new Date(Date.now() + 15 * 60000),
    );
    // Entrega local prevista na atividade; nao envia email nem depende de dominio.
    console.log(
      `Recuperacao de senha (15 minutos): http://localhost:${env.port}/recuperar.html?token=${token}`,
    );
  }
  return {
    message: "Se a conta existir, o link sera exibido no terminal do servidor.",
  };
}
export async function resetPassword(input) {
  const password = parsePassword(input?.newPassword);
  if (typeof input?.token !== "string" || !/^[a-f0-9]{64}$/.test(input.token))
    throw new AppError("Link invalido");
  const stored = await repository.consumeToken(digest(input.token), "RESET");
  if (!stored) throw new AppError("Link invalido, expirado ou ja utilizado");
  await repository.updatePassword(
    stored.userId,
    await bcrypt.hash(password, env.auth.saltRounds),
  );
}
