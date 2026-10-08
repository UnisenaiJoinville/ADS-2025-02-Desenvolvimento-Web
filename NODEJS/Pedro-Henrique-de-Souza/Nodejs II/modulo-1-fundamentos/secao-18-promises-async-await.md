# Seção 18 — Promises e Async/Await — Primeiro Contato

**Como executar:** salve como `secao-18.js` e rode `node secao-18.js`. Não é necessário criar o `services.json` — o código já trata o caso de arquivo inexistente (se quiser testar o outro caminho, crie um `services.json` com `[{"name":"Consulta"}]` na mesma pasta).

```javascript
import { readFile } from "node:fs/promises";

// Exercícios 1 e 2 — ler services.json e tratar arquivo inexistente
async function loadServicesFile() {
  try {
    const content = await readFile("./services.json", "utf8");
    return JSON.parse(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log("1/2) Arquivo services.json não encontrado, usando lista vazia.");
      return [];
    }
    throw error;
  }
}
const services = await loadServicesFile();
console.log("1/2) resultado ->", services);

// Exercício 3 — função async com Promise.resolve(42) dobrada
async function doubleAsync() {
  const value = await Promise.resolve(42);
  return value * 2;
}
console.log("3) doubleAsync() ->", await doubleAsync());
```

## Log de execução (`node secao-18.js`, sem o arquivo `services.json` presente)

```
1/2) Arquivo services.json não encontrado, usando lista vazia.
1/2) resultado -> []
3) doubleAsync() -> 84
```

## Explicação
`readFile` retorna uma Promise; `await` "pausa" a função `async` até ela resolver, sem bloquear o restante da aplicação. O erro `ENOENT` (arquivo não encontrado) é tratado especificamente, enquanto qualquer outro erro (ex.: JSON inválido) é relançado com `throw error` — não deve ser escondido silenciosamente.
