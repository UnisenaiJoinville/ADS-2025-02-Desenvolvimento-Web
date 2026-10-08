import { randomUUID } from 'node:crypto';
import { validateServiceInput } from './service-validator.js';
import { save, findAll, findByName, deactivate } from './service-repository.js';

export function createService(input) {
  const data = validateServiceInput(input);

  if (findByName(data.name)) {
    throw new Error('Serviço com este nome já existe.');
  }

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
  const service = deactivate(id);
  if (!service) throw new Error('Serviço não encontrado.');
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
