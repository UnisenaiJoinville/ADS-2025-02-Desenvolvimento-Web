# Respostas e decisões dos exercícios

## Arquitetura, estoque e SQL (aula 22)

Uma requisição percorre rotas → controller → service → repository. O controller lida com HTTP; o service coordena validação/regras; o repository executa SQL parametrizado. O banco persiste os dados no volume Docker. `RUN` constrói a imagem e `CMD` inicia o processo do container.

Uma movimentação grava histórico e saldo na mesma transação. `SELECT ... FOR UPDATE` serializa alterações do mesmo produto; uma saída sem saldo desfaz tudo. A quantidade inicial pode ser cadastrada sem movimento, como nos exemplos da apostila; o histórico posterior não deve ser apagado para justificar uma edição de saldo. Por isso a revisão exige ADJUST para alterar saldo de um produto existente.

Em ADJUST, `quantity` é o valor contado, não uma entrada/saída. Guardamos `previous_quantity` e `resulting_quantity`. A diferença permite auditar o impacto sem confundir uma contagem de 37 unidades com a chegada de 37 mercadorias. Uma observação é obrigatória. O estoque zero é permitido no ajuste.

Valores SQL usam `?`. Identificadores de ordenação usam uma lista branca, porque parâmetros não representam nomes de colunas. `escapeHtml` protege a construção da interface; ele não substitui parâmetros SQL. CSV escapa aspas/separadores/quebras e neutraliza textos que seriam fórmulas.

O diagnóstico da aula 22 aponta: `var`, comparação com coerção, SQL concatenado, controller acessando pool, status sempre 200, respostas inconsistentes, ausência de asyncHandler, preço sem validação, nome sem limite/trim, nomes misturados e duplicidade sem tratamento. A correção está distribuída entre validators, services, repositories e middleware de erro; não há SQL no controller.

## Autenticação e armazenamento (aula 32)

O mínimo de senha e o limite de nome são validados no servidor e refletidos nos formulários. A confirmação também é exigida na API. Bcrypt é assíncrono e o limite de 72 é medido em bytes UTF-8. O login conserva uma mensagem única para e-mail/senha inválidos.

O id do perfil e o responsável por movimentações vêm da autenticação. Aceitar id arbitrário permitiria alterar outra conta ou atribuir operações a terceiros. ADMIN/OPERATOR também vem do banco, não do corpo. O token traz o papel, mas o middleware consulta o usuário atual para aplicar alterações de papel/desativação sem esperar o token expirar.

Um access token curto limita o tempo útil de uma cópia roubada. O refresh token pode durar mais e fica revogável/rotativo no banco. Sua troca invalida o anterior. A senha tem uma versão de sessão: ao mudar, JWTs e refresh tokens antigos deixam de funcionar. Logout revoga a renovação informada e limpa o navegador, mas não invalida por si só uma cópia já extraída do JWT de acesso.

Falhas por IP ficam em memória e zeram ao reiniciar; falhas por conta ficam no MySQL. Os dois controles reduzem ataques distribuídos. Contas inexistentes são limitadas por IP sem criar registros de e-mails arbitrários. Um link de reset precisa expirar e ser consumido uma única vez para não continuar funcionando depois de uma troca legítima de senha.

### localStorage versus cookie httpOnly

O localStorage simplifica a aula: o JavaScript guarda e lê o token e o envia explicitamente em Authorization. O navegador não o envia automaticamente a qualquer pedido, o que reduz o cenário clássico de CSRF baseado em cookies. Entretanto, qualquer script que execute na origem consegue ler os valores: uma falha XSS pode roubar access e refresh tokens. Não se deve tratar o conteúdo do localStorage como prova de identidade; o servidor precisa conferir a assinatura e a conta.

Um cookie httpOnly não pode ser lido diretamente pelo JavaScript e dificulta a extração do token por XSS. Ainda assim, um script malicioso pode fazer ações usando uma sessão aberta. Cookies são enviados automaticamente conforme domínio/caminho/SameSite, o que exige atenção a CSRF. Uma implementação completa precisa definir SameSite, Secure, expiração, escopo e política de origem, além de usar HTTPS quando publicada. O atributo httpOnly resolve a leitura do cookie, não todo o problema de XSS ou autorização.

Mantivemos localStorage por coerência com o exercício e com a aplicação local. Uma publicação real exigiria reavaliar esse transporte, a recuperação por e-mail e o modelo de renovação. A CSP permite `unsafe-eval` porque a versão global do Vue compila os templates no navegador; os scripts são locais e não foi liberado `unsafe-inline` para scripts.

