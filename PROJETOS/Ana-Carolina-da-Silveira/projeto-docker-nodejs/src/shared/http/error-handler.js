import { AppError } from "../errors/app-error.js";

export function notFoundHandler(request, response) {
  response.status(404).json({
    error: `Rota nao encontrada: ${request.method} ${request.originalUrl}`,
  });
}

// Middleware de erro do Express: precisa dos 4 parametros.
export function errorHandler(error, request, response, next) {
  if (error instanceof AppError) {
    return response.status(error.statusCode).json({ error: error.message });
  }

  console.error("Erro inesperado:", error);

  return response.status(500).json({ error: "Erro interno do servidor" });
}