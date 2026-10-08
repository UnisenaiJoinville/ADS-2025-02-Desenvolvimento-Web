import { validateServiceInput } from "./service-validator.js";
import {
  save,
  findByName,
  findAll,
  generateId,
  updateActiveStatus,
} from "./service-repository.js";
import {
  ConflictError,
  NotFoundError,
} from "../../shared/errors/application-error.js";

export function createService(input) {
  const data = validateServiceInput(input);

  if (findByName(data.name)) {
    throw new ConflictError(`Já existe um serviço chamado "${data.name}".`);
  }

  const service = {
    id: generateId(),
    ...data,
    active: true,
    createdAt: new Date().toISOString(),
  };

  return save(service);
}

export function findServiceByName(name) {
  return findByName(name) ?? null;
}

export function listServices() {
  return findAll();
}

export function listActiveServices() {
  return findAll().filter((service) => service.active);
}

export function deactivateService(id) {
  const updated = updateActiveStatus(id, false);
  if (!updated) {
    throw new NotFoundError(`Serviço com id ${id} não encontrado.`);
  }
  return updated;
}

export function getAveragePriceOfActiveServices() {
  const active = listActiveServices();
  if (active.length === 0) return 0;

  const total = active.reduce((sum, service) => sum + service.price, 0);
  return total / active.length;
}
