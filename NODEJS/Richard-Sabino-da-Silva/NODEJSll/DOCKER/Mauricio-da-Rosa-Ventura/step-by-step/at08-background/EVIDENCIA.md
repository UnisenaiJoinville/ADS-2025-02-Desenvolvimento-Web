# Evidencia de execucao - Atividade 08: Criando um container em segundo plano

Gerado em: 2026-08-28 14:22:50 -0300

## Comandos e saída

```
$ docker run -d --name at08-nginx nginx
Unable to find image 'nginx:latest' locally
latest: Pulling from library/nginx
6310eb16bf42: Pulling fs layer
0a35a4e59186: Pulling fs layer
30576ad53d33: Pulling fs layer
b8f66660faa6: Pulling fs layer
657dd7fba849: Pulling fs layer
c90544874aaf: Pulling fs layer
8f655e1bd5c1: Pulling fs layer
0a35a4e59186: Download complete
b8f66660faa6: Download complete
657dd7fba849: Download complete
c90544874aaf: Download complete
8f655e1bd5c1: Download complete
1cf64d45fa0f: Download complete
e0649adc94d9: Download complete
6310eb16bf42: Download complete
30576ad53d33: Download complete
6310eb16bf42: Pull complete
30576ad53d33: Pull complete
b8f66660faa6: Pull complete
657dd7fba849: Pull complete
c90544874aaf: Pull complete
8f655e1bd5c1: Pull complete
0a35a4e59186: Pull complete
Digest: sha256:b34848eff6db786b6b1282d3a9c3fd0b5563dfb6d261df4923378b419e0d24f0
Status: Downloaded newer image for nginx:latest
1db462215a9a9c25aa92ab6badc45b3283951cedcccac0bee91e8a29756b2383

$ docker ps --filter name=at08-nginx
CONTAINER ID   IMAGE     COMMAND                  CREATED         STATUS        PORTS     NAMES
1db462215a9a   nginx     "/docker-entrypoint.…"   2 seconds ago   Up 1 second   80/tcp    at08-nginx

```

