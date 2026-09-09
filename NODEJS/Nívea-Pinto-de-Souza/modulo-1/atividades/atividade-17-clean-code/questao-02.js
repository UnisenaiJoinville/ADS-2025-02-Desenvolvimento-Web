function validatePositivePrice(price) {
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Preço inválido");
  }
}

function createService(input) {
  validatePositivePrice(input.price);
  return { ...input, active: true };
}

function updateServicePrice(service, newPrice) {
  validatePositivePrice(newPrice);
  return { ...service, price: newPrice };
}

console.log(createService({ name: "Consulta", price: 150 }));
