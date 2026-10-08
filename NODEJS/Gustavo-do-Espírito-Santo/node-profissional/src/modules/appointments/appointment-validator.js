export function validateAppointmentInput(input) {
  const professionalId = input?.professionalId?.trim();
  const serviceId = input?.serviceId?.trim();
  const durationMinutes = Number(input?.durationMinutes);
  const startAt = new Date(input?.startAt);

  if (!professionalId) {
    throw new Error('professionalId é obrigatório');
  }

  if (!serviceId) {
    throw new Error('serviceId é obrigatório');
  }

  if (Number.isNaN(startAt.getTime())) {
    throw new Error('startAt deve ser uma data válida');
  }

  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    throw new Error('durationMinutes deve ser um número inteiro maior que zero');
  }

  return { professionalId, serviceId, startAt, durationMinutes };
}
