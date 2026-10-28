import { AppError } from "../../shared/errors/app-error.js";
import { parsePagination } from "../../shared/http/pagination.js";
import { parseId } from "../../shared/http/parse-id.js";

import * as service from "./product-service.js";

export async function index(request, response) {
  const { search, categoryId, lowStock } = request.query;
  const pagination = parsePagination(request.query, {
    defaultPageSize: 10,
    maxPageSize: 100,
  });
  const products = await service.listProducts({
    search: typeof search === "string" ? search.trim() : "",
    categoryId: categoryId ? parseId(categoryId, "categoryId") : null,
    onlyLowStock: lowStock === "true",
    ...pagination,
  });

  response.json(products);
}

export async function search(request, response) {
  const { q, limit } = request.query;
  const term = typeof q === "string" ? q.trim() : "";
  const parsedLimit = limit === undefined ? 8 : Number(limit);

  if (term.length > 60) {
    throw new AppError("A busca deve ter no maximo 60 caracteres");
  }

  if (!Number.isInteger(parsedLimit) || parsedLimit <= 0 || parsedLimit > 20) {
    throw new AppError("O parametro limit deve ser um inteiro entre 1 e 20");
  }

  response.json(await service.searchProducts({ term, limit: parsedLimit }));
}

export async function show(request, response) {
  const id = parseId(request.params.id);
  const product = await service.getProduct(id);
  response.json(product);
}

export async function store(request, response) {
  const product = await service.createProduct(request.body);
  response.status(201).json(product);
}

export async function update(request, response) {
  const id = parseId(request.params.id);
  const product = await service.updateProduct(id, request.body);
  response.json(product);
}

export async function destroy(request, response) {
  const id = parseId(request.params.id);
  await service.deleteProduct(id);
  response.status(204).send();
}
