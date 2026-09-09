# Etapa 22 — Exercícios e checklist

📋 **Tipo:** exercícios e checklist de revisão

---

## Como usar

- **Nível 1** — fixação, logo após concluir o projeto
- **Nível 2** — evoluções que exigem mexer em várias camadas
- **Nível 3** — extensões maiores, no nível de um projeto próprio
- **Diagnóstico** — leitura crítica de um código cheio de problemas

---

# Nível 1 — Fixação

## 1.1 Campo novo: fornecedor

Adicione o campo `supplier` (fornecedor) ao produto.

**Arquivos que você vai precisar tocar:**

- [ ] `database/init.sql` — a coluna nova
- [ ] `product-validator.js` — validar (texto opcional, máx. 120)
- [ ] `product-repository.js` — `SELECT`, `INSERT` e `UPDATE`
- [ ] `produtos.html` — o campo no formulário
- [ ] `produtos.js` — ler o campo e enviar no payload

**Dica:** depois de mudar o `init.sql`, rode `docker compose down -v && docker compose up -d`.

> 🎓 **O que este exercício ensina:** o custo real de adicionar um campo em um sistema em camadas. Serve para discutir por que modelar bem no início economiza trabalho depois.

---

## 1.2 Ordenação na listagem

Aceite `?orderBy=name|quantity|salePrice` em `GET /api/products`.

⚠️ **Atenção — pegadinha de segurança:** nome de coluna **não pode** ir como `?`. Isto **não funciona**:

```javascript
`ORDER BY ? ASC`, [orderBy]     // ❌ o driver escaparia como string
```

E concatenar direto seria **SQL Injection**:

```javascript
`ORDER BY ${orderBy}`            // ❌ PERIGOSO
```

**A solução correta é uma lista branca:**

```javascript
const ALLOWED_ORDER = {
  name: "p.name",
  quantity: "p.quantity",
  salePrice: "p.sale_price",
};

const orderColumn = ALLOWED_ORDER[orderBy] ?? "p.name";
// agora pode concatenar: só valores que NÓS escrevemos entram aqui
```

> 🎓 **O que este exercício ensina:** que a proteção contra SQL Injection nem sempre é o `?`. Quando a parte variável é **estrutura** e não **valor**, a defesa é a lista branca.

---

## 1.3 Card novo no dashboard

Mostre o **preço médio de venda** dos produtos ativos.

- [ ] `dashboard-repository.js` — acrescente `AVG(sale_price)` ao `getSummary`
- [ ] `dashboard-service.js` — converta com `Number()`
- [ ] `dashboard.js` — mais um `card({...})`

⚠️ **Lembre-se do conjunto vazio!** Sem produtos, `AVG` devolve `NULL`. Use `COALESCE(AVG(sale_price), 0)`.

---

## 1.4 Modal de confirmação

Troque o `window.confirm` da exclusão por um modal no padrão visual do sistema.

**Dica:** reaproveite a estrutura do modal de produtos (Etapa 17), com um texto e dois botões.

---

# Nível 2 — Aplicação

## 2.1 Soft delete

Em vez de apagar o produto, marque `active = false`.

**Perguntas para discutir antes de codificar:**

1. O que acontece hoje com as movimentações quando apagamos um produto? (releia o `ON DELETE CASCADE` da Etapa 06)
2. Isso é aceitável em um sistema que precisa de auditoria?
3. Se o produto for só desativado, ele deve aparecer na listagem? E no dashboard?

**Implementação sugerida:**

- `DELETE /api/products/:id` passa a fazer `UPDATE products SET active = FALSE`
- A listagem ganha `?includeInactive=true`
- O dashboard já ignora inativos (repare no `WHERE active = TRUE`)

---

## 2.2 Paginação

Implemente `?page=1&perPage=20` na listagem de produtos.

**Resposta esperada:**

```json
{
  "data": [ ... ],
  "total": 137,
  "page": 1,
  "perPage": 20,
  "totalPages": 7
}
```

