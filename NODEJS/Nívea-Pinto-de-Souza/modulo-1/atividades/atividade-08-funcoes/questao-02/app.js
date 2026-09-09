function formatService(service) {
  return `Serviço: ${service.name} | Preço: R$ ${service.price}`;
}

const service = {
  name: "Consulta",
  price: 150
};

console.log(formatService(service));

/*A função apenas lê os dados do objeto e 
retorna uma nova string, sem modificar nenhuma
 propriedade do objeto original.*/ 
