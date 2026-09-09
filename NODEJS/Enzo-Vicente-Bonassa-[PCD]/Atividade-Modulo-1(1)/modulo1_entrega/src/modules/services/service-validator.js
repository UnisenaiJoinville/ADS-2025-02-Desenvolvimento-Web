export function validateServiceInput(input) {
  const name = typeof input?.name === 'string'
    ? input.name.trim().replace(/\s+/g, ' ')
    : '';
  const durationMinutes = input?.durationMinutes;
  const price = input?.price;

  if (!name) {
    throw new Error('Nome é obrigatório.');
  }

  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    throw new Error('Duração deve ser um inteiro positivo.');
  }

  if (!Number.isFinite(price) || price < 0) {
    throw new Error('Preço deve ser um número maior ou igual a zero.');
  }

  return { name, durationMinutes, price };
}
