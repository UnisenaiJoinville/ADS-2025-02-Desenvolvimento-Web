import { AppError } from "../errors/app-error.js";
export function parsePagination(
  query = {},
  { defaultPageSize = 20, maxPageSize = 200 } = {},
) {
  const rawPage = query.page ?? 1;
  const rawSize = query.pageSize ?? query.perPage ?? defaultPageSize;
  if (typeof rawPage === "object" || typeof rawSize === "object")
    throw new AppError("Paginacao invalida");
  const page = Number(rawPage),
    pageSize = Number(rawSize);
  const offset = (page - 1) * pageSize;
  if (
    !Number.isSafeInteger(page) ||
    page <= 0 ||
    !Number.isSafeInteger(offset) ||
    offset > 2147483647
  )
    throw new AppError("O parametro page deve ser um inteiro positivo valido");
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > maxPageSize)
    throw new AppError(
      `O parametro pageSize deve ser um inteiro entre 1 e ${maxPageSize}`,
    );
  return { page, pageSize, offset };
}
export function buildPagination({ page, pageSize }, total) {
  return {
    page,
    pageSize,
    total: Number(total),
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
