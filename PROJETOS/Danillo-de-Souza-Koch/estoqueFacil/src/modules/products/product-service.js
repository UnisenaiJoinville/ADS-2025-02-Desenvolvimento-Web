import { AppError, ConflictError, NotFoundError } from "../../shared/errors/app-error.js";
import { buildPagination } from "../../shared/http/pagination.js";
import * as categoryRepository from "../categories/category-repository.js";
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
  const [rows, total] = await Promise.all([
    repository.findAll(filters),
    repository.countAll(filters),
  ]);

  return {
    pagination: buildPagination(filters, total),
    rows,
  };
}

export async function searchProducts(filters) {
  return repository.search(filters);
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
  const movementCount = await movementRepository.countByProduct(id);

  if (movementCount > 0) {
    throw new ConflictError(
      `Este produto tem ${movementCount} movimentacao(oes) no historico. Inative-o para preservar os registros`
    );
  }

  try {
    await repository.remove(id);
  } catch (error) {
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      throw new ConflictError(
        "Este produto recebeu uma movimentacao durante a exclusao. Inative-o para preservar os registros"
      );
    }

    throw error;
  }
}
