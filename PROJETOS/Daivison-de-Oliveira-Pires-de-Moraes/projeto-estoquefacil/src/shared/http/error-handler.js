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

  if (error.type === "entity.parse.failed")
    return response.status(400).json({ error: "JSON invalido" });
  if (error.type === "entity.too.large")
    return response
      .status(413)
      .json({ error: "Corpo da requisicao muito grande" });
  if (error.code === "ER_DUP_ENTRY")
    return response
      .status(409)
      .json({ error: "Registro duplicado: nome, SKU ou e-mail ja utilizado" });
  if (["ER_ROW_IS_REFERENCED_2", "ER_NO_REFERENCED_ROW_2"].includes(error.code))
    return response.status(409).json({
      error: "Operacao conflita com registros relacionados. Atualize a tela.",
    });
  console.error("Erro inesperado:", error);

  return response.status(500).json({ error: "Erro interno do servidor" });
}
