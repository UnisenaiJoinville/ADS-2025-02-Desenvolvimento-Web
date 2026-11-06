import {
  AppError,
  ConflictError,
  NotFoundError,
} from "../../shared/errors/app-error.js";
import { buildPagination } from "../../shared/http/pagination.js";
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
  return { rows, pagination: buildPagination(filters, total) };
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
  // O saldo so muda por transacoes de movimentacao.
  const data = validateProductInput({ ...input, quantity: current.quantity });

  const existing = await repository.findBySku(data.sku);

  if (existing && existing.id !== Number(id)) {
    throw new ConflictError(`Ja existe um produto com o SKU ${data.sku}`);
  }

  await ensureCategoryExists(data.categoryId);

  return repository.update(id, data);
}

export async function deleteProduct(id) {
  await getProduct(id);
  await repository.remove(id);
}

export const searchProducts = (filters) => repository.search(filters);
