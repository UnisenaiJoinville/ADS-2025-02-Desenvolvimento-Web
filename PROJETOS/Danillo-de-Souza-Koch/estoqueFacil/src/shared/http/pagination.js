import { AppError } from "../errors/app-error.js";

export function parsePagination(query, { defaultPageSize = 10, maxPageSize = 100 } = {}) {
  const page = Number(query?.page ?? 1);
  const pageSize = Number(query?.pageSize ?? defaultPageSize);

  if (!Number.isSafeInteger(page) || page <= 0) {
    throw new AppError("O parametro page deve ser um inteiro maior que zero");
  }

  if (!Number.isSafeInteger(pageSize) || pageSize <= 0 || pageSize > maxPageSize) {
    throw new AppError(`O parametro pageSize deve ser um inteiro entre 1 e ${maxPageSize}`);
  }

  const offset = (page - 1) * pageSize;
  if (!Number.isSafeInteger(offset)) {
    throw new AppError("O parametro page e muito grande");
  }

  return { page, pageSize, offset };
}

export function buildPagination({ page, pageSize }, total) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
