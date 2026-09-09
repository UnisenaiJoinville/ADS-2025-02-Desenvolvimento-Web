import { randomUUID } from "node:crypto";
import { validateServiceInput } from "./service-validator.js";
import { save, findAll, findByName, update } from "./service-repository.js";
import { ConflictError, NotFoundError } from "../shared/errors/application-error.js";

/**
 * Caso de uso: cadastrar serviço. Orquestra validação + regra de negócio
 * (nome único, ignorando maiúsculas/minúsculas) + persistência, mas não
 * conhece detalhes de nenhuma das três — cada uma vive em seu próprio módulo.
 */
export function createService(input) {
  const data = validateServiceInput(input);

  if (findByName(data.name)) {
    throw new ConflictError(`Já existe um serviço cadastrado com o nome "${data.name}".`);
  }

  const service = {
    id: randomUUID(),
    ...data,
    active: true,
    createdAt: new Date().toISOString(),
  };

  return save(service);
}

export function listServices() {
  return findAll();
}

export function listActiveServices() {
  return findAll().filter((service) => service.active);
}

export function findServiceByName(name) {
  return findByName(name);
}

export function deactivateService(id) {
  const updated = update(id, { active: false });
  if (!updated) {
    throw new NotFoundError(`Nenhum serviço encontrado com o id "${id}".`);
  }
  return updated;
}

/**
 * Preço médio dos serviços ativos. Guard explícito contra divisão por zero
 * (0 / 0 = NaN em JS) quando não há nenhum serviço ativo.
 */
export function getAverageActivePrice() {
  const active = listActiveServices();
  if (active.length === 0) {
    return 0;
  }
  const total = active.reduce((sum, service) => sum + service.price, 0);
  return total / active.length;
}
