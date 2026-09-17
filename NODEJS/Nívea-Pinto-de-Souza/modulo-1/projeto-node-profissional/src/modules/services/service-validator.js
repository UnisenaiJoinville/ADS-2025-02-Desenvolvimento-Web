export function normalizeName(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

export function validateServiceInput(input) {
  const name = normalizeName(input?.name);
  const durationMinutes = Number(input?.durationMinutes);
  const price = Number(input?.price);

  if (!name) throw new Error("Nome é obrigatório");
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) throw new Error("Duração inválida");
  if (!Number.isFinite(price) || price < 0) throw new Error("Preço inválido");

  return { name, durationMinutes, price };
}
