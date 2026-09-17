const services = [];

export function save(service) {
    services.push(service);
    return service;
}

export function findByName(name) {
    return services.find((service) => service.name === name);
}

export function findById(id) {
    return services.find((service) => service.id === id);
}

export function update(id, partialData) {
    const index = services.findIndex((s) => s.id === id);
    if (index === -1) return null;
    services[index] = { ...services[index], ...partialData };
    return { ...services[index] };
}

export function findAll() {
    return services.map((service) => ({ ...service }));
}
