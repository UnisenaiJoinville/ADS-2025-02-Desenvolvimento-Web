export function validateAppointmentInput(input) {
  if (!input?.professionalId) {
    throw new Error("professionalId é obrigatório");
  }

  if (!input?.serviceId) {
    throw new Error("serviceId é obrigatório");
  }

  const startAt = new Date(input?.startAt);
  if (Number.isNaN(startAt.getTime())) {
    throw new Error("startAt inválido");
  }

  if (!Number.isFinite(input?.durationMinutes) || input.durationMinutes <= 0) {
    throw new Error("durationMinutes deve ser maior que zero");
  }

  return {
    professionalId: input.professionalId,
    serviceId: input.serviceId,
    startAt,
    durationMinutes: input.durationMinutes,
  };
}
