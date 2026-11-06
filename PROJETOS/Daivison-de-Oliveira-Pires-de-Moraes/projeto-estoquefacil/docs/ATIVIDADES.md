# Cobertura da apostila e das atividades

A pasta `apostila-passo-a-passo` contém a versão completa enviada: aulas 00–69 e README, total de 71 Markdown. Os textos da apostila foram preservados como referência; as decisões finais desta revisão estão neste documento. As diferenças entre exercícios de etapas intermediárias e aulas posteriores seguem a versão mais recente.

| Aulas | Entrega no projeto |
|---|---|
| 00–10 | Estrutura, ambiente, Express, erros, MySQL, Docker, inicialização e documentação local |
| 11–14 | CRUD, validação, transações, concorrência e agregações do dashboard |
| 15–21 | Interface, filtros, estados vazios, tratamento de falhas e procedimentos de execução |
| 22 | Fornecedor, ordenação segura, preço médio, confirmação, ativos/inativos, paginação, ajuste, período, autenticação, CSV, testes e gráfico |
| 23–27 | Hash, JWT, cadastro/login, token e rotas protegidas |
| 28 | Laboratório em `public/vue-lab.html` |
| 29–31 | Cadastro/login Vue, sessão, menu e proteção das telas |
| 32 | Senha de 8 caracteres, nome de 60, sem atalho demo, cadastro com entrada direta, último acesso, perfil, troca de senha, responsável, papéis, refresh, bloqueio e reset local |
| 33–39 | Laboratórios SQL, dados de exemplo, filtros, JOINs, agrupamentos, responsáveis e ranking |
| 40–44 | Estoque, períodos, Vue, integração, paginação, ordenação e CSV completo |
| 45 | Consultas resolvidas, produtos parados, giro por categoria, CSV por usuário, faixa de preço, conversão consistente, ABC acumulada, comparação, ruptura, EXPLAIN e cache |
| 46–59 | Adaptadas à execução local: imagem com usuário sem privilégios, portas locais, segredos gerados, perfil prod local, backup/restauração e script de disco |
| 60–61 | Lucide, mostrar senha, Caps Lock, menu acessível e Axios com interceptadores; bibliotecas locais |
| 62–64 | Busca por relevância, escape de LIKE, autocomplete, teclado, debounce, cancelamento, paginação e URL |
| 65–66 | FK RESTRICT, 409 com inativação, confirmação, foco, carregamento, bloqueio de duplo envio, rótulos e skeleton |
| 67–69 | Limites de login/cadastro/reset, gráfico diário, Tailwind compilado, ícones nos cards, paginação compartilhada, PATCH active, filtro de inativos, URL, picker reutilizado, tentativas restantes, foco preso e tema escuro |

## Atividades de hospedagem

Não foram contratados servidores, cadastrados domínios, alterados SSH/UFW/Fail2ban/cron, criadas contas externas nem publicados serviços. Essas operações exigem infraestrutura que não faz parte desta execução local. As atividades de backup externo, monitoramento por e-mail e deploy por Git ficam documentadas como procedimentos, não como serviços configurados. A atividade 59.1 referencia dois arquivos externos de diagnóstico que não constavam em nenhum dos ZIPs; não foram inventadas respostas a esses arquivos ausentes.

O equivalente local de cadastro aberto/fechado usa `REGISTRATION_OPEN`, sem Caddy. `helmet` aplica cabeçalhos à API. Backup, ensaio de restauração e alarme de disco têm scripts prontos para execução voluntária.

## Exercícios que evoluíram ao longo do roteiro

- **22.2.1 versus aula 65:** o DELETE final apaga apenas produtos sem histórico. Produtos com histórico retornam 409 e a interface oferece inativação via PATCH. O histórico é preservado pelo próprio banco.
- **22.2.2 versus aula 64:** o contrato final é `{ pagination, rows }`; a API também aceita `perPage` como alias de `pageSize`.
- **32.1.1:** o ensaio de token expirado é automatizado com JWT expirado; a entrega usa 15 minutos e refresh de 7 dias, conforme o desafio posterior.
- **33 e 38:** mantivemos os exemplos de estoque, mas sem contas de demonstração. Histórico antigo fica como “Não informado”; operações novas registram a conta autenticada. As contagens exatas de autores da apostila deixam de se aplicar.
- **65 / arquivos de criação:** tanto `database/init.sql` quanto `database/producao/001-schema.sql` têm o esquema final completo, com a FK RESTRICT.
- **69 / CDN:** as bibliotecas foram mantidas localmente, com versões registradas no lockfile e licenças junto aos arquivos estáticos.

As respostas de compreensão e diagnóstico estão em `DECISOES.md`; as consultas solicitadas em `database/queries/atividades-resolvidas.sql`.
