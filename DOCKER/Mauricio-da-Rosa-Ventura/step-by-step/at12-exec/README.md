# Atividade 12 — Conectando-se a um container em execução

## Objetivo

Usar `docker exec -it <container> bash`, instalar um pacote e sair.

## Explicação

Diferente de `docker run` (que **cria um container novo**), `docker exec`
abre uma nova sessão de processo **dentro de um container que já está
rodando** — útil para depurar um serviço em produção sem reiniciá-lo. O `-it`
aqui tem o mesmo papel de antes (terminal interativo); como este script não
tem um humano digitando ao vivo, o equivalente reprodutível usado abaixo é
`docker exec at08-nginx bash -c "apt-get update && apt-get install -y
procps && ps aux"` — instala o pacote `procps` (que traz o comando `ps`) e já
usa esse comando para provar que a instalação funcionou, no mesmo container
Nginx que ficou rodando desde a atividade 8.

## Como gerar a evidência

Com o Docker (Desktop ou Engine) aberto na sua máquina, rode, dentro desta pasta:

```
./run.sh
```

Isso executa os comandos reais desta atividade e grava a saída em
[`EVIDENCIA.md`](./EVIDENCIA.md).
