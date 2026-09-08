# Atividade 04: Criando um container interativo

## Objetivo
Abrir um shell interativo dentro de um container Ubuntu e instalar um pacote.

## Comandos executados
```bash
docker run -it ubuntu bash
# dentro do container:
apt-get update
exit
# de volta no host:
docker ps -a
```

## O que foi observado / evidenciado
`-i` mantém o STDIN aberto e `-t` aloca um pseudo-terminal. Ao sair do `bash` (processo principal, PID 1), o container **para automaticamente** — ele aparece em `docker ps -a` como `Exited`, mas não em `docker ps`.
