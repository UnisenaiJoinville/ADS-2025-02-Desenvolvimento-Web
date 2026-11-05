import { AppError } from "../errors/app-error.js";

export function parsePagination(query, { defaultPageSize = 10, maxPageSize = 100 } = {}) {
  const page = Number(query?.page ?? 1);
  const pageSize = Number(query?.pageSize ?? defaultPageSize);

  if (!Number.isInteger(page) || page <= 0) {
    throw new AppError("O parametro page deve ser um inteiro maior que zero");
  }

  if (!Number.isInteger(pageSize) || pageSize <= 0 || pageSize > maxPageSize) {
    throw new AppError(`O parametro pageSize deve ser um inteiro entre 1 e ${maxPageSize}`);
  }

  return { page, pageSize, offset: (page - 1) * pageSize };
}

export function buildPagination({ page, pageSize }, total) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
