# Evidencia de execucao - Atividade 29: Configurando um proxy reverso

Gerado em: 2026-08-28 14:25:58 -0300

## Comandos e saída

```
$ docker network create rede-proxy
feba5c297fdfe586cb637b1a26fc0272d102479eff66618367ec8cba2e7aa9fd

$ docker run -d --network rede-proxy --name backend -v $(pwd)/app-content:/usr/share/nginx/html:ro nginx
2ea02b019794117ad967677c619c0d3ad26f391a9ec31197246893f5d1073675

$ docker run -d --network rede-proxy --name proxy -p 8081:80 -v $(pwd)/proxy.conf:/etc/nginx/conf.d/default.conf:ro nginx
791806d98261ee86c161a39d1cfcc851207cd64dd133d88f2ec285777ab155b2

$ sleep 1

$ curl -sS http://localhost:8081
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
html { color-scheme: light dark; }
body { width: 35em; margin: 0 auto;
font-family: Tahoma, Verdana, Arial, sans-serif; }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, nginx is successfully installed and working.
Further configuration is required for the web server, reverse proxy, 
API gateway, load balancer, content cache, or other features.</p>

<p>For online documentation and support please refer to
<a href="https://nginx.org/">nginx.org</a>.<br/>
To engage with the community please visit
<a href="https://community.nginx.org/">community.nginx.org</a>.<br/>
For enterprise grade support, professional services, additional 
security features and capabilities please refer to
<a href="https://f5.com/nginx">f5.com/nginx</a>.</p>

<p><em>Thank you for using nginx.</em></p>
</body>
</html>

```

