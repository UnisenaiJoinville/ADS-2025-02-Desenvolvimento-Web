import { randomUUID } from 'node:crypto';
import { validateAppointmentInput } from './appointment-validator.js';
import { findByProfessional, save } from './appointment-repository.js';

function toRange(startAt, durationMinutes) {
  const start = startAt.getTime();
  const end = start + durationMinutes * 60_000;
  return { start, end };
}

function overlaps(rangeA, rangeB) {
  return rangeA.start < rangeB.end && rangeB.start < rangeA.end;
}

export function scheduleAppointment(input) {
  const data = validateAppointmentInput(input);
  const newRange = toRange(data.startAt, data.durationMinutes);

  const hasConflict = findByProfessional(data.professionalId).some((appointment) =>
    overlaps(newRange, toRange(new Date(appointment.startAt), appointment.durationMinutes)),
  );

  if (hasConflict) {
    throw new Error(
      `Profissional "${data.professionalId}" já possui um agendamento nesse horário`,
    );
  }

  const appointment = {
    id: randomUUID(),
    professionalId: data.professionalId,
    serviceId: data.serviceId,
    startAt: data.startAt.toISOString(),
    durationMinutes: data.durationMinutes,
    createdAt: new Date().toISOString(),
  };

  return save(appointment);
}
