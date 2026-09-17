import { deactivate, findAll, findByName, save } from "./service-repository.js";
import { validateServiceInput } from "./service-validator.js";

export function createService(name, durationMinutes, price) {
  validateServiceInput(name, durationMinutes, price);

  if (findByName(name)) {
    throw new Error("Serviço já cadastrado");
  }

  const service = save(name, durationMinutes, price);
  console.log("cadastrado " + service.name);

  return service;
}

export function searchService(name) {
  return findByName(name);
}

export function listServices() {
  return findAll();
}

export function deactivateService(id) {
  return deactivate(id);
}

export function getAverageActivePrice() {
  const active = findAll().filter((service) => service.active);

  if (active.length === 0) {
    return 0;
  }

  const total = active.reduce((sum, service) => sum + service.price, 0);
  return total / active.length;
}