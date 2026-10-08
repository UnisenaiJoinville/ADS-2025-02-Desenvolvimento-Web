# Seção 19 — Process, Argumentos e Variáveis de Ambiente

**Como executar:** salve como `secao-19.js` e rode passando argumentos:
```
node secao-19.js "Consulta" 45
```

```javascript
// Exercício 1 — receber name e durationMinutes via linha de comando
const [, , name, rawDuration] = process.argv;
const durationMinutes = Number(rawDuration);
console.log("1) argumentos recebidos ->", { name, durationMinutes });

// Exercício 2 — ler APP_ENV com padrão "development"
const appEnv = process.env.APP_ENV ?? "development";
console.log("2) APP_ENV ->", appEnv);

// Exercício 3 — explicação
console.log(
  "3) process.env.PORT é string porque variáveis de ambiente do SO são sempre texto puro; é preciso Number(...) antes de usar em cálculos.",
);
```

## Log de execução (`node secao-19.js "Consulta" 45`)

```
1) argumentos recebidos -> { name: 'Consulta', durationMinutes: 45 }
2) APP_ENV -> development
3) process.env.PORT é string porque variáveis de ambiente do SO são sempre texto puro; é preciso Number(...) antes de usar em cálculos.
```

**Para testar o exercício 2 com outro valor de ambiente:**
- Linux/Mac: `APP_ENV=production node secao-19.js "Consulta" 45`
- Windows PowerShell: `$env:APP_ENV="production"; node secao-19.js "Consulta" 45`

## Explicação
`process.argv` é um array onde as duas primeiras posições são o caminho do executável `node` e o caminho do script — por isso os argumentos reais começam na posição 2 (daí o `[, , name, rawDuration]`, pulando as duas primeiras). Variáveis de ambiente (`process.env`) são sempre strings, independentemente do que você "pretendia" armazenar.
