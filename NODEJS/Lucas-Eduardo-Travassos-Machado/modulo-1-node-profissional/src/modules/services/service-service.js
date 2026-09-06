import { randomUUID } from "node:crypto";
import { findByName, save } from "./service-repository.js";
import { validateServiceInput } from "./service-validator.js";

export function createService(input) {
    validateServiceInput(input);

    if (findByName(input.name)) {
        throw new Error("Serviço já cadastrado");
    }

    const service = {
        id: randomUUID(),
        ...input,
        active: true,
        createdAt: new Date().toISOString(),
    };

    return save(service);
}

