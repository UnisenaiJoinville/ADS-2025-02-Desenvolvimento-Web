const services = [];
let nextId = 1;

export function save(data) {
  const service = {
    id: nextId,
    ...data,
    active: true,
  };

  nextId += 1;
  services.push(service);
  return { ...service };
}

export function findByName(name) {
  const service = services.find(
    (item) => item.name.toLowerCase() === name.toLowerCase(),
  );

  return service ? { ...service } : undefined;
}

export function findAll() {
  return services.map((service) => ({ ...service }));
}

export function deactivateById(id) {
  const service = services.find((item) => item.id === id);
  if (!service) return undefined;

  service.active = false;
  return { ...service };
}
