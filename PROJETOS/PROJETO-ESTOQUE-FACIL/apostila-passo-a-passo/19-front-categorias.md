# Aula 19 — Tela de Categorias

⏱️ **Tempo estimado:** 30 minutos
📋 **Tipo:** prática (HTML + JavaScript)

---

## Objetivo

Criar a última tela do sistema. Ela é a **mais simples**, e por isso é uma boa oportunidade para você tentar fazer sozinho antes de olhar a resposta.

---

## Antes de começar

- [ ] Aula 18 concluída (movimentações funcionando)

---

## 🎯 Desafio: tente fazer sozinho primeiro

Você já viu tudo o que precisa nas aulas 15 a 18. Antes de copiar o código, tente construir:

**Requisitos:**

1. Um formulário com um campo de texto (nome) e um botão **Salvar**
2. Uma tabela listando as categorias com a coluna "Produtos" (a contagem)
3. Botões **Editar** e **Excluir** em cada linha
4. Ao clicar em **Editar**, o formulário carrega o nome e passa a atualizar
5. Um botão **Cancelar** que aparece só no modo edição

**Dicas:**

- Use o `<input type="hidden" name="id">` do jeito que fizemos em produtos
- Use **delegação de eventos** no container da tabela
- Para mostrar/esconder o botão Cancelar, use `classList.add("hidden")` e `classList.remove("hidden")`

> ⏰ Dê 15 minutos a você (ou à turma). Depois compare com a solução abaixo.

---

## Passo 1 — Criar o `public/categorias.html`

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Categorias | Estoque Facil</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="min-h-screen bg-slate-100 text-slate-900">
    <div data-nav></div>

    <main class="mx-auto max-w-3xl px-6 py-8">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-slate-900">Categorias</h1>
        <p class="text-sm text-slate-500">Organize os produtos por grupo</p>
      </div>

      <section class="mb-6 rounded-2xl border border-slate-200 bg-white p-6">
        <form data-form class="flex flex-wrap items-end gap-3">
          <input type="hidden" name="id" />

          <div class="min-w-[220px] flex-1">
            <label class="mb-1 block text-sm font-medium text-slate-700">Nome da categoria</label>
            <input
              name="name"
              required
              placeholder="Ex.: Bebidas"
              class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
          </div>

          <button class="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700">
            Salvar
          </button>
          <button
            type="button"
            data-cancel
            class="hidden rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
        </form>
      </section>

      <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-6 py-3">Categoria</th>
              <th class="px-4 py-3 text-right">Produtos</th>
              <th class="px-6 py-3 text-right">Acoes</th>
            </tr>
          </thead>
          <tbody data-rows class="divide-y divide-slate-100"></tbody>
        </table>
      </section>
    </main>

    <div data-toast-stack class="fixed bottom-6 right-6 z-50 flex flex-col gap-2"></div>

    <script type="module" src="/js/categorias.js"></script>
  </body>
</html>
```

Salve.

### Diferenças em relação às outras telas

| Item | Por quê |
|---|---|
| `max-w-3xl` (em vez de `max-w-7xl`) | A tela tem poucas colunas; largura menor fica mais legível |
| Formulário **na página**, sem modal | Só um campo — abrir um modal seria exagero |
| Botão Cancelar com `hidden` | Só aparece no modo edição |

> 📌 **Decisão de design:** nem toda tela precisa de modal. Formulário simples pode ficar direto na página. Adequar a complexidade da interface à do dado é uma boa prática.

### O `type="button"` no Cancelar

```html
<button type="button" data-cancel>Cancelar</button>
```

⚠️ **Detalhe crucial:** dentro de um `<form>`, todo `<button>` sem `type` é tratado como `type="submit"`. Sem o `type="button"`, clicar em Cancelar **enviaria o formulário**.

| Tipo | Comportamento dentro do form |
|---|---|
| (sem type) | Envia o formulário |
| `type="submit"` | Envia o formulário |
| `type="button"` | Não faz nada (só o que o JS mandar) ✅ |

---

## Passo 2 — Criar o `public/js/categorias.js`

```javascript
import { api } from "./api.js";
import { escapeHtml, mountLayout, toast } from "./layout.js";

mountLayout("/categorias.html");

const form = document.querySelector("[data-form]");
const rowsContainer = document.querySelector("[data-rows]");
const cancelButton = document.querySelector("[data-cancel]");

