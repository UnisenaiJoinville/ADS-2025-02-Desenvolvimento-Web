// Erro de NEGOCIO: sabemos o que aconteceu e qual status HTTP devolver.
// Qualquer outro erro sera tratado como 500 (falha inesperada).
export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Registro nao encontrado") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Registro ja existente") {
    super(message, 409);
    this.name = "ConflictError";
  }
}
