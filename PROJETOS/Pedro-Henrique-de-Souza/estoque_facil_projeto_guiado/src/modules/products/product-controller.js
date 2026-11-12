import { AppError } from "../../shared/errors/app-error.js";
import { parsePagination } from "../../shared/http/pagination.js";
import { parseId } from "../../shared/http/parse-id.js";

import * as service from "./product-service.js";

// Limites da busca rapida (Aula 62). Toda listagem precisa de um teto.
const SEARCH_DEFAULT_LIMIT = 8;
const SEARCH_MAX_LIMIT = 20;
const SEARCH_MAX_LENGTH = 60;

export async function index(request, response) {
  const { search, categoryId, lowStock } = request.query;

  // Padrao de 10 por pagina; no maximo 100 (toda listagem tem um teto).
  const { page, pageSize, offset } = parsePagination(request.query, {
    defaultPageSize: 10,
    maxPageSize: 100,
  });

  const result = await service.listProducts({
    search: typeof search === "string" ? search.trim() : "",
    categoryId: categoryId ? parseId(categoryId, "categoryId") : null,
    onlyLowStock: lowStock === "true",
    page,
    pageSize,
    offset,
  });

  response.json(result);
}

export async function search(request, response) {
  const { q, limit } = request.query;

  // ?q=cafe&q=cha chega como ARRAY. So aceitamos texto.
  const term = typeof q === "string" ? q.trim() : "";
  const parsedLimit = limit === undefined ? SEARCH_DEFAULT_LIMIT : Number(limit);

  if (term.length > SEARCH_MAX_LENGTH) {
    throw new AppError(`A busca deve ter no maximo ${SEARCH_MAX_LENGTH} caracteres`);
  }

  if (!Number.isInteger(parsedLimit) || parsedLimit <= 0 || parsedLimit > SEARCH_MAX_LIMIT) {
    throw new AppError(`O parametro limit deve ser um inteiro entre 1 e ${SEARCH_MAX_LIMIT}`);
  }

  const products = await service.searchProducts({ term, limit: parsedLimit });

  response.json(products);
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
