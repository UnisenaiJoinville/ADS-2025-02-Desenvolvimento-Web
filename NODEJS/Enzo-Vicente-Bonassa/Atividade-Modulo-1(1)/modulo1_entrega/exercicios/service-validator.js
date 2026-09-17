export function validatePrice(price) {
  if (!Number.isFinite(price) || price < 0) {
    throw new Error('Entrada inválida: preço deve ser um número não negativo.');
  }
}

export function validateDuration(durationMinutes) {
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    throw new Error('Entrada inválida: duração deve ser um inteiro positivo.');
  }
}

export function validateServiceInput(input) {
  if (typeof input?.name !== 'string' || !input.name.trim()) {
    throw new Error('Entrada inválida: nome é obrigatório.');
  }
  validatePrice(input.price);
  validateDuration(input.durationMinutes);
  return {
    name: input.name.trim(),
    price: input.price,
    durationMinutes: input.durationMinutes,
  };
}
