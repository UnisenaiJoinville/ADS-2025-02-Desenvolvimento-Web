# Seção 9 — Operadores Modernos Úteis no Backend

**Como executar:** salve como `secao-09.js` e rode `node secao-09.js`.

```javascript
// Exercício 1 — optional chaining
const person = { contact: null };
console.log("1) person.contact?.phone ->", person.contact?.phone);

// Exercício 2 — || vs ??
console.log("2) 0 || 20 ->", 0 || 20);
console.log("2) 0 ?? 20 ->", 0 ?? 20);

// Exercício 3 — ternário aninhado vs if/else
function getLabelTernarioAninhado(status) {
  return status === "ACTIVE" ? "Ativo" : status === "PAUSED" ? "Pausado" : "Inativo";
}
function getLabel(status) {
  if (status === "ACTIVE") return "Ativo";
  if (status === "PAUSED") return "Pausado";
  return "Inativo";
}
console.log("3) ternário aninhado:", getLabelTernarioAninhado("PAUSED"));
console.log("3) if/else:          ", getLabel("PAUSED"));
```

## Log de execução (`node secao-09.js`)

```
1) person.contact?.phone -> undefined
2) 0 || 20 -> 20
2) 0 ?? 20 -> 0
3) ternário aninhado: Pausado
3) if/else:           Pausado
```

## Explicação
`?.` evita `TypeError` ao acessar propriedades de algo que pode ser `null`/`undefined`. `||` troca qualquer valor *falsy* (`0`, `""`, `false`...) pelo padrão; `??` só troca quando o valor é `null` ou `undefined` — por isso `0 ?? 20` preserva o `0`. A versão com `if/else` é mais legível que o ternário aninhado porque cada condição fica isolada, sem precisar decifrar a precedência dos `?:` encadeados.
