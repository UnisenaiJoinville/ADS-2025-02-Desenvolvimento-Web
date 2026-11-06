# Aula 65 — Exclusão segura e modal de confirmação

⏱️ **Tempo estimado:** 60 minutos
📋 **Tipo:** prática (SQL + back-end + front-end)

---

## Objetivo

Hoje, clicar em **Excluir** num produto faz duas coisas ruins:

1. abre o `window.confirm` do navegador, feio e impossível de estilizar;
2. **apaga todo o histórico de movimentações** do produto, sem avisar.

Nesta aula:

- o banco passa a **recusar** a exclusão de produto com histórico (`ON DELETE RESTRICT`);
- a API explica o motivo com um `409` e uma mensagem clara;
- a tela oferece a alternativa certa: **inativar** o produto;
- produto inativo deixa de receber movimentações;
- o `window.confirm` vira um **modal de confirmação** reutilizável.

---

## Antes de começar

- [ ] [Aula 64](64-paginacao-busca-produtos.md) concluída
- [ ] O `api.js` coloca `status` nos erros ([Aula 61](61-axios-no-lugar-do-fetch.md), seção 3.7)

---

## Arquivos desta aula

```text
NOVOS ARQUIVOS
├── database/migrations/004-produto-com-historico.sql
└── database/migrations/004-rollback.sql

ARQUIVOS ALTERADOS
├── database/init.sql                                (a FK nasce RESTRICT)
├── database/producao/001-schema.sql                 (idem)
├── src/modules/movements/movement-repository.js     (countByProduct + produto inativo)
├── src/modules/movements/movement-service.js        (mensagem do produto inativo)
├── src/modules/products/product-service.js          (deleteProduct confere o historico)
├── public/js/layout.js                              (confirmDialog)
├── public/js/produtos.js                             (excluir / inativar)
└── public/js/categorias.js                          (confirmDialog)
```

---

## 1. O problema, ao vivo

Faça este teste **antes** de mudar qualquer coisa:

```bash
# Quantas movimentacoes o cafe (BEB-001) tem?
docker compose exec db mysql -uestoque -pestoque123 estoque_db -e \
  "SELECT p.id, p.name, COUNT(m.id) AS movimentacoes
     FROM products p LEFT JOIN stock_movements m ON m.product_id = p.id
    WHERE p.sku = 'BEB-001' GROUP BY p.id, p.name;"
```

Anote o número. Agora **imagine** que alguém exclui o café pela tela. Por causa desta linha da [Aula 06](06-banco-de-dados.md):

```sql
CONSTRAINT fk_movements_product
  FOREIGN KEY (product_id) REFERENCES products (id)
  ON DELETE CASCADE
```

...o MySQL apagaria **todas** essas movimentações junto. E, com elas:

- as entradas e saídas do mês no dashboard **mudariam** de valor;
- os relatórios por período e por usuário ([Aulas 38 a 41](41-relatorios-por-periodo.md)) **perderiam** linhas;
- a curva ABC ([Aula 45](45-subqueries-e-relatorios-avancados.md)) mudaria;
- ninguém saberia mais que aquele café foi comprado e vendido.

> 📌 **Movimentação de estoque é um fato contábil.** Ela aconteceu. Apagar o produto não "desacontece" a compra. Na Aula 06 dissemos que "o histórico de um produto que não existe mais não serve para nada". Com os relatórios que construímos depois, essa frase deixou de ser verdade, e o projeto precisa acompanhar.

### As três estratégias possíveis

| `ON DELETE` | O que acontece ao apagar o produto | Serve para |
|---|---|---|
| `CASCADE` | apaga as movimentações junto | dados que **só** existem por causa do pai (ex.: itens de um rascunho) |
| `SET NULL` | mantém as movimentações, sem produto | quando o "filho" faz sentido sozinho (ex.: o `user_id` da Aula 38) |
| **`RESTRICT`** | **recusa** apagar o produto | quando o "filho" é um registro que não pode se perder |

