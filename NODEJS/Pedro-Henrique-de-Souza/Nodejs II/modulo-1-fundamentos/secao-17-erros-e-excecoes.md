# Seção 17 — Erros, Exceções e Fail Fast

**Como executar:** salve como `secao-17.js` e rode `node secao-17.js`.

```javascript
// Exercício 1 — validatePrice lançando Error
function validatePrice(price) {
  if (typeof price !== "number" || !Number.isFinite(price) || price < 0) {
    throw new Error("Preço inválido.");
  }
  return price;
}

// Exercício 2 — capturar o erro e imprimir mensagem amigável
try {
  validatePrice(-10);
} catch (error) {
  console.log("2) mensagem amigável -> Não foi possível processar o preço:", error.message);
}

try {
  console.log("1) validatePrice(150) ->", validatePrice(150));
} catch (error) {
  console.log("erro inesperado:", error.message);
}

// Exercício 3 — explicação
console.log(
  "3) Exemplo de erro que NUNCA deve ser engolido: falha ao conectar no banco durante o startup — se ignorada, o servidor sobe 'saudável' mas tudo que depende do banco falha depois, sem causa aparente.",
);
```

## Log de execução (`node secao-17.js`)

```
2) mensagem amigável -> Não foi possível processar o preço: Preço inválido.
1) validatePrice(150) -> 150
3) Exemplo de erro que NUNCA deve ser engolido: falha ao conectar no banco durante o startup — se ignorada, o servidor sobe 'saudável' mas tudo que depende do banco falha depois, sem causa aparente.
```

## Explicação
`throw new Error(...)` interrompe a execução e sinaliza claramente o motivo da falha. Um `catch` só deve existir quando a camada atual sabe **o que fazer** com o erro (transformar, logar, compensar ou relançar) — nunca para simplesmente escondê-lo com um bloco vazio.
