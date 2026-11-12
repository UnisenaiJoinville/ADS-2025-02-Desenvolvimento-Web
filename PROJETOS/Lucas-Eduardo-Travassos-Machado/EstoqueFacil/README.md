# Estoque Facil

Sistema de estoque desenvolvido nas etapas 00 a 45 e 60 a 69 da atividade. Usa Node.js 22, Express, MySQL 8 e Docker Compose. Cadastro, login e relatorios usam Vue 3 pelo CDN, junto com o layout existente em Tailwind.

## Executar

Copie `.env.example` para `.env` e preencha `JWT_SECRET` com um segredo de pelo menos 32 caracteres. O arquivo `.env` deve permanecer fora do Git.

```powershell
Copy-Item .env.example .env
npm ci
npm run css:build
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

## Melhorias da Parte 9

Produtos usam busca ao vivo e paginacao: `GET /api/products` retorna `{ pagination, rows }`, com 10 registros por padrao e teto de 100. A ordem e nome e ID. A busca rapida `GET /api/products/search?q=&limit=8` retorna um array de ate 20 produtos ativos, com SKU exato e inicio do nome primeiro. Percentual, sublinhado e barra sao texto literal.

Movimentacoes usam autocomplete com debounce, cancelamento, teclado e saldo. A quantidade inicial so pode ser definida no cadastro do produto; edicoes posteriores preservam o saldo atual. Para alterar estoque, registre entrada ou saida. Produtos inativos nao recebem movimentacoes, inclusive pela API.

Excluir produto com historico retorna 409 e oferece inativacao. O banco tambem impede a exclusao. Categorias continuam podendo ser excluidas, deixando os produtos sem categoria. Todas as confirmacoes usam dialogo proprio com Cancelar como foco inicial.

A comunicacao fica em uma instancia Axios com interceptors, timeout de 15 segundos e tratamento de cancelamento, sessao, erros e CSV. Login/cadastro nao enviam o token de uma sessao anterior. Lucide e Chart.js sao opcionais: suas falhas nao interrompem os formularios nem os demais dados do dashboard. O grafico aceita 7, 30 e 90 dias, inclui dias vazios e tem resumo acessivel.

## Migracao 004

Uma base existente nas aulas 33–45 precisa somente da migracao 004. Confira antes a FK com `SHOW CREATE TABLE stock_movements` e mantenha um backup. Uma base nova criada com o init.sql final ja usa RESTRICT e nao precisa da migracao.

```powershell
Get-Content -Raw -Encoding UTF8 database/migrations/004-produto-com-historico.sql | docker compose exec -T db sh -c 'MYSQL_PWD="$MYSQL_PASSWORD" mysql -u"$MYSQL_USER" "$MYSQL_DATABASE"'
```

O script usa uma FK temporaria em dois ALTERs: MySQL 8 recusa remover e adicionar uma FK com o mesmo nome no mesmo ALTER. Cada comando troca uma restricao por outra, sem deixar o historico sem protecao. DDL faz commit implicito. Se houver interrupcao entre os comandos, confira o esquema: a FK temporaria permanece valida e o segundo ALTER conclui a troca.

`database/migrations/004-rollback.sql` restaura CASCADE e reabre a possibilidade de apagar historico em futuras exclusoes. Use somente para uma reversao deliberada; o script nao remove dados. Os rollbacks anteriores continuam removendo movimentacoes antes dos produtos. Os testes de rollback usam bases isoladas.

## CSS e build local

`npm ci` instala as versoes do lockfile; `npm run css:build` gera `public/css/app.css`. O CSS gerado nao e versionado. Em desenvolvimento, mantenha `npm run css:watch` em outro terminal. O Dockerfile compila o CSS, mas o bind mount de public usa os arquivos do host: gere o CSS no host antes de subir o Compose normal.

```powershell
npm ci
npm run css:build
npm run css:watch
# Build de producao, somente local:
docker build -f Dockerfile.prod -t estoque-parte9-prod-local .
```

A imagem de producao usa duas etapas, gera o CSS automaticamente e roda como usuario node, sem Tailwind ou ferramentas de teste no runtime. Nao depende de Caddy, dominio ou infraestrutura de hospedagem. Todas as oito paginas, incluindo vue-lab.html, usam o CSS compilado. Classes condicionais aparecem completas nos HTMLs/JS para o compilador encontra-las.

## Limites de autenticacao e proxy

Login permite cinco respostas de erro em 15 minutos por IP; a sexta tentativa recebe JSON 429, mesmo com a senha correta. Login bem-sucedido nao consome tentativa. Cadastro permite dez requisicoes por hora por IP. Os contadores sao locais a cada processo e zeram ao reiniciar; varias instancias exigiriam armazenamento compartilhado.

`TRUST_PROXY=false` e o padrao, correto para acesso direto local. Somente com UM proxy confiavel na frente, sem acesso direto alternativo a API, use `TRUST_PROXY=true`: o Express confiara em um salto. Nao use essa opcao para aceitar IPs enviados por clientes diretos.

## Validacao reproduzivel

Use Node 22.19 ou superior (exigencia das ferramentas de validacao). Os testes de API recusam o banco normal e exigem nomes `estoque_*_validation`. Nao execute as suites na base de uso. As ferramentas de navegador e Lighthouse estao em devDependencies; Chrome instalado e necessario.

```powershell
npm ci
npm run css:build
docker compose -p estoque-parte9 -f docker-compose.validation.yml up -d --build
# Cria bases novas; use um identificador diferente a cada execucao.
$env:VALIDATION_RUN='ensaio_um'
node tests/database-validation.mjs
npm run test:browser
# Reinicie somente a API de validacao antes do Lighthouse:
docker compose -p estoque-parte9 -f docker-compose.validation.yml restart api
npm run test:lighthouse
```

O Compose de validacao usa porta 3019, nomes e volume proprios; nao usa .env nem expoe o MySQL. O runner recusa sobrescrever bases de execucoes anteriores. Testa inicializacao, migracoes 002–004, reaplicacao 002, rollbacks e suites de relatorios/Parte 9 tanto em schema novo quanto migrado. Os testes alteram apenas essas bases. Reinicie somente a API de validacao entre a suite de navegador (que bloqueia o login no ultimo teste) e Lighthouse.

Se o Docker nao iniciar novos containers, e possivel reutilizar um MySQL Docker ja ativo com bases separadas, sem alterar as tabelas da aplicacao normal:

```powershell
$env:VALIDATION_DB_CONTAINER='estoque-db'
$env:VALIDATION_DB_PORT='3308'
$env:VALIDATION_RUN='ensaio_dois'
node tests/database-validation.mjs
$env:VALIDATION_DB_NAME='estoque_ensaio_dois_browser_validation'
node tests/serve-validation.mjs
# Em outro terminal: npm run test:browser
```

Nesse modo, a API de teste roda no host na porta 3019; as credenciais do servidor MySQL sao lidas somente em memoria, sem imprimi-las ou grava-las. Pare essa API com Ctrl+C e inicie-a novamente antes do Lighthouse. As bases isoladas ficam disponiveis para inspecao. Nao e necessario apagar volumes.

A suite de navegador cobre senha/Caps Lock, cadastro, sessao, CRUD, CSV, autocomplete, cancelamento sob latencia, cliques repetidos, paginacao, confirmacoes, inativacao, grafico, falhas de CDN/rede e largura de 390px. Artefatos ficam em .validation e test-results, fora do Git. O Lighthouse gera HTML/JSON e imprime a nota efetiva.

O resultado desta entrega e as 32 verificacoes estao em [docs/validacao-parte9.md](docs/validacao-parte9.md).

Para repetir os testes sem depender de DNS dos CDNs, prepare o cache opcional com `node tests/cdn-cache.mjs --download`. As bibliotecas oficiais continuam sendo executadas; os testes de falha ainda bloqueiam as respectivas URLs. Esse cache fica em `.validation/cdn`, fora do Git.

`tests/Dockerfile.smoke` executa `tests/runtime-smoke.mjs` nas imagens prontas via BuildKit. Forneca um arquivo de variaveis de uma base isolada com `--secret id=validation_env,src=<arquivo-local>` e escolha a imagem com `--build-arg RUNTIME_IMAGE=estoque-parte9-prod-local`. O arquivo deve apontar para `estoque_*_validation`; nunca use a base normal nem versione as credenciais.
