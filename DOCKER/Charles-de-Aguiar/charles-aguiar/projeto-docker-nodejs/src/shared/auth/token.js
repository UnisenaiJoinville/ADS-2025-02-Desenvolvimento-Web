import jwt from "jsonwebtoken";

import { UnauthorizedError } from "../errors/app-error.js";

// Chave mestra secreta para assinar os crachas digitais (Tokens).
const JWT_SECRET = process.env.JWT_SECRET || "chave-secreta-do-estoque-facil-2026";

export function generateToken(user) {
  // O payload passa a carregar o role (perfil) do usuario
  const payload = {
    sub: String(user.id),
    name: user.name,
    email: user.email,
    role: user.role, // <-- IMPORTANTE: Injetando o cargo aqui
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    return {
      id: Number(decoded.sub),
      name: decoded.name,
      email: decoded.email,
      role: decoded.role, // <-- IMPORTANTE: Extraindo o cargo na leitura
    };
  } catch {
    throw new UnauthorizedError("Token invalido ou expirado");
  }
}
