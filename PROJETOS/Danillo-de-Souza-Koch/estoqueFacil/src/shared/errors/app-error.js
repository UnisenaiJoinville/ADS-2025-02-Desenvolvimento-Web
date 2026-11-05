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
// 401: "eu nao sei quem voce e" - falta token, token invalido ou senha errada.
export class UnauthorizedError extends AppError {
  constructor(message = "Nao autenticado") {
    super(message, 401);
    this.name = "UnauthorizedError";
  }
}

// 403: "eu sei quem voce e, mas voce nao pode fazer isso".
export class ForbiddenError extends AppError {
  constructor(message = "Acesso negado") {
    super(message, 403);
    this.name = "ForbiddenError";
  }
}