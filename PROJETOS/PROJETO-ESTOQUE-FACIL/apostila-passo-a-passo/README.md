# Estoque Fácil — Apostila em Mini-Aulas

Bem-vindo! Esta pasta contém o projeto **Estoque Fácil** dividido em **23 mini-aulas**.

Cada arquivo é uma etapa curta, com passos numerados, o que você deve ver na tela e o que fazer se der erro.

> **Regra número 1:** faça as aulas **na ordem**. Cada uma começa de onde a anterior parou.

---

## Como usar este material

Cada mini-aula tem sempre a mesma estrutura:

| Seção | Para que serve |
|---|---|
| **Objetivo** | O que você vai conseguir fazer ao final |
| **Antes de começar** | O que precisa estar pronto da aula anterior |
| **Passo 1, 2, 3...** | O que digitar e onde |
| **Entendendo o que fizemos** | A explicação do "porquê" |
| **Confira se deu certo** | Lista para marcar antes de seguir |
| **Se deu erro** | Os problemas mais comuns **daquela etapa** |

---

## Roteiro completo

### Parte 1 — Preparação (aulas 0 a 6)

| # | Aula | Tempo | O que você faz |
|---|---|---|---|
| 00 | [Visão geral do projeto](00-visao-geral.md) | 15 min | Entende o que será construído |
| 01 | [Preparando o ambiente](01-preparando-o-ambiente.md) | 20 min | Instala e testa Node e Docker |
| 02 | [Criando o projeto](02-criando-o-projeto.md) | 15 min | Cria as pastas e o `package.json` |
| 03 | [Variáveis de ambiente](03-variaveis-de-ambiente.md) | 15 min | Cria o `.env` |
| 04 | [Dockerfile](04-dockerfile.md) | 20 min | Escreve a receita da imagem |
| 05 | [Docker Compose](05-docker-compose.md) | 30 min | Orquestra API + banco |
| 06 | [Banco de dados](06-banco-de-dados.md) | 30 min | Modela as tabelas em SQL |

### Parte 2 — Base do backend (aulas 7 a 10)

| # | Aula | Tempo | O que você faz |
|---|---|---|---|
| 07 | [Configuração da aplicação](07-configuracao-da-aplicacao.md) | 25 min | Lê o `.env` e conecta no MySQL |
| 08 | [Tratamento de erros](08-tratamento-de-erros.md) | 25 min | Cria a base de erros do projeto |
| 09 | [Servidor Express](09-servidor-express.md) | 25 min | Monta o servidor web |
| 10 | [Primeira execução](10-primeira-execucao.md) | 30 min | **Sobe tudo pela primeira vez** |

### Parte 3 — A API (aulas 11 a 14)

| # | Aula | Tempo | O que você faz |
|---|---|---|---|
| 11 | [CRUD de Categorias](11-crud-categorias.md) | 50 min | Seu primeiro CRUD completo |
| 12 | [CRUD de Produtos](12-crud-produtos.md) | 50 min | CRUD com filtros e mais regras |
| 13 | [Movimentações e Transações](13-movimentacoes-transacoes.md) | 50 min | **A aula mais importante** |
| 14 | [Dashboard (API)](14-dashboard-api.md) | 40 min | Somas e totais direto no SQL |

### Parte 4 — O front-end (aulas 15 a 19)

| # | Aula | Tempo | O que você faz |
|---|---|---|---|
| 15 | [Base do front-end](15-front-base.md) | 30 min | Tailwind, `api.js` e `layout.js` |
| 16 | [Tela do Dashboard](16-front-dashboard.md) | 45 min | Os cards que somam e subtraem |
| 17 | [Tela de Produtos](17-front-produtos.md) | 50 min | Tabela, filtros e modal |
| 18 | [Tela de Movimentações](18-front-movimentacoes.md) | 40 min | Entradas e saídas na tela |
| 19 | [Tela de Categorias](19-front-categorias.md) | 30 min | A tela mais simples |

### Parte 5 — Fechamento (aulas 20 a 22)

| # | Aula | Tempo | O que você faz |
|---|---|---|---|
| 20 | [Teste final](20-teste-final.md) | 40 min | Testa o sistema inteiro |
| 21 | [Solução de problemas](21-solucao-de-problemas.md) | consulta | Dicionário de erros |
| 22 | [Exercícios e checklist](22-exercicios-e-checklist.md) | — | Para fixar e avaliar |

**Tempo total estimado:** cerca de 11 horas de aula.

---

## Sugestão de divisão em encontros

| Encontro | Aulas | Entregável ao final |
|---|---|---|
| 1 | 00 a 06 | Estrutura e banco modelados |
| 2 | 07 a 10 | **API respondendo no navegador** |
| 3 | 11 a 12 | CRUD de categorias e produtos |
| 4 | 13 a 14 | Transações e dashboard funcionando |
| 5 | 15 a 17 | Dashboard e produtos na tela |
| 6 | 18 a 20 | **Sistema completo testado** |

---

## Antes da primeira aula

Peça aos alunos que já tenham instalado:

1. **Node.js** (versão LTS) — https://nodejs.org
2. **Docker Desktop** — https://www.docker.com/products/docker-desktop
3. **Visual Studio Code** — https://code.visualstudio.com
4. **Git** (para ter o Git Bash no Windows) — https://git-scm.com

> A aula [01](01-preparando-o-ambiente.md) tem o passo a passo para conferir se está tudo certo.

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
| ⚠️ | Atenção: erro comum acontece aqui |
| ✅ | Checkpoint: pare e confira antes de continuar |

Bom trabalho, e vamos começar pela [Aula 00](00-visao-geral.md).
