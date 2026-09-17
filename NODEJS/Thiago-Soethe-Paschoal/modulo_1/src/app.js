import {
  createService,
  deactivateService,
  getActiveServicesSummary,
  listActiveServices,
  listServices,
  listServicesSortedByPrice,
  searchServicesByName,
} from "./modules/services/service-service.js";
import { scheduleAppointment } from "./modules/appointments/appointment-service.js";
import { listAppointments } from "./modules/appointments/appointment-repository.js";

const servicesToCreate = [
  { name: "Consulta inicial", durationMinutes: "45", price: 150 },
  { name: "Retorno", durationMinutes: 30, price: 80 },
  { name: "Avaliação", durationMinutes: 60, price: 120 },
  { name: "Fisioterapia", durationMinutes: 50, price: 100 },
  { name: "Pilates", durationMinutes: 60, price: 90 },
  { name: "Massagem", durationMinutes: 45, price: 110 },
  { name: "Acupuntura", durationMinutes: 40, price: 130 },
  { name: "RPG", durationMinutes: 60, price: 140 },
];

const createdServices = servicesToCreate.map((input) => createService(input));

deactivateService(createdServices[1].id);

console.log("\nTodos os serviços");
console.table(listServices());

console.log("\nServiços ativos");
console.table(listActiveServices());

console.log("\nResumo dos serviços ativos");
console.log(getActiveServicesSummary());

console.log("\nBusca pelo texto 'ção'");
console.table(searchServicesByName("ção"));

console.log("\nServiços ordenados por preço");
console.table(listServicesSortedByPrice("asc"));

const invalidServices = [
  { name: "consulta inicial", durationMinutes: 45, price: 150 },
  { name: "   ", durationMinutes: 30, price: 80 },
  { name: "Serviço inválido", durationMinutes: 30, price: -10 },
];

console.log("\nErros intencionais");

for (const input of invalidServices) {
  try {
    createService(input);
  } catch (error) {
    console.log(error.message);
  }
}

console.log("\nAgendamentos");

scheduleAppointment({
  professionalId: "prof-1",
  serviceId: createdServices[0].id,
  startAt: "2026-09-10T09:00:00-03:00",
  durationMinutes: 45,
});

scheduleAppointment({
  professionalId: "prof-1",
  serviceId: createdServices[2].id,
  startAt: "2026-09-10T10:00:00-03:00",
  durationMinutes: 30,
});

try {
  scheduleAppointment({
    professionalId: "prof-1",
    serviceId: createdServices[3].id,
    startAt: "2026-09-10T09:30:00-03:00",
    durationMinutes: 30,
  });
} catch (error) {
  console.log("Conflito esperado:", error.message);
}

console.table(listAppointments());

function getPort() {
  const port = Number(process.env.PORT ?? 3000);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("A porta deve ser um número inteiro positivo");
  }

  return port;
}

async function loadData() {
  return "Dados carregados";
}

console.log(`\nPorta: ${getPort()}`);
console.log(await loadData());
