import jwt from "jsonwebtoken";

import { env } from "../../config/env.js";
import { UnauthorizedError } from "../errors/app-error.js";

// Gera o cracha do usuario.
// O token NAO e secreto: qualquer um consegue ler o conteudo.
// O que ninguem consegue e FALSIFICAR, porque nao tem o JWT_SECRET.
export function generateToken(user) {
  return jwt.sign(
    // "payload": os dados publicos que viajam dentro do token.
    // Nunca coloque senha ou hash aqui.
    { name: user.name, email: user.email },
    env.auth.jwtSecret,
    {
      // "sub" (subject) e o campo padrao para o dono do token.
      subject: String(user.id),
      expiresIn: env.auth.jwtExpiresIn,
    }
  );
}

// Confere a assinatura e a validade. Se algo estiver errado, recusa.
export function verifyToken(token) {
  try {
    const payload = jwt.verify(token, env.auth.jwtSecret);

    return {
      id: Number(payload.sub),
      name: payload.name,
      email: payload.email,
    };
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new UnauthorizedError("Sessao expirada. Faca login novamente");
    }

    throw new UnauthorizedError("Token invalido");
  }
}