const services = [];
let nextId = 1;

export function generateId() {
  const id = nextId;
  nextId += 1;
  return id;
}

export function save(service) {
  services.push(service);
  return { ...service };
}

export function findByName(name) {
  const normalized = name.toLocaleLowerCase("pt-BR");
  return services.find(
    (service) => service.name.toLocaleLowerCase("pt-BR") === normalized,
  );
}

export function findById(id) {
  return services.find((service) => service.id === id);
}

export function findAll() {
  // retorna cópias rasas para não expor as referências internas do array
  return services.map((service) => ({ ...service }));
}

export function updateActiveStatus(id, active) {
  const service = findById(id);
  if (!service) return null;
  service.active = active;
  return { ...service };
}
