import { AppError, ConflictError, NotFoundError } from "../../shared/errors/app-error.js";
import * as categoryRepository from "../categories/category-repository.js";

import * as repository from "./product-repository.js";
import { validateProductInput } from "./product-validator.js";

const MAX_PER_PAGE = 100;

async function ensureCategoryExists(categoryId) {
  if (categoryId === null) {
    return;
  }

  const category = await categoryRepository.findById(categoryId);

  if (!category) {
    throw new AppError("Categoria informada nao existe");
  }
}

// Exercicio 2.2 — paginacao.
export async function listProducts(filters) {
  const page = Math.max(1, Number(filters.page) || 1);
  const perPage = Math.min(MAX_PER_PAGE, Math.max(1, Number(filters.perPage) || 20));

  const { data, total } = await repository.findAll({ ...filters, page, perPage });

  return {
    data,
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
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

// Exercicio 2.1 — soft delete.
// Perguntas do exercicio: apagar de verdade apaga o historico de
// movimentacoes junto (ON DELETE CASCADE), o que nao serve para um sistema
// com auditoria. Por isso "excluir" um produto apenas o desativa.
export async function deleteProduct(id) {
  await getProduct(id);

  await repository.deactivate(id);
}

export async function reactivateProduct(id) {
  await getProduct(id);

  await repository.reactivate(id);
}

// Exercicio 3.2 — exportacao em CSV: sempre todos os produtos, sem paginar.
export async function exportProducts() {
  return repository.findAllForExport();
}
