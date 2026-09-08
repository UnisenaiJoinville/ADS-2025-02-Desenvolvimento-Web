# 23 - Atividade — P6: profile `tools`

O cenário 2 possui PgAdmin como ferramenta opcional. Compare os dois momentos:

```bash
docker compose up -d --build
docker compose ps
```

Nesse primeiro `ps`, o PgAdmin não deve aparecer. Depois:

```bash
docker compose --profile tools up -d pgadmin
docker compose ps
```

Agora ele deve estar ativo na porta `5050`. Isso comprova que o profile permite incluir um serviço somente quando ele for solicitado.
