import bcrypt from "bcrypt";

import { generateToken } from "../../shared/auth/token.js";
import { UnauthorizedError } from "../../shared/errors/app-error.js";
import * as repository from "./auth-repository.js";

export async function loginUser({ email, password }) {
  // O repositório já devolve o objeto do usuário direto (rows[0])
  const user = await repository.findByEmail(email);
  
  if (!user) {
    throw new UnauthorizedError("E-mail ou senha invalidos");
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatch) {
    throw new UnauthorizedError("E-mail ou senha invalidos");
  }

  const token = generateToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    token
  };
}

export async function registerUser({ name, email, password, passwordConfirmation }) {
  const existing = await repository.findByEmail(email);

  if (existing) {
    throw new UnauthorizedError("Ja existe uma conta com esse e-mail");
  }

  if (password !== passwordConfirmation) {
    throw new UnauthorizedError("A confirmacao de senha nao confere");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  
  // O repositório já cria e faz o SELECT devolvendo o objeto puro do novo usuário
  const newUser = await repository.create({ name, email, passwordHash });
  
  if (!newUser) {
    throw new Error("Erro ao registrar usuario no banco de dados");
  }

  const token = generateToken({
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role
  });

  return {
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    },
    token
  };
}


