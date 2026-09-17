const services = [];
let nextId = 1;

export function save(name, durationMinutes, price) {
  const service = {
    id: nextId,
    name,
    durationMinutes,
    price,
    active: true,
  };

  nextId += 1;
  services.push(service);

  return service;
}

export function findAll() {
  return [...services];
}

export function findByName(name) {
  return services.find(
    (service) => service.name.toLowerCase() === name.toLowerCase(),
  );
}

export function deactivate(id) {
  const service = services.find((service) => service.id === id);

  if (service) {
    service.active = false;
  }

  return service;
}