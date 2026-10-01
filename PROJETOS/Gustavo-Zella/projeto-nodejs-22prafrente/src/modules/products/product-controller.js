import { AppError } from "../../shared/errors/app-error.js";
import { parseId } from "../../shared/http/parse-id.js";

import * as service from "./product-service.js";

const ALLOWED_ORDER_BY = ["name", "quantity", "salePrice", "costPrice", "createdAt"];

export async function index(request, response) {
  const { search, categoryId, lowStock, includeInactive, orderBy, orderDir, page, perPage } =
    request.query;

  if (orderBy && !ALLOWED_ORDER_BY.includes(orderBy)) {
    throw new AppError(
      `orderBy invalido. Use um de: ${ALLOWED_ORDER_BY.join(", ")}`
    );
  }

  const result = await service.listProducts({
    search: typeof search === "string" ? search.trim() : "",
    categoryId: categoryId ? parseId(categoryId, "categoryId") : null,
    onlyLowStock: lowStock === "true",
    includeInactive: includeInactive === "true",
    orderBy: orderBy ?? "name",
    orderDir: orderDir === "desc" ? "desc" : "asc",
    page,
    perPage,
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

// Exercicio 2.1 — "excluir" agora e soft delete (204, sem corpo).
export async function destroy(request, response) {
  const id = parseId(request.params.id);

  await service.deleteProduct(id);

  response.status(204).send();
}

export async function reactivate(request, response) {
  const id = parseId(request.params.id);

  await service.reactivateProduct(id);

  response.status(204).send();
}

// Exercicio 3.2 — exportar produtos em CSV.
function csvEscape(value) {
  const text = String(value ?? "");

  // Se o valor contem virgula, aspas ou quebra de linha, precisa ser
  // envolvido em aspas duplas, e aspas internas viram aspas duplicadas.
  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

export async function exportCsv(request, response) {
  const products = await service.exportProducts();

  const header = [
    "id",
    "name",
    "sku",
    "supplier",
    "categoryName",
    "costPrice",
    "salePrice",
    "quantity",
    "minimumStock",
    "active",
  ];

  const lines = [header.join(",")];

  for (const product of products) {
    lines.push(header.map((field) => csvEscape(product[field])).join(","));
  }

  const csv = lines.join("\n");

  response.setHeader("Content-Type", "text/csv; charset=utf-8");
  response.setHeader("Content-Disposition", "attachment; filename=produtos.csv");
  response.status(200).send(csv);
}
