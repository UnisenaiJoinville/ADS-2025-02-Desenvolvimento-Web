console.log(0 || 20);
console.log(0 ?? 20);


/*O operador || considera 0 como um valor falsy e, por isso, retorna 20. Já o operador ?? só usa o valor
 alternativo quando o valor é null ou undefined, então mantém o 0.*/ 