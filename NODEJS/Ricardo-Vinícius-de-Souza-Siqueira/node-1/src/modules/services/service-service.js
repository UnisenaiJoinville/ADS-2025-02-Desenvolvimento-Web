import { randomUUID } from 'node:crypto';
import { validateServiceInput } from './service-validator.js';
import { findAll, findByName, markAsInactive, save } from './service-repository.js';

export function createService(input) {
  const data = validateServiceInput(input);

  if (findByName(data.name)) {
    throw new Error(`Já existe um serviço cadastrado com o nome "${data.name}"`);
  }

  const service = {
    id: randomUUID(),
    ...data,
    active: true,
    createdAt: new Date().toISOString(),
  };

  return save(service);
}

export function findServiceByName(name) {
  return findByName(name);
}

export function listAllServices() {
  return findAll();
}

export function listActiveServices() {
  return findAll().filter((service) => service.active);
}

export function deactivateService(id) {
  return markAsInactive(id);
}

export function getActiveServicesSummary() {
  const active = listActiveServices();
  const totalPrice = active.reduce((sum, service) => sum + service.price, 0);

  return {
    count: active.length,
    averagePrice: active.length ? totalPrice / active.length : 0,
  };
}
