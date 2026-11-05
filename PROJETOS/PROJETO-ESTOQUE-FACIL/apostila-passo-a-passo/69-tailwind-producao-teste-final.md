# Aula 69 — Tailwind compilado, teste final e exercícios do bloco

⏱️ **Tempo estimado:** 60 minutos
📋 **Tipo:** prática + teste + atividade

---

## Objetivo

1. Tirar o Tailwind do CDN e gerar um **arquivo CSS pronto e mínimo**, como se faz em produção.
2. Ajustar o `Dockerfile.prod` para gerar esse CSS na hora do build.
3. Fazer o **teste final** de todas as melhorias (Aulas 60 a 69).
4. Praticar com os exercícios do bloco.

---

## Antes de começar

- [ ] Aulas 60 a 68 concluídas
- [ ] Node instalado no seu computador (`node -v`)

---

## Arquivos desta aula

```text
NOVOS ARQUIVOS
├── tailwind.config.js
└── styles/app.css

GERADO (nao vai para o Git)
└── public/css/app.css

ARQUIVOS ALTERADOS
├── package.json  e  package-lock.json   (tailwindcss + scripts)
├── .gitignore
├── public/*.html                        (as 7 paginas: <link> no lugar do <script>)
└── Dockerfile.prod                      (etapa que gera o CSS)
```

---

# PARTE 1 — Tailwind compilado

## 1. O que o CDN faz, e por que isso pesa

Desde a [Aula 15](15-front-base.md), cada página tem:

```html
<script src="https://cdn.tailwindcss.com"></script>
```

Esse script é um **compilador de Tailwind rodando no navegador** de cada usuário:

```text
   CDN (o que temos hoje)                     CSS compilado (o que vamos fazer)

   navegador baixa ~400 KB de JavaScript      navegador baixa ~20 KB de CSS
   le o HTML da pagina                        aplica
   descobre quais classes foram usadas        pronto
   gera o CSS na hora
   aplica
   (e repete em TODA pagina aberta)
```

E a própria página avisa. Abra qualquer tela, F12 → **Console**:

```text
cdn.tailwindcss.com should not be used in production. To use Tailwind CSS in
production, install it as a PostCSS plugin or use the Tailwind CLI
```

Lembra do aviso da Aula 15? *"Em um projeto real, você instalaria o Tailwind via `npm` e geraria um CSS mínimo, só com as classes usadas."* É hora.

### A ideia do compilador

O Tailwind tem **milhares** de classes possíveis. O compilador (CLI) lê os seus arquivos, encontra **só as que você usou** e gera um CSS com elas:

```text
   public/**/*.html  ─┐
                      ├──►  tailwindcss (CLI)  ──►  public/css/app.css
   public/js/**/*.js ─┘         lê as classes          só o que é usado
```

---

## Passo 1 — Instalar o Tailwind (como ferramenta de desenvolvimento)

Na pasta do projeto, **no seu computador**:

```bash
npm install -D tailwindcss@3.4.17
```

O `-D` (de `--save-dev`) coloca o pacote em **`devDependencies`**, e não em `dependencies`:

| Seção do `package.json` | Para quê | Entra na imagem de produção? |
|---|---|---|
| `dependencies` | o que a API usa **rodando** (express, mysql2...) | sim |
| `devDependencies` | o que só serve para **construir** (tailwindcss) | **não** (`npm ci --omit=dev`, Aula 47) |

> 🔍 **Por que a versão 3?** O CDN que usamos desde a Aula 15 é o Tailwind 3. Todas as classes do projeto são da versão 3. Fixar `3.4.17` garante que o CSS gerado seja **igual** ao que você via com o CDN.

## Passo 2 — Os scripts no `package.json`

Abra o `package.json` e acrescente dois scripts:

```json
  "scripts": {
    "start": "node src/server.js",
    "dev": "node --watch src/server.js",
    "css:build": "tailwindcss -i ./styles/app.css -o ./public/css/app.css --minify",
    "css:watch": "tailwindcss -i ./styles/app.css -o ./public/css/app.css --watch"
  },
```

Salve.

