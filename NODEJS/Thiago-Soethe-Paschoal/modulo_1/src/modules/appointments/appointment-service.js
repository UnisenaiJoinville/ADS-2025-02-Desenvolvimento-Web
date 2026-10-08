import { randomUUID } from "node:crypto";
import {
  findAppointmentsByProfessional,
  saveAppointment,
} from "./appointment-repository.js";

function validateAppointmentInput(input) {
  if (!input?.professionalId?.trim()) {
    throw new Error("O profissional é obrigatório");
  }

  if (!input?.serviceId?.trim()) {
    throw new Error("O serviço é obrigatório");
  }

  if (!Number.isInteger(input.durationMinutes) || input.durationMinutes <= 0) {
    throw new Error("A duração deve ser um número inteiro positivo");
  }

  const startDate = new Date(input.startAt);

  if (Number.isNaN(startDate.getTime())) {
    throw new Error("A data de início é inválida");
  }

  return {
    professionalId: input.professionalId.trim(),
    serviceId: input.serviceId.trim(),
    startAt: startDate.toISOString(),
    durationMinutes: input.durationMinutes,
  };
}

function calculateEndTime(startAt, durationMinutes) {
  return new Date(startAt).getTime() + durationMinutes * 60_000;
}

function hasTimeConflict(input) {
  const newStart = new Date(input.startAt).getTime();
  const newEnd = calculateEndTime(input.startAt, input.durationMinutes);
  const professionalAppointments = findAppointmentsByProfessional(
    input.professionalId,
  );

  return professionalAppointments.some((appointment) => {
    const existingStart = new Date(appointment.startAt).getTime();
    const existingEnd = calculateEndTime(
      appointment.startAt,
      appointment.durationMinutes,
    );

    return newStart < existingEnd && newEnd > existingStart;
  });
}

export function scheduleAppointment(input) {
  const data = validateAppointmentInput(input);

  if (hasTimeConflict(data)) {
    throw new Error("O profissional já possui um agendamento neste horário");
  }

  const appointment = {
    id: randomUUID(),
    ...data,
    createdAt: new Date().toISOString(),
  };

  return saveAppointment(appointment);
}
