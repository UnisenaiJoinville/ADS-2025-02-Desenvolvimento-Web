export function validateProductInput(input) {
  const name = parseText(input?.name, { field: "nome", maxLength: 120 });
  const sku = parseText(input?.sku, { field: "SKU", maxLength: 40 }).toUpperCase();

  const costPrice = parseMoney(input?.costPrice ?? 0, "preco de custo");
  const salePrice = parseMoney(input?.salePrice ?? 0, "preco de venda");
  const quantity = parseInteger(input?.quantity ?? 0, "quantidade");
  const minimumStock = parseInteger(input?.minimumStock ?? 0, "estoque minimo");

  // Novo campo fornecedor (opcional, máximo 120 caracteres)
  const supplier = input?.supplier
    ? parseText(input.supplier, { field: "fornecedor", maxLength: 120, required: false })
    : null;

  if (salePrice < costPrice) {
    throw new AppError("O preco de venda nao pode ser menor que o preco de custo");
  }

  let categoryId = null;

  if (input?.categoryId !== undefined && input?.categoryId !== null && input?.categoryId !== "") {
    categoryId = Number(input.categoryId);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      throw new AppError("Categoria invalida");
    }
  }

  const active = input?.active === undefined ? true : Boolean(input.active);

  return {
    name,
    sku,
    categoryId,
    costPrice,
    salePrice,
    quantity,
    minimumStock,
    supplier,
    active,
  };
}