| Script | Quando usar |
|---|---|
| `npm run css:build` | gera o CSS **uma vez**, minificado (produção, ou depois de clonar o projeto) |
| `npm run css:watch` | fica **vigiando** e regera a cada arquivo salvo (enquanto você desenvolve) |

| Opção | Significado |
|---|---|
| `-i ./styles/app.css` | o arquivo de **entrada** (*input*) |
| `-o ./public/css/app.css` | o arquivo de **saída** (*output*), dentro de `public` para o Express servir |
| `--minify` | tira espaços e quebras de linha: arquivo menor |
| `--watch` | não termina: regera sempre que algo mudar |

## Passo 3 — A configuração

Crie na **raiz** do projeto o arquivo `tailwind.config.js`:

```javascript
// Configuracao do Tailwind (Aula 69).
// "export default" porque o projeto usa "type": "module" no package.json.

/** @type {import('tailwindcss').Config} */
export default {
  // ONDE procurar classes. Nao basta o HTML: varias telas montam
  // HTML dentro do JavaScript (template strings e :class do Vue).
  content: ["./public/**/*.html", "./public/js/**/*.js"],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

Salve.

### 🔍 O `content` é a configuração mais importante

O Tailwind **não executa** o seu JavaScript. Ele lê os arquivos como **texto** e procura qualquer coisa que pareça uma classe. Se um arquivo não estiver no `content`, as classes **só dele** não entram no CSS.

```text
   public/js/layout.js tem:  "bg-emerald-600"  (cor do toast de sucesso)

   content SEM "./public/js/**/*.js"  ->  a classe nao entra  ->  toast sem cor
   content COM                        ->  entra               ->  toast verde
```

### ⚠️ A regra das classes inteiras

Como o Tailwind lê **texto**, a classe precisa aparecer **inteira** no código:

```javascript
// FUNCIONA: as duas classes aparecem inteiras no arquivo
const color = isIn ? "text-emerald-600" : "text-rose-600";

// NAO FUNCIONA: "text-emerald-600" nunca aparece escrita em lugar nenhum
const color = `text-${isIn ? "emerald" : "rose"}-600`;
```

O projeto inteiro foi escrito do primeiro jeito, então nada precisa mudar. Mas guarde a regra: **nunca monte nome de classe do Tailwind por pedaços.**

## Passo 4 — O arquivo de entrada

Crie a pasta `styles` na raiz e, dentro dela, `app.css`:

```css
/* Entrada do Tailwind (Aula 69). O CLI troca estas tres linhas
   pelo CSS de verdade e grava em public/css/app.css. */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Salve.

| Diretiva | O que vira |
|---|---|
| `@tailwind base` | o "reset" do Tailwind (margens zeradas, fontes padrão...) |
| `@tailwind components` | componentes de plugins (não usamos nenhum) |
| `@tailwind utilities` | as classes utilitárias **que você usou** |

> 🔍 **Por que `styles/` na raiz e não em `public/`?** Porque `public` é o que o navegador pode baixar. O `app.css` de entrada não serve para o navegador (ele tem `@tailwind`, que o navegador não entende). Só o **resultado** vai para `public/css/`.

## Passo 5 — Gerar o CSS

```bash
npm run css:build
```

✅ **Esperado:**

```text
Rebuilding...
Done in 312ms.
```

E o arquivo `public/css/app.css` existe. Veja o tamanho:

```bash
ls -lh public/css/app.css
```

Algo em torno de **15 a 30 KB**. Compare com os ~400 KB do script do CDN.

## Passo 6 — Trocar o CDN pelo `<link>` nas 7 páginas

Em **cada** HTML da pasta `public`, troque:

```html
    <script src="https://cdn.tailwindcss.com"></script>
```

por:

```html
    <!-- CSS gerado pelo Tailwind CLI (Aula 69): npm run css:build -->
    <link rel="stylesheet" href="/css/app.css" />
```

- [ ] `public/index.html`
- [ ] `public/produtos.html`
- [ ] `public/movimentacoes.html`
- [ ] `public/categorias.html`
- [ ] `public/relatorios.html`
- [ ] `public/login.html`
- [ ] `public/cadastro.html`

