export function validateServiceInput(name, durationMinutes, price) {
  if (!name || name.trim() === "") {
    throw new Error("Nome é obrigatório");
  }

  if (typeof durationMinutes !== "number" || Number.isNaN(durationMinutes)) {
    throw new Error("Duração deve ser um número");
  }

  if (price < 0) {
    throw new Error("Preço não pode ser negativo");
  }
}