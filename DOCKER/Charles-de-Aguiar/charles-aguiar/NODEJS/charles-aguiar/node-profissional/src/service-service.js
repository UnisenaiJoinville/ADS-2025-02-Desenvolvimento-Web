import { randomUUID } from "node:crypto";
import { save, findAll, update, findById } from "./service-repository.js";
import { validateServiceInputCompleto } from "./service-validator.js";

export function createService(input) {
    const data = validateServiceInputCompleto(input);

    const normalizedName = data.name.toLocaleLowerCase("pt-BR");
    const exists = findAll().some(
        (service) => service.name.toLocaleLowerCase("pt-BR") === normalizedName
    );

    if (exists) {
        throw new Error("Serviço já cadastrado");
    }

    const service = {
        id: randomUUID(),
        ...data,
        active: true,
        createdAt: new Date().toISOString(),
    };

    return save(service);
}

export function listAllServices() {
    return findAll();
}

export function listActiveServices() {
    return findAll().filter((service) => service.active);
}

export function deactivateService(id) {
    const exists = findById(id);
    if (!exists) {
        throw new Error("Serviço não encontrado para desativação");
    }
    return update(id, { active: false });
}

export function calculateAveragePriceActive() {
    const active = findAll().filter((service) => service.active);
    const totalPrice = active.reduce((sum, service) => sum + service.price, 0);
    
    return {
        count: active.length,
        averagePrice: active.length ? totalPrice / active.length : 0,
    };
}
