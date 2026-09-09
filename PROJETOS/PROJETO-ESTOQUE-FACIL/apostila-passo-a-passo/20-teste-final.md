# Aula 20 — Teste final 🏁

⏱️ **Tempo estimado:** 40 minutos
📋 **Tipo:** prática guiada (roteiro para fazer com a turma)

---

## Objetivo

Percorrer o sistema inteiro, do clique na tela até a gravação no banco, confirmando que **tudo funciona junto**.

Este roteiro também serve como **avaliação prática**: se todos os itens passarem, o projeto está concluído.

---

## Antes de começar

- [ ] Aula 19 concluída (as 4 telas funcionando)
- [ ] `docker compose ps` mostra os dois containers `Up`

---

## Teste 1 — O ciclo completo do CRUD

**Tela:** http://localhost:3000/categorias.html

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Cadastre a categoria `Hortifruti` | Aparece na tabela com `0` produtos |
| 2 | Tente cadastrar `hortifruti` de novo | 🔴 *"Ja existe uma categoria com esse nome"* |

**Tela:** http://localhost:3000/produtos.html

| # | Ação | Resultado esperado |
|---|---|---|
| 3 | **+ Novo produto**: nome `Banana prata`, SKU `hor-001`, categoria `Hortifruti`, custo `4`, venda `7,50`, qtd `30`, mínimo `10` | 🟢 Produto cadastrado |
| 4 | Olhe o SKU na tabela | Aparece **`HOR-001`** (maiúsculas) |
| 5 | **Editar** a banana, mude a quantidade para `5` | Status vira 🔴 **"Estoque baixo"** |
| 6 | Marque **"Apenas estoque baixo"** e filtre | A banana aparece na lista |

> 🎓 **O que isso comprova:** validação, normalização de dados, campo calculado `lowStock` e filtros dinâmicos.

---

## Teste 2 — O estoque subindo e descendo

**Tela:** http://localhost:3000/movimentacoes.html

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Selecione `Banana prata` | Dica: *"Estoque atual: 5 unidade(s)"* |
| 2 | **Entrada** de `50` | 🟢 Entrada registrada |
| 3 | Selecione o produto de novo | Dica mostra **55** |
| 4 | **Saída** de `20` | Histórico mostra `-20` em vermelho |
| 5 | Selecione o produto | Dica mostra **35** |
| 6 | **Saída** de `9999` | 🔴 *"Estoque insuficiente. Disponivel: 35 unidade(s)"* |
| 7 | Olhe o histórico | **Nenhuma** linha nova foi criada |
| 8 | Selecione o produto | Continua **35** |

> 🎓 **O que isso comprova:** transação, `ROLLBACK`, `FOR UPDATE` e a regra de estoque negativo.

### ⭐ O momento-chave da aula

Pare no passo 7 e chame a atenção da turma:

> "A tentativa de saída **falhou**. Repare que o histórico não ganhou linha nenhuma e a quantidade não mudou. Isso é a transação: ou as duas gravações acontecem, ou nenhuma acontece. Nunca meio caminho."

Confirme direto no banco:

```bash
docker compose exec db mysql -u estoque -pestoque123 estoque_db \
  -e "SELECT COUNT(*) AS total FROM stock_movements WHERE quantity = 9999;"
```

```text
+-------+
| total |
+-------+
|     0 |
+-------+
```

---

## Teste 3 — O dashboard reagindo

**Tela:** http://localhost:3000

| # | Verifique | Deve mostrar |
|---|---|---|
| 1 | Card **Produtos ativos** | Aumentou (agora inclui a banana) |
| 2 | Cards **Valor de custo** e **Valor de venda** | Subiram |
| 3 | **Entradas do mês** | Inclui as 50 unidades do Teste 2 |
| 4 | **Saídas do mês** | Inclui as 20 unidades |
| 5 | **Saldo do mês** | É igual a entradas − saídas |
| 6 | **Estoque por categoria** | `Hortifruti` aparece nas barras |
| 7 | **Últimas movimentações** | Mostra as do Teste 2 no topo |
| 8 | Clique em **Atualizar** | Toast azul e dados recarregados |

> 🎓 **O que isso comprova:** agregações SQL (`SUM`, `GROUP BY`, `CASE WHEN`) e `Promise.all`.

---

## Teste 4 — As validações da API

Estes testes vão **direto na API**, sem passar pela tela. Isso mostra que a validação está no lugar certo — no backend, não só no formulário.

```bash
# Nome vazio
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" -d '{"name":"","sku":"X-1"}'

# Preço negativo
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","sku":"X-2","costPrice":-5,"salePrice":10}'

# Venda menor que custo
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","sku":"X-3","costPrice":50,"salePrice":10}'

# Quantidade fracionada em movimentação
curl -X POST http://localhost:3000/api/movements \
  -H "Content-Type: application/json" -d '{"productId":1,"type":"IN","quantity":1.5}'

# Tipo inexistente
curl -X POST http://localhost:3000/api/movements \
  -H "Content-Type: application/json" -d '{"productId":1,"type":"TALVEZ","quantity":1}'

# Id inválido
curl http://localhost:3000/api/products/abc

# Rota inexistente
curl http://localhost:3000/api/naoexiste
```

Todas devem devolver **JSON** com uma mensagem clara em português.

> 💭 **Pergunta para a turma:** *"Se a validação já existe no formulário HTML (`required`, `min`, `type=number`), por que precisamos dela no backend também?"*
>
> **Resposta:** porque qualquer pessoa pode chamar a API direto, sem passar pelo formulário — como acabamos de fazer com o `curl`. Validação no front é **conveniência**; no backend é **segurança**.

---

## Teste 5 — Persistência dos dados

Este teste mostra, na prática, a diferença entre **container** e **volume**.

### Parte A — Container é descartável

```bash
docker compose down
```

Os containers foram **destruídos**. Confirme:

```bash
docker compose ps
```

(lista vazia)

Agora suba de novo:

```bash
docker compose up -d
```

Aguarde uns 20 segundos e abra o dashboard:

```text
http://localhost:3000
```

> 🎉 **Todos os dados continuam lá!** Inclusive a Banana prata e as movimentações do Teste 2.

**Por quê?** Porque o volume `estoque-db-data` sobreviveu. Os containers foram recriados, mas os dados estavam guardados fora deles.

### Parte B — Volume é onde a informação vive

Agora repita com o `-v`:

```bash
docker compose down -v
docker compose up -d
```

Aguarde o banco subir (uns 30 segundos) e recarregue o dashboard.

> 💀 **Os dados voltaram aos 7 produtos originais.** A Banana prata, a categoria Hortifruti e todas as movimentações da aula **sumiram**.

**Por quê?** O `-v` apagou o volume. Sem volume, o MySQL recriou o banco do zero e rodou o `init.sql` de novo.

### 📌 A conclusão da aula sobre Docker

Escreva isto no quadro:

> **Container é descartável. Volume é onde a informação vive.**

| Comando | Containers | Volume (dados) |
|---|---|---|
| `docker compose restart` | Reiniciados | ✅ Preservado |
| `docker compose down` | Destruídos | ✅ Preservado |
| `docker compose down -v` | Destruídos | ❌ **Apagado** |

---

## Teste 6 — O caminho completo de uma requisição

Este é um exercício de **compreensão**, não de digitação.

Deixe os logs abertos:

```bash
docker compose logs -f api
```

Agora, no navegador, cadastre um produto qualquer. Observe a linha que aparece no log:

```text
estoque-api  | POST /api/products
```

E percorra mentalmente (ou no quadro) o caminho:

```text
 1. produtos.js       form submit -> api.createProduct(payload)
 2. api.js            fetch POST /api/products
 3. app.js            express.json() transforma o corpo
 4. app.js            middleware de log imprime a linha
 5. routes/index.js   "/products" -> productRoutes
 6. product-routes    POST "/" -> asyncHandler(controller.store)
 7. controller        lê request.body, chama o service
 8. service           valida, checa SKU, checa categoria
 9. validator         limpa e converte os dados
10. repository        INSERT INTO products (...) VALUES (?, ?, ...)
11. MySQL             grava e devolve insertId
12. repository        findById -> devolve o produto completo
13. controller        response.status(201).json(product)
14. api.js            response.ok? sim -> devolve os dados
15. produtos.js       toast("Produto cadastrado") + recarrega a lista
```

> 🎓 **Se o aluno consegue explicar esses 15 passos, ele entendeu o curso.**

E se der erro, o caminho é o mesmo, desviando no passo 8 ou 9:

```text
 8. service           throw new ConflictError("Ja existe...")
     |
     v
     asyncHandler captura -> next(erro)
     |
     v
     errorHandler -> status 409 + { error: "..." }
     |
     v
15. produtos.js       toast(error.message, "error")  -> vermelho na tela
```

---

## ✅ Checklist final do projeto

### Infraestrutura

- [ ] `docker compose up -d` sobe os dois containers
- [ ] O banco aparece como `(healthy)`
- [ ] Os dados persistem após `docker compose down`
- [ ] Os dados são recriados após `docker compose down -v`
- [ ] Salvar um `.js` reinicia a API sozinho

### API

- [ ] `/api/health` responde
- [ ] Os 4 módulos respondem (`categories`, `products`, `movements`, `dashboard`)
- [ ] CRUD de categorias completo
- [ ] CRUD de produtos completo
- [ ] Os 3 filtros de produtos funcionam
- [ ] Movimentação de entrada **soma**
- [ ] Movimentação de saída **subtrai**
- [ ] Saída maior que o estoque é recusada **sem gravar nada**
- [ ] Erros devolvem `{ "error": "..." }` com o status certo
- [ ] Rota inexistente devolve 404 em JSON

### Front-end

- [ ] As 4 telas carregam
- [ ] O menu destaca a página atual
- [ ] Os cards mostram valores em `R$` no formato brasileiro
- [ ] As barras por categoria têm larguras proporcionais
- [ ] O modal de produtos abre e fecha de 3 formas
- [ ] Os toasts aparecem em verde (sucesso) e vermelho (erro)
- [ ] As mensagens de erro vêm do backend
- [ ] Telas sem dados mostram mensagem de estado vazio

---

## 🎓 Encerramento sugerido para a aula

Faça estas perguntas à turma:

1. **Qual camada escreve SQL?** (repository)
2. **Onde estão as regras de negócio?** (service)
3. **Por que o `?` nas consultas?** (SQL Injection)
4. **Por que o `escapeHtml` no front?** (XSS)
5. **O que uma transação garante?** (tudo ou nada)
6. **O que acontece com os dados no `docker compose down`?** (continuam, estão no volume)
7. **Por que validar no backend se o formulário já valida?** (o formulário pode ser contornado)

---

## ➡️ Próximos passos

- **[Aula 21 — Solução de problemas](21-solucao-de-problemas.md)** — guarde para consulta
- **[Aula 22 — Exercícios e checklist](22-exercicios-e-checklist.md)** — para fixar e avaliar

---

## 🏆 Parabéns!

Se você chegou até aqui com todos os itens marcados, você construiu — do zero — uma aplicação web completa, com:

- banco de dados relacional em container;
- API REST organizada em camadas;
- validação em todas as fronteiras;
- proteção contra SQL Injection e XSS;
- transação com controle de concorrência;
- interface responsiva consumindo a própria API.

**Isso é backend de verdade.**
