// Erro customizado que carrega um "código" além da mensagem.
// Isso prepara o projeto para, no futuro (com HTTP), mapear cada código
// para um status HTTP diferente (ex: VALIDATION_ERROR -> 400, CONFLICT -> 409).
export class ApplicationError extends Error {
  constructor(message, code = "APPLICATION_ERROR") {
    super(message);
    this.name = "ApplicationError";
    this.code = code;
  }
}

export class ValidationError extends ApplicationError {
  constructor(message) {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class ConflictError extends ApplicationError {
  constructor(message) {
    super(message, "CONFLICT_ERROR");
    this.name = "ConflictError";
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message) {
    super(message, "NOT_FOUND_ERROR");
    this.name = "NotFoundError";
  }
}
