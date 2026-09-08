# Atividade 16: Parando serviços com Docker Compose

## Objetivo
Derrubar os serviços subidos pelo Compose e confirmar a remoção.

## Comandos executados
```bash
docker compose up -d
docker compose down
docker ps -a
```

## O que foi observado / evidenciado
`docker compose down` para **e remove** containers, redes e (com `-v`) volumes criados pelo `up`. Diferente de `docker compose stop`, que só pausa sem remover.

## Arquivos desta pasta
- `docker-compose.yml`: mesmo arquivo da Atividade 15, para a pasta ser autocontida.
