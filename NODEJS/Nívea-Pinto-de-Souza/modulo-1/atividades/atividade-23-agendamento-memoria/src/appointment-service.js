import { randomUUID } from "node:crypto";
import { findByProfessionalId, saveAppointment } from "./appointment-repository.js";
import { validateAppointmentInput } from "./appointment-validator.js";

function hasTimeConflict(existing, startAt, durationMinutes) {
  const newStart = startAt.getTime();
  const newEnd = newStart + durationMinutes * 60_000;

  return existing.some((appointment) => {
    const currentStart = new Date(appointment.startAt).getTime();
    const currentEnd = currentStart + appointment.durationMinutes * 60_000;
    return newStart < currentEnd && newEnd > currentStart;
  });
}

export function scheduleAppointment(input) {
  const data = validateAppointmentInput(input);
  const existing = findByProfessionalId(data.professionalId);

  if (hasTimeConflict(existing, data.startAt, data.durationMinutes)) {
    throw new Error("Conflito de horário para este profissional");
  }

  return saveAppointment({
    id: randomUUID(),
    professionalId: data.professionalId,
    serviceId: data.serviceId,
    startAt: data.startAt.toISOString(),
    durationMinutes: data.durationMinutes,
  });
}
