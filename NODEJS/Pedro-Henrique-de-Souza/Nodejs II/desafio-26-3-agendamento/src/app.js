import { scheduleAppointment } from "./modules/appointments/appointment-service.js";

const TIME_ZONE = "America/Sao_Paulo";

function formatTime(date) {
  return date.toLocaleTimeString("pt-BR", { timeZone: TIME_ZONE });
}

function trySchedule(label, input) {
  try {
    const appointment = scheduleAppointment(input);
    console.log(
      `[OK] ${label}: agendado das ${formatTime(appointment.startAt)} ` +
        `às ${formatTime(appointment.endAt)} (prof: ${appointment.professionalId})`,
    );
    return appointment;
  } catch (error) {
    console.error(`[ERRO] ${label}: ${error.message}`);
    return null;
  }
}

console.log("=== Cenário base (exemplo do enunciado) ===");
trySchedule("Agendamento inicial", {
  professionalId: "prof-1",
  serviceId: "service-1",
  startAt: "2026-09-10T14:00:00-03:00",
  durationMinutes: 45,
});

console.log("\n=== Tentando agendar com conflito de horário (mesmo profissional) ===");
trySchedule("Sobreposição parcial (14:30-15:15)", {
  professionalId: "prof-1",
  serviceId: "service-2",
  startAt: "2026-09-10T14:30:00-03:00",
  durationMinutes: 45,
});

console.log("\n=== Agendando em horário livre (sem conflito) ===");
trySchedule("Horário livre (14:45-15:15)", {
  professionalId: "prof-1",
  serviceId: "service-2",
  startAt: "2026-09-10T14:45:00-03:00",
  durationMinutes: 30,
});

console.log("\n=== Mesmo horário, mas profissional DIFERENTE (não deve conflitar) ===");
trySchedule("Outro profissional, mesmo horário", {
  professionalId: "prof-2",
  serviceId: "service-1",
  startAt: "2026-09-10T14:00:00-03:00",
  durationMinutes: 45,
});

console.log("\n=== Duração inválida ===");
trySchedule("Duração zero", {
  professionalId: "prof-1",
  serviceId: "service-1",
  startAt: "2026-09-10T16:00:00-03:00",
  durationMinutes: 0,
});

console.log("\n=== Campos obrigatórios ausentes ===");
trySchedule("Sem professionalId", {
  serviceId: "service-1",
  startAt: "2026-09-10T16:00:00-03:00",
  durationMinutes: 30,
});