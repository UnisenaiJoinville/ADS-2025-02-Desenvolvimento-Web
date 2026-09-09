import assert from "node:assert/strict";
import { createServiceRepository } from "../26.2-refatoracao/src/modules/services/service-repository.js";
import { createServiceService } from "../26.2-refatoracao/src/modules/services/service-service.js";
import { createAppointmentService } from "../26.3-agendamento/src/appointment-service.js";

const repository = createServiceRepository();
const services = createServiceService(repository);

const created = services.createService({
  name: "Consulta",
  durationMinutes: "45",
  price: 150
});

assert.equal(created.durationMinutes, 45);
assert.equal(created.active, true);

assert.throws(
  () => services.createService({ name: "   ", durationMinutes: 30, price: 10 }),
  /nome do serviço/
);

assert.throws(
  () => services.createService({ name: "Consulta", durationMinutes: 30, price: 10 }),
  /Já existe/
);

services.createService({
  name: "Avaliação",
  durationMinutes: 30,
  price: 100
});

assert.equal(services.listServices().length, 2);
assert.equal(services.averageActivePrice(), 125);

services.deactivateService(created.id);
assert.equal(services.listActiveServices().length, 1);
assert.equal(services.averageActivePrice(), 100);

const appointments = createAppointmentService();

const first = appointments.scheduleAppointment({
  professionalId: "prof-1",
  serviceId: "service-1",
  startAt: "2026-09-10T14:00:00-03:00",
  durationMinutes: 45
});

assert.equal(first.durationMinutes, 45);
assert.equal(appointments.listAppointments().length, 1);

assert.throws(
  () =>
    appointments.scheduleAppointment({
      professionalId: "prof-1",
      serviceId: "service-2",
      startAt: "2026-09-10T14:30:00-03:00",
      durationMinutes: 30
    }),
  /conflito|agendamento/i
);

const differentProfessional = appointments.scheduleAppointment({
  professionalId: "prof-2",
  serviceId: "service-2",
  startAt: "2026-09-10T14:30:00-03:00",
  durationMinutes: 30
});

assert.equal(differentProfessional.professionalId, "prof-2");

assert.throws(
  () =>
    appointments.scheduleAppointment({
      professionalId: "prof-1",
      serviceId: "service-3",
      startAt: "2026-09-10T16:00:00-03:00",
      durationMinutes: 0
    }),
  /inteiro positivo/
);

console.log("Todos os testes passaram.");
