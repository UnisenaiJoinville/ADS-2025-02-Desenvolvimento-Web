import { UnauthorizedError, ForbiddenError } from "../errors/app-error.js";
import { verifyToken } from "./token.js";
import { findById } from "../../modules/auth/user-repository.js";
export function ensureAuthenticated(req, res, next) {
  Promise.resolve()
    .then(async () => {
      const match = /^Bearer ([^\s]+)$/.exec(req.headers.authorization ?? "");
      if (!match)
        throw new UnauthorizedError("Token nao informado ou formato invalido");
      const token = verifyToken(match[1]);
      const user = await findById(token.id);
      if (!user?.active || token.version !== user.tokenVersion)
        throw new UnauthorizedError("Sessao invalida. Entre novamente");
      req.user = user;
      next();
    })
    .catch(next);
}
export function ensureRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role)
      return next(new ForbiddenError("Somente ADMIN pode excluir registros"));
    next();
  };
}
