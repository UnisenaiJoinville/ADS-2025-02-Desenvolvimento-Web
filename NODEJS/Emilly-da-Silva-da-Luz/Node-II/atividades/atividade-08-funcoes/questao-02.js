function formatService(service) {
  return `Serviço: ${service.name} | Preço: R$ ${service.price}`;
}

const service = { name: "Consulta", price: 150 };
console.log(formatService(service));
console.log(service); // objeto permanece inalterado
