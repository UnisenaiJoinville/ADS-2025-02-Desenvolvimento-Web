# Evidencia de execucao - Atividade 11: Inspecionando um container

Gerado em: 2026-08-28 14:23:15 -0300

## Comandos e saída

```
$ docker inspect at10-nginx --format 'Status: {{.State.Status}}'
Status: running

$ docker inspect at10-nginx --format 'IP: {{.NetworkSettings.IPAddress}}'

template parsing error: template: :1:22: executing "" at <.NetworkSettings.IPAddress>: map has no entry for key "IPAddress"

$ docker inspect at10-nginx --format 'Mounts: {{json .Mounts}}'
Mounts: [{"Type":"volume","Name":"meu-volume","Source":"/var/lib/docker/volumes/meu-volume/_data","Destination":"/data","Driver":"local","Mode":"z","RW":true,"Propagation":""}]

```

