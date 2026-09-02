# Evidencia de execucao - Atividade 15: Usando Docker Compose

Gerado em: 2026-08-28 14:23:33 -0300

## Comandos e saída

```
$ cat docker-compose.yml
services:
  web:
    image: nginx
    ports:
      - "8080:80"

$ docker compose up -d
 Network at15-compose_default Creating 
 Network at15-compose_default Creating 
 Network at15-compose_default Created 
 Network at15-compose_default Created 
 Container at15-compose-web-1 Creating 
 Container at15-compose-web-1 Created 
 Container at15-compose-web-1 Starting 
 Container at15-compose-web-1 Started 

$ sleep 1

$ curl -sS -o /dev/null -w 'HTTP %{http_code}\n' http://localhost:8080
HTTP 200

$ docker compose ps
NAME                 IMAGE     COMMAND                  SERVICE   CREATED         STATUS         PORTS
at15-compose-web-1   nginx     "/docker-entrypoint.…"   web       2 seconds ago   Up 2 seconds   0.0.0.0:8080->80/tcp, [::]:8080->80/tcp

$ docker compose down
 Container at15-compose-web-1 Stopping 
 Container at15-compose-web-1 Stopped 
 Container at15-compose-web-1 Removing 
 Container at15-compose-web-1 Removed 
 Network at15-compose_default Removing 
 Network at15-compose_default Removed 

```

