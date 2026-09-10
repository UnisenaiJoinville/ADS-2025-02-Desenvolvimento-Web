const services = [];

export function save(service) {
  services.push(service);
  return { ...service };
}

export function findAll() {
  return services.map((service) => ({ ...service }));
}

export function findByName(normalizedName) {
  const found = services.find(
    (service) => service.name.toLocaleLowerCase("pt-BR") === normalizedName,
  );
  return found ? { ...found } : undefined;
}

export function deactivate(id) {
  const service = services.find((service) => service.id === id);
  if (!service) return undefined;
  service.active = false;
  return { ...service };
}