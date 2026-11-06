import { text } from "../../shared/http/input.js";
export function validateCategoryInput(input) {
  return { name: text(input?.name, "nome da categoria", 80, true) };
}
