import { validateServiceInput } from "./service-validator.js";
import {
  save,
  findAll,
  findByName,
  deactivateById,
} from "./service-repository.js";

export function createService(input) {
  const data = validateServiceInput(input);

  if (findByName(data.name)) {
    throw new Error(`Já existe um serviço cadastrado com o nome "${data.name}".`);
  }

  return save({ ...data, active: true, createdAt: new Date().toISOString() });
}

export function listAllServices() {
  return findAll();
}

export function listActiveServices() {
  return findAll().filter((service) => service.active);
}

export function findServiceByName(name) {
  return findByName(name);
}

export function deactivateService(id) {
  const updated = deactivateById(id);

  if (!updated) {
    throw new Error(`Nenhum serviço encontrado com o id "${id}".`);
  }

  return updated;
}

export function getAveragePrice() {
  const active = listActiveServices();

  if (active.length === 0) {
    return 0;
  }

  const total = active.reduce((sum, service) => sum + service.price, 0);
  return total / active.length;
}