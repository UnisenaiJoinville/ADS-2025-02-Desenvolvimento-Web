import { AppError } from "../errors/app-error.js";
import { verifyToken } from "../../modules/auth/auth-service.js";

// Protege rotas de escrita: exige "Authorization: Bearer <token>".
export function requireAuth(request, response, next) {
  const header = request.headers.authorization ?? "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new AppError("Nao autenticado. Envie o token no header Authorization", 401);
  }

  const payload = verifyToken(token);

  request.user = { id: payload.sub, email: payload.email };

  next();
}
