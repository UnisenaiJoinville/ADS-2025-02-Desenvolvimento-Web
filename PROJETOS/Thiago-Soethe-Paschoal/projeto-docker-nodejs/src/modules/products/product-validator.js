import { AppError } from "../../shared/errors/app-error.js";

function parseText(value, { field, maxLength, required = true }) {
  const text = String(value ?? "").trim().replace(/\s+/g, " ");

  if (required && !text) {
    throw new AppError(`O campo ${field} e obrigatorio`);
  }

  if (text.length > maxLength) {
    throw new AppError(`O campo ${field} deve ter no maximo ${maxLength} caracteres`);
  }

  return text;
}

function parseMoney(value, field) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount < 0) {
    throw new AppError(`O campo ${field} deve ser um numero maior ou igual a zero`);
  }

  // Duas casas decimais, como no banco (DECIMAL(10,2))
  return Math.round(amount * 100) / 100;
}

function parseInteger(value, field) {
  const amount = Number(value);

  if (!Number.isInteger(amount) || amount < 0) {
    throw new AppError(`O campo ${field} deve ser um numero inteiro maior ou igual a zero`);
  }

  return amount;
}

export function validateProductInput(input) {
  const name = parseText(input?.name, { field: "nome", maxLength: 120 });
  const sku = parseText(input?.sku, { field: "SKU", maxLength: 40 }).toUpperCase();

  const supplier = parseText(input?.supplier, {
    field: "fornecedor",
    maxLength: 120,
    required: false,
  }); 
  const costPrice = parseMoney(input?.costPrice ?? 0, "preco de custo");
  const salePrice = parseMoney(input?.salePrice ?? 0, "preco de venda");
  const quantity = parseInteger(input?.quantity ?? 0, "quantidade");
  const minimumStock = parseInteger(input?.minimumStock ?? 0, "estoque minimo");

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
    supplier,
    costPrice,
    salePrice,
    quantity,
    minimumStock,
    active,
  };
}
