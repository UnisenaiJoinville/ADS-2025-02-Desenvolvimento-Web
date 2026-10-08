# Seção 15 — JSON: Formato de Troca de Dados

**Como executar:** salve como `secao-15.js` e rode `node secao-15.js`.

```javascript
// Exercício 1 — stringify de service e professional
const payload = JSON.stringify({ service: "Consulta", professional: "Ana" });
console.log("1) JSON.stringify ->", payload);

// Exercício 2 — JSON.parse com texto inválido, capturando o erro
try {
  JSON.parse("{ nome: invalido }");
} catch (error) {
  console.log("2) erro capturado ->", error.constructor.name, "-", error.message);
}

// Exercício 3 — explicação
console.log(
  "3) Funções e undefined não existem no formato JSON (que só define dado, não código); JSON.stringify simplesmente as omite.",
);
```

## Log de execução (`node secao-15.js`)

```
1) JSON.stringify -> {"service":"Consulta","professional":"Ana"}
2) erro capturado -> SyntaxError - Expected property name or '}' in JSON at position 2 (line 1 column 3)
3) Funções e undefined não existem no formato JSON (que só define dado, não código); JSON.stringify simplesmente as omite.
```

## Explicação
JSON é um formato **de dados**, não de código: só define objetos, arrays, strings, números, booleanos e `null`. `JSON.parse` lança `SyntaxError` sempre que o texto recebido não segue essa gramática — por isso dados externos (arquivos, requisições, filas) devem ser tratados como não confiáveis e o parsing deve estar dentro de um `try/catch`.
