const services = [];

export function save(service) {
    services.push(service);
    return service;
}

export function findByName(name) {
    return services.find((service) => service.name === name);
}

export function findAll() {
    return[...services];
}