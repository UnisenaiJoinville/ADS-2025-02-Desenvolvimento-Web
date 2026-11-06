import { AppError } from "../../shared/errors/app-error.js";
import { parseId } from "../../shared/http/parse-id.js";
import { parsePagination } from "../../shared/http/pagination.js";
import { text, integer, boolean } from "../../shared/http/input.js";
import { toCsv } from "../../shared/http/to-csv.js";
import * as service from "./product-service.js";
export function parseList(query = {}) {
  const order = query.orderBy ?? "name";
  const columns = {
    name: "p.name",
    quantity: "p.quantity",
    salePrice: "p.sale_price",
  };
  if (typeof order !== "string" || !Object.hasOwn(columns, order))
    throw new AppError("Ordenacao invalida");
  const direction = query.direction ?? "asc";
  if (!["asc", "desc"].includes(direction))
    throw new AppError("Direcao invalida");
  return {
    ...parsePagination(query),
    search: text(query.search, "busca", 80),
    categoryId: query.categoryId ? parseId(query.categoryId) : null,
    onlyLowStock: boolean(query.lowStock),
    includeInactive: boolean(query.includeInactive),
    orderColumn: columns[order],
    direction: direction.toUpperCase(),
  };
}
export async function index(req, res) {
  res.json(await service.listProducts(parseList(req.query)));
}
export async function search(req, res) {
  res.json(
    await service.searchProducts({
      term: text(req.query.q, "q", 80),
      limit: integer(req.query.limit ?? 8, "limit", 1, 20),
    }),
  );
}
export async function show(req, res) {
  res.json(await service.getProduct(parseId(req.params.id)));
}
export async function store(req, res) {
  res.status(201).json(await service.createProduct(req.body));
}
export async function update(req, res) {
  res.json(await service.updateProduct(parseId(req.params.id), req.body));
}
export async function active(req, res) {
  if (typeof req.body?.active !== "boolean")
    throw new AppError("active deve ser true ou false");
  res.json(
    await service.setProductActive(parseId(req.params.id), req.body.active),
  );
}
export async function destroy(req, res) {
  await service.deleteProduct(parseId(req.params.id));
  res.status(204).send();
}
export async function exportCsv(req, res) {
  const filters = parseList(req.query),
    rows = [];
  for (let page = 1; ; page++) {
    const result = await service.listProducts({
      ...filters,
      page,
      pageSize: 200,
      offset: (page - 1) * 200,
    });
    rows.push(...result.rows);
    if (page >= result.pagination.totalPages) break;
  }
  res
    .type("text/csv; charset=utf-8")
    .attachment("produtos.csv")
    .send(
      toCsv(rows, [
        { key: "sku", label: "SKU" },
        { key: "name", label: "Produto" },
        { key: "supplier", label: "Fornecedor" },
        { key: "quantity", label: "Quantidade" },
      ]),
    );
}
