import { randomUUID } from "node:crypto";
import {
  findAll,
  findById,
  findByName,
  save,
  updateById,
} from "./service-repository.js";
import {
  normalizeName,
  validateServiceInput,
} from "./service-validator.js";

export function createService(input) {
  const data = validateServiceInput(input);

  if (findByName(data.name)) {
    throw new Error("Já existe um serviço com este nome");
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

export function deactivateService(id) {
  const service = findById(id);

  if (!service) {
    throw new Error("Serviço não encontrado");
  }

  if (!service.active) {
    return service;
  }

  return updateById(id, { active: false });
}

export function getActiveServicesSummary() {
  const activeServices = listActiveServices();
  const totalPrice = activeServices.reduce(
    (total, service) => total + service.price,
    0,
  );

  return {
    count: activeServices.length,
    averagePrice: activeServices.length
      ? totalPrice / activeServices.length
      : 0,
  };
}

export function searchServicesByName(searchText) {
  if (typeof searchText !== "string") {
    throw new Error("O texto da busca deve ser uma string");
  }

  const normalizedSearch = normalizeName(searchText).toLocaleLowerCase("pt-BR");

  return findAll().filter((service) =>
    service.name.toLocaleLowerCase("pt-BR").includes(normalizedSearch),
  );
}

export function listServicesSortedByPrice(order = "asc") {
  if (order !== "asc" && order !== "desc") {
    throw new Error("A ordenação deve ser asc ou desc");
  }

  const direction = order === "asc" ? 1 : -1;
  return findAll().sort((first, second) =>
    (first.price - second.price) * direction,
  );
}
