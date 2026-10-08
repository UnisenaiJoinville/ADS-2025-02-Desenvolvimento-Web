const MIN_SERVICE_DURATION_MINUTES = 1;

export function validateServiceInput(input) {
  const name = input?.name?.trim();
  const duration = Number(input?.duration);
  const price = Number(input?.price);

  if (!name) {
    throw new Error("O nome do serviço é obrigatório.");
  }

  if (!Number.isInteger(duration) || duration < MIN_SERVICE_DURATION_MINUTES) {
    throw new Error("A duração deve ser um número inteiro maior que zero.");
  }

  if (!Number.isFinite(price) || price < 0) {
    throw new Error("O preço não pode ser negativo.");
  }

  return { name, duration, price };
}