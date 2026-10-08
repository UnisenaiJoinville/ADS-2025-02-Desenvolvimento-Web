import { randomUUID } from "node:crypto";
import { findByName, save } from "./service-repository.js";
import { validateServiceInput } from "./service-validator.js";

export function createService(input) {
  const data = validateServiceInput(input);
  if (findByName(data.name)) throw new Error("Serviço já cadastrado");
  return save({ id: randomUUID(), ...data, active: true, createdAt: new Date().toISOString() });
}
