export function validateServiceInput({ name, durationMinutes, price }) {
  const normalizedName = typeof name === "string" ? name.trim() : "";
  const duration = Number(durationMinutes);
  const numericPrice = Number(price);

  if (!normalizedName) {
    throw new Error("O nome do serviço é obrigatório.");
  }

  if (!Number.isInteger(duration) || duration <= 0) {
    throw new Error("A duração deve ser um número inteiro positivo.");
  }

  if (!Number.isFinite(numericPrice) || numericPrice < 0) {
    throw new Error("O preço deve ser um número maior ou igual a zero.");
  }

  return {
    name: normalizedName,
    durationMinutes: duration,
    price: numericPrice
  };
}
