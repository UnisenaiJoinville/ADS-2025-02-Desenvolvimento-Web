import { ForbiddenError } from "../errors/app-error.js";

// Middleware Fabrica: você passa o cargo aceito e ele devolve a funcao interceptadora.
export function ensureRole(requiredRole) {
  return (request, response, next) => {
    // request.user foi preenchido antes pelo middleware ensureAuthenticated
    const userRole = request.user?.role;

    if (!userRole || userRole !== requiredRole) {
      throw new ForbiddenError("Acesso negado: recurso exclusivo para administradores");
    }

    next();
  };
}
