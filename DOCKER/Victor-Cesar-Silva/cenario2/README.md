# Cenário 2 — React + Postgres + Nginx

**Aluno:** Victor Cesar Silva

Demonstra a diferença entre `ports` e `expose`, o uso de profiles e por que um banco não
precisa publicar porta no host.

## Serviços

| Serviço | Imagem / build | Porta no host | Papel |
|---|---|---|---|
| `nginx` | `nginx:1.27-alpine` | 8082 → 80 | proxy reverso, única entrada |
| `app` | React + Vite (multi-stage) | — (`expose: 80`) | aplicação |
| `postgres` | `postgres:16-alpine` | — | banco, volume `postgres_data` |
| `pgadmin` | `dpage/pgadmin4:8.14` | 5050 | **profile `tools`** |

> O Nginx é publicado em **8082** porque a 8080 estava ocupada na máquina. Dentro da rede
> Docker ele continua ouvindo na 80.

## Como rodar

```bash
cp .env.example .env               # Copy-Item no PowerShell
docker compose up -d --build       # sem o PgAdmin
curl http://localhost:8082         # HTTP 200
```

Com as ferramentas de apoio:

```bash
docker compose --profile tools up -d
# PgAdmin em http://localhost:5050 (login pelo .env)
```

O `pgadmin` tem `profiles: [tools]`, então **não sobe** no `up` comum. Quem só quer rodar
a aplicação não carrega a ferramenta junto.

Dentro do PgAdmin, o host do banco é **`postgres`** (nome do serviço), não `localhost` —
o PgAdmin também roda em container.

## `ports` vs. `expose`

```yaml
nginx:
  ports:
    - "8082:80"    # publica no host: o navegador entra por aqui
app:
  expose:
    - "80"         # só documenta; ninguém de fora alcança
```

No `docker compose ps` a diferença aparece: o `nginx` mostra `0.0.0.0:8082->80/tcp` e o
`app` mostra apenas `80/tcp`. Mesmo assim o Nginx alcança o app com
`proxy_pass http://app:80`, porque estão na mesma rede `web_net`.

O Postgres não publica porta porque ninguém fora da rede precisa dele — e publicar
aumentaria a superfície de ataque e criaria conflito com outros projetos.

## Troubleshooting

**`port is already allocated`** — mude o lado esquerdo do mapeamento (`"8083:80"`).
Descubra o ocupante com `netstat -ano | findstr :8082` ou `sudo lsof -i :8082`.

**PgAdmin não sobe** — ele está no profile `tools`. Use `docker compose --profile tools up -d`.

**PgAdmin não conecta no banco** — o host é `postgres`, não `localhost`.

**502 Bad Gateway no Nginx** — o `app` ainda está iniciando ou caiu. Verifique com
`docker compose ps` e `docker compose logs app`.

**Alteração no código não aparece** — a imagem usa multi-stage build; rode
`docker compose up -d --build`.