> 🔍 **`/css/app.css` com barra no começo:** caminho a partir da raiz do site. O Express serve a pasta `public` na raiz ([Aula 09](09-servidor-express.md)), então `public/css/app.css` vira `http://localhost:3000/css/app.css`.

## Passo 7 — O `.gitignore`

O `public/css/app.css` é um arquivo **gerado**: qualquer um recria com `npm run css:build`. Arquivo gerado não vai para o Git (pelo mesmo motivo do `node_modules`).

Abra o `.gitignore` e acrescente:

```text
# CSS gerado pelo Tailwind (Aula 69): recrie com "npm run css:build"
public/css/app.css
```

> ⚠️ **Consequência:** quem clonar o projeto precisa rodar `npm install` e `npm run css:build` antes do primeiro `docker compose up`, senão as telas abrem **sem estilo nenhum**. Acrescente isso ao `README.md` do projeto, na seção "Como rodar".

## Passo 8 — O dia a dia de desenvolvimento

Enquanto você mexe nas telas, deixe um **segundo terminal** aberto com:

```bash
npm run css:watch
```

```text
   Terminal 1: docker compose up        (a API)
   Terminal 2: npm run css:watch        (o CSS, regerado a cada salvamento)
```

Teste: num HTML qualquer, acrescente a classe `underline` num título, salve e recarregue a página. O título fica sublinhado. Pare o `css:watch` (`Ctrl + C`), acrescente `italic`, salve, recarregue: **não** fica itálico, porque ninguém regerou o CSS.

> 📌 **Esse é o preço do CSS compilado:** um passo de build. Em troca, o usuário baixa 20 KB em vez de 400 KB e não espera compilação nenhuma.

## Passo 9 — Testar todas as telas

Recarregue com **Ctrl + Shift + R** e percorra **todas** as telas: login, cadastro, dashboard, produtos (com o modal), movimentações (com o autocomplete aberto), categorias e relatórios (com as abas).

Procure por:

- [ ] cores dos toasts (verde, vermelho, cinza)
- [ ] as abas ativas (fundo branco com sombra)
- [ ] os botões Entrada/Saída mudando de cor (`peer-checked:`)
- [ ] o modal de produto centralizado com fundo escuro
- [ ] o skeleton pulsando e o spinner girando
- [ ] a barra de força da senha no cadastro (vermelha, amarela, verde)

Abra o **Console**: o aviso `cdn.tailwindcss.com should not be used in production` **sumiu**.

Na aba **Network**, filtre por `css`: `app.css` com poucos KB.

---

## Passo 10 — O `Dockerfile.prod` gera o CSS

Em produção, o servidor não deve depender de você lembrar de rodar o `css:build` antes do deploy. A imagem vai gerar o CSS sozinha, num **build em duas etapas** (*multi-stage*).

Abra `Dockerfile.prod` e deixe assim:

```dockerfile
# ============================================================
# Etapa 1 - gera o CSS do Tailwind (Aula 69)
# Esta etapa tem as ferramentas de build. Ela NAO vai para producao:
# so o arquivo que ela produz e copiado para a etapa 2.
# ============================================================
FROM node:22-alpine AS css

WORKDIR /build

COPY package*.json ./
# Aqui SIM instalamos as devDependencies: o tailwindcss e uma delas.
RUN npm ci

COPY tailwind.config.js ./
COPY styles ./styles
# O Tailwind precisa LER as paginas e os .js para achar as classes.
COPY public ./public

RUN npm run css:build


# ============================================================
# Etapa 2 - a imagem de PRODUCAO da API
# ============================================================
FROM node:22-alpine

# Faz o Express e as bibliotecas trabalharem em modo producao
ENV NODE_ENV=production

WORKDIR /app

# Dependencias primeiro (cache de camadas, como na Aula 04).
# "--omit=dev" deixa o tailwindcss DE FORA desta imagem.
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# So o que a aplicacao precisa para rodar
COPY --chown=node:node src ./src
COPY --chown=node:node public ./public

# Da etapa 1, so o CSS pronto.
COPY --chown=node:node --from=css /build/public/css/app.css ./public/css/app.css

# A imagem node ja traz o usuario "node", sem poderes de administrador.
USER node

EXPOSE 3000

CMD ["node", "src/server.js"]
```

