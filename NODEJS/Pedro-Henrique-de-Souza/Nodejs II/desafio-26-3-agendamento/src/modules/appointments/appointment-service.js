import { validateAppointmentInput } from "./appointment-validator.js";
import { save, findByProfessionalId } from "./appointment-repository.js";

// Função pura: calcula o horário de término a partir do início e da duração.
export function calculateEndAt(startAt, durationMinutes) {
  return new Date(startAt.getTime() + durationMinutes * 60_000);
}

// Função pura: dois intervalos se sobrepõem quando um começa antes do
// outro terminar E vice-versa.
export function overlaps(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

// Função pura: procura, entre os agendamentos existentes, algum conflito.
export function findConflictingAppointment(existingAppointments, startAt, endAt) {
  return (
    existingAppointments.find((appointment) => {
      const existingEndAt = calculateEndAt(appointment.startAt, appointment.durationMinutes);
      return overlaps(startAt, endAt, appointment.startAt, existingEndAt);
    }) ?? null
  );
}

export function scheduleAppointment(input) {
  const data = validateAppointmentInput(input);
  const endAt = calculateEndAt(data.startAt, data.durationMinutes);

  const existingAppointments = findByProfessionalId(data.professionalId);
  const conflict = findConflictingAppointment(existingAppointments, data.startAt, endAt);

  if (conflict) {
    const conflictEndAt = calculateEndAt(conflict.startAt, conflict.durationMinutes);
    const timeZone = "America/Sao_Paulo";
    throw new Error(
      `Conflito de horário: o profissional já possui um agendamento das ` +
        `${conflict.startAt.toLocaleTimeString("pt-BR", { timeZone })} às ` +
        `${conflictEndAt.toLocaleTimeString("pt-BR", { timeZone })}.`,
    );
  }

  return save({ ...data, endAt });
}