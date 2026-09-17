export function validatePrice(price) {
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Preço inválido");
  }
  return true;
}
