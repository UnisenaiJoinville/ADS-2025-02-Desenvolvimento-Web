import {
  createService,
  listServices,
  deactivateService,
  getAverageActivePrice,
  findServiceByName,
} from "./modules/services/service-service.js";
import { scheduleAppointment } from "./modules/appointments/appointment-service.js";
import { ApplicationError } from "./modules/shared/errors/application-error.js";

/**
 * app.js só conhece os casos de uso (createService, scheduleAppointment...).
 * Ele não sabe como a validação funciona nem como os dados são guardados —
 * essas responsabilidades ficam nos módulos de cada domínio.
 */

// ---------------------------------------------------------------------
// 1. Cadastro de serviços (equivalente ao cenário original de app.js)
// ---------------------------------------------------------------------

function tryCreateService(input) {
  try {
    const service = createService(input);
    console.log(`Serviço cadastrado: ${service.name} (id: ${service.id})`);
    return service;
  } catch (error) {
    if (error instanceof ApplicationError) {
      console.error(`Não cadastrado (${input?.name ?? "sem nome"}): ${error.message}`);
      return null;
    }
    throw error; // erro inesperado: não escondemos, deixamos propagar
  }
}

const consulta = tryCreateService({ name: "Consulta", durationMinutes: 45, price: 150 });
tryCreateService({ name: "consulta", durationMinutes: 30, price: 100 }); // nome duplicado -> ConflictError
tryCreateService({ name: "", durationMinutes: 50, price: 90 }); // nome vazio -> ValidationError
tryCreateService({ name: "Avaliação", durationMinutes: -10, price: 120 }); // duração inválida -> ValidationError

const encontrado = findServiceByName("CONSULTA");
if (encontrado) {
  console.log(`${encontrado.name} encontrado.`);
}

if (consulta) {
  deactivateService(consulta.id);
}

console.log(listServices());
console.log(`Média dos serviços ativos: ${getAverageActivePrice().toFixed(2)}`);

function readPort() {
  const port = Number(process.env.PORT ?? 3000);
  console.log(`Porta configurada: ${port}`);
  return port;
}
readPort();

async function loadData() {
  return "dados carregados";
}
console.log(await loadData());

// ---------------------------------------------------------------------
// 2. Desafio 26.3 — agendamento em memória com validação de conflito
// ---------------------------------------------------------------------

function tryScheduleAppointment(input) {
  try {
    const appointment = scheduleAppointment(input);
    console.log(
      `Agendamento criado: profissional ${appointment.professionalId}, ` +
        `serviço ${appointment.serviceId}, início ${appointment.startAt.toISOString()}`,
    );
    return appointment;
  } catch (error) {
    if (error instanceof ApplicationError) {
      console.error(`Agendamento recusado: ${error.message}`);
      return null;
    }
    throw error;
  }
}

tryScheduleAppointment({
  professionalId: "prof-1",
  serviceId: "service-1",
  startAt: "2026-09-10T14:00:00-03:00",
  durationMinutes: 45,
});

// mesmo profissional, horário sobreposto (14:20 cai dentro de 14:00-14:45) -> ConflictError
tryScheduleAppointment({
  professionalId: "prof-1",
  serviceId: "service-2",
  startAt: "2026-09-10T14:20:00-03:00",
  durationMinutes: 30,
});

// mesmo horário, profissional diferente -> permitido
tryScheduleAppointment({
  professionalId: "prof-2",
  serviceId: "service-1",
  startAt: "2026-09-10T14:00:00-03:00",
  durationMinutes: 45,
});

// duração inválida -> ValidationError
tryScheduleAppointment({
  professionalId: "prof-1",
  serviceId: "service-1",
  startAt: "2026-09-11T09:00:00-03:00",
  durationMinutes: 0,
});
