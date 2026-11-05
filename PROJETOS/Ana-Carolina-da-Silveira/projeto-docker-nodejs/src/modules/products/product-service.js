import { AppError } from "../../shared/errors/app-error.js";
import { parseId } from "../../shared/http/parse-id.js";
import * as service from "./product-service.js";
import { AppError, ConflictError, NotFoundError } from "../../shared/errors/app-error.js";
import * as categoryRepository from "../categories/category-repository.js";
import * as repository from "./product-repository.js";
import { validateProductInput } from "./product-validator.js";
import { AppError, ConflictError, NotFoundError } from "../../shared/errors/app-error.js";
import { buildPagination } from "../../shared/http/pagination.js";
import * as categoryRepository from "../categories/category-repository.js";
import * as movementRepository from "../movements/movement-repository.js";

// Limites da busca rapida (Aula 62). Toda listagem precisa de um teto.
const SEARCH_DEFAULT_LIMIT = 8;
const SEARCH_MAX_LIMIT = 20;
const SEARCH_MAX_LENGTH = 60;

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
  // As duas consultas sao independentes: rodam ao mesmo tempo.
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

  // O banco ja recusaria (FK RESTRICT, Aula 65), mas com uma mensagem
  // tecnica. Conferimos antes para explicar o motivo em portugues.
  const movementCount = await movementRepository.countByProduct(id);

  if (movementCount > 0) {
    throw new ConflictError(
      `Este produto tem ${movementCount} movimentacao(oes) no historico e nao pode ser excluido.`
    );
  }

  await repository.remove(id);
}