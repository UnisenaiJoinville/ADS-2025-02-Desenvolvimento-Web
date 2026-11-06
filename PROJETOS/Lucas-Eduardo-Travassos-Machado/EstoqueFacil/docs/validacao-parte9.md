# Validacao da Parte 9

Entrega executada em 05/11/2026 (America/Sao_Paulo; arquivos de evidencia usam UTC, 06/11). Somente a aplicacao de Lucas foi alterada.

## Execucoes

- API: 105 verificacoes de relatorios e 123 da Parte 9 em cada um dos schemas novo e migrado: **456 aprovadas**. Inclui autenticacao, CRUD, transacoes concorrentes, registros sem categoria/responsavel, filtros, totais e ambos os CSVs com mais de 200 linhas.
- Banco: MySQL 8.0.46 em Docker. Inicializacao nova, migracoes 002–004, reaplicacao 002, rollback 004 sem perda de dados, rollbacks 003/002 e reaplicacao. Contagens anteriores 7 produtos/12 movimentos/4 categorias/1 usuario; atualizadas 12/24/5/2.
- Chrome: **11 cenarios aprovados**, com teclado, mouse, rede controlada, respostas fora de ordem, desktop e 390px. A rodada final usou cache dos mesmos scripts oficiais apos falhas de DNS dos CDNs; uma rodada anterior de dez cenarios passou usando os CDNs diretamente. Os testes de indisponibilidade bloqueiam os scripts mesmo com cache. Nao ha mocks de Axios, Vue, Lucide ou Chart.js.
- Docker: builds de desenvolvimento e producao, npm ci e CSS compilado aprovados. Smoke tests via BuildKit em ambas as imagens, com Node 22.23.4 e MySQL real, verificaram HTTP, CSS, JWT, dashboard, serie diaria, busca, paginacao e CSV. Producao roda como usuario node e instala somente dependencies.
- Lighthouse: **100 em Accessibility**, tela autenticada de Produtos, Lighthouse 13.6.0, 2026-11-06T00:53:15.119Z. Relatorios HTML/JSON em .validation.
- Sintaxe: 63 arquivos JavaScript conferidos; diff sem erros de whitespace. npm audit durante as instalacoes/builds nao apontou vulnerabilidades.

## Limites reais do ambiente

O Docker Desktop respondeu a consultas e execucoes nos containers existentes, mas deixou novos containers no estado Created, inclusive uma imagem Node sem volumes e sem rede. O Compose isolado nao iniciou. Nao foi reiniciado o Docker Desktop e nao foram parados os servicos anteriores. As suites usaram bancos exclusivos estoque_partnine_final_*_validation no MySQL existente; a API do navegador rodou no host, em 3019. Os smoke tests executaram a API dentro do Docker BuildKit; nao representam um Compose completo em execucao nem publicacao do sistema.

A base normal e seu volume foram preservados. Nenhuma migracao foi aplicada a ela. Para atualizar uma instalacao existente, siga o README e aplique a 004 depois de conferir o schema e ter backup.

Houve falhas intermitentes ERR_NAME_NOT_RESOLVED em cdn.jsdelivr.net e unpkg.com. O cache opcional de testes preserva os bytes baixados das URLs usadas pelo aplicativo, sem mudar o codigo de producao. Os avisos de Browserslist desatualizado na compilacao nao impediram o build. Nao ha medicao de acessibilidade anterior a aula 66 para comparacao.

## As 32 verificacoes da aula 69

