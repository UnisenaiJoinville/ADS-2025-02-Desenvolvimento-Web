# Estoque Fácil — Apostila em Mini-Aulas

Bem-vindo! Esta pasta contém o projeto **Estoque Fácil** dividido em **46 mini-aulas**.

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

### Parte 6 — Autenticação com Vue.js (aulas 23 a 32)

Bloco novo. Fecha o sistema com cadastro, login e proteção das rotas — e apresenta o **Vue.js**.

| # | Aula | Tempo | O que você faz |
|---|---|---|---|
| 23 | [Autenticação: conceitos](23-autenticacao-conceitos.md) | 30 min | Hash, salt, bcrypt e JWT no papel |
| 24 | [Tabela de usuários](24-tabela-usuarios.md) | 35 min | Tabela `users`, migração e `JWT_SECRET` |
| 25 | [Validador e repositório](25-auth-validator-repository.md) | 45 min | As duas camadas de baixo do módulo |
| 26 | [O service: bcrypt e JWT](26-auth-service.md) | 50 min | **O coração:** onde a senha vira hash |
| 27 | [Rotas e middleware](27-auth-rotas-e-middleware.md) | 45 min | **Tranca a API inteira** |
| 28 | [Primeiros passos com Vue](28-vue-primeiros-passos.md) | 45 min | Reatividade, diretivas e laboratório |
| 29 | [Tela de cadastro (Vue)](29-tela-cadastro-vue.md) | 50 min | Formulário reativo + sessão no navegador |
| 30 | [Tela de login (Vue)](30-tela-login-vue.md) | 45 min | Entrar e guardar o token |
| 31 | [Protegendo o front](31-protegendo-o-front.md) | 40 min | Porteiro nas telas e botão "Sair" |
| 32 | [Teste final e exercícios](32-teste-final-autenticacao.md) | 45 min | 20 testes, diagnóstico e desafios |

### Parte 7 — Relatórios, SQL e JOINs (aulas 33 a 45)

Bloco novo. Usa o banco real do projeto para ensinar SQL do zero até vários `JOIN`s — e entrega um módulo de relatórios completo.

| # | Aula | Tempo | O que você faz |
|---|---|---|---|
| 33 | [Mapa do banco](33-relatorios-mapa-do-banco.md) | 40 min | Lê o esquema e prepara os dados de teste |
| 34 | [SELECT, filtros e ordenação](34-select-filtros-ordenacao.md) | 55 min | O primeiro relatório + lista branca de ordenação |
| 35 | [Agregação, GROUP BY e HAVING](35-agregacao-group-by.md) | 55 min | Contar, somar e agrupar |
| 36 | [INNER JOIN](36-inner-join.md) | 55 min | **Juntar duas tabelas** |
| 37 | [LEFT JOIN](37-left-join.md) | 55 min | **A aula mais importante do bloco** |
| 38 | [Vários JOINs](38-multiplos-joins.md) | 55 min | Quatro tabelas + `user_id` nas movimentações |
| 39 | [JOIN com agrupamento](39-join-agrupamento-having.md) | 50 min | Rankings e relatórios por responsável |
| 40 | [Relatórios de estoque](40-relatorios-de-estoque.md) | 45 min | Situação do estoque como filtro |
| 41 | [Relatórios por período](41-relatorios-por-periodo.md) | 50 min | **A armadilha da data com hora** |
| 42 | [Tela de relatórios (Vue)](42-tela-relatorios-vue.md) | 50 min | Abas, cards e os quatro estados |
| 43 | [Integração com a API](43-integracao-vue-api.md) | 55 min | Filtros, `watch` e debounce |
| 44 | [Paginação, ordenação e CSV](44-paginacao-ordenacao-csv.md) | 55 min | Exportar para a planilha |
| 45 | [Subqueries e avançado](45-subqueries-e-relatorios-avancados.md) | 60 min | Curva ABC, teste final e exercícios |

**Tempo total estimado:** cerca de 11 h (aulas 00–22) + 7 h (aulas 23–32) + 11 h (aulas 33–45).

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
| 7 | 23 a 27 | **API protegida por token** |
| 8 | 28 a 32 | **Cadastro e login em Vue funcionando** |
| 9 | 33 a 35 | SQL no terminal e o primeiro relatório |
| 10 | 36 a 39 | **JOINs dominados** |
| 11 | 40 a 41 | Relatórios de estoque e por período |
| 12 | 42 a 45 | **Tela de relatórios completa** |

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

- [`../apostila.md`](../apostila.md) — as aulas 00 a 22 em **arquivo único**, boa para consulta e impressão
- [`../apostila-autenticacao.md`](../apostila-autenticacao.md) — as aulas 23 a 32 em arquivo único
- [`../apostila-relatorios.md`](../apostila-relatorios.md) — as aulas 33 a 45 em arquivo único
- [`../database/queries/relatorios-lab.sql`](../database/queries/relatorios-lab.sql) e [`joins-lab.sql`](../database/queries/joins-lab.sql) — os cadernos de SQL
- [`../ferramentas/`](../ferramentas/LEIA-ME.md) — scripts que mantêm as apostilas em sincronia com o código
- [`../database/queries/auth-queries.sql`](../database/queries/auth-queries.sql) — consultas de apoio do módulo de autenticação
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
