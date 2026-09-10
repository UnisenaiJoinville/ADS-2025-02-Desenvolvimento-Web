# Seção 12 — Escopo, Closures e Estado

**Como executar:** salve como `secao-12.js` e rode `node secao-12.js`.

```javascript
// Exercício 1 — createSequence(start)
function createSequence(start) {
  let value = start;
  return function next() {
    const current = value;
    value += 1;
    return current;
  };
}
const seq = createSequence(100);
console.log("1) seq() ->", seq());
console.log("1) seq() ->", seq());
console.log("1) seq() ->", seq());

// Exercícios 2 e 3 — explicações textuais
console.log(
  "2) Quando o processo Node.js é encerrado, a memória da closure é liberada e o estado se perde.",
);
console.log(
  "3) Duas instâncias do backend têm memórias isoladas: cada uma teria seu próprio 'value', sem sincronização.",
);
```

## Log de execução (`node secao-12.js`)

```
1) seq() -> 100
1) seq() -> 101
1) seq() -> 102
2) Quando o processo Node.js é encerrado, a memória da closure é liberada e o estado se perde.
3) Duas instâncias do backend têm memórias isoladas: cada uma teria seu próprio 'value', sem sincronização.
```

## Explicação
A closure mantém acesso à variável `value` do escopo onde foi criada, mesmo depois que `createSequence` já terminou de executar. Esse estado só existe enquanto o processo estiver rodando — não é confiável como gerador de ID em produção com múltiplas instâncias.
