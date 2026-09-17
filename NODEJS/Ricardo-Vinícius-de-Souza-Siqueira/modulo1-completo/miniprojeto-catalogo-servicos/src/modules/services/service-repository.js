
const services = [];

export function save(service) {
  services.push(service);
  return { ...service };
}

export function findAll() {
  return services.map((service) => ({ ...service }));
}

export function findByName(name) {
  const found = services.find(
    (service) => service.name.toLowerCase() === name.toLowerCase(),
  );
  return found ? { ...found } : undefined;
}

export function findById(id) {
  const found = services.find((service) => service.id === id);
  return found ? { ...found } : undefined;
}


export function update(id, changes) {
  const index = services.findIndex((service) => service.id === id);
  if (index === -1) return undefined;
  services[index] = { ...services[index], ...changes };
  return { ...services[index] };
}
