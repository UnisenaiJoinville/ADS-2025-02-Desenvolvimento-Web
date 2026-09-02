# Atividades parciais do Cenário 2 (seção 7.4 do material)

## Teórica — Diferença entre `ports` e `expose` no Compose

`ports` **publica** a porta do container em uma porta do host, tornando o serviço acessível de fora da máquina Docker (do navegador, de outra aplicação, de outro computador na mesma rede). `expose` apenas declara, de forma documental, que aquela porta existe e é usada por outros containers **dentro da mesma rede do Compose** — ela nunca fica acessível pelo `localhost` do host.

Exemplo direto deste próprio cenário: o serviço `proxy` (Nginx) usa `ports: ["8080:80"]`, porque ele é o único ponto de entrada que precisa ser alcançado pelo navegador do desenvolvedor. Já os serviços `frontend` e `api` usam `expose: ["5173"]` e `expose: ["3000"]` — eles continuam acessíveis para o `proxy` (que fala com eles pelo nome do serviço, `frontend:5173` e `api:3000`, ver `nginx/default.conf`), mas não aparecem publicados no host. Isso reflete a topologia real do cenário: só o proxy é "de fora"; frontend e api são detalhe de implementação por trás dele.

## Prática — Subir o Cenário 2 e acessar via `http://localhost:8080`

Automatizado por `./coletar-evidencias.sh`. O script sobe `docker compose up -d --build`, espera os healthchecks, e testa `GET http://localhost:8080/` (frontend, via proxy) e `GET http://localhost:8080/api/health` e `/api/status` (API, via proxy), gravando os códigos de resposta HTTP e o corpo em `EVIDENCIAS.md`.

## Prática — Subir ferramentas com `docker compose --profile tools up -d`

Também automatizado por `coletar-evidencias.sh`: como `pgadmin` está marcado com `profiles: ["tools"]` no `docker-compose.yml`, ele **não sobe** com um `docker compose up -d` normal — só sobe quando o profile é explicitamente ativado (`--profile tools`), evitando que uma ferramenta de inspeção opcional consuma recursos no dia a dia. O script roda esse comando e confirma que `http://localhost:5050` responde.

## Análise — Por que o PostgreSQL não precisa publicar porta para o host quando só a API acessa o banco?

Publicar uma porta (`ports:`) existe para permitir que algo **fora** da rede do Compose alcance o serviço — normalmente, uma ferramenta rodando diretamente no host (o navegador, um cliente de banco como o DBeaver citado no Módulo 0, um script local). Neste cenário, o único consumidor do PostgreSQL é a própria API (`api`), que já está dentro da mesma rede `app_net` e já enxerga o banco pelo nome do serviço (`postgres:5432`, resolvido pelo DNS interno do Compose) — não há necessidade de expor a porta 5432 no host para isso funcionar. Deixar de publicar essa porta é, além de desnecessário, uma prática de segurança melhor: reduz a superfície de ataque (ninguém de fora consegue tentar se conectar diretamente no banco, nem por engano nem propositalmente) e documenta, só pela ausência do `ports:`, que aquele banco é um detalhe interno da arquitetura, não uma interface pública. Se for necessário inspecionar o banco manualmente durante o desenvolvimento, a ferramenta certa é subir o `pgadmin` (que já está na mesma rede) em vez de publicar a porta do Postgres — exatamente a solução adotada na atividade prática anterior.
