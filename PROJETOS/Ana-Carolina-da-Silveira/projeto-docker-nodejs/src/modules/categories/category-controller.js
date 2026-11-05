import { parseId } from "../../shared/http/parse-id.js";

import * as service from "./category-service.js";

export async function index(request, response) {
  const categories = await service.listCategories();

  response.json(categories);
}

export async function show(request, response) {
  const id = parseId(request.params.id);
  const category = await service.getCategory(id);

  response.json(category);
}

export async function store(request, response) {
  const category = await service.createCategory(request.body);

  response.status(201).json(category);
}

export async function update(request, response) {
  const id = parseId(request.params.id);
  const category = await service.updateCategory(id, request.body);

  response.json(category);
}

export async function destroy(request, response) {
  const id = parseId(request.params.id);

  await service.deleteCategory(id);

  response.status(204).send();
}