**Dicas:**

- SQL: `LIMIT ? OFFSET ?`, onde `offset = (page - 1) * perPage`
- Faça uma segunda consulta com `COUNT(*)` para o total
- Use `Promise.all` para as duas consultas (Etapa 14!)
- Limite o `perPage` a um máximo (Etapa 13!)

⚠️ **Atenção:** isso **quebra** o front-end, que hoje espera um array. Você terá que ajustar o `produtos.js`.

---

## 2.3 Movimentação de ajuste

Crie o tipo `ADJUST`, que **define** a quantidade em vez de somar ou subtrair.

Útil para inventário: "contei e tem 37 unidades".

**Arquivos:**

- [ ] `init.sql` — `ENUM('IN', 'OUT', 'ADJUST')`
- [ ] `movement-validator.js` — aceitar o novo tipo
- [ ] `movement-repository.js` — a lógica do `delta` muda
- [ ] Front — um terceiro botão

**Desafio extra:** no ajuste, a coluna `quantity` deve guardar o valor **novo** ou a **diferença**? Justifique sua escolha.

---

## 2.4 Filtro por período

Aceite `?from=2026-01-01&to=2026-01-31` nas movimentações.

**Cuidados:**

- Valide o formato da data
- `from` não pode ser maior que `to`
- Use `?` também para as datas

---

# Nível 3 — Desafio

## 3.1 Autenticação com JWT

Proteja as rotas de escrita (`POST`, `PUT`, `DELETE`) com login.

**Etapas:**

1. Tabela `users` com `email` e `password_hash`
2. `POST /api/auth/login` devolvendo um token
3. Middleware que valida o token
4. Tela de login no front
5. `api.js` enviando o token no header `Authorization`

**Bibliotecas:** `jsonwebtoken` e `bcryptjs`.

⚠️ **Nunca** guarde senha em texto puro. Sempre hash.

---

## 3.2 Exportar relatório em CSV

Crie `GET /api/products/export` devolvendo um arquivo CSV.

**Dicas:**

```javascript
response.setHeader("Content-Type", "text/csv; charset=utf-8");
response.setHeader("Content-Disposition", "attachment; filename=produtos.csv");
```

⚠️ Cuidado com valores que contenham vírgula ou aspas — eles precisam ser escapados.

---

## 3.3 Testes automatizados

Escreva testes para o `product-validator.js` usando o `node:test` nativo.

```javascript
import test from "node:test";
import assert from "node:assert";

import { validateProductInput } from "../src/modules/products/product-validator.js";

test("converte SKU para maiusculas", () => {
  const result = validateProductInput({ name: "Teste", sku: "abc-1" });
  assert.strictEqual(result.sku, "ABC-1");
});

test("rejeita venda menor que custo", () => {
  assert.throws(() =>
    validateProductInput({ name: "X", sku: "X-1", costPrice: 50, salePrice: 10 })
  );
});
```

Rode com:

```bash
docker compose exec api node --test
```

**Meta:** cobrir todos os caminhos de erro do validador.

---

## 3.4 Gráfico de 7 dias

Adicione um gráfico de barras com entradas e saídas dos últimos 7 dias.

**Dicas:**

- SQL: `GROUP BY DATE(created_at)` com `WHERE created_at >= CURRENT_DATE - INTERVAL 7 DAY`
- ⚠️ Dias sem movimentação **não aparecem** no resultado — preencha os buracos no JavaScript
- Você pode fazer com `div` e Tailwind, como as barras da Etapa 16

---

# Exercício de diagnóstico

> Leitura crítica: encontre os problemas antes de abrir o gabarito.

O código abaixo foi escrito por um "colega". Ele **funciona**, mas tem pelo menos **10 problemas**.

**Sua tarefa:**

1. Identifique cada problema
2. Explique **por que** é inadequado
3. Mostre como deveria ser

