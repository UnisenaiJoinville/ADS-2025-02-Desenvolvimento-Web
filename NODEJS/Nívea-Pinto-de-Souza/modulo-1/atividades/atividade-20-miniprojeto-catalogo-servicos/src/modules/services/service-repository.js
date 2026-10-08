const services = [];

export function save(service) {
  services.push({ ...service });
  return { ...service };
}

export function findAll() {
  return services.map((service) => ({ ...service }));
}

export function findById(id) {
  const service = services.find((item) => item.id === id);
  return service ? { ...service } : undefined;
}

export function replaceById(id, updatedService) {
  const index = services.findIndex((item) => item.id === id);
  if (index < 0) return undefined;
  services[index] = { ...updatedService };
  return { ...services[index] };
}
