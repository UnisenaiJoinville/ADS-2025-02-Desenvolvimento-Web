# Seção 8 — Strings, Template Literals e Conversões

**Como executar:** salve como `secao-08.js` e rode `node secao-08.js`.

```javascript
// Exercício 1 — template literal com nome, preço e duração
const name = "Consulta";
const price = 150;
const duration = 45;
console.log("1)", `Serviço ${name}: R$ ${price}, ${duration} minutos.`);

// Exercício 2 — converter "19.90" para number e formatar com 2 casas
const converted = Number("19.90");
console.log("2) Number('19.90').toFixed(2) ->", converted.toFixed(2));

// Exercício 3 — parseInt vs Number
console.log("3) parseInt('10min', 10) ->", parseInt("10min", 10));
console.log("3) Number('10min')       ->", Number("10min"));
```

## Log de execução (`node secao-08.js`)

```
1) Serviço Consulta: R$ 150, 45 minutos.
2) Number('19.90').toFixed(2) -> 19.90
3) parseInt('10min', 10) -> 10
3) Number('10min')       -> NaN
```

## Explicação do exercício 3
`parseInt` é tolerante: lê os dígitos válidos do começo da string e para no primeiro caractere inválido. `Number` é estrito: exige que a string INTEIRA seja numérica, senão retorna `NaN`. Em validações de entrada de backend, `Number` costuma ser mais seguro justamente por essa rigidez.
