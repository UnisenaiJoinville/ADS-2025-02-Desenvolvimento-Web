import { validarNomeServico } from "./service-validator.js";
export function criarServico(name, price) {
  validarNomeServico(name);
  return { name, price, createdAt: new Date() };
}