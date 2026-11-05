import { UnauthorizedError } from "../errors/app-error.js";

import { verifyToken } from "./token.js";

export function ensureAuthenticated(request, response, next) {
  const header = request.headers.authorization;

  if (!header) throw new UnauthorizedError("Token nao informado");

  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new UnauthorizedError("Formato do token invalido");
  }

  request.user = verifyToken(token);
  next();
}
