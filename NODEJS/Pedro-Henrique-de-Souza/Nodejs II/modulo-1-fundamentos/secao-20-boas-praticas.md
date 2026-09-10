# Seção 20 — Boas Práticas de Código para Backend

**Como executar:** salve como `secao-20.js` e rode `node secao-20.js`.

```javascript
// Exercício 1 — renomear a, b, x em função de comissão
function calculateCommission(saleValue, commissionPercentage) {
  return saleValue * (commissionPercentage / 100);
}
console.log("1) calculateCommission(1000, 5) ->", calculateCommission(1000, 5));

// Exercício 2 — extrair validação repetida para função de domínio
function isValidName(value) {
  return typeof value === "string" && value.trim().length > 0;
}
function createService(input) {
  if (!isValidName(input.name)) throw new Error("Nome inválido.");
  return { name: input.name.trim() };
}
function updateService(input) {
  if (!isValidName(input.name)) throw new Error("Nome inválido.");
  return { name: input.name.trim() };
}
console.log("2) createService ->", createService({ name: " Consulta " }));
console.log("2) updateService ->", updateService({ name: " Retorno " }));

// Exercício 3 — comentário substituído por nome melhor
function incrementCounter(counter) {
  return counter + 1;
}
console.log("3) incrementCounter(5) ->", incrementCounter(5));
```

## Log de execução (`node secao-20.js`)

```
1) calculateCommission(1000, 5) -> 50
2) createService -> { name: 'Consulta' }
2) updateService -> { name: 'Retorno' }
3) incrementCounter(5) -> 6
```

## Explicação
`calculateCommission(saleValue, commissionPercentage)` comunica intenção só pelo nome, ao contrário de `calc(a, b, x)`. `isValidName` centraliza uma regra repetida em um único lugar com nome de domínio, evitando duplicação. Uma função bem nomeada (`incrementCounter`) substitui a necessidade de um comentário que só repetiria o que o código já diz.
