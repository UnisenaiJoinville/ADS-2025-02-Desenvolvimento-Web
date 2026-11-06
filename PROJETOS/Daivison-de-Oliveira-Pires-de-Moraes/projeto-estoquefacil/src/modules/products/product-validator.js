import { AppError } from "../../shared/errors/app-error.js";
import { text, integer, boolean } from "../../shared/http/input.js";
function money(value, field) {
  if (
    !["string", "number"].includes(typeof value) ||
    String(value).trim() === ""
  )
    throw new AppError(`${field} invalido`);
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 99999999.99)
    throw new AppError(`${field} deve ser entre 0 e 99999999.99`);
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
export function validateProductInput(input) {
  const name = text(input?.name, "nome", 120, true);
  const sku = text(input?.sku, "SKU", 40, true).toUpperCase();
  const supplier = text(input?.supplier, "fornecedor", 120);
  const costPrice = money(input?.costPrice ?? 0, "Preco de custo");
  const salePrice = money(input?.salePrice ?? 0, "Preco de venda");
  if (salePrice < costPrice)
    throw new AppError(
      "O preco de venda nao pode ser menor que o preco de custo",
    );
  const quantity = integer(input?.quantity ?? 0, "Quantidade");
  const minimumStock = integer(input?.minimumStock ?? 0, "Estoque minimo");
  const categoryId =
    input?.categoryId == null || input.categoryId === ""
      ? null
      : integer(input.categoryId, "Categoria", 1);
  return {
    name,
    sku,
    supplier: supplier || null,
    costPrice,
    salePrice,
    quantity,
    minimumStock,
    categoryId,
    active: boolean(input?.active, true),
  };
}
