import jwt from "jsonwebtoken";

import { env } from "../../config/env.js";
import { UnauthorizedError } from "../errors/app-error.js";

export function generateToken(user) {
  return jwt.sign(
    { name: user.name, email: user.email },
    env.auth.jwtSecret,
    {
      subject: String(user.id),
      expiresIn: env.auth.jwtExpiresIn,
    }
  );
}

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
