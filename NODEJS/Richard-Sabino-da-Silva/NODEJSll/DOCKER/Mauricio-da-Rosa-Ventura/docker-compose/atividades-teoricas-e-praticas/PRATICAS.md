# Atividades práticas (seção 10.2 do material de Docker e Docker Compose)

Como as práticas P1, P3, P5 e P6 já são cobertas pelas evidências dos próprios cenários (P1/P3/P5 no Cenário 1, P6 no Cenário 2) e P7 pelo Cenário 3, este documento só referencia onde cada uma foi feita, e cobre diretamente P2, P4 e P8, que são transversais aos três cenários.

| Nº | Atividade | Onde foi feita | Critério de aceite |
|---|---|---|---|
| P1 | Criar `.env.example` para o cenário 1 | [`../cenario-1-vue-node-mysql/.env.example`](../cenario-1-vue-node-mysql/.env.example) | Sem senhas reais (`troque-esta-senha`), nomes coerentes com as variáveis usadas no `docker-compose.yml`. |
| P2 | Executar `docker compose config` | Este documento, seção "P2" abaixo, e `verificar.sh` | Arquivo validado sem erro de sintaxe nos três cenários. |
| P3 | Subir cenário 1 e coletar logs | [`../cenario-1-vue-node-mysql/EVIDENCIAS.md`](../cenario-1-vue-node-mysql/EVIDENCIAS.md) (gerado por `coletar-evidencias.sh`) | Logs de api, mysql e rabbitmq apresentados. |
| P4 | Executar comando dentro da api | Este documento, seção "P4" abaixo, e `verificar.sh` | `docker compose exec api sh` (ou equivalente) executado com sucesso. |
| P5 | Simular perda de container sem perder volume | [`../cenario-1-vue-node-mysql/EVIDENCIAS.md`](../cenario-1-vue-node-mysql/EVIDENCIAS.md), seção 7 | Dados persistem após `docker compose down` + `up` (contagem de linhas do MySQL antes/depois). |
| P6 | Ativar profile tools no cenário 2 | [`../cenario-2-react-express-postgres/EVIDENCIAS.md`](../cenario-2-react-express-postgres/EVIDENCIAS.md), seção 4 | PgAdmin executando apenas quando `docker compose --profile tools up -d` é chamado. |
| P7 | Adicionar healthcheck em serviço escolhido | [`../cenario-3-consolidacao/docker-compose.yml`](../cenario-3-consolidacao/docker-compose.yml) (serviço `api`) | `docker compose ps` mostra status `healthy` — ver `EVIDENCIAS.md` do Cenário 3, seções 2 e 7. |
| P8 | Documentar troubleshooting | Seções "Diagnóstico e troubleshooting"/"Diagnóstico" dos READMEs dos 3 cenários | Cada README contém uma tabela com pelo menos três erros comuns e suas soluções. |

## P2 — `docker compose config`

`docker compose config` lê o `docker-compose.yml` (e o `.env`), resolve todas as variáveis de ambiente e imprime a configuração final já validada — se houvesse um erro de sintaxe YAML ou uma referência quebrada, o comando falharia aqui, antes mesmo de tentar subir qualquer container. Rodar isso nos três cenários antes de um `up` é uma forma rápida de pegar erros de configuração sem esperar o download de imagens. Automatizado em `verificar.sh` (roda os três cenários em sequência e grava a saída em `EVIDENCIAS.md`).

## P4 — Executar comando dentro da api

`docker compose exec api sh` abre um shell dentro do container `api` já em execução (mesma lógica da atividade 12 do `step-by-step-docker.md`, mas usando o vocabulário do Compose). Como este script roda sem interação humana ao vivo, a evidência gerada usa o equivalente não interativo `docker compose exec api sh -c "node -v && whoami && ls"`, no Cenário 1 — automatizado em `verificar.sh`.
