import { findAllAppointments } from "./appointment-repository.js";
import { scheduleAppointment } from "./appointment-service.js";

const first = {
  professionalId: "prof-1",
  serviceId: "service-1",
  startAt: "2026-09-10T14:00:00-03:00",
  durationMinutes: 45,
};

console.log("Criado:", scheduleAppointment(first));

try {
  scheduleAppointment({
    professionalId: "prof-1",
    serviceId: "service-2",
    startAt: "2026-09-10T14:30:00-03:00",
    durationMinutes: 30,
  });
} catch (error) {
  console.log("Conflito detectado:", error.message);
}

try {
  scheduleAppointment({ ...first, professionalId: "prof-2", durationMinutes: 0 });
} catch (error) {
  console.log("Duração inválida detectada:", error.message);
}

console.log("Agendamentos:", findAllAppointments());
