import { randomUUID } from "node:crypto";
import { findAll, findById, replaceById, save } from "./service-repository.js";
import { validateServiceInput } from "./service-validator.js";

export function createService(input) {
  const data = validateServiceInput(input);
  const normalizedName = data.name.toLocaleLowerCase("pt-BR");
  const exists = findAll().some(
    (service) => service.name.toLocaleLowerCase("pt-BR") === normalizedName
  );
  if (exists) throw new Error("Serviço já cadastrado");

  return save({
    id: randomUUID(),
    ...data,
    active: true,
    createdAt: new Date().toISOString(),
  });
}

export function listServices() {
  return findAll();
}

export function listActiveServices() {
  return findAll().filter((service) => service.active);
}

export function deactivateService(id) {
  const service = findById(id);
  if (!service) throw new Error("Serviço não encontrado");
  if (!service.active) return service;
  return replaceById(id, { ...service, active: false });
}

export function getActiveServicesSummary() {
  const active = listActiveServices();
  const totalPrice = active.reduce((sum, service) => sum + service.price, 0);
  return {
    count: active.length,
    averagePrice: active.length ? totalPrice / active.length : 0,
  };
}

export function searchServices(term) {
  const normalizedTerm = String(term ?? "").trim().toLocaleLowerCase("pt-BR");
  return findAll().filter((service) =>
    service.name.toLocaleLowerCase("pt-BR").includes(normalizedTerm)
  );
}

export function sortServicesByPrice(direction = "asc") {
  const factor = direction === "desc" ? -1 : 1;
  return findAll().toSorted((a, b) => (a.price - b.price) * factor);
}
