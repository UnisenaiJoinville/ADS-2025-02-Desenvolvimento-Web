import { validateServiceInput } from "./service-validator.js";

export function createService(input) {
  validateServiceInput(input);
  return { ...input, active: true };
}
