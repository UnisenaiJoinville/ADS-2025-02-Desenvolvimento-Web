# Evidencia de execucao - Atividade 21: Criando um container com variáveis de ambiente

Gerado em: 2026-08-28 14:24:37 -0300

## Comandos e saída

```
$ docker run --rm -e "MY_VAR=Hello" ubuntu env | grep MY_VAR
MY_VAR=Hello

```

