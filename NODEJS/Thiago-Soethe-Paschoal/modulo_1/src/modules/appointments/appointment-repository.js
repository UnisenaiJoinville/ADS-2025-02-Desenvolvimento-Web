const appointments = [];

export function saveAppointment(appointment) {
  const storedAppointment = { ...appointment };
  appointments.push(storedAppointment);
  return { ...storedAppointment };
}

export function findAppointmentsByProfessional(professionalId) {
  return appointments
    .filter((appointment) => appointment.professionalId === professionalId)
    .map((appointment) => ({ ...appointment }));
}

export function listAppointments() {
  return appointments.map((appointment) => ({ ...appointment }));
}