function renderRows(categories) {
  if (categories.length === 0) {
    rowsContainer.innerHTML = `
      <tr><td colspan="3" class="px-6 py-10 text-center text-sm text-slate-500">
        Nenhuma categoria cadastrada
      </td></tr>`;
    return;
  }

  rowsContainer.innerHTML = categories
    .map(
      (category) => `
        <tr class="hover:bg-slate-50">
          <td class="px-6 py-3 font-medium text-slate-800">${escapeHtml(category.name)}</td>
          <td class="px-4 py-3 text-right text-slate-600">${category.productCount}</td>
          <td class="px-6 py-3 text-right whitespace-nowrap">
            <button
              data-edit="${category.id}"
              data-name="${escapeHtml(category.name)}"
              class="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >Editar</button>
            <button
              data-delete="${category.id}"
              class="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
            >Excluir</button>
          </td>
        </tr>
      `
    )
    .join("");
}

function resetForm() {
  form.reset();
  form.elements.id.value = "";
  cancelButton.classList.add("hidden");
}

async function loadCategories() {
  try {
    const categories = await api.listCategories();
    renderRows(categories);
  } catch (error) {
    toast(error.message, "error");
  }
}

cancelButton.addEventListener("click", resetForm);

rowsContainer.addEventListener("click", async (event) => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;

  if (editId) {
    form.elements.id.value = editId;
    form.elements.name.value = event.target.dataset.name;
    form.elements.name.focus();
    cancelButton.classList.remove("hidden");
  }

  if (deleteId) {
    if (!window.confirm("Excluir esta categoria? Os produtos ficarao sem categoria.")) return;

    try {
      await api.deleteCategory(deleteId);
      toast("Categoria excluida");
      resetForm();
      loadCategories();
    } catch (error) {
      toast(error.message, "error");
    }
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const data = new FormData(form);
  const id = data.get("id");
  const payload = { name: data.get("name") };

  try {
    if (id) {
      await api.updateCategory(id, payload);
      toast("Categoria atualizada");
    } else {
      await api.createCategory(payload);
      toast("Categoria cadastrada");
    }

    resetForm();
    loadCategories();
  } catch (error) {
    toast(error.message, "error");
  }
});

