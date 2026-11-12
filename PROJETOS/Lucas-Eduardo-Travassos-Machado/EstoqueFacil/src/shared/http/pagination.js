import { AppError } from "../errors/app-error.js";

export function parsePagination(
  query,
  { defaultPageSize = 10, maxPageSize = 100 } = {},
) {
  for (const key of ["page", "pageSize"]) {
    if (query[key] !== undefined && typeof query[key] !== "string") {
      throw new AppError(`O parametro ${key} deve ter um unico valor`);
    }
  }
  const page = Number(query.page ?? 1);
  const pageSize = Number(query.pageSize ?? defaultPageSize);
  if (
    !Number.isSafeInteger(page) ||
    page <= 0 ||
    !Number.isSafeInteger((page - 1) * pageSize)
  ) {
    throw new AppError("O parametro page deve ser um inteiro maior que zero");
  }
  if (!Number.isInteger(pageSize) || pageSize <= 0 || pageSize > maxPageSize) {
    throw new AppError(
      `O parametro pageSize deve ser um inteiro entre 1 e ${maxPageSize}`,
    );
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
