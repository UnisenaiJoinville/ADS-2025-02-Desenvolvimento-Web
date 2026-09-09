export function validateAppointmentInput(input) {
  const professionalId = String(input?.professionalId ?? "").trim();
  const serviceId = String(input?.serviceId ?? "").trim();
  const startAt = new Date(input?.startAt);
  const durationMinutes = Number(input?.durationMinutes);

  if (!professionalId) throw new Error("professionalId é obrigatório");
  if (!serviceId) throw new Error("serviceId é obrigatório");
  if (Number.isNaN(startAt.getTime())) throw new Error("startAt inválido");
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    throw new Error("durationMinutes deve ser inteiro positivo");
  }

  return { professionalId, serviceId, startAt, durationMinutes };
}
