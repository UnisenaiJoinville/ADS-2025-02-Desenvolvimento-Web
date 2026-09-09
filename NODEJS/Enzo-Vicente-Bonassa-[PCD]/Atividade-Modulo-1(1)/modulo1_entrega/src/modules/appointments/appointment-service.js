const appointments = [];

function validateAppointment(input) {
  if (!input.professionalId || !input.serviceId) {
    throw new Error('Profissional e serviço são obrigatórios.');
  }

  if (!Number.isInteger(input.durationMinutes) || input.durationMinutes <= 0) {
    throw new Error('Duração deve ser um inteiro positivo.');
  }

  if (typeof input.startAt !== 'string' || Number.isNaN(Date.parse(input.startAt))) {
    throw new Error('Data de início inválida.');
  }
}

function hasConflict(candidate) {
  return appointments.some((appointment) => {
    const sameProfessional = appointment.professionalId === candidate.professionalId;
    const startsBeforeEnd = Date.parse(candidate.startAt) < Date.parse(appointment.endAt);
    const endsAfterStart = Date.parse(candidate.endAt) > Date.parse(appointment.startAt);
    return sameProfessional && startsBeforeEnd && endsAfterStart;
  });
}

export function scheduleAppointment(input) {
  validateAppointment(input);

  const start = new Date(input.startAt);
  const end = new Date(start.getTime() + input.durationMinutes * 60_000);
  const appointment = {
    professionalId: input.professionalId,
    serviceId: input.serviceId,
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    durationMinutes: input.durationMinutes,
  };

  if (hasConflict(appointment)) {
    throw new Error('O profissional já possui agendamento nesse horário.');
  }

  appointments.push(appointment);
  return { ...appointment };
}