Movimentação **sem produto** (`SET NULL`) não faz sentido: "saíram 30 unidades de... nada". Então a resposta é `RESTRICT`.

### E o produto que ninguém usa mais?

Para isso já existe a coluna `active` desde a [Aula 06](06-banco-de-dados.md). **Inativar** é a "exclusão" de quem tem histórico:

| | Excluir | Inativar |
|---|---|---|
| Some da lista de produtos | sim | não (aparece com a etiqueta "Inativo") |
| Some da busca de Movimentações | sim | **sim** (Aula 62) |
| Pode receber movimentação | — | **não** (vamos garantir nesta aula) |
| Histórico preservado | **não** | **sim** |
| Dá para desfazer | não | sim, é só reativar |

---

# PARTE 1 — O banco

## Passo 1 — A migração

Crie `database/migrations/004-produto-com-historico.sql`:

```sql
-- ============================================================
-- Migracao 004 - produto com historico nao pode ser apagado (Aula 65)
-- ------------------------------------------------------------
-- POR QUE ESTA MIGRACAO EXISTE
-- A FK de stock_movements.product_id nasceu com ON DELETE CASCADE
-- (Aula 06): apagar um produto apagava TODAS as movimentacoes dele.
-- Depois dos relatorios (Aulas 33 a 45), isso virou um risco:
-- uma exclusao alterava o passado do estoque sem deixar rastro.
--
-- O QUE ELA FAZ
--   troca a regra da FK de CASCADE para RESTRICT: o MySQL passa
--   a RECUSAR a exclusao de um produto que tenha movimentacoes.
--
-- O MySQL nao tem "ALTER FOREIGN KEY". Para mudar a regra,
-- apagamos a FK e criamos de novo, com o mesmo nome.
-- O indice idx_movements_product continua existindo: apagar a FK
-- nao apaga o indice que ela usava.
--
-- COMO RODAR (com os containers no ar):
--   docker compose exec -T db mysql -uestoque -pestoque123 estoque_db \
--     < database/migrations/004-produto-com-historico.sql
--
-- PARA DESFAZER: database/migrations/004-rollback.sql
-- ============================================================

ALTER TABLE stock_movements DROP FOREIGN KEY fk_movements_product;

ALTER TABLE stock_movements
  ADD CONSTRAINT fk_movements_product
  FOREIGN KEY (product_id) REFERENCES products (id)
  ON DELETE RESTRICT;

-- Confira: a linha da FK deve terminar em "ON DELETE RESTRICT"
-- (ou sem ON DELETE nenhum: RESTRICT e o padrao e o MySQL as vezes omite).
SHOW CREATE TABLE stock_movements;
```

Salve.

E o rollback, `database/migrations/004-rollback.sql`:

```sql
-- ============================================================
-- Rollback da migracao 004 (Aula 65)
-- Volta a FK de product_id para ON DELETE CASCADE.
--
-- ATENCAO: depois disto, excluir um produto volta a apagar o
-- historico dele. So use para voltar ao comportamento da Aula 06.
--
-- COMO RODAR:
--   docker compose exec -T db mysql -uestoque -pestoque123 estoque_db \
--     < database/migrations/004-rollback.sql
-- ============================================================

ALTER TABLE stock_movements DROP FOREIGN KEY fk_movements_product;

ALTER TABLE stock_movements
  ADD CONSTRAINT fk_movements_product
  FOREIGN KEY (product_id) REFERENCES products (id)
  ON DELETE CASCADE;

SHOW CREATE TABLE stock_movements;
```

Salve.

## Passo 2 — Rodar a migração

```bash
docker compose exec -T db mysql -uestoque -pestoque123 estoque_db \
  < database/migrations/004-produto-com-historico.sql
```

Na saída do `SHOW CREATE TABLE`, procure a linha:

