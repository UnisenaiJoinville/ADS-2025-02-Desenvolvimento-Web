import { randomUUID } from "node:crypto";
import { deactivate, findAll, findByName, save } from "./service-repository.js";
import { normalizeName, validateServiceInput } from "./service-validator.js";

export function createService(input) {
  const data = validateServiceInput(input);
  const normalizedName = data.name.toLocaleLowerCase("pt-BR");

  if (findByName(normalizedName)) {
    throw new Error("Serviço já cadastrado");
  }

  const service = {
    id: randomUUID(),
    ...data,
    active: true,
    createdAt: new Date().toISOString(),
  };

  return save(service);
}

export function listServices() {
  return findAll();
}

export function listActiveServices() {
  return findAll().filter((service) => service.active);
}

export function deactivateService(id) {
  const service = deactivate(id);
  if (!service) {
    throw new Error("Serviço não encontrado");
  }
  return service;
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
  const normalizedTerm = normalizeName(term ?? "").toLocaleLowerCase("pt-BR");
  return listServices().filter((service) =>
    service.name.toLocaleLowerCase("pt-BR").includes(normalizedTerm),
  );
}

export function listServicesSortedByPrice() {
  return [...listServices()].sort((a, b) => a.price - b.price);
}