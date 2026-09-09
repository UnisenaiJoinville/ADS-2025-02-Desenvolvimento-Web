const services = [];

export function save(service) {
  services.push(service);
  return { ...service };
}

export function findByName(name) {
  const normalized = name.toLocaleLowerCase('pt-BR');
  const found = services.find(
    (service) => service.name.toLocaleLowerCase('pt-BR') === normalized,
  );
  return found ? { ...found } : null;
}

export function findById(id) {
  const found = services.find((service) => service.id === id);
  return found ? { ...found } : null;
}

export function findAll() {
  return services.map((service) => ({ ...service }));
}

export function markAsInactive(id) {
  const service = services.find((service) => service.id === id);

  if (!service) {
    throw new Error(`Serviço com id "${id}" não encontrado`);
  }

  service.active = false;
  return { ...service };
}
