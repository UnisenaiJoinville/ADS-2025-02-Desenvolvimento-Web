import { randomUUID } from "node:crypto";

const appointments = [];

export function save(appointment) {
  const newAppointment = { ...appointment, id: randomUUID() };
  appointments.push(newAppointment);
  return { ...newAppointment };
}

export function findAll() {
  return appointments.map((appointment) => ({ ...appointment }));
}

export function findByProfessionalId(professionalId) {
  return appointments
    .filter((appointment) => appointment.professionalId === professionalId)
    .map((appointment) => ({ ...appointment }));
}