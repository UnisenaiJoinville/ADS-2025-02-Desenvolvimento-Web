import { ValidationError } from "../shared/errors/application-error.js";

/**
 * Valida a entrada de um agendamento. Segue o mesmo padrão de
 * service-validator.js: converte tipos explicitamente e falha cedo com uma
 * mensagem específica por campo, antes de qualquer regra de negócio.
 *
 * @param {{ professionalId?: unknown, serviceId?: unknown, startAt?: unknown, durationMinutes?: unknown }} input
 */
export function validateAppointmentInput(input) {
  const professionalId =
    typeof input?.professionalId === "string" ? input.professionalId.trim() : "";
  const serviceId = typeof input?.serviceId === "string" ? input.serviceId.trim() : "";
  const startAt = new Date(input?.startAt);
  const durationMinutes = Number(input?.durationMinutes);

  if (professionalId === "") {
    throw new ValidationError("professionalId é obrigatório.");
  }

  if (serviceId === "") {
    throw new ValidationError("serviceId é obrigatório.");
  }

  if (Number.isNaN(startAt.getTime())) {
    throw new ValidationError("startAt deve ser uma data/hora válida (ISO 8601).");
  }

  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    throw new ValidationError("durationMinutes deve ser um número inteiro maior que zero.");
  }

  return { professionalId, serviceId, startAt, durationMinutes };
}