| # | Verificacao | Resultado | Evidencia |
|---|---|---|---|
| 1 | Olho na senha | Aprovado | Login e cadastro; alternancias repetidas, rotulo e Enter; um SVG por botao. |
| 2 | Caps Lock | Aprovado | Eventos de teclado com modificador ligado/desligado mostram e removem o aviso. |
| 3 | Menu | Aprovado | Cinco icones, pagina atual com aria-current e navegacao entre telas. |
| 4 | Lucide indisponivel | Aprovado | URL bloqueada no Chrome; senha continua alternando, sem excecao JavaScript. |
| 5 | Senha incorreta | Aprovado | Mensagem da API, sem navegacao/reload. |
| 6 | Erro 404 no Axios | Aprovado | Error com mensagem Produto nao encontrado e status 404. |
| 7 | Token nas requisicoes | Aprovado | Authorization observado em requisicao de relatorios no navegador. |
| 8 | CSV de relatorios | Aprovado | Dois downloads no Chrome; API confere 204 produtos e 206 movimentacoes, BOM, aspas e lotes. |
| 9 | Busca rapida | Aprovado | Ativos, limites, SKU exato, inicio do nome, texto literal e parametros invalidos. |
| 10 | Autocomplete | Aprovado | Nome/SKU, destaque escapado, saldo e ausencia de HTML executavel. |
| 11 | Setas e Enter | Aprovado | Selecao atualiza ID e saldo sem enviar; mouse, limpeza, Tab e Esc conferidos. |
| 12 | Cancelamento em rede lenta | Aprovado | CDP: latencia 600 ms e limite de transferencia; requestfailed registra ERR_ABORTED. Resposta antiga atrasada nao substitui a nova. |
| 13 | Saida acima do saldo | Aprovado | Aviso e bloqueio no formulario; API recusa e preserva saldo. |
| 14 | Envelope e paginas distintas | Aprovado | rows/pagination, contagem filtrada, pagina distante vazia e desempate por ID. |
| 15 | Busca ao vivo | Aprovado | Uma requisicao apos a pausa; primeira carga separada da medicao. |
| 16 | Anterior/proxima | Aprovado | Navegacao e botoes desabilitados nas pontas. |
| 17 | Exclusao na ultima pagina | Aprovado | Onze produtos filtrados: excluido o unico da segunda pagina, retorna a 1/1. |
| 18 | DELETE direto no MySQL | Aprovado | Erro 1451 para produto com historico; conferido na suite isolada. |
| 19 | Oferta de inativacao | Aprovado | 409 abre segundo dialogo; inativacao muda status e preserva historico. |
| 20 | Produto inativo | Aprovado | Fora do autocomplete; entradas e saidas recusadas dentro da transacao. |
| 21 | Confirmacao propria | Aprovado | Nenhum window.confirm; Cancelar inicial, Esc, fundo e restauracao de foco. |
| 22 | Tres envios rapidos | Aprovado | Tres requestSubmit consecutivos geram um POST de movimentacao; produto/categoria tambem nao duplicam. |
| 23 | Clique no SVG de editar | Aprovado | Edicao de produtos e categorias funciona clicando no icone. |
| 24 | Rotulo Preco de venda | Aprovado | Clique no texto foca o input correto. |
| 25 | Esc e foco no modal | Aprovado | Fecha produto e devolve foco ao botao de edicao. |
| 26 | Cinco falhas e sexta tentativa | Aprovado | Suite API: cinco 401 e depois 429; logins corretos anteriores nao consomem tentativas. |
| 27 | Senha correta bloqueada | Aprovado | 429 durante a janela; X-Forwarded-For nao contorna o acesso local direto. |
| 28 | Mensagem de bloqueio na tela | Aprovado | Faixa de erro em portugues, sem recarregar login. |
| 29 | Grafico 7/30/90 | Aprovado | Quantidade exata de dias, zeros, fronteiras de meia-noite, strings de data, instancia unica e resumo. Chart.js bloqueado nao interrompe cards. |
| 30 | Sem aviso Tailwind CDN | Aprovado | CDN removido dos oito HTMLs; console conferido nas telas internas. |
| 31 | Telas com CSS compilado | Aprovado | Login, cadastro e cinco telas internas; modais, autocomplete, abas e celular 390px sem transbordamento. Vue-lab tambem aponta para o CSS local. |
| 32 | Lighthouse Accessibility | Aprovado | Produtos: 100, Lighthouse 13.6.0. A primeira medicao foi 96; contraste corrigido e medicao repetida. |

Os roteiros reproduziveis estao em tests/part9.integration.mjs, tests/reports.integration.mjs, tests/database-validation.mjs e tests/part9.browser.spec.mjs. Capturas de celular, traces de falhas e relatorios gerados permanecem fora do Git em .validation/ e test-results/.
