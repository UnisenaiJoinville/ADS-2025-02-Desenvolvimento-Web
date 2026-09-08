# Atividade 22: Limitando recursos do container

## Objetivo
Restringir memória e CPU disponíveis para um container.

## Comandos executados
```bash
docker run -m 512m --cpus="1.0" ubuntu
```

## O que foi observado / evidenciado
`-m 512m` limita a memória RAM a 512 MB (ultrapassar pode causar OOM Kill). `--cpus="1.0"` limita o uso de CPU ao equivalente a 1 núcleo inteiro. Fundamental em produção para não deixar um container consumir todos os recursos do host.
