export function normalizeName(value) {
  return value.trim().replace(/\s+/g, " ");
}

export function validateServiceInput(input) {
  const name = normalizeName(input?.name ?? "");

  if (!name) {
    throw new Error("Nome é obrigatório");
  }

  if (!Number.isFinite(input?.durationMinutes) || input.durationMinutes <= 0) {
    throw new Error("Duração deve ser maior que zero");
  }

  if (!Number.isFinite(input?.price) || input.price < 0) {
    throw new Error("Preço não pode ser negativo");
  }

  return {
    name,
    durationMinutes: input.durationMinutes,
    price: input.price,
  };
}