loadCategories();
```

Salve.

---

## Entendendo os pontos novos

### 💡 O botão que carrega o nome consigo

```html
<button data-edit="${category.id}" data-name="${escapeHtml(category.name)}">Editar</button>
```

```javascript
form.elements.name.value = event.target.dataset.name;
```

Repare: **não fazemos requisição** para buscar a categoria ao editar. O nome já está guardado no próprio botão, em um atributo `data-name`.

Compare com a tela de produtos:

| Tela | Ao clicar em Editar | Por quê |
|---|---|---|
| Produtos | `await api.getProduct(id)` | São 8 campos; buscar garante dados frescos |
| Categorias | Lê do `data-name` | É **um** campo; a requisição não compensa |

> 📌 **Lição:** nem toda ação precisa ir ao servidor. Se o dado já está na tela e é simples, aproveite.

### ⚠️ O `escapeHtml` dentro do atributo

```javascript
data-name="${escapeHtml(category.name)}"
```

Este `escapeHtml` é **essencial** aqui. Imagine uma categoria chamada:

```text
Bebidas" onmouseover="alert(1)
```

Sem o escape, o HTML gerado seria:

```html
<button data-name="Bebidas" onmouseover="alert(1)">
```

O atacante teria injetado um evento no seu botão. Com o `escapeHtml`, as aspas viram `&quot;` e o valor continua sendo apenas texto.

> 🎯 XSS não acontece só dentro de tags — acontece também **dentro de atributos**. Escape sempre.

### O modo edição do formulário

```javascript
if (editId) {
  form.elements.id.value = editId;                     // marca que é edição
  form.elements.name.value = event.target.dataset.name; // preenche
  form.elements.name.focus();                          // foca
  cancelButton.classList.remove("hidden");             // mostra Cancelar
}
```

E o `resetForm` desfaz os quatro passos:

```javascript
function resetForm() {
  form.reset();                              // limpa os campos
  form.elements.id.value = "";               // volta ao modo criação
  cancelButton.classList.add("hidden");      // esconde Cancelar
}
```

> ⚠️ **Por que limpar o `id` explicitamente?** Porque `form.reset()` volta os campos ao **valor inicial do HTML**, e o `id` é `hidden` sem valor... mas depois de atribuirmos por JavaScript, o `reset()` pode não limpá-lo em todos os navegadores. Limpar explicitamente é mais seguro.

### O `window.confirm` com aviso de consequência

```javascript
if (!window.confirm("Excluir esta categoria? Os produtos ficarao sem categoria.")) return;
```

Repare que a mensagem **explica a consequência**. Lembra do `ON DELETE SET NULL` da Aula 06? A interface avisa exatamente o que o banco vai fazer.

> 💭 Compare com um genérico "Tem certeza?". Uma boa mensagem de confirmação diz **o que vai acontecer**, não só pergunta se você quer.

---

## Passo 3 — 🧪 Testar

Acesse:

```text
http://localhost:3000/categorias.html
```

### Roteiro

1. **Ver a lista** — 4 categorias, com a contagem de produtos ao lado
2. **Criar** — digite `Hortifruti`, clique em **Salvar** → toast verde, aparece com `0` produtos
3. **Testar duplicidade** — digite `hortifruti` (minúsculas) e salve → toast vermelho: *"Ja existe uma categoria com esse nome"*
4. **Testar vazio** — deixe em branco e tente salvar → o navegador bloqueia (é o `required` do HTML)
5. **Editar** — clique em **Editar** na Hortifruti:
   - o nome aparece no campo
   - o botão **Cancelar** aparece
   - mude para `Hortifruti e Frios` e salve → toast de atualização
6. **Cancelar** — clique em **Editar** de novo e depois em **Cancelar** → o formulário limpa e o botão some
7. **Excluir** — clique em **Excluir** → aparece a confirmação com o aviso → confirme

### 🧪 O teste que mostra o `ON DELETE SET NULL`

1. Vá em **Produtos** e crie um produto na categoria `Bebidas`
2. Volte em **Categorias** e **exclua** `Bebidas`
3. Volte em **Produtos**

Os produtos **continuam lá**, agora com "Sem categoria". Nada foi perdido.

> 🎯 Aqui você vê, na tela, a decisão de modelagem que tomamos lá na Aula 06.

---

## 🎉 O sistema está completo!

Faça um tour pelas quatro telas:

| Tela | Endereço |
|---|---|
| Dashboard | http://localhost:3000 |
| Produtos | http://localhost:3000/produtos.html |
| Movimentações | http://localhost:3000/movimentacoes.html |
| Categorias | http://localhost:3000/categorias.html |

E veja o menu funcionando, com o item da página atual sempre destacado.

### O que você construiu

```text
   4 telas responsivas
   14 endpoints REST
   4 módulos com 4 camadas cada
   3 tabelas relacionadas
   2 containers Docker
   1 transação com controle de concorrência
```

---

## ✅ Confira se deu certo

- [ ] `public/categorias.html` e `public/js/categorias.js` existem
- [ ] A tabela mostra as categorias com a contagem de produtos
- [ ] Criar categoria funciona
- [ ] Nome duplicado (mesmo com outra caixa) é recusado
- [ ] **Editar** preenche o formulário e mostra o **Cancelar**
- [ ] **Cancelar** limpa e esconde o botão
- [ ] **Excluir** pede confirmação explicando a consequência
- [ ] Ao excluir uma categoria, os produtos dela ficam "Sem categoria"
- [ ] O menu do topo funciona nas 4 telas

---

## 🔧 Se deu erro

| Sintoma | Causa | Solução |
|---|---|---|
| Cancelar envia o formulário | Faltou `type="button"` | Acrescente no `<button data-cancel>` |
| Ao editar, o campo vem vazio | `data-name` ausente | Confira o atributo no botão Editar |
| Editar cria em vez de atualizar | O `id` não foi preenchido | Confira `form.elements.id.value = editId` |
| Depois de editar, continua em modo edição | `resetForm` não chamado | Chame após salvar |
| Toast não aparece | Falta o container | Confira `<div data-toast-stack>` no HTML |

---

## ➡️ Próximo passo

Sistema pronto. Vamos testar tudo junto, do começo ao fim.

**[Aula 20 — Teste final](20-teste-final.md)** 🏁
