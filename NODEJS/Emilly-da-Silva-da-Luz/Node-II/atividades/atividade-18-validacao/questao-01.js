export function validateServiceInput(input) {
  const name = input?.name?.trim();
  const price = Number(input?.price);
  const durationMinutes = Number(input?.durationMinutes);

  if (!name) throw new Error("Nome é obrigatório");
  if (!Number.isFinite(price) || price < 0) throw new Error("Preço inválido");
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    throw new Error("Duração inválida");
  }

  return { name, price, durationMinutes };
}
