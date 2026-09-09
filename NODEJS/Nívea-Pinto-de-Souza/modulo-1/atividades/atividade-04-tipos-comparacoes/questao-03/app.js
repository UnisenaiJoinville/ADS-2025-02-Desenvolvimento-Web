const valor = Number("abc");

console.log(Number.isNaN(valor));

/*Number("abc") retorna NaN, pois o texto não pode ser convertido em número. O Number.isNaN() é utilizado
para verificar se o resultado da conversão é inválido.*/ 