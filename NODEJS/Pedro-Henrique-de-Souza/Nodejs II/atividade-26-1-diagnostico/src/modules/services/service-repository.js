import { randomUUID } from "node:crypto";

const services = [];

export function save(service) {
  const newService = { ...service, id: randomUUID() };
  services.push(newService);
  return { ...newService };
}

export function findAll() {
  return services.map((service) => ({ ...service }));
}

export function findByName(name) {
  const normalized = name.toLocaleLowerCase("pt-BR");
  const found = services.find(
    (service) => service.name.toLocaleLowerCase("pt-BR") === normalized,
  );
  return found ? { ...found } : null;
}

export function findById(id) {
  const found = services.find((service) => service.id === id);
  return found ? { ...found } : null;
}

export function deactivateById(id) {
  const service = services.find((service) => service.id === id);

  if (!service) {
    return null;
  }

  service.active = false;
  return { ...service };
}