import { randomUUID } from "node:crypto";
import { validateAppointmentInput } from "./appointment-validator.js";
import { save, findByProfessional } from "./appointment-repository.js";
import { ConflictError } from "../shared/errors/application-error.js";

/**
 * Calcula o instante de término a partir do início e da duração.
 * Função pura, sem efeito colateral — fácil de testar isoladamente.
 */
export function calculateEndAt(startAt, durationMinutes) {
  return new Date(startAt.getTime() + durationMinutes * 60_000);
}

/**
 * Verifica se dois intervalos [start, end) se sobrepõem.
 * Função pura e pequena de propósito: é a regra central do desafio, então
 * precisa ser trivial de ler, testar e confiar.
 */
export function periodsOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

/**
 * Caso de uso: agendar um serviço com um profissional. A regra de conflito
 * de horário mora aqui (no serviço de aplicação), não no repositório — o
 * repositório só sabe persistir e consultar por profissional; quem decide
 * se um horário é permitido é a regra de negócio, que também não deveria
 * mudar quando trocarmos a persistência em memória pelo PostgreSQL.
 */
export function scheduleAppointment(input) {
  const data = validateAppointmentInput(input);
  const endAt = calculateEndAt(data.startAt, data.durationMinutes);

  const hasConflict = findByProfessional(data.professionalId).some((existing) => {
    const existingEnd = calculateEndAt(existing.startAt, existing.durationMinutes);
    return periodsOverlap(data.startAt, endAt, existing.startAt, existingEnd);
  });

  if (hasConflict) {
    throw new ConflictError(
      `O profissional "${data.professionalId}" já possui um agendamento nesse horário.`,
    );
  }

  const appointment = {
    id: randomUUID(),
    ...data,
    endAt,
    createdAt: new Date().toISOString(),
  };

  return save(appointment);
}
