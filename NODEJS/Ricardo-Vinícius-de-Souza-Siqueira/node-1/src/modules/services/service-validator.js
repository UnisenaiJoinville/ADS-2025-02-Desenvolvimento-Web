export function validateServiceInput(input) {
  const name = input?.name?.trim().replace(/\s+/g, ' ');
  const durationMinutes = Number(input?.durationMinutes);
  const price = Number(input?.price);

  if (!name) {
    throw new Error('Nome do serviço é obrigatório');
  }

  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    throw new Error('Duração deve ser um número inteiro maior que zero');
  }

  if (!Number.isFinite(price) || price < 0) {
    throw new Error('Preço não pode ser negativo');
  }

  return { name, durationMinutes, price };
}
