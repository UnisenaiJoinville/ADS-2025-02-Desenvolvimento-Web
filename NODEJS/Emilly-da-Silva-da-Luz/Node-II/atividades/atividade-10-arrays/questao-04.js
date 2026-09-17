const services = [
  { id: 1, name: "Consulta", active: true, price: 150 },
  { id: 2, name: "Retorno", active: false, price: 80 },
  { id: 3, name: "Avaliação", active: true, price: 120 },
];

const total = services.reduce((sum, service) => sum + service.price, 0);
const average = services.length ? total / services.length : 0;
console.log(average);
