import { AppError } from "../../shared/errors/app-error.js";

const MAX_PAGE_SIZE = 200;

const PRODUCT_SORT_COLUMNS = {
  name: "p.name",
  sku: "p.sku",
  category: "categoryName",
  quantity: "p.quantity",
  costPrice: "p.cost_price",
  salePrice: "p.sale_price",
  stockValue: "stockCostValue",
  createdAt: "p.created_at",
};

const MOVEMENT_SORT_COLUMNS = {
  date: "m.created_at",
  product: "p.name",
  category: "categoryName",
  user: "userName",
  type: "m.type",
  quantity: "m.quantity",
};

function parseText(value, { field, maxLength = 80 }) {
  const text = String(value ?? "").trim().replace(/\s+/g, " ");

  if (text.length > maxLength) {
    throw new AppError(`O filtro ${field} deve ter no maximo ${maxLength} caracteres`);
  }

  return text;
}

function parseOptionalId(value, field) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(`O filtro ${field} e invalido: ${value}`);
  }

  return id;
}

function parseSort(value, { columns, fallback }) {
  const key = String(value ?? "").trim() || fallback;

  if (!Object.hasOwn(columns, key)) {
    throw new AppError(
      `Ordenacao invalida: ${key}. Use um destes: ${Object.keys(columns).join(", ")}`
    );
  }

  return { key, column: columns[key] };
}

function parseDirection(value) {
  const direction = String(value ?? "asc").trim().toUpperCase();

  if (direction !== "ASC" && direction !== "DESC") {
    throw new AppError('A direcao da ordenacao deve ser "asc" ou "desc"');
  }

  return direction;
}

function parsePagination(query) {
  const page = Number(query?.page ?? 1);
  const pageSize = Number(query?.pageSize ?? 25);

  if (!Number.isInteger(page) || page <= 0) {
    throw new AppError("O parametro page deve ser um inteiro maior que zero");
  }

  if (!Number.isInteger(pageSize) || pageSize <= 0 || pageSize > MAX_PAGE_SIZE) {
    throw new AppError(
      `O parametro pageSize deve ser um inteiro entre 1 e ${MAX_PAGE_SIZE}`
    );
  }

  return { page, pageSize, offset: (page - 1) * pageSize };
}

export function parseProductReportFilters(query = {}) {
  const { page, pageSize, offset } = parsePagination(query);

  return {
    search: parseText(query.search, { field: "search" }),
    categoryId: parseOptionalId(query.categoryId, "categoryId"),
    onlyActive: String(query.onlyActive ?? "true") !== "false",
    sort: parseSort(query.sort, { columns: PRODUCT_SORT_COLUMNS, fallback: "name" }),
    direction: parseDirection(query.direction),
    page,
    pageSize,
    offset,
  };
}

export function parseMovementReportFilters(query = {}) {
  const { page, pageSize, offset } = parsePagination(query);
  const type = parseText(query.type, { field: "type", maxLength: 3 }).toUpperCase();

  if (type && type !== "IN" && type !== "OUT") {
    throw new AppError('O filtro type deve ser "IN" ou "OUT"');
  }

  return {
    productId: parseOptionalId(query.productId, "productId"),
    categoryId: parseOptionalId(query.categoryId, "categoryId"),
    userId: parseOptionalId(query.userId, "userId"),
    type: type || null,
    sort: parseSort(query.sort, { columns: MOVEMENT_SORT_COLUMNS, fallback: "date" }),
    direction: parseDirection(query.direction ?? "desc"),
    page,
    pageSize,
    offset,
  };
}
