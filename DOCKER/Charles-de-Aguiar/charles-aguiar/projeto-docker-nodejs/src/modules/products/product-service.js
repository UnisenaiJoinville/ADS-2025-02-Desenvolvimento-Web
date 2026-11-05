import { AppError, ConflictError, NotFoundError } from "../../shared/errors/app-error.js";
import * as categoryRepository from "../categories/category-repository.js";
import * as repository from "./product-repository.js";
import { validateProductInput } from "./product-validator.js";

async function ensureCategoryExists(categoryId) {
  if (categoryId === null) {
    return;
  }

  const rows = await categoryRepository.findById(categoryId);

  // CORREÇÃO CIRÚRGICA: Confere se o array retornou vazio (id nao encontrado)
  if (!rows || rows.length === 0) {
    throw new AppError("Categoria informada nao existe");
  }
}

export async function listProducts(filters) {
  return repository.findAll(filters);
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

  // ANTES TAVA: if (existing && existing.length > 0)

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

 // ANTES TAVA: if (existing && existing.length > 0 && existing.id !== Number(id))
//Mudei para: if (existing && existing.id !== Number(id)) para corrigir o bug de atualizar um produto com o mesmo SKU de outro produto. Antes, se existisse um produto com o mesmo SKU, mas fosse o mesmo produto que estava sendo atualizado, ele lançava um erro de conflito. Agora, ele só lança o erro se for um produto diferente com o mesmo SKU.
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
