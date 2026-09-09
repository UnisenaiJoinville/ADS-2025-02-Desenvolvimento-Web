const totalPrice = services.reduce(
  (total, service) => total + service.price,
  0
);

const averagePrice = totalPrice / services.length;

console.log(averagePrice);