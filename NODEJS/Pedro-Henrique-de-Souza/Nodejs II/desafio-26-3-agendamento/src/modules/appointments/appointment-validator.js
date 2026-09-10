const MIN_APPOINTMENT_DURATION_MINUTES = 1;

export function validateAppointmentInput(input) {
  const professionalId = input?.professionalId?.trim();
  const serviceId = input?.serviceId?.trim();
  const startAt = new Date(input?.startAt);
  const durationMinutes = Number(input?.durationMinutes);

  if (!professionalId) {
    throw new Error("professionalId é obrigatório.");
  }

  if (!serviceId) {
    throw new Error("serviceId é obrigatório.");
  }

  if (Number.isNaN(startAt.getTime())) {
    throw new Error("startAt deve ser uma data/hora válida (ISO 8601).");
  }

  if (!Number.isInteger(durationMinutes) || durationMinutes < MIN_APPOINTMENT_DURATION_MINUTES) {
    throw new Error("durationMinutes deve ser um número inteiro maior que zero.");
  }

  return { professionalId, serviceId, startAt, durationMinutes };
}