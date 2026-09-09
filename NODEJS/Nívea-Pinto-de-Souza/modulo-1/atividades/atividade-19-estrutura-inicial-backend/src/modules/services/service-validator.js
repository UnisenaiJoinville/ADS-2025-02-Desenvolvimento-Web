export function validateServiceInput(input) {
  const name = input?.name?.trim();
  const durationMinutes = Number(input?.durationMinutes);
  if (!name) throw new Error("Nome é obrigatório");
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) throw new Error("Duração inválida");
  return { name, durationMinutes };
}
