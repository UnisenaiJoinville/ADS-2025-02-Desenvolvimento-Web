import { parseId } from "../../shared/http/parse-id.js";

import * as service from "./product-service.js";

export async function index(request, response) {
  const { search, categoryId, lowStock } = request.query;
  const products = await service.listProducts({
    search: typeof search === "string" ? search.trim() : "",
    categoryId: categoryId ? parseId(categoryId, "categoryId") : null,
    onlyLowStock: lowStock === "true",
  });

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
