# Estoque Fácil — Apostila passo a passo

Esta pasta contém a construção completa do projeto **Estoque Fácil**, dividida em **33 etapas** sequenciais.

Cada arquivo é uma etapa curta, com passos numerados, o que você deve ver na tela e o que fazer se der erro.

> **Regra número 1:** faça as etapas **na ordem**. Cada uma começa de onde a anterior parou.

---

## Como usar este material

Cada etapa tem sempre a mesma estrutura:

| Seção | Para que serve |
|---|---|
| **Objetivo** | O que você vai conseguir fazer ao final |
| **Antes de começar** | O que precisa estar pronto da etapa anterior |
| **Passo 1, 2, 3...** | O que digitar e onde |
| **Entendendo o que fizemos** | A explicação do "porquê" |
| **Confira se deu certo** | Lista para marcar antes de seguir |
| **Se deu erro** | Os problemas mais comuns **daquela etapa** |

---

## Roteiro completo

### Parte 1 — Preparação (etapas 00 a 06)

| # | Etapa | O que você faz |
|---|---|---|
| 00 | [Visão geral do projeto](00-visao-geral.md) | Entende o que será construído |
| 01 | [Preparando o ambiente](01-preparando-o-ambiente.md) | Instala e testa Node e Docker |
| 02 | [Criando o projeto](02-criando-o-projeto.md) | Cria as pastas e o `package.json` |
| 03 | [Variáveis de ambiente](03-variaveis-de-ambiente.md) | Cria o `.env` |
| 04 | [Dockerfile](04-dockerfile.md) | Escreve a receita da imagem |
| 05 | [Docker Compose](05-docker-compose.md) | Orquestra API + banco |
| 06 | [Banco de dados](06-banco-de-dados.md) | Modela as tabelas em SQL |

### Parte 2 — Base do backend (etapas 07 a 10)

| # | Etapa | O que você faz |
|---|---|---|
| 07 | [Configuração da aplicação](07-configuracao-da-aplicacao.md) | Lê o `.env` e conecta no MySQL |
| 08 | [Tratamento de erros](08-tratamento-de-erros.md) | Cria a base de erros do projeto |
| 09 | [Servidor Express](09-servidor-express.md) | Monta o servidor web |
| 10 | [Primeira execução](10-primeira-execucao.md) | **Sobe tudo pela primeira vez** |

### Parte 3 — A API (etapas 11 a 14)

| # | Etapa | O que você faz |
|---|---|---|
| 11 | [CRUD de Categorias](11-crud-categorias.md) | Seu primeiro CRUD completo |
| 12 | [CRUD de Produtos](12-crud-produtos.md) | CRUD com filtros e mais regras |
| 13 | [Movimentações e Transações](13-movimentacoes-transacoes.md) | **Transações e controle de concorrência** |
| 14 | [Dashboard (API)](14-dashboard-api.md) | Somas e totais direto no SQL |

### Parte 4 — O front-end (etapas 15 a 19)

| # | Etapa | O que você faz |
|---|---|---|
| 15 | [Base do front-end](15-front-base.md) | Tailwind, `api.js` e `layout.js` |
| 16 | [Tela do Dashboard](16-front-dashboard.md) | Os cards que somam e subtraem |
| 17 | [Tela de Produtos](17-front-produtos.md) | Tabela, filtros e modal |
| 18 | [Tela de Movimentações](18-front-movimentacoes.md) | Entradas e saídas na tela |
| 19 | [Tela de Categorias](19-front-categorias.md) | A tela mais simples |

### Parte 5 — Fechamento (etapas 20 a 22)

| # | Etapa | O que você faz |
|---|---|---|
| 20 | [Teste final](20-teste-final.md) | Testa o sistema inteiro |
| 21 | [Solução de problemas](21-solucao-de-problemas.md) | Dicionário de erros, para consulta |
| 22 | [Exercícios e checklist](22-exercicios-e-checklist.md) | Para fixar o que foi construído |

### Parte 6 — Autenticação e Vue.js (etapas 23 a 32)

| # | Etapa | O que você faz |
|---|---|---|
| 23 | [Autenticação: conceitos](23-autenticacao-conceitos.md) | Entende hash, token e middleware antes de codar |
| 24 | [Tabela de usuários](24-tabela-usuarios.md) | Cria a tabela `users` e instala `bcryptjs` e `jsonwebtoken` |
| 25 | [Validador e repositório](25-auth-validator-repository.md) | `user-validator.js` e `user-repository.js` |
| 26 | [Service de autenticação](26-auth-service.md) | Hash da senha e geração do token JWT |
| 27 | [Rotas e middleware](27-auth-rotas-e-middleware.md) | **Protege a API inteira** |
| 28 | [Primeiros passos com Vue.js](28-vue-primeiros-passos.md) | Laboratório com as diretivas do Vue |
| 29 | [Tela de cadastro](29-tela-cadastro-vue.md) | Formulário reativo em Vue |
| 30 | [Tela de login](30-tela-login-vue.md) | Login e armazenamento do token |
| 31 | [Protegendo o front](31-protegendo-o-front.md) | Telas protegidas, usuário logado e botão Sair |
| 32 | [Teste final da autenticação](32-teste-final-autenticacao.md) | Teste completo, erros comuns e exercícios |

---

## Marcos de progresso

Se quiser dividir a construção em blocos, estes são os pontos naturais de parada — cada um termina com algo funcionando:

| Bloco | Etapas | Entregável ao final |
|---|---|---|
| 1 | 00 a 06 | Estrutura e banco modelados |
| 2 | 07 a 10 | **API respondendo no navegador** |
| 3 | 11 a 12 | CRUD de categorias e produtos |
| 4 | 13 a 14 | Transações e dashboard funcionando |
| 5 | 15 a 17 | Dashboard e produtos na tela |
| 6 | 18 a 20 | **Sistema completo testado** |
| 7 | 23 a 27 | API protegida por login |
| 8 | 28 a 32 | **Telas de cadastro e login em Vue, sistema protegido** |

---

## Antes de começar

Tenha instalado:

1. **Node.js** (versão LTS) — https://nodejs.org
2. **Docker Desktop** — https://www.docker.com/products/docker-desktop
3. **Visual Studio Code** — https://code.visualstudio.com
4. **Git** (para ter o Git Bash no Windows) — https://git-scm.com

> A [Etapa 01](01-preparando-o-ambiente.md) tem o passo a passo para conferir se está tudo certo.

---

## Materiais relacionados

- [`../apostila.md`](../apostila.md) — a mesma apostila em **arquivo único**, boa para consulta e impressão
- [`../README.md`](../README.md) — como rodar o projeto pronto

---

## Convenções usadas nos textos

| Marca | Significado |
|---|---|
| `código assim` | Nome de arquivo, comando ou trecho de código |
| **Passo N** | Uma ação que você precisa executar |
| > Bloco citado | Explicação extra ou aviso importante |
| **Atenção:** | Erro comum acontece aqui |
| **Confira se deu certo** | Checkpoint: pare e confira antes de continuar |

Bom trabalho, e vamos começar pela [Etapa 00](00-visao-geral.md).