```javascript
// src/modules/products/product-controller.js

export async function store(req, res) {
  var nome = req.body.nome;
  var preco = req.body.preco;

  if (nome == undefined || nome == "") {
    res.json({ erro: "erro" });
    return;
  }

  const [result] = await pool.query(
    "INSERT INTO products (name, sale_price) VALUES ('" + nome + "', " + preco + ")"
  );

  res.json({ ok: 1 });
}
```

<details>
<summary>📝 Gabarito sugerido</summary>

| # | Problema | Por quê | Correção |
|---|---|---|---|
| 1 | `var` | Escopo de função e hoisting | `const` |
| 2 | `==` | Coerção automática de tipos | `===`, ou validação explícita |
| 3 | **SQL Injection** | Concatenação de valor no SQL | Consulta parametrizada com `?` |
| 4 | Controller acessa o `pool` | Pula service e repository | Chamar `service.createProduct()` |
| 5 | Status sempre 200 | Erro deveria ser 400; criação, 201 | `response.status(400)` / `status(201)` |
| 6 | Resposta inconsistente | `{erro}` e `{ok:1}` fogem do padrão | Sempre `{error}` ou o objeto criado |
| 7 | Sem `asyncHandler` | Erro async não é capturado | Envolver a rota |
| 8 | `preco` não validado | Pode ser `NaN`, negativo ou texto | `Number.isFinite` e `>= 0` |
| 9 | Validação incompleta | Não faz `trim`, não checa tamanho | Usar o validator |
| 10 | Nomes em português | Mistura com o padrão do projeto | `name`, `price` |
| 11 | Sem checagem de duplicidade | Aceita SKU repetido | `findBySku` antes de inserir |
| 12 | `req`/`res` abreviados | O projeto usa nomes completos | `request` / `response` |

**Versão corrigida:**

```javascript
import { parseId } from "../../shared/http/parse-id.js";

import * as service from "./product-service.js";

export async function store(request, response) {
  const product = await service.createProduct(request.body);

  response.status(201).json(product);
}
```

E a rota:

```javascript
productRoutes.post("/", asyncHandler(controller.store));
```

**Discussão para fechar:** repare que a versão correta é **muito menor**. Isso não é coincidência — quando cada camada faz só o que lhe cabe, o código de cada uma fica pequeno.

</details>

---

# ✅ Checklist de conceitos trabalhados

Use como roteiro de revisão ou como base para a prova.

## Docker

- [ ] Diferença entre imagem, container e volume
- [ ] `Dockerfile`: `FROM`, `WORKDIR`, `COPY`, `RUN`, `CMD`
- [ ] Diferença entre `RUN` (build) e `CMD` (execução)
- [ ] Cache de camadas e por que copiar o `package.json` antes
- [ ] `docker compose` com múltiplos serviços
- [ ] Mapeamento de portas `host:container`
- [ ] Volume nomeado para persistência
- [ ] Bind mount para desenvolvimento com hot reload
- [ ] `healthcheck` e `depends_on: service_healthy`
- [ ] Rede interna: um serviço enxerga o outro pelo nome
- [ ] `docker compose down` x `down -v`

## Node.js e Express

- [ ] ES Modules (`import`/`export`) e `"type": "module"`
- [ ] `node --watch` em vez do `nodemon`
- [ ] Variáveis de ambiente validadas na inicialização (fail fast)
- [ ] Arquitetura em camadas: routes → controller → service → repository
- [ ] `Router` para modularizar rotas
- [ ] Middlewares e a importância da **ordem**
- [ ] Middleware de erro com 4 parâmetros
- [ ] Classes de erro customizadas com status HTTP
- [ ] `asyncHandler` para capturar erros em funções async
- [ ] Status HTTP: 200, 201, 204, 400, 404, 409, 500
- [ ] Encerramento gracioso com `SIGTERM`
- [ ] Separação `app.js` / `server.js` e por que ela ajuda nos testes

## MySQL

