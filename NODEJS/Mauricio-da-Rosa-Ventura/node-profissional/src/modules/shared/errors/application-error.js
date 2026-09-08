/**
 * Erro base da aplicação. Distinguir subclasses (em vez de usar Error puro
 * ou console.log) permite que cada camada decida como reagir: validação
 * vira resposta 400 no futuro, conflito vira 409, e um erro não reconhecido
 * continua se propagando em vez de ser silenciado.
 */
export class ApplicationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ApplicationError";
  }
}

/** Entrada inválida (formato, tipo ou campo obrigatório ausente). */
export class ValidationError extends ApplicationError {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

/** Regra de negócio violada (ex.: nome duplicado, horário ocupado). */
export class ConflictError extends ApplicationError {
  constructor(message) {
    super(message);
    this.name = "ConflictError";
  }
}

/** Registro não encontrado para o identificador informado. */
export class NotFoundError extends ApplicationError {
  constructor(message) {
    super(message);
    this.name = "NotFoundError";
  }
}
