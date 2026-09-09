export function normalizeName(value) {
  return value.trim().replace(/\s+/g, " ");
}

export function validateServiceInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Os dados do serviço são obrigatórios");
  }

  if (typeof input.name !== "string") {
    throw new Error("O nome deve ser um texto");
  }

  const name = normalizeName(input.name);

  if (!name) {
    throw new Error("O nome do serviço é obrigatório");
  }

  if (
    input.durationMinutes === null ||
    input.durationMinutes === undefined ||
    input.durationMinutes === ""
  ) {
    throw new Error("A duração do serviço é obrigatória");
  }

  const durationMinutes = Number(input.durationMinutes);

  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    throw new Error("A duração deve ser um número inteiro positivo");
  }

  if (input.price === null || input.price === undefined || input.price === "") {
    throw new Error("O preço do serviço é obrigatório");
  }

  const price = Number(input.price);

  if (!Number.isFinite(price) || price < 0) {
    throw new Error("O preço deve ser um número maior ou igual a zero");
  }

  return { name, durationMinutes, price };
}
