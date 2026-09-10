import { validateServiceInput } from './service-validator.js';

const services = [];

export function createService(input) {
  const data = validateServiceInput(input);
  const exists = services.some(
    (service) => service.name.toLowerCase() === data.name.toLowerCase(),
  );

  if (exists) {
    throw new Error('Regra de negócio: serviço com este nome já existe.');
  }

  const service = { ...data, active: true };
  services.push(service);
  return { ...service };
}
