const service = {
  id: 1,
  name: "Consulta",
  price: 150,
  internalNote: "Uso interno",
};

const { internalNote, ...publicService } = service;
console.log(publicService);
