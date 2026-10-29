import { AppError } from "../errors/app-error.js";

// Le ?page= e ?pageSize= da URL com seguranca (Aula 64).
// Cada listagem escolhe o proprio tamanho padrao e o proprio teto.
export function parsePagination(query, { defaultPageSize = 10, maxPageSize = 100 } = {}) {
  const page = Number(query?.page ?? 1);
  const pageSize = Number(query?.pageSize ?? defaultPageSize);

  if (!Number.isInteger(page) || page <= 0) {
    throw new AppError("O parametro page deve ser um inteiro maior que zero");
  }

  if (!Number.isInteger(pageSize) || pageSize <= 0 || pageSize > maxPageSize) {
    throw new AppError(`O parametro pageSize deve ser um inteiro entre 1 e ${maxPageSize}`);
  }

  // OFFSET: quantas linhas pular antes de comecar a devolver.
  return { page, pageSize, offset: (page - 1) * pageSize };
}

// O bloco "pagination" do envelope, sempre no mesmo formato.
export function buildPagination({ page, pageSize }, total) {
  return {
    page,
    pageSize,
    total,
    // Math.ceil: 26 registros de 10 em 10 sao 3 paginas, nao 2,6.
    // Math.max(1, ...): sem nenhum registro, ainda existe a "pagina 1".
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
