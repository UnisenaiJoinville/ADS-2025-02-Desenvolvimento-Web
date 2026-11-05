import { parseId } from "../../shared/http/parse-id.js";

import * as service from "./product-service.js";

export async function index(request, response) {
  const { search, categoryId, lowStock, includeInactive, page, perPage } = request.query;

  // Trata e valida parâmetros de paginação
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const rawPerPage = parseInt(perPage, 10) || 20;
  const parsedPerPage = Math.min(100, Math.max(1, rawPerPage)); // Trava perPage até o máximo de 100

  const result = await service.listProducts({
    search: typeof search === "string" ? search.trim() : "",
    categoryId: categoryId ? parseId(categoryId, "categoryId") : null,
    onlyLowStock: lowStock === "true",
    includeInactive: includeInactive === "true",
    page: parsedPage,
    perPage: parsedPerPage,
  });

  response.json(result);
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

  // O service executará o Soft Delete (UPDATE products SET active = FALSE WHERE id = ?)
  await service.deleteProduct(id);

  response.status(204).send();
}