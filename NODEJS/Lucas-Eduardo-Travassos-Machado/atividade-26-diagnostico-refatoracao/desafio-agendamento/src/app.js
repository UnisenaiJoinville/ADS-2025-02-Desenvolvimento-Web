import { scheduleAppointment } from "./modules/appointments/appointment-service.js";

const input = {
  professionalId: "prof-1",
  serviceId: "service-1",
  startAt: "2026-09-10T14:00:00-03:00",
  durationMinutes: 45,
};

const agendamento = scheduleAppointment(input);
console.log("Agendamento criado:", agendamento);

try {
  scheduleAppointment({
    professionalId: "prof-1",
    serviceId: "service-2",
    startAt: "2026-09-10T14:20:00-03:00",
    durationMinutes: 30,
  });
} catch (error) {
  console.error("Erro esperado (conflito de horário):", error.message);
}

const semConflito = scheduleAppointment({
  professionalId: "prof-1",
  serviceId: "service-2",
  startAt: "2026-09-10T15:00:00-03:00",
  durationMinutes: 30,
});
console.log("Agendamento sem conflito criado:", semConflito);

try {
  scheduleAppointment({
    professionalId: "prof-2",
    serviceId: "service-1",
    startAt: "2026-09-10T14:00:00-03:00",
    durationMinutes: 0,
  });
} catch (error) {
  console.error("Erro esperado (duração inválida):", error.message);
}
