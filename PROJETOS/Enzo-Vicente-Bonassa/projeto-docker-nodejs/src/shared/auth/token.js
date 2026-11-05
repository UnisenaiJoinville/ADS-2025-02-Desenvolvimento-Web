import jwt from "jsonwebtoken";

import { env } from "../../config/env.js";
import { UnauthorizedError } from "../errors/app-error.js";

// Gera o token do usuario.
// O conteudo pode ser lido; a assinatura permite verificar sua autenticidade.
export function generateToken(user) {
  return jwt.sign(
    // Nunca coloque senha ou hash no payload.
    { name: user.name, email: user.email },
    env.auth.jwtSecret,
    {
      subject: String(user.id),
      expiresIn: env.auth.jwtExpiresIn,
    }
  );
}

// Confere a assinatura e a validade.
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