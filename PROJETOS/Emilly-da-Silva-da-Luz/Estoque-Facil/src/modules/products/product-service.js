import { AppError, ConflictError, NotFoundError } from "../../shared/errors/app-error.js";
import * as categoryRepository from "../categories/category-repository.js";

import {buildPagination} from "../../shared/http/pagination.js";
import * as movementRepository from "../movements/movement-repository.js";
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
  const [rows,total] = await Promise.all([repository.findAll(filters),repository.countAll(filters)]);
  return {rows,pagination:buildPagination(filters,total)};
}

export async function searchProducts(q, limit = 8) {
 const term = typeof q === 'string' ? q.trim() : '';
 if (!term) return [];
 const size = Number(limit);
 if (!Number.isInteger(size) || size < 1 || size > 20) throw new AppError('Limite invalido');
 return repository.search({term,limit:size});
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
  await getProduct(id);

  const data = validateProductInput(input);

  const existing = await repository.findBySku(data.sku);

  if (existing && existing.id !== Number(id)) {
    throw new ConflictError(`Ja existe um produto com o SKU ${data.sku}`);
  }

  await ensureCategoryExists(data.categoryId);

  return repository.update(id, data);
}

export async function deleteProduct(id) {
  await getProduct(id);

  if (await movementRepository.countByProduct(id)) throw new ConflictError("Produto possui movimentacoes. Inative-o para preservar o historico");
  await repository.remove(id);
}
