import { AppError } from "../../shared/errors/app-error.js";

// ------------------------------------------------------------------
// Peca central do modulo: transformar a query string (que e toda
// texto e vem de fora) em filtros limpos e confiaveis.
// Mesma ideia dos validators dos outros modulos.
// ------------------------------------------------------------------

const MAX_PAGE_SIZE = 200;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// LISTAS BRANCAS DE ORDENACAO
// O ? do prepared statement so funciona para VALORES.
// Nome de coluna entra no SQL por interpolacao - e interpolar
// texto do usuario e exatamente a porta da SQL injection.
// Por isso o cliente nao manda a coluna: ele manda uma CHAVE,
// e nos escolhemos o SQL correspondente.
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

const STOCK_STATUS = ["ALL", "OK", "LOW", "OUT"];
const MOVEMENT_TYPES = ["IN", "OUT"];

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

function parseChoice(value, { field, allowed, fallback }) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const choice = String(value).trim().toUpperCase();

  if (!allowed.includes(choice)) {
    throw new AppError(
      `O filtro ${field} deve ser um destes valores: ${allowed.join(", ")}`
    );
  }

  return choice;
}

function parseOptionalDate(value, field) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const date = String(value).trim();

  if (!DATE_PATTERN.test(date)) {
    throw new AppError(`O filtro ${field} deve estar no formato AAAA-MM-DD`);
  }

  // Number.isNaN(...) pega datas com cara certa mas inexistentes,
  // como 2026-02-31.
  const parsed = new Date(`${date}T00:00:00Z`);

  if (Number.isNaN(parsed.getTime()) || !parsed.toISOString().startsWith(date)) {
    throw new AppError(`O filtro ${field} nao e uma data valida: ${date}`);
  }

  return date;
}

function ensureDateOrder(startDate, endDate) {
  if (startDate && endDate && startDate > endDate) {
    throw new AppError("A data inicial nao pode ser maior que a data final");
  }
}

function parseSort(value, { columns, fallback }) {
  const key = String(value ?? "").trim() || fallback;

  if (!Object.hasOwn(columns, key)) {
    throw new AppError(
      `Ordenacao invalida: ${key}. Use um destes: ${Object.keys(columns).join(", ")}`
    );
  }

  // Devolve a CHAVE (para o cliente) e a COLUNA (para o SQL).
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

  // OFFSET: quantas linhas pular antes de comecar a devolver.
  return { page, pageSize, offset: (page - 1) * pageSize };
}

export function parseProductReportFilters(query = {}) {
  const { page, pageSize, offset } = parsePagination(query);

  return {
    search: parseText(query.search, { field: "search" }),
    categoryId: parseOptionalId(query.categoryId, "categoryId"),
    // "sem categoria" nao e um id: e a ausencia de um.
    // Por isso vira um filtro booleano separado.
    withoutCategory: String(query.withoutCategory ?? "") === "true",
    stockStatus: parseChoice(query.stockStatus, {
      field: "stockStatus",
      allowed: STOCK_STATUS,
      fallback: "ALL",
    }),
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

  const startDate = parseOptionalDate(query.startDate, "startDate");
  const endDate = parseOptionalDate(query.endDate, "endDate");

  ensureDateOrder(startDate, endDate);

  return {
    productId: parseOptionalId(query.productId, "productId"),
    categoryId: parseOptionalId(query.categoryId, "categoryId"),
    userId: parseOptionalId(query.userId, "userId"),
    type: parseChoice(query.type, {
      field: "type",
      allowed: MOVEMENT_TYPES,
      fallback: null,
    }),
    startDate,
    endDate,
    sort: parseSort(query.sort, { columns: MOVEMENT_SORT_COLUMNS, fallback: "date" }),
    direction: parseDirection(query.direction ?? "desc"),
    page,
    pageSize,
    offset,
  };
}

// O ranking tem dois ajustes proprios, que tambem precisam ser
// validados: nada que vai para o SQL escapa do validator.
export function parseTopProductsOptions(query = {}) {
  const minUnits = Number(query.minUnits ?? 1);
  const limit = Number(query.limit ?? 10);

  if (!Number.isInteger(minUnits) || minUnits < 0) {
    throw new AppError("O parametro minUnits deve ser um inteiro maior ou igual a zero");
  }

  if (!Number.isInteger(limit) || limit <= 0 || limit > 100) {
    throw new AppError("O parametro limit deve ser um inteiro entre 1 e 100");
  }

  return { minUnits, limit };
}
