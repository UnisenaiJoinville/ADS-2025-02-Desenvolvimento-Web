# Seção 7 — Tipos, Valores e Comparações

**Como executar:** salve como `secao-07.js` e rode `node secao-07.js`.

```javascript
// Exercício 1 — cinco comparações == vs ===
console.log("1) 0 == '0'  ->", 0 == "0");
console.log("1) 0 === '0' ->", 0 === "0");
console.log("1) false == 0  ->", false == 0);
console.log("1) false === 0 ->", false === 0);
console.log("1) null == undefined  ->", null == undefined);
console.log("1) null === undefined ->", null === undefined);
console.log("1) '' == 0  ->", "" == 0);
console.log("1) '' === 0 ->", "" === 0);
console.log("1) NaN == NaN  ->", NaN == NaN);
console.log("1) NaN === NaN ->", NaN === NaN);

// Exercício 2 — validação que aceita 0 mas rejeita null/undefined
function validateDiscount(discountPercentage) {
  if (discountPercentage === null || discountPercentage === undefined) {
    throw new Error("discountPercentage é obrigatório.");
  }
  return discountPercentage;
}
console.log("2) validateDiscount(0)         ->", validateDiscount(0));
try {
  validateDiscount(undefined);
} catch (error) {
  console.log("2) validateDiscount(undefined) -> erro:", error.message);
}

// Exercício 3 — Number.isNaN
console.log("3) Number.isNaN(Number('abc')) ->", Number.isNaN(Number("abc")));
```

## Log de execução (`node secao-07.js`)

```
1) 0 == '0'  -> true
1) 0 === '0' -> false
1) false == 0  -> true
1) false === 0 -> false
1) null == undefined  -> true
1) null === undefined -> false
1) '' == 0  -> true
1) '' === 0 -> false
1) NaN == NaN  -> false
1) NaN === NaN -> false
2) validateDiscount(0)         -> 0
2) validateDiscount(undefined) -> erro: discountPercentage é obrigatório.
3) Number.isNaN(Number('abc')) -> true
```

## Explicação
`==` faz coerção de tipos antes de comparar (por isso `0 == "0"` e `false == 0` são `true`). `null == undefined` é uma regra especial da linguagem — os dois só são "iguais" no `==`, nunca no `===`. `NaN` nunca é igual a nada, nem a si mesmo, por isso usamos `Number.isNaN` em vez de `=== NaN`.
