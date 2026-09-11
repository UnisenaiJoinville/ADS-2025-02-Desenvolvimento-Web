import { randomUUID } from "node:crypto";
import { validateServiceInput } from "./service-validator.js";
import { findAll, findByName, findById, save, update } from "./service-repository.js";
import { ConflictError, NotFoundError } from "../../shared/errors/application-error.js";


export function createService(input) {
  const data = validateServiceInput(input);

  if (findByName(data.name)) {
    throw new ConflictError(`Já existe um serviço chamado "${data.name}"`);
  }

  const service = {
    id: randomUUID(),
    ...data,
    active: true,
    createdAt: new Date().toISOString(),
  };

  return save(service);
}

export function listAllServices() {
  return findAll();
}

export function listActiveServices() {
  return findAll().filter((service) => service.active);
}

export function deactivateService(id) {
  const service = findById(id);
  if (!service) {
    throw new NotFoundError(`Serviço com id "${id}" não encontrado`);
  }
  return update(id, { active: false });
}


export function getActiveServicesSummary() {
  const active = listActiveServices();
  const totalPrice = active.reduce((sum, service) => sum + service.price, 0);

  return {
    count: active.length,
    averagePrice: active.length ? totalPrice / active.length : 0,
  };
}


export function searchServicesByName(term) {
  const normalizedTerm = term.trim().toLowerCase();
  return findAll().filter((service) =>
    service.name.toLowerCase().includes(normalizedTerm),
  );
}


export function listServicesSortedByPrice(order = "asc") {
  const services = findAll();
  return services.toSorted((a, b) =>
    order === "asc" ? a.price - b.price : b.price - a.price,
  );
}
