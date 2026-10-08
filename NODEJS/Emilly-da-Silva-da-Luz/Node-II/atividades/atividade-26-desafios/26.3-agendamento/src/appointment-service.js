function assertNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} é obrigatório.`);
  }
}

function parseDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("startAt deve ser uma data válida.");
  }

  return date;
}

function validateDuration(durationMinutes) {
  const duration = Number(durationMinutes);

  if (!Number.isInteger(duration) || duration <= 0) {
    throw new Error("durationMinutes deve ser um inteiro positivo.");
  }

  return duration;
}

function calculateEndAt(startAt, durationMinutes) {
  return new Date(
    startAt.getTime() + durationMinutes * 60 * 1000
  );
}

function intervalsOverlap(firstStart, firstEnd, secondStart, secondEnd) {
  return firstStart < secondEnd && secondStart < firstEnd;
}

function hasProfessionalConflict(appointments, professionalId, startAt, endAt) {
  return appointments.some((appointment) => {
    if (appointment.professionalId !== professionalId) return false;

    return intervalsOverlap(
      startAt,
      endAt,
      new Date(appointment.startAt),
      new Date(appointment.endAt)
    );
  });
}

export function createAppointmentService() {
  const appointments = [];

  return {
    scheduleAppointment({
      professionalId,
      serviceId,
      startAt,
      durationMinutes
    }) {
      assertNonEmptyString(professionalId, "professionalId");
      assertNonEmptyString(serviceId, "serviceId");

      const parsedStartAt = parseDate(startAt);
      const duration = validateDuration(durationMinutes);
      const parsedEndAt = calculateEndAt(parsedStartAt, duration);

      if (
        hasProfessionalConflict(
          appointments,
          professionalId,
          parsedStartAt,
          parsedEndAt
        )
      ) {
        throw new Error("O profissional já possui um agendamento nesse intervalo.");
      }

      const appointment = {
        id: `appointment-${appointments.length + 1}`,
        professionalId,
        serviceId,
        startAt: parsedStartAt.toISOString(),
        endAt: parsedEndAt.toISOString(),
        durationMinutes: duration
      };

      appointments.push(appointment);
      return { ...appointment };
    },

    listAppointments() {
      return appointments.map((appointment) => ({ ...appointment }));
    }
  };
}
