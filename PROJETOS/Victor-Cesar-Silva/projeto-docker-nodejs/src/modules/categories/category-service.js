import { ConflictError, NotFoundError } from "../../shared/errors/app-error.js";

import * as repository from "./category-repository.js";
import { validateCategoryInput } from "./category-validator.js";

export async function listCategories() {
  return repository.findAll();
}

export async function getCategory(id) {
  const category = await repository.findById(id);

  if (!category) {
    throw new NotFoundError("Categoria nao encontrada");
  }

  return category;
}

export async function createCategory(input) {
  const data = validateCategoryInput(input);

  const existing = await repository.findByName(data.name);

  if (existing) {
    throw new ConflictError("Ja existe uma categoria com esse nome");
  }

  return repository.create(data);
}

export async function updateCategory(id, input) {
  await getCategory(id);

  const data = validateCategoryInput(input);

  const existing = await repository.findByName(data.name);

  // So e conflito se o nome pertencer a OUTRA categoria
  if (existing && existing.id !== Number(id)) {
    throw new ConflictError("Ja existe uma categoria com esse nome");
  }

  return repository.update(id, data);
}

export async function deleteCategory(id) {
  await getCategory(id);

  await repository.remove(id);
}
