# Evidencia de execucao - Atividade 09: Expondo portas

Gerado em: 2026-08-28 14:23:07 -0300

## Comandos e saída

```
$ docker run -d --name at09-nginx -p 8080:80 nginx
0bbac71178bd58d2c4ee434d96908a8df07c280197cbacd77fc3b354474df2fb

$ sleep 1

$ curl -sS -o /dev/null -w 'HTTP %{http_code}\n' http://localhost:8080
HTTP 200

$ curl -sS http://localhost:8080 | head -5
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>

```

