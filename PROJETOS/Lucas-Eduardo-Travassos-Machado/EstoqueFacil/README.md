# Estoque Facil

Sistema de estoque desenvolvido nas etapas 00 a 45 da atividade. Usa Node.js 22, Express, MySQL 8 e Docker Compose. Cadastro, login e relatorios usam Vue 3 pelo CDN, junto com o layout existente em Tailwind.

## Executar

Copie `.env.example` para `.env` e preencha `JWT_SECRET` com um segredo de pelo menos 32 caracteres. O arquivo `.env` deve permanecer fora do Git.

```powershell
Copy-Item .env.example .env
docker compose up -d --build
docker compose ps
```

Abra http://localhost:3000/login.html. A conta de demonstracao usa `professor@estoquefacil.com` e senha `123456`.

Em um volume novo, o MySQL executa `database/init.sql` e cria a estrutura completa, com os dados de demonstracao. Em um volume existente, alterar esse arquivo nao atualiza o banco. Para uma base que concluiu a etapa 32, aplique as migracoes abaixo, nesta ordem:

```powershell
Get-Content -Raw -Encoding UTF8 database/migrations/002-dados-relatorios.sql | docker compose exec -T db sh -c 'MYSQL_PWD="$MYSQL_PASSWORD" mysql -u"$MYSQL_USER" "$MYSQL_DATABASE"'
Get-Content -Raw -Encoding UTF8 database/migrations/003-movimentacoes-por-usuario.sql | docker compose exec -T db sh -c 'MYSQL_PWD="$MYSQL_PASSWORD" mysql -u"$MYSQL_USER" "$MYSQL_DATABASE"'
```

A migracao 002 pode ser reaplicada sem duplicar os dados. A 003 deve ser executada uma unica vez, apenas quando a coluna `stock_movements.user_id` ainda nao existir. Ela nao deve ser aplicada depois de criar um banco com o `init.sql` final.

Os arquivos `003-rollback.sql` e `002-rollback.sql` desfazem as migracoes nessa ordem. O primeiro remove a informacao do responsavel; o segundo remove os produtos de demonstracao e seu historico. Devem ser usados somente em uma base de atividade preparada para essa operacao. Nao e necessario apagar volumes para atualizar o sistema.

## Relatorios das etapas 33 a 45

O menu Relatorios abre quatro abas: Produtos, Movimentacoes, Resumos e Analises. Os indicadores superiores representam todo o estoque ativo; os totais das tabelas correspondem aos filtros aplicados, independentemente da pagina.

Todas as rotas abaixo exigem `Authorization: Bearer <token>` e usam o prefixo `/api/reports`.

| Rota | Resultado |
|---|---|
| `/products` | Produtos com filtros, ordenacao, paginacao e totais |
| `/stock-summary` | Indicadores gerais do estoque ativo |
| `/stock-by-category` | Estoque por categoria, incluindo categorias vazias e produtos sem categoria |
| `/products-without-movement` | Produtos ativos que nunca tiveram movimentacao |
| `/abc-curve` | Classificacao por participacao individual no valor de custo do estoque |
| `/movements` | Historico com produto, categoria, responsavel e totais |
| `/movements-by-user` | Movimentacoes agrupadas por responsavel |
| `/movements-by-month` | Entradas, saidas e saldo por mes |
| `/top-products` | Ranking por quantidade movimentada, somando entradas e saidas |

Produtos aceitam `search`, `categoryId`, `withoutCategory`, `stockStatus` e `onlyActive`. Movimentacoes aceitam `productId`, `categoryId`, `userId`, `type`, `startDate` e `endDate`. Os agrupamentos de movimentacoes e o ranking respeitam os mesmos filtros de movimentacoes. O ranking tambem aceita `minUnits` e `limit`.

As listagens aceitam `page`, `pageSize`, `sort` e `direction`. O tamanho maximo por pagina e 200. Valores invalidos retornam 400. O periodo inclui todo o dia final informado.

`/products?format=csv` e `/movements?format=csv` exportam toda a selecao filtrada, mantendo a ordenacao e ignorando a pagina exibida. A consulta ocorre em lotes de 200 registros; o arquivo final nao e cortado nesse limite. O arquivo usa UTF-8 com BOM, separador ponto e virgula e virgula decimal. A exportacao e sincrona e mantem as linhas na memoria, adequada ao volume desta atividade; nao representa uma fotografia transacional caso os dados mudem durante o download.

A classificacao ABC segue a versao didatica da etapa 45: classe A com participacao individual de pelo menos 20%, B de pelo menos 5% e C abaixo de 5%. Ela nao usa participacao acumulada.

Os cadernos em `database/queries/` servem para executar uma consulta por vez no terminal. Alguns exemplos mostram erros intencionais para explicar SQL.

## Validacao

`tests/reports.integration.mjs` inicia uma instancia temporaria da aplicacao e valida a API contra uma base separada. O teste recusa o nome do banco normal e exige um nome no formato `estoque_*_validation`.

Prepare uma base vazia chamada `estoque_reports_validation`, conceda acesso ao usuario configurado em `DB_USER` e carregue nela `database/init.sql`. Depois execute:

```powershell
docker compose exec -T -e DB_NAME=estoque_reports_validation api node tests/reports.integration.mjs
```

O teste altera somente a base de validacao, que deve ser descartada depois. Uma nova execucao requer uma base novamente preparada. Ele cobre as nove rotas, autenticacao, filtros invalidos, resultados vazios, preservacao dos registros sem categoria ou responsavel, datas, paginacao, totais, CSV com mais de 200 linhas e gravacao do usuario autenticado na transacao de estoque.

Na verificacao desta entrega, passaram 104 verificacoes em uma base criada pelo `init.sql` e outras 104 em uma base atualizada pelas migracoes. Os rollbacks restauraram os totais anteriores de 7 produtos, 12 movimentacoes, 4 categorias e 1 usuario. A reaplicacao da migracao 002 nao duplicou registros.

No Chrome foram conferidos login, dashboard, produtos, categorias, movimentacoes e as quatro abas de relatorios. Busca, filtros, estado vazio, mensagem de data invalida, paginacao e ordenacao funcionaram sem excecoes JavaScript. A largura de 390 pixels foi conferida sem transbordamento da pagina.

Tambem foram conferidos os downloads dos dois CSVs no navegador, a mensagem de erro de rede nas abas Resumos e Analises, a recuperacao apos restabelecer a conexao e o redirecionamento ao login quando o token do download e invalido.
