# Evidencia de execucao - Atividade 10: Usando volumes

Gerado em: 2026-08-28 14:23:12 -0300

## Comandos e saída

```
$ docker volume create meu-volume
meu-volume

$ docker run -d --name at10-nginx -v meu-volume:/data nginx
b5990f5263f58972819ba6505c7d5fefd1f601a52a41131880e0cdf42eda2345

$ docker volume ls --filter name=meu-volume
DRIVER    VOLUME NAME
local     meu-volume

$ docker volume inspect meu-volume
[
    {
        "CreatedAt": "2026-08-28T17:23:12Z",
        "Driver": "local",
        "Labels": null,
        "Mountpoint": "/var/lib/docker/volumes/meu-volume/_data",
        "Name": "meu-volume",
        "Options": null,
        "Scope": "local"
    }
]

```

