import { UnauthorizedError } from "../errors/app-error.js";

import { verifyToken } from "./token.js";

// Middleware: roda ANTES do controller e so deixa passar quem
// apresentar um token valido no cabecalho Authorization.
//
//   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
//                  |____| |_______________________|
//                  esquema         token
export function ensureAuthenticated(request, response, next) {
  const header = request.headers.authorization;

  if (!header) {
    throw new UnauthorizedError("Token nao informado");
  }

  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new UnauthorizedError("Formato do token invalido");
  }

  // Se o token nao prestar, verifyToken lanca UnauthorizedError
  // e o middleware de erro devolve 401 para o cliente.
  request.user = verifyToken(token);

  next();
}