```text
CONSTRAINT `fk_movements_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
```

✅ Ela **não** termina mais em `ON DELETE CASCADE`. (O MySQL costuma omitir o `ON DELETE RESTRICT`, porque é o comportamento padrão.)

### Prove que o banco recusa

```bash
docker compose exec db mysql -uestoque -pestoque123 estoque_db -e \
  "DELETE FROM products WHERE sku = 'BEB-001';"
```

✅ **Esperado:**

```text
ERROR 1451 (23000): Cannot delete or update a parent row: a foreign key constraint fails
(`estoque_db`.`stock_movements`, CONSTRAINT `fk_movements_product` ...)
```

O banco virou a **rede de segurança**: mesmo que alguém esqueça a regra no código, ou rode um `DELETE` na mão, o histórico está protegido.

> 🔍 **E o rollback da Aula 33?** O `002-rollback.sql` apaga as movimentações **antes** dos produtos ("apagamos primeiro quem aponta para alguém"). Ele continua funcionando com `RESTRICT`. Aquela ordem "na mão, para a intenção ficar explícita" acabou de se pagar.

## Passo 3 — Os arquivos de criação do banco

A migração resolve **o seu** banco. Mas quem criar o banco do zero (um colega, ou o servidor de produção) usa o `init.sql` e o `001-schema.sql`.

Abra `database/init.sql`, localize o `CREATE TABLE IF NOT EXISTS stock_movements` e troque:

```sql
  CONSTRAINT fk_movements_product
    FOREIGN KEY (product_id) REFERENCES products (id)
    ON DELETE CASCADE
```

por:

```sql
  CONSTRAINT fk_movements_product
    FOREIGN KEY (product_id) REFERENCES products (id)
    -- RESTRICT: produto com historico nao pode ser apagado (Aula 65)
    ON DELETE RESTRICT
```

Faça **a mesma troca** em `database/producao/001-schema.sql` (da [Aula 47](47-preparando-arquivos-producao.md)).

> ⚠️ **Se o seu sistema já está no ar** (Aula 56), o banco de produção **não** roda o `001-schema.sql` de novo: ele só roda na primeira criação. Aplique a migração 004 no servidor como ensina a [Aula 58](58-manutencao-atualizacoes.md) (seção das migrações), **depois** do backup.

---

# PARTE 2 — O back-end

## Passo 4 — Contar o histórico

Abra `src/modules/movements/movement-repository.js` e acrescente, no fim do arquivo:

```javascript
// Quantas movimentacoes um produto tem (Aula 65).
// Usado para explicar POR QUE um produto nao pode ser excluido.
export async function countByProduct(productId) {
  const [rows] = await pool.query(
    "SELECT COUNT(*) AS total FROM stock_movements WHERE product_id = ?",
    [productId]
  );

  return Number(rows[0].total);
}
```

Salve.

## Passo 5 — O service de produtos confere antes de excluir

Abra `src/modules/products/product-service.js`.

Acrescente o import do repositório de movimentações:

```javascript
import { AppError, ConflictError, NotFoundError } from "../../shared/errors/app-error.js";
import { buildPagination } from "../../shared/http/pagination.js";
import * as categoryRepository from "../categories/category-repository.js";
import * as movementRepository from "../movements/movement-repository.js";
```

E troque a função `deleteProduct`:

```javascript
export async function deleteProduct(id) {
  await getProduct(id);

  await repository.remove(id);
}
```

por:

```javascript
export async function deleteProduct(id) {
  await getProduct(id);

  // O banco ja recusaria (FK RESTRICT, Aula 65), mas com uma mensagem
  // tecnica. Conferimos antes para explicar o motivo em portugues.
  const movementCount = await movementRepository.countByProduct(id);

  if (movementCount > 0) {
    throw new ConflictError(
      `Este produto tem ${movementCount} movimentacao(oes) no historico e nao pode ser excluido.`
    );
  }

  await repository.remove(id);
}
```

Salve.

### 🔍 Validar no código **e** no banco?

É o padrão da [Aula 12](12-crud-produtos.md), com a categoria inexistente:

| Camada | O que faz | Mensagem |
|---|---|---|
| Service | confere e explica | "Este produto tem 3 movimentacao(oes) no historico..." |
| Banco (FK) | **garante**, mesmo se o código falhar | `ER_ROW_IS_REFERENCED_2: Cannot delete or update a parent row...` |

> 📌 **Valide na aplicação para dar boa mensagem; mantenha a restrição no banco como rede de segurança.** Você já leu essa frase na Aula 12. Agora ela protege algo muito mais valioso.

### 🔍 Por que `409 Conflict`?

O pedido está bem formado e o produto existe. O problema é o **estado atual** do recurso (ele tem histórico), que conflita com a operação. É exatamente o caso do `409`, o mesmo do SKU duplicado.

## Passo 6 — Produto inativo não recebe movimentação

Abra `src/modules/movements/movement-repository.js` e, dentro de `createWithStockUpdate`, troque a consulta que trava o produto:

```javascript
    const [productRows] = await connection.query(
      "SELECT id, name, quantity FROM products WHERE id = ? FOR UPDATE",
      [productId]
    );
```

por:

```javascript
    const [productRows] = await connection.query(
      "SELECT id, name, quantity, active FROM products WHERE id = ? FOR UPDATE",
      [productId]
    );
```

E, logo depois do `if (!product) { ... }`, acrescente:

```javascript
    if (!product) {
      await connection.rollback();
      return { status: "PRODUCT_NOT_FOUND" };
    }

    // Produto inativo e um produto "aposentado": nao entra nem sai (Aula 65).
    if (!product.active) {
      await connection.rollback();
      return { status: "PRODUCT_INACTIVE" };
    }
```

Salve.

Agora abra `src/modules/movements/movement-service.js` e, em `createMovement`, acrescente o tratamento do status novo logo depois do `PRODUCT_NOT_FOUND`:

```javascript
  if (result.status === "PRODUCT_NOT_FOUND") {
    throw new NotFoundError("Produto nao encontrado");
  }

  if (result.status === "PRODUCT_INACTIVE") {
    throw new AppError("Produto inativo nao pode receber movimentacoes. Reative-o antes");
  }
```

Salve.

### 🔍 Por que conferir **dentro** da transação?

Poderíamos conferir no service, antes de chamar o repository. Mas existe uma janela:

```text
   1. service le o produto: ativo            (pessoa A, movimentando)
   2.                                         pessoa B inativa o produto
   3. repository grava a movimentacao        <- num produto JA inativo!
```

Dentro da transação, depois do `FOR UPDATE`, a linha do produto está **travada**: ninguém altera o `active` entre a leitura e a gravação. É a mesma lógica do saldo da [Aula 13](13-movimentacoes-transacoes.md). E o repository continua só **relatando** (`PRODUCT_INACTIVE`); quem escreve a mensagem é o service.

## Passo 7 — Testar a API

Pegue o `TOKEN` como na Aula 62 e descubra o `id` do café:

```bash
curl -s "http://localhost:3000/api/products/search?q=BEB-001" -H "Authorization: Bearer $TOKEN"
```

| # | Comando | Esperado |
|---|---|---|
| 1 | `curl -s -i -X DELETE http://localhost:3000/api/products/ID_DO_CAFE -H "Authorization: Bearer $TOKEN"` | `409` — "Este produto tem N movimentacao(oes)..." |
| 2 | Crie um produto novo pela tela, sem movimentar, e exclua pelo `curl` | `204` (sem histórico, pode excluir) |
| 3 | Inative um produto pela tela e tente movimentá-lo pelo console | "Produto inativo nao pode receber movimentacoes..." |

Para o teste 3, no console do navegador:

```javascript
const { api } = await import("/js/api.js");
await api.createMovement({ productId: ID_DO_PRODUTO_INATIVO, type: "IN", quantity: 1 });
```

---

# PARTE 3 — O front-end

## 2. Por que trocar o `window.confirm`?

```javascript
if (!window.confirm("Deseja realmente excluir este produto?")) return;
```

| Problema | Consequência |
|---|---|
| Visual do navegador, não do sistema | cada navegador mostra de um jeito; não combina com nada |
| Não dá para estilizar | o botão "OK" de excluir é igual ao de qualquer coisa: nada de vermelho |
| Texto dos botões fixo | "OK / Cancelar", em vez de "Excluir / Cancelar" |
| **Trava a página inteira** | nenhum JavaScript roda enquanto ele está aberto |
| Alguns navegadores oferecem "impedir esta página de criar diálogos" | e aí o `confirm` passa a devolver `false` **sempre** |

Vamos criar o nosso, com uma vantagem: ele vai devolver uma **Promise**, então o uso fica quase igual.

```javascript
// ANTES
if (!window.confirm("Excluir?")) return;

// DEPOIS
if (!(await confirmDialog({ title: "Excluir?", ... }))) return;
```

## Passo 8 — O `confirmDialog` no `layout.js`

Abra `public/js/layout.js` e acrescente, **no fim do arquivo** (depois do `toast`):

```javascript
// Caixa de confirmacao no lugar do window.confirm (Aula 65).
// Devolve uma Promise: true se a pessoa confirmou, false se desistiu.
export function confirmDialog({ title, message, confirmLabel = "Confirmar", variant = "danger" }) {
  return new Promise((resolve) => {
    // Para devolver o foco ao botao que abriu a caixa, ao fechar.
    const previousFocus = document.activeElement;
    const isDanger = variant === "danger";

    const overlay = document.createElement("div");
    overlay.className = "fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4";

    overlay.innerHTML = `
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <div class="flex gap-4">
          <div class="grid h-10 w-10 shrink-0 place-items-center rounded-full ${
            isDanger ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
          }">
            <i data-lucide="${isDanger ? "trash-2" : "triangle-alert"}" class="h-5 w-5"></i>
          </div>
          <div>
            <h2 id="confirm-title" class="text-lg font-semibold text-slate-900">${escapeHtml(title)}</h2>
            <p id="confirm-message" class="mt-1 text-sm text-slate-600">${escapeHtml(message)}</p>
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-2">
          <button
            type="button"
            data-answer="no"
            class="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >Cancelar</button>
          <button
            type="button"
            data-answer="yes"
            class="rounded-xl px-4 py-2 text-sm font-semibold text-white ${
              isDanger ? "bg-rose-600 hover:bg-rose-700" : "bg-slate-900 hover:bg-slate-700"
            }"
          >${escapeHtml(confirmLabel)}</button>
        </div>
      </div>
    `;

    function close(answer) {
      document.removeEventListener("keydown", onKeydown);
      overlay.remove();
      previousFocus?.focus?.();
      resolve(answer);
    }

    function onKeydown(event) {
      if (event.key === "Escape") close(false);
    }

    overlay.addEventListener("click", (event) => {
      // Clique no fundo escuro: desistiu (como o modal da Aula 17).
      if (event.target === overlay) {
        close(false);
        return;
      }

      const button = event.target.closest("[data-answer]");

      if (button) close(button.dataset.answer === "yes");
    });

    document.addEventListener("keydown", onKeydown);
    document.body.append(overlay);
    renderIcons();

    // O foco comeca no CANCELAR: um Enter por engano nao apaga nada.
    overlay.querySelector('[data-answer="no"]').focus();
  });
}
```

Salve.

---

## 3. Dissecando o `confirmDialog`

### 3.1 Uma função que devolve uma Promise

```javascript
export function confirmDialog(...) {
  return new Promise((resolve) => {
    // ... monta a caixa ...
    // ... e só chama resolve(true/false) quando a pessoa clicar
  });
}
```

Esta é a ideia central. A Promise fica **pendente** enquanto a caixa está aberta, e só "termina" quando alguém chama `resolve`:

```text
   const ok = await confirmDialog(...)
                    |
                    |  (a caixa aparece; o await ESPERA, sem travar a página)
                    |
       pessoa clica em "Excluir"  ->  resolve(true)   ->  ok = true
       pessoa clica em "Cancelar" ->  resolve(false)  ->  ok = false
       pessoa aperta Esc          ->  resolve(false)  ->  ok = false
       pessoa clica no fundo      ->  resolve(false)  ->  ok = false
```

Até agora você **usou** Promises (`await api.listProducts()`). Aqui você **criou** uma. O `resolve` é o "botão" que a termina.

> 🔍 **A diferença para o `window.confirm`:** o `confirm` trava o navegador inteiro até a resposta. O `await confirmDialog(...)` só pausa **a função** que o chamou. O resto da página continua vivo (toasts somem, animações rodam).

### 3.2 Criado e destruído a cada uso

A caixa **não existe** no HTML. Ela nasce com `createElement`, é colocada no `<body>` e é removida no `close`. Vantagens:

- **nenhuma página precisa mudar o HTML** para usar;
- cada chamada é independente: não sobra estado de uma confirmação para a outra.

### 3.3 O `close` faz tudo, sempre

```javascript
function close(answer) {
  document.removeEventListener("keydown", onKeydown);
  overlay.remove();
  previousFocus?.focus?.();
  resolve(answer);
}
```

| Linha | Sem ela... |
|---|---|
| `removeEventListener` | cada confirmação deixaria um ouvinte de Esc para trás; depois de 10, a tecla chamaria 10 funções |
| `overlay.remove()` | a caixa ficaria na tela |
| `previousFocus.focus()` | o foco iria para o topo da página; quem navega pelo teclado se perde |
| `resolve(answer)` | o `await` esperaria **para sempre** |

Todos os caminhos de saída (botões, Esc, fundo) passam pelo **mesmo** `close`. Não tem como esquecer uma dessas linhas num caminho específico.

> ⚠️ **Por que `onKeydown` é uma função com nome?** Porque o `removeEventListener` precisa receber **a mesma função** que foi adicionada. Com uma função anônima (`addEventListener("keydown", (e) => ...)`), não haveria como removê-la depois.

### 3.4 Acessibilidade

| Atributo | Efeito |
|---|---|
| `role="alertdialog"` | o leitor de tela anuncia "caixa de alerta" e lê o conteúdo |
| `aria-modal="true"` | "o resto da página está inacessível agora" |
| `aria-labelledby` / `aria-describedby` | o título e a mensagem são lidos ao abrir |
| foco inicial no **Cancelar** | a ação segura é a padrão; Enter por engano não apaga |
| foco volta ao botão de origem | quem usa teclado continua de onde parou |

### 3.5 `escapeHtml` no título e na mensagem

A mensagem pode conter o **nome do produto**, que veio do banco. Como montamos com `innerHTML`, o `escapeHtml` continua obrigatório. É a mesma regra das tabelas desde a [Aula 15](15-front-base.md).

---

## Passo 9 — A tela de Produtos

Abra `public/js/produtos.js`.

### 9.1 O import

```javascript
import { confirmDialog, currency, escapeHtml, mountLayout, toast } from "./layout.js";
```

### 9.2 O nome do produto no botão Excluir

Na Parte C (`renderRows`), no botão de excluir, acrescente o `data-name`:

```javascript
            <button
              data-delete="${product.id}"
              data-name="${escapeHtml(product.name)}"
              class="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
            >Excluir</button>
```

### 9.3 Excluir com o modal, e oferecer a inativação

Na Parte E, dentro do listener do `rowsContainer`, troque o bloco `if (deleteId) { ... }` inteiro por:

```javascript
  if (deleteId) {
    const name = event.target.dataset.name;

    const confirmed = await confirmDialog({
      title: "Excluir produto?",
      message: `"${name}" sera excluido definitivamente. Esta acao nao pode ser desfeita.`,
      confirmLabel: "Excluir",
    });

    if (!confirmed) return;

    try {
      await api.deleteProduct(deleteId);
      toast("Produto excluido");
      loadProducts();
    } catch (error) {
      // 409 = o produto tem historico. Em vez de so mostrar o erro,
      // oferecemos a alternativa certa (Aula 65).
      if (error.status === 409) {
        await offerDeactivation(deleteId, error.message);
        return;
      }

      toast(error.message, "error");
    }
  }
```

### 9.4 A função `offerDeactivation`

Acrescente esta função na Parte E, **antes** do listener do `rowsContainer`:

```javascript
// Produto com historico nao se exclui: se inativa (Aula 65).
async function offerDeactivation(id, reason) {
  const confirmed = await confirmDialog({
    title: "Nao e possivel excluir",
    message: `${reason} Voce pode inativa-lo: ele sai da busca de movimentacoes, mas o historico e preservado.`,
    confirmLabel: "Inativar produto",
    variant: "warning",
  });

  if (!confirmed) return;

  try {
    // O PUT exige o produto inteiro: buscamos e mudamos so o "active".
    const product = await api.getProduct(id);

    await api.updateProduct(id, { ...product, active: false });

    toast("Produto inativado");
    loadProducts();
  } catch (error) {
    toast(error.message, "error");
  }
}
```

Salve.

### 🔍 O `error.status === 409`

Aqui está o motivo de o `api.js` da [Aula 61](61-axios-no-lugar-do-fetch.md) pendurar o `status` no erro:

```javascript
// FRAGIL: quebra se alguem mudar uma virgula da mensagem no back-end
if (error.message.startsWith("Este produto tem")) { ... }

// ROBUSTO: o tipo do erro e um numero combinado pelo protocolo HTTP
if (error.status === 409) { ... }
```

### 🔍 `{ ...product, active: false }`

O `PUT` da [Aula 12](12-crud-produtos.md) **substitui** o produto inteiro e valida todos os campos. Por isso buscamos o produto atual e mandamos tudo de volta, trocando só o `active`. Campos a mais que vêm no objeto (`categoryName`, `lowStock`, `createdAt`) são ignorados pelo `validateProductInput`, que só lê o que conhece.

> 💡 **Exercício:** crie a rota `PATCH /api/products/:id/active`, que recebe só `{ "active": false }`. O `PATCH` é o verbo HTTP para **alteração parcial**, e o front não precisaria mais buscar o produto inteiro.

### O fluxo completo

```text
   clica em Excluir
        |
        v
   [ Excluir produto? ]  ── Cancelar ──► nada acontece
        | Excluir
        v
   DELETE /api/products/7
        |
        ├── 204 ──► toast "Produto excluido"
        |
        └── 409 ──► [ Nao e possivel excluir ]  ── Cancelar ──► nada acontece
                         | Inativar produto
                         v
                    GET + PUT { active: false } ──► toast "Produto inativado"
```

---

## Passo 10 — A tela de Categorias

Abra `public/js/categorias.js`.

Troque o import do `layout.js`:

```javascript
import { confirmDialog, escapeHtml, mountLayout, toast } from "./layout.js";
```

E, no listener do `rowsContainer`, troque a linha do `window.confirm`:

```javascript
    if (!window.confirm("Excluir esta categoria? Os produtos ficarao sem categoria.")) return;
```

por:

```javascript
    const confirmed = await confirmDialog({
      title: "Excluir categoria?",
      message: "Os produtos desta categoria nao serao apagados: eles ficarao sem categoria.",
      confirmLabel: "Excluir",
    });

    if (!confirmed) return;
```

Salve.

> 🔍 **Por que a categoria pode ser excluída e o produto não?** Porque a FK de `products.category_id` é `ON DELETE SET NULL` ([Aula 06](06-banco-de-dados.md)): apagar a categoria não apaga nada importante, só tira o "rótulo" dos produtos. A mensagem do modal agora diz isso com clareza.

---

## Passo 11 — Testar na tela

Recarregue com **Ctrl + Shift + R**.

| # | Faça | Esperado |
|---|---|---|
| 1 | Produtos: clique em Excluir no café | Modal com ícone de lixeira vermelho e o nome "Cafe em graos 1kg" |
| 2 | Aperte **Esc** | O modal fecha, nada acontece |
| 3 | Abra de novo e clique no fundo escuro | Fecha, nada acontece |
| 4 | Abra de novo e tecle **Enter** direto | Fecha **sem** excluir (o foco estava no Cancelar) |
| 5 | Abra de novo e clique em **Excluir** | Segundo modal, amarelo: "Este produto tem N movimentacao(oes)..." |
| 6 | Clique em **Inativar produto** | Toast "Produto inativado"; o café aparece com a etiqueta **Inativo** |
| 7 | Movimentações: busque `caf` | O café **não** aparece mais |
| 8 | Relatórios: movimentações por período | As movimentações do café **continuam** lá |
| 9 | Produtos: edite o café, marque "Produto ativo", salve | Volta a aparecer na busca de Movimentações |
| 10 | Crie um produto "Teste exclusao", sem movimentar, e exclua | Exclui direto (um modal só) |
| 11 | Categorias: exclua uma categoria de teste | Modal com a explicação dos produtos |
| 12 | Depois de fechar qualquer modal | O foco volta para o botão que o abriu (aperte Tab e veja) |

---

## ✅ Confira se deu certo

- [ ] A FK `fk_movements_product` não é mais `CASCADE` (`SHOW CREATE TABLE`)
- [ ] `DELETE` direto no MySQL de um produto com histórico dá `ERROR 1451`
- [ ] `init.sql` e `producao/001-schema.sql` foram atualizados
- [ ] A API devolve `409` com mensagem clara para produto com histórico
- [ ] Produto inativo não recebe movimentação (mensagem da API)
- [ ] O `window.confirm` não aparece mais em nenhuma tela
- [ ] O modal fecha com Esc, fundo e Cancelar, e começa com foco no Cancelar
- [ ] O 409 oferece a inativação
- [ ] O histórico do produto inativado continua nos relatórios

---

## 🔧 Se deu erro

### `ERROR 1091: Can't DROP 'fk_movements_product'; check that column/key exists`

A FK tem outro nome no seu banco. Descubra com `SHOW CREATE TABLE stock_movements;` e use o nome que aparecer no `CONSTRAINT`.

### `ERROR 1826: Duplicate foreign key constraint name`

Você rodou a migração duas vezes, ou só o `ADD` sem o `DROP`. Rode `SHOW CREATE TABLE stock_movements;` para ver o estado atual.

### A exclusão dá `500` em vez de `409`

O `deleteProduct` não está chamando o `countByProduct`, e o erro veio direto do banco (`ER_ROW_IS_REFERENCED_2`). Confira o Passo 5 e o import do `movementRepository`.

### O modal aparece, mas o `await` nunca termina

Algum caminho de saída não chama o `resolve`. Todos precisam passar pelo `close(...)`.

### O ícone do modal não aparece

Faltou o `renderIcons()` **depois** do `document.body.append(overlay)`.

### Depois de usar o modal várias vezes, o Esc fecha coisas demais

O `removeEventListener` não está removendo. Confira se o `addEventListener` e o `removeEventListener` recebem a **mesma** função `onKeydown`.

### Inativar dá "O preco de venda nao pode ser menor que o preco de custo"

O produto foi gravado antes dessa regra existir, com preços invertidos. Edite-o pela tela, corrija os preços e tente de novo. (A validação está fazendo o trabalho dela.)

### O segundo modal (amarelo) não aparece; só o toast vermelho

O `error.status` está `undefined`. Confira a função `toAppError` do `api.js` (Aula 61): ela precisa ter `appError.status = error.response?.status ?? 0;`.

---

## ➡️ Próximo passo

As regras estão certas. Agora vamos dar um acabamento à interface: botões que mostram que estão trabalhando, tabelas que mostram que estão carregando, e formulários que funcionam bem para todo mundo.

**[Aula 66 — Carregamento, skeleton e acessibilidade](66-carregamento-acessibilidade.md)**