O diagnóstico da aula 32 identifica: service recebendo HTTP, SQL interpolado, SELECT de senha sem controle de saída, enumeração de contas, comparação direta de senha/hash, hash dentro do JWT, segredo fixo, ausência de expiração, retorno do usuário completo, bcrypt síncrono. Extras: sem validação/normalização, duplicidade sem 409 e criação com status errado. A implementação usa lista de campos públicos, bcrypt.compare, segredo do ambiente e 201 no cadastro.

## Relatórios (aula 45)

As cinco consultas do nível 1 estão no laboratório SQL de atividades resolvidas. Produtos parados já tiveram movimento e o último ocorreu há mais de 90 dias; os nunca movimentados têm relatório próprio. Isso separa ausência de atividade de abandono posterior.

No giro por categoria, o filtro de período fica no ON do LEFT JOIN. Colocá-lo no WHERE descartaria as categorias sem movimentação. A linha “Sem categoria” é incluída separadamente. O período usa limite inferior inclusivo e limite superior exclusivo do dia seguinte, sem aplicar DATE à coluna indexada.

A curva ABC usa funções de janela para manter cada produto e calcular o acumulado. GROUP BY, sozinho, colapsaria as linhas. Classificamos pelo acumulado anterior ao produto: quem cruza a fronteira de 80% ainda pertence ao grupo A e quem cruza 95% ao B. Itens de valor zero são C. O relatório também expõe acumulado e participação.

Na comparação de períodos, base zero e destino zero resulta em 0%; base zero e destino positivo resulta em `null`, pois a variação percentual não é definida. Na ruptura, produtos sem saída em 60 dias recebem estimativa `null`, evitando divisão por zero. Não é previsão garantida: depende de manter o ritmo de saída.

O cache do resumo dura no máximo 60 segundos e é invalidado por respostas bem-sucedidas de escrita na aplicação. Captura a versão anterior à consulta para não publicar um cache novo com uma versão mais recente que seus dados. Alterações diretas no banco, fora da API, podem aguardar o TTL. A aplicação local utiliza um processo; vários processos precisariam de invalidação compartilhada.

EXPLAIN: `DATE(created_at)=...` tende a impedir a busca por faixa; `created_at >= ... AND created_at < ...` pode utilizar `idx_movements_created_at` ou `idx_movements_date_type`. A escolha final depende da seletividade: em uma tabela pequena, o otimizador pode preferir uma varredura. Não se deve afirmar que um índice sempre será escolhido.

O diagnóstico da aula 45 cobre HTTP no repository, SQL concatenado, ORDER BY sem lista branca, SELECT *, INNER eliminando sem categoria, filtros obrigatórios indevidos, COUNT(*) contando a linha vazia, WHERE anulando LEFT JOIN, SUM sem COALESCE e datas não indexáveis/perdendo o último dia. As consultas entregues corrigem esses padrões.

## Operação local (aula 59)

`ports` publica no host; `expose` descreve acesso interno sem publicar uma porta. Regras UFW podem não filtrar o caminho usado pelas regras de publicação Docker; por isso não publicamos o banco em interfaces públicas. O `.env` é gerado na máquina para evitar transportar senhas em um pacote. A regra 3-2-1 significa três cópias, dois tipos de mídia e uma fora da máquina; o script cria a cópia local, e a transferência externa continua sendo responsabilidade de uma configuração posterior.

SSH, segundo usuário, Fail2ban, domínio, monitoramento externo e deploy por Git não foram configurados: não existe VPS nesta entrega. Scripts de restauração usam banco separado. O teste de desastre só deve ocorrer em dados descartáveis. O alarme de disco escreve no log; o agendamento é opcional e não foi instalado no computador do usuário.

## Melhorias de interface (aula 69)

Debounce reduz quantas buscas começam; cancelamento interrompe uma busca antiga e a verificação de sequência evita aplicar respostas fora de ordem. `/search` precede `/:id` para não ser interpretado como id. CASCADE apaga dependentes; SET NULL preserva produto sem categoria ou movimento sem autor; RESTRICT impede apagar produto com histórico.

`trust proxy` deve ser falso no acesso local direto: confiar em cabeçalhos enviados pelo cliente permitiria falsificar IP. Atrás de um proxy corretamente isolado, precisa identificar quantos proxies confiáveis existem. Datas diárias viajam como texto AAAA-MM-DD para não sofrer conversão de fuso no navegador.

O autocomplete é compartilhado entre Movimentações e Relatórios. O foco circula nos controles dos modais. A paginação usa history.replaceState para preservar filtros na atualização. O tema fica em um módulo próprio, porque não é estado de autenticação.
