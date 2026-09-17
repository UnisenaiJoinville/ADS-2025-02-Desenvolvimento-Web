const services = [];

export function save(service) {
  services.push({ ...service });
  return { ...service };
}

export function findAll() {
  return services.map((service) => ({ ...service }));
}

export function findByName(name) {
  return findAll().find(
    (service) => service.name.toLocaleLowerCase('pt-BR')
      === name.toLocaleLowerCase('pt-BR'),
  );
}

export function deactivate(id) {
  const service = services.find((service) => service.id === id);
  if (!service) return undefined;

  service.active = false;
  return { ...service };
}
