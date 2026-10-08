# Evidencias - Cenario 2 (React + Postgres + Nginx)

## docker compose --profile tools up -d
```
SERVICE    STATUS                        PORTS
app        Up About a minute             80/tcp
nginx      Up About a minute             0.0.0.0:8082->80/tcp, [::]:8082->80/tcp
pgadmin    Up About a minute             0.0.0.0:5050->80/tcp, [::]:5050->80/tcp
postgres   Up About a minute (healthy)   5432/tcp
```

## Acesso via Nginx (porta 8082 - 8080 estava ocupada na maquina)
```
$ curl -o /dev/null -w 'HTTP %{http_code}' http://localhost:8082
HTTP 200
$ curl -o /dev/null -w 'HTTP %{http_code}' http://localhost:5050   # PgAdmin
HTTP 302
```

## Postgres NAO publica porta: inacessivel do host, acessivel na rede interna
```
172.28.0.3        postgres  postgres
172.28.0.2        app  app
```
