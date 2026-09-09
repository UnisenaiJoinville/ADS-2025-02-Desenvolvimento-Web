
const discountPercentage = 0;

if (discountPercentage === null || discountPercentage === undefined) {
  console.log("Valor inválido");
} else {
  console.log("Valor válido");
}

/*A validação deve verificar null e undefined 
de forma explícita, porque o valor 0 é válido, mesmo
sendo considerado falsy em JavaScript. */ 