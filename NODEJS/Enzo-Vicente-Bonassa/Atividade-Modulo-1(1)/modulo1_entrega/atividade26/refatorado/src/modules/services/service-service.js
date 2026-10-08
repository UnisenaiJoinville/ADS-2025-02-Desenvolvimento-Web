import {
  save,
  findByName,
  findAll,
  deactivateById,
} from './service-repository.js';
import { validateServiceInput } from './service-validator.js';

export function createService(input) {
  const data = validateServiceInput(input);

  if (findByName(data.name)) {
    throw new Error('Serviço com este nome já existe.');
  }

  return save(data);
}

export function searchService(name) {
  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('Nome para busca é obrigatório.');
  }

  return findByName(name.trim());
}

export function listServices() {
  return findAll();
}

export function deactivateService(id) {
  const numericId = Number(id);

  if (!Number.isInteger(numericId)) {
    throw new Error('ID inválido.');
  }

  const service = deactivateById(numericId);
  if (!service) {
    throw new Error('Serviço não encontrado.');
  }

  return service;
}

export function calculateAveragePrice() {
  const activeServices = findAll().filter((service) => service.active);
  if (activeServices.length === 0) return 0;

  const total = activeServices.reduce(
    (sum, service) => sum + service.price,
    0,
  );

  return total / activeServices.length;
}
