import { AppError } from "../../shared/errors/app-error.js";
import { parsePagination } from "../../shared/http/pagination.js";
import { parseId } from "../../shared/http/parse-id.js";

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