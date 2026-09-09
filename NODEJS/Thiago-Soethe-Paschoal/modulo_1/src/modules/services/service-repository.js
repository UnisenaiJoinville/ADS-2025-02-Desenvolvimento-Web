const services = [];

export function save(service) {
  const storedService = { ...service };
  services.push(storedService);
  return { ...storedService };
}

export function findAll() {
  return services.map((service) => ({ ...service }));
}

export function findById(id) {
  const service = services.find((item) => item.id === id);
  return service ? { ...service } : undefined;
}

export function findByName(name) {
  const normalizedName = name.toLocaleLowerCase("pt-BR");
  const service = services.find(
    (item) => item.name.toLocaleLowerCase("pt-BR") === normalizedName,
  );

  return service ? { ...service } : undefined;
}

export function updateById(id, changes) {
  const index = services.findIndex((service) => service.id === id);

  if (index === -1) {
    return undefined;
  }

  services[index] = { ...services[index], ...changes };
  return { ...services[index] };
}
