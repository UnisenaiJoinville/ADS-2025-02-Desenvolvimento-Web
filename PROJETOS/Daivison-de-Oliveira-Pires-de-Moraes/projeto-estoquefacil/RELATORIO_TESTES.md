# Relatório de revisão e testes — 05/11/2026

## Resultado

**30 testes unitários + 17 cenários de integração + 15 cenários de interface aprovados (62 verificações/cenários).** O executor de integração conta também o teste agrupador e, por isso, apresenta 18 testes no total. Não houve falhas nem testes ignorados na execução final.

| Verificação | Resultado |
|---|---|
| Build de CSS e bibliotecas locais | Aprovado |
| Sintaxe de JavaScript e ausência de conflitos de merge no código | Aprovado |
| Validação de produtos, movimentações, cadastro, datas, booleanos, paginação e CSV | 30 testes unitários aprovados, incluindo setup com segredos aleatórios |
| API HTTP com MySQL real | 17 cenários aprovados |
| Interface com Chromium/Playwright | 15 cenários aprovados, sem erros JavaScript de página |
| Criação do banco a partir de `init.sql` | Aprovada, repetida em bancos descartáveis |
| Schema vazio de produção local | Aprovado; sem produtos nem usuários de demonstração |
| Migrações 004/005 sobre o banco legado | Aprovadas; fornecedor, papel ADMIN e FK de preservação conferidos |
| Consultas de atividades e EXPLAIN | Executadas sem erros no MySQL |
| Telas em 1440 × 1000 e 390 × 844 | Verificadas no navegador; tabelas possuem áreas próprias de rolagem |
| Tema escuro | Persistência testada e aparência inspecionada |
| Auditoria `npm audit` | 0 vulnerabilidades conhecidas retornadas, incluindo dependências de desenvolvimento, na execução desta data |
| Compose e scripts operacionais | YAML lido/validado e scripts Bash com sintaxe conferida |

## Ambiente real utilizado

- Node.js **24.22.1**.
- MySQL **8.0.46** — não foi substituído por um banco simulado.
- Playwright **1.56.1**, com Chromium **141.0.7390.37**.
- Execução local Linux; banco e processos descartáveis de teste.

## Cenários de integração

1. Health público, proteção da API, JSON inválido e cabeçalhos HTTP.
2. Cadastro inicial ADMIN, conta seguinte OPERATOR, normalização e hash sem exposição de senha.
3. Login, último acesso, perfil, JWT adulterado e expirado.
4. CRUD de categorias, duplicidade e bloqueio de exclusão por operador.
5. Produto com fornecedor, filtros, ordenação permitida, limite de página e dados inválidos.
6. Busca por SKU e tratamento literal de `%`, `_` e `!`.
7. **Duas saídas de 7 unidades simultâneas sobre saldo 10: uma aceita, outra recusada; saldo final 3 e apenas uma movimentação.**
8. Ajuste para zero, observação obrigatória, entrada, inativação e recusa de movimentar inativo.
9. Edição não sobrescrevendo saldo, exclusão com histórico recusada na API e pela FK, exclusão de produto sem histórico.
10. Períodos, datas impossíveis, último dia incluído e diferença de ajuste no relatório.
11. Todos os relatórios, categoria vazia, produto sem categoria, preços, ABC acumulada e gráfico de 7/30/90 dias.
12. Invalidação do cache depois de movimentação e remoção de categoria mantendo produto.
13. **CSV com 225 linhas de dados**, sem corte em 200, com fórmulas neutralizadas.
14. Perfil pelo id autenticado, refresh rotativo, troca de senha e revogação de tokens.
15. Reset local com link consumido uma única vez e revogação da sessão anterior.
16. Schema vazio, migrações de banco legado e consultas SQL das atividades.
17. Cinco falhas de login com 401; sexta tentativa com 429, inclusive com senha correta durante o bloqueio; cabeçalho de tentativas.

## Cenários de interface

Redirecionamento sem sessão; senha visível e erro sem recarregar; cadastro com entrada direta; dashboard e troca de período do gráfico; produto com fornecedor e foco preso no modal; edição clicando no SVG; paginação preservada na URL e após F5; autocomplete com teclado e recusa antecipada de saída; ajuste de inventário; confirmação/inativação preservando histórico; CRUD de categorias; relatórios Vue com picker compartilhado; download CSV; comparação de meses; tema persistente, telas pequenas e laboratório Vue; edição de perfil e logout. Alguns destes passos são agrupados nos 15 cenários automatizados.

## Correções encontradas na revisão

- Conflitos de merge que impediam o carregamento das rotas e a criação do banco.
- Ausência das melhorias finais da apostila e das atividades complementares.
- Exportação dos relatórios limitada indevidamente a 200 linhas.
- Exclusão que podia apagar o histórico por CASCADE.
- Edição de produto capaz de sobrescrever saldo fora da transação de movimentação.
- Conversões permissivas de booleanos/números e limite de senha medido em caracteres em vez de bytes.
- Falta de validação de filtros, paginação comum, busca literal e tratamento de erros de integridade concorrentes.
- Dependência de CDN durante o uso e ausência de CSS compilado.
- Contraste de alertas e dos rótulos do gráfico no tema escuro.

## Limites desta validação

Não havia um Docker Engine utilizável neste ambiente. **As imagens/containers e os scripts que chamam Docker não foram executados aqui**; os testes completos da aplicação ocorreram diretamente com Node, MySQL 8 e navegador reais. Os arquivos de construção, configuração e scripts estão incluídos para execução local e o teste Docker pode ser repetido pelos comandos de `COMO_EXECUTAR.md`.

O iniciador `.bat` foi preparado para Windows, mas não houve execução nativa em Windows. Não foi levantada nota Lighthouse. Não foram feitos testes de carga ou configuração de VPS, DNS, HTTPS, SSH, monitoramento externo ou agendamento no computador do usuário; a entrega foi adaptada para localhost, conforme solicitado.

## Reproduzir

Veja `COMO_EXECUTAR.md`. Com dependências instaladas e o MySQL de teste iniciado:

```bash
npm run build
npm run check
npm test
npm run test:integration
npm run test:ui
npm audit
```

Os bancos usados pelos testes terminam em `_test` e são separados do banco de trabalho. Os testes não devem receber credenciais de um ambiente real de uso.