Salve.

### 🔍 O build em duas etapas

```text
   ETAPA 1 "css"                              ETAPA 2 (a imagem final)
   ┌────────────────────────────┐             ┌────────────────────────────┐
   │ node + TODAS as deps       │             │ node + SÓ deps de produção │
   │ (inclusive tailwindcss)    │             │ src/                       │
   │ public/ + styles/          │             │ public/                    │
   │ npm run css:build          │   COPY      │ public/css/app.css  ◄──────┤
   │   └─► public/css/app.css ──┼─────────────┼──►                         │
   └────────────────────────────┘ --from=css  └────────────────────────────┘
          (descartada)                              (vai para o servidor)
```

| Linha | Por quê |
|---|---|
| `FROM node:22-alpine AS css` | dá um **nome** à etapa 1, para a etapa 2 poder copiar dela |
| `RUN npm ci` (sem `--omit=dev`) | a etapa 1 precisa do tailwindcss |
| `COPY --from=css ...` | traz **um arquivo** da etapa 1; todo o resto dela é jogado fora |

> 📌 **A imagem final não tem o Tailwind**, nem o `styles/`, nem nada de build. Menos coisa instalada é menos coisa para atualizar e menos superfície de ataque, o princípio de **reduzir a superfície** da [Aula 59](59-teste-final-hospedagem.md).

### O pacote de deploy

O `tar` da [Aula 58](58-manutencao-atualizacoes.md) usa uma lista de permitidos: arquivos fora da lista **não** vão para o servidor. Acrescente `tailwind.config.js` e `styles`:

```bash
data=$(date +%Y%m%d-%H%M)
tar -czf "estoque-deploy-$data.tar.gz" src public styles tailwind.config.js database/producao deploy package.json package-lock.json Dockerfile.prod docker-compose.prod.yml .env.production.example
```

> ⚠️ Sem isso, o build no servidor falha na etapa 1 com `"/styles": not found`.

### Ensaio local

Se você tem o ensaio da [Aula 47](47-preparando-arquivos-producao.md):

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Abra `http://localhost:8080`: as telas devem aparecer **com estilo**, sem o CDN.

---

# PARTE 2 — Teste final do bloco

Percorra cada linha. Faça com a rede **normal**, salvo quando indicado.

### Ícones e senha (Aula 60)

| # | Verificação | Esperado |
|---|---|---|
| 1 | Olho na senha do login | Alterna `eye` / `eye-off` e mostra/esconde |
| 2 | Caps Lock na senha | Aviso amarelo aparece e some |
| 3 | Menu | Ícone em cada item; página atual destacada |
| 4 | Bloqueie o CDN do Lucide | Sistema funciona, só sem ícones |

### Axios (Aula 61)

| # | Verificação | Esperado |
|---|---|---|
| 5 | Senha errada no login | Mensagem do servidor, **sem** recarregar a tela |
| 6 | Console: `await api.getProduct(99999)` | `Error` com `message` e `status: 404` |
| 7 | Network: qualquer requisição | Tem `Authorization: Bearer ...` |
| 8 | Exportar CSV nos relatórios | O arquivo baixa |

### Busca e autocomplete (Aulas 62 e 63)

| # | Verificação | Esperado |
|---|---|---|
| 9 | `GET /api/products/search?q=caf` | Só ativos, no máximo 8, o mais parecido primeiro |
| 10 | Movimentações: digite `caf` | Lista com o trecho destacado e o saldo |
| 11 | Setas + Enter | Escolhe sem enviar o formulário |
| 12 | Slow 3G, digitando aos poucos | Buscas velhas **(canceled)** |
| 13 | Saída maior que o estoque | Dica vermelha e botão travado |

### Paginação (Aula 64)

| # | Verificação | Esperado |
|---|---|---|
| 14 | `GET /api/products?pageSize=3&page=2` | Envelope `{ pagination, rows }`, sem repetir linhas |
| 15 | Produtos: digitar na busca | Filtra sozinho, **uma** requisição por pausa |
| 16 | ‹ e › | Navegam; desabilitados nas pontas |
| 17 | Excluir o único item da última página | Volta para a página anterior |

