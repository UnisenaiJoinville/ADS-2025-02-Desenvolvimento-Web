import { randomUUID } from "node:crypto";
import { findByProfessional, save } from "./appointment-repository.js";
import { validateAppointmentInput } from "./appointment-validator.js";

function getEndTime(startAt, durationMinutes) {
  return new Date(startAt.getTime() + durationMinutes * 60000);
}

function hasOverlap(existing, candidateStart, candidateEnd) {
  const existingStart = new Date(existing.startAt);
  const existingEnd = getEndTime(existingStart, existing.durationMinutes);
  return candidateStart < existingEnd && existingStart < candidateEnd;
}

export function scheduleAppointment(input) {
  const data = validateAppointmentInput(input);
  const candidateEnd = getEndTime(data.startAt, data.durationMinutes);

  const conflicting = findByProfessional(data.professionalId).some((existing) =>
    hasOverlap(existing, data.startAt, candidateEnd),
  );

  if (conflicting) {
    throw new Error("Conflito de horário para este profissional");
  }

  const appointment = {
    id: randomUUID(),
    professionalId: data.professionalId,
    serviceId: data.serviceId,
    startAt: data.startAt.toISOString(),
    durationMinutes: data.durationMinutes,
  };

  return save(appointment);
}
