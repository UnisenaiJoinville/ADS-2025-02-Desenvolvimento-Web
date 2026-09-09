const appointments = [];

export function saveAppointment(appointment) {
  appointments.push({ ...appointment });
  return { ...appointment };
}

export function findByProfessionalId(professionalId) {
  return appointments
    .filter((item) => item.professionalId === professionalId)
    .map((item) => ({ ...item }));
}

export function findAllAppointments() {
  return appointments.map((item) => ({ ...item }));
}