### Exclusão segura (Aula 65)

| # | Verificação | Esperado |
|---|---|---|
| 18 | `DELETE` no MySQL de produto com histórico | `ERROR 1451` |
| 19 | Excluir produto com histórico pela tela | Oferece **inativar** |
| 20 | Produto inativo | Some da busca de Movimentações; a API recusa movimentá-lo |
| 21 | Nenhum `window.confirm` no sistema | Só o modal próprio |

### Acabamento (Aula 66)

| # | Verificação | Esperado |
|---|---|---|
| 22 | Slow 3G: 3 cliques rápidos em Registrar | **Uma** movimentação |
| 23 | Clicar no meio do ícone de lápis | Abre a edição |
| 24 | Clicar no texto "Preco de venda" | Foca o campo |
| 25 | Esc no modal de produto | Fecha e devolve o foco ao botão de origem |

### Segurança (Aula 67)

| # | Verificação | Esperado |
|---|---|---|
| 26 | 6 logins errados seguidos | 5 × `401`, depois `429` |
| 27 | Login certo durante o bloqueio | Também `429` |
| 28 | Mensagem na tela de login | "Muitas tentativas de login..." |

### Gráfico e Tailwind (Aulas 68 e 69)

| # | Verificação | Esperado |
|---|---|---|
| 29 | Gráfico com 7/30/90 dias | Um registro por dia, inclusive vazios; barras animam na troca |
| 30 | Console de qualquer tela | **Sem** o aviso do `cdn.tailwindcss.com` |
| 31 | Todas as telas | Com estilo, iguais ao que eram com o CDN |
| 32 | Lighthouse → Accessibility na tela de Produtos | Nota anotada (compare com a de antes da Aula 66, se tiver) |

---

## Dicionário de problemas do bloco

| Sintoma | Causa provável | Aula |
|---|---|---|
| Ícone não aparece, sem erro no console | faltou `renderIcons()` depois do `innerHTML` | 60 |
| Dois olhos na senha ao mesmo tempo | `renderIcons()` depois do `mount` do Vue, ou diretiva no `<i>` | 60 |
| Telas recebem `{ data, status, headers }` | interceptor de resposta não devolve `response.data` | 61 |
| Toast "Request failed with status code 400" | erro não passa pelo `toAppError` | 61 |
| `400 — Parametro id invalido: search` | rota `/search` depois de `/:id` | 62 |
| Busca por `%` devolve tudo | faltou escapar o `LIKE` | 62 |
| Clicar numa sugestão só fecha a lista | `click` em vez de `mousedown` | 63 |
| Resultado de uma busca antiga aparece no fim | faltou o `abort()` / `isCanceled` | 63 |
| Produtos repetidos entre páginas | `ORDER BY` sem o `p.id` | 64 |
| Total e linhas não batem | `findAll` e `countAll` filtrando diferente | 64 |
| `500` ao excluir produto, em vez de `409` | o service não conta o histórico antes | 65 |
| O `await confirmDialog` nunca termina | um caminho de saída não chama `resolve` | 65 |
| Clicar no ícone de lápis não faz nada | delegação sem `closest` | 66 |
| Botão preso em "Salvando..." | `setButtonLoading(false)` fora do `finally` | 66 |
| Em produção, ninguém consegue logar depois de um erro | `TRUST_PROXY` desligado atrás do Caddy | 67 |
| Gráfico sem os dias vazios | `INNER JOIN` em vez de `LEFT`, ou calendário à direita | 68 |
| Gráfico mostra o dia anterior | data convertida com `new Date()` no front | 68 |
| Uma tela perdeu cores depois do Tailwind CLI | arquivo fora do `content`, ou classe montada por pedaços | 69 |
| Build de produção: `"/styles": not found` | `styles` fora da lista do `tar` | 69 |

---

# PARTE 3 — Exercícios

### 🟢 Nível 1 — Compreensão

