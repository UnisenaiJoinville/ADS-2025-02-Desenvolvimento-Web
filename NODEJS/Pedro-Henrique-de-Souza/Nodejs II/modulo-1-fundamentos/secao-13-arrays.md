# Seção 13 — Arrays e Programação Orientada a Coleções

**Como executar:** salve como `secao-13.js` e rode `node secao-13.js`.

```javascript
const services = [
  { id: 1, name: "Consulta", active: true, price: 150 },
  { id: 2, name: "Retorno", active: false, price: 80 },
  { id: 3, name: "Avaliação", active: true, price: 120 },
  { id: 4, name: "Exame", active: true, price: 90 },
];

// Exercício 1 — ativos com preço > 100
console.log("1) ativos com preço > 100:", services.filter((s) => s.active && s.price > 100));

// Exercício 2 — novo array só com { id, name }
console.log("2) apenas id e name:", services.map(({ id, name }) => ({ id, name })));

// Exercício 3 — existe algum inativo?
console.log("3) existe inativo?", services.some((s) => !s.active));

// Exercício 4 — preço médio com reduce
const average = services.reduce((sum, s) => sum + s.price, 0) / services.length;
console.log("4) preço médio:", average);

// Desafio — paginate(items, page, pageSize)
function paginate(items, page, pageSize) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}
const items25 = Array.from({ length: 25 }, (_, i) => i + 1);
console.log("Desafio) página 1 (10 itens):", paginate(items25, 1, 10));
console.log("Desafio) página 3 (10 itens):", paginate(items25, 3, 10));
```

## Log de execução (`node secao-13.js`)

```
1) ativos com preço > 100: [
  { id: 1, name: 'Consulta', active: true, price: 150 },
  { id: 3, name: 'Avaliação', active: true, price: 120 }
]
2) apenas id e name: [
  { id: 1, name: 'Consulta' },
  { id: 2, name: 'Retorno' },
  { id: 3, name: 'Avaliação' },
  { id: 4, name: 'Exame' }
]
3) existe inativo? true
4) preço médio: 110
Desafio) página 1 (10 itens): [
  1, 2, 3, 4,  5,
  6, 7, 8, 9, 10
]
Desafio) página 3 (10 itens): [ 21, 22, 23, 24, 25 ]
```

## Explicação
`filter`, `map`, `some` e `reduce` substituem laços imperativos por intenções explícitas: "filtre", "transforme", "existe algum", "acumule". `paginate` usa `slice`, que **não muta** o array original — importante para não corromper a lista de itens ao paginar.