- [ ] Modelagem com chaves estrangeiras
- [ ] `ON DELETE SET NULL` x `ON DELETE CASCADE`
- [ ] `DECIMAL` para dinheiro (nunca `FLOAT`)
- [ ] `ENUM` para valores restritos
- [ ] Índices em colunas usadas em filtros
- [ ] Pool de conexões e `release()`
- [ ] **Consultas parametrizadas contra SQL Injection**
- [ ] `JOIN` x `LEFT JOIN`
- [ ] Agregação: `COUNT`, `SUM`, `AVG`, `GROUP BY`
- [ ] `COALESCE` para tratar `NULL`
- [ ] `SUM(CASE WHEN ...)` para contagem condicional
- [ ] **Transações: `BEGIN`, `COMMIT`, `ROLLBACK`**
- [ ] `SELECT ... FOR UPDATE` contra race condition

## JavaScript aplicado

- [ ] `const` como padrão, `let` só quando necessário
- [ ] Comparação estrita (`===`)
- [ ] Conversão explícita de tipos
- [ ] `Number.isInteger` x `Number.isFinite`
- [ ] Validação nas fronteiras e fail fast
- [ ] `throw new Error` em vez de `console.log("erro")`
- [ ] `find`, `filter`, `map`, `reduce`
- [ ] Spread e desestruturação
- [ ] Optional chaining (`?.`) e nullish coalescing (`??`)
- [ ] Diferença entre `??` e `||`
- [ ] `async/await` e `try/catch/finally`
- [ ] `Promise.all` para operações independentes
- [ ] Nomes que revelam intenção
- [ ] Divisão por zero e conjuntos vazios

## Front-end

- [ ] Tailwind CSS por classes utilitárias
- [ ] Layout responsivo *mobile first*
- [ ] `fetch` **não** lança erro em 4xx/5xx
- [ ] Módulos ES no navegador (`type="module"`)
- [ ] Renderização com `.map().join("")`
- [ ] **Delegação de eventos** para elementos dinâmicos
- [ ] `FormData` e o comportamento de checkbox
- [ ] `event.preventDefault()` em formulários
- [ ] `Intl.NumberFormat` para moeda
- [ ] **Escape de HTML contra XSS**
- [ ] Estados vazios e feedback ao usuário
- [ ] Atributos `data-*` como âncora do JavaScript

---

# 🎯 Autoavaliação

Se você consegue responder às perguntas abaixo sem consultar o código, dominou o projeto.

### Perguntas de revisão

1. Explique o caminho de uma requisição, do clique até o banco.
2. Por que o repository não decide regra de negócio?
3. O que aconteceria sem a transação no registro de movimentação?
4. Por que `?` nas consultas e `escapeHtml` na tela?
5. Onde ficam os dados quando você roda `docker compose down`?
6. Por que validar no backend se o formulário já valida?
7. Qual a diferença entre `RUN` e `CMD` no Dockerfile?

---

# 📚 Para continuar estudando

| Tema | Por onde seguir |
|---|---|
| **ORM** | Prisma ou Sequelize — abstrai o SQL |
| **Testes** | Jest + Supertest para testar a API inteira |
| **TypeScript** | Tipagem estática no backend |
| **Validação** | Zod ou Joi — validadores declarativos |
| **Autenticação** | JWT, OAuth, sessões |
| **Deploy** | Railway, Render, Fly.io ou VPS |
| **CI/CD** | GitHub Actions rodando testes a cada push |
| **Observabilidade** | Logs estruturados (Pino), métricas |

---

## 🏆 Encerramento

Você começou com um array em memória que se perdia ao fechar o programa.

Termina com uma aplicação que:

- guarda dados em um banco relacional em container;
- expõe uma API REST organizada em camadas;
- valida tudo que entra;
- se protege de SQL Injection e XSS;
- garante consistência com transações;
- e tem uma interface responsiva consumindo a própria API.

**Isso é engenharia de software de verdade.** Parabéns.

---

← [Voltar ao índice](README.md)