1. Explique, com suas palavras, a diferença entre **debounce** e **cancelamento** de requisição. Por que o autocomplete precisa dos dois?
2. Por que a rota `/search` precisa ser declarada **antes** de `/:id`? Desenhe o caminho que o Express faz nos dois casos.
3. Compare `ON DELETE CASCADE`, `SET NULL` e `RESTRICT`. Para cada uma, dê um exemplo de tabela do projeto em que ela seria a escolha certa.
4. O que acontece com o limite de login se o `trust proxy` estiver **desligado** em produção? E se estiver **ligado** em desenvolvimento?
5. Por que o dia do gráfico viaja como texto (`"2026-10-14"`) e não como data?

### 🟡 Nível 2 — Prática

6. **Ícones nos cards do dashboard.** Acrescente um ícone do Lucide a cada card (`package`, `wallet`, `trending-up`, `triangle-alert`). Lembre-se do `renderIcons()`.
7. **Refatoração da paginação.** Faça o `report-filters.js` e o `report-service.js` usarem o `src/shared/http/pagination.js` da Aula 64, apagando as cópias.
8. **`PATCH` de ativo.** Crie `PATCH /api/products/:id/active` recebendo `{ "active": false }` e use-o no `offerDeactivation`, em vez do `GET` + `PUT`.
9. **Filtro de ativos.** Na tela de Produtos, acrescente um filtro "Mostrar inativos" (desmarcado por padrão), com o parâmetro correspondente na API.
10. **Skeleton no dashboard.** Mostre cards "fantasma" enquanto o `getDashboard` carrega.

### 🔴 Nível 3 — Desafios

11. **Paginação na URL.** Faça a tela de Produtos guardar `search`, `page` e `pageSize` na URL (`?search=caf&page=2`), com `history.replaceState`. Ao recarregar a página (F5), a tela deve voltar ao mesmo ponto.
12. **Autocomplete reutilizável.** Transforme o autocomplete da Aula 63 numa função `createProductPicker(elemento, { onSelect })` em um arquivo próprio, e use-a também como filtro de produto na tela de relatórios.
13. **Tentativas restantes.** Leia o cabeçalho `RateLimit` (Aula 67) na tela de login e mostre "Restam N tentativas" depois de cada erro.
14. **Prender o foco no modal.** Hoje, com o modal aberto, o `Tab` pode levar o foco para os botões da página **atrás** dele. Faça o foco "dar a volta" dentro do modal (pesquise *focus trap*).
15. **Modo escuro.** Com o Tailwind compilado, configure `darkMode: "class"` no `tailwind.config.js` e crie um botão no menu que alterna o tema, guardando a escolha no `localStorage` (pelo `auth.js`? Pense em qual módulo deve cuidar disso).

---

## 🎓 Conclusão do bloco

Você pegou um sistema que **funcionava** e o deixou **melhor de usar, mais seguro e mais leve**, sem reescrever nada do zero:

| Melhoria | O princípio por trás |
|---|---|
| Lucide com `window.lucide?.` | **Enfeite que falha não derruba a tela** |
| Axios com interceptors | **Centralizar** o que se repete (o `api.js` da Aula 15 pagou o investimento) |
| Rota `/search` separada | **Uma rota por caso de uso** |
| Autocomplete com debounce e `abort` | **Menos estado guardado, menos estado velho** |
| `findAll` + `countAll` com o mesmo `WHERE` | **O que precisa ser igual, uma coisa usa a outra** |
| `RESTRICT` + `409` + inativar | **Validar na aplicação para explicar; no banco para garantir** |
| `setButtonLoading` no `finally` | **Todo caminho de saída restaura o estado** |
| `aria-label`, `for`/`id`, foco devolvido | **A interface precisa funcionar para todo mundo** |
| `express-rate-limit` + `trust proxy` | **Configuração de segurança depende do ambiente** |
| CTE + `LEFT JOIN` no gráfico | **Mostrar o zero também é informação** |
| Tailwind compilado em multi-stage | **Produção leva só o que roda** |

E, em todas as aulas, a mesma regra que atravessa o curso: **o front ajuda, o servidor decide.**

---

## ➡️ Fim do roteiro

Voltar ao índice: **[README das mini-aulas](README.md)**
