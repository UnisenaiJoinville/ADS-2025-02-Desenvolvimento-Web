// Antes: function calc(a, b, x) { return a * b * x; }
function calculateCommission(saleValue, commissionRate, multiplier) {
  return saleValue * commissionRate * multiplier;
}
console.log(calculateCommission(1000, 0.05, 1));
