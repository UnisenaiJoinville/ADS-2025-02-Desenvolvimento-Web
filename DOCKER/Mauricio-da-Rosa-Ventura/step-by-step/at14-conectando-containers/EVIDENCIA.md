# Evidencia de execucao - Atividade 14: Conectando containers à rede

Gerado em: 2026-08-28 14:23:27 -0300

## Comandos e saída

```
$ docker run -d --network minha-rede --name container1 nginx
a38c560a272bfb85a90135a950ba78d93039e47a55ebc08e4be8ed659560a835

$ docker run -d --network minha-rede --name container2 nginx
f5ca533bd76c080b21b7640a8c2c0195a34d3b848758959e7560092b1300d223

$ sleep 1

$ docker exec container1 curl -sS -o /dev/null -w 'container1 -> container2: HTTP %{http_code}\n' http://container2
container1 -> container2: HTTP 200

```

