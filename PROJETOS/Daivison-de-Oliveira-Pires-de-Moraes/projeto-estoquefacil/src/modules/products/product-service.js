import { buildPagination } from "../../shared/http/pagination.js";
import {
  AppError,
  ConflictError,
  NotFoundError,
} from "../../shared/errors/app-error.js";
import * as categoryRepository from "../categories/category-repository.js";

import * as repository from "./product-repository.js";
import { validateProductInput } from "./product-validator.js";

async function ensureCategoryExists(categoryId) {
  if (categoryId === null) {
    return;
  }

  const category = await categoryRepository.findById(categoryId);

  if (!category) {
    throw new AppError("Categoria informada nao existe");
  }
}

export async function listProducts(filters) {
  const [rows, total] = await Promise.all([
    repository.findAll(filters),
    repository.countAll(filters),
  ]);
  return { pagination: buildPagination(filters, total), rows };
}
export async function searchProducts(filters) {
  return repository.search(filters);
}
export async function setProductActive(id, active) {
  await getProduct(id);
  return repository.setActive(id, active);
}

export async function getProduct(id) {
  const product = await repository.findById(id);

  if (!product) {
    throw new NotFoundError("Produto nao encontrado");
  }

  return product;
}

export async function createProduct(input) {
  const data = validateProductInput(input);

  const existing = await repository.findBySku(data.sku);

  if (existing) {
    throw new ConflictError(`Ja existe um produto com o SKU ${data.sku}`);
  }

  await ensureCategoryExists(data.categoryId);

  return repository.create(data);
}

export async function updateProduct(id, input) {
  const current = await getProduct(id);

  const data = validateProductInput(input);

  if (data.quantity !== current.quantity)
    throw new ConflictError(
      "Altere o saldo pela tela Movimentacoes usando Ajuste",
    );

  const existing = await repository.findBySku(data.sku);

  if (existing && existing.id !== Number(id)) {
    throw new ConflictError(`Ja existe um produto com o SKU ${data.sku}`);
  }

  await ensureCategoryExists(data.categoryId);

  return repository.update(id, data);
}

export async function deleteProduct(id) {
  await getProduct(id);

  if (await repository.countMovements(id))
    throw new ConflictError(
      "Produto com historico nao pode ser excluido. Inative-o para preservar as movimentacoes.",
    );
  await repository.remove(id);
}
