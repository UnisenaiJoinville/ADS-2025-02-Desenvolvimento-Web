# Atividade 3 — Listando containers

## O que foi feito
Execução do comando:

```
docker ps -a
```

## O que aconteceu
O comando `docker ps -a` lista **todos** os containers existentes na máquina, independente do estado em que se encontram (a flag `-a` significa "all"). Na saída é possível ver a coluna **STATUS**, que indica a diferença entre containers em execução e parados:

- **Containers em execução (`Up ...`)**: containers cujo processo principal ainda está rodando — por exemplo `projeto-guiado-api-1`, `projeto-guiado-redis-1` e `projeto-guiado-mysql-1`, todos com status `Up`. Alguns inclusive mostram `(healthy)`, indicando que passaram na verificação de *healthcheck* configurada na imagem.
- **Containers parados (`Exited (código) ...`)**: containers cujo processo principal terminou (seja porque a tarefa acabou, como o `hello-world`, seja porque houve um erro). O número entre parênteses é o **código de saída**: `Exited (0)` significa que o processo terminou normalmente, enquanto `Exited (255)`, por exemplo, indica que o processo terminou com erro.

Um container só ocupa recursos de CPU/memória enquanto está "Up". Um container parado continua existindo no disco (com seus arquivos e configurações) até ser removido com `docker rm`, mas não consome processamento.

## Print
- `01-docker-ps-a.png` — saída do `docker ps -a` mostrando containers em execução e parados.
