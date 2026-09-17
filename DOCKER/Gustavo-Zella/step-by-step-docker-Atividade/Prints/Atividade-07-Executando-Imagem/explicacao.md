# Atividade 7 — Executando uma imagem

## O que foi feito
Execução da imagem criada na Atividade 6:

```
docker run minha-imagem
```

## O que a imagem faz
A imagem `minha-imagem` foi construída a partir do Ubuntu com o `curl` instalado, mas o `Dockerfile` **não define um comando padrão (`CMD`/`ENTRYPOINT`)** para ser executado quando o container inicia. Por isso, ao rodar `docker run minha-imagem`, o Docker usa o comportamento padrão herdado da imagem `ubuntu`, que é iniciar um `bash` sem processo interativo anexado — como não há um `-it` e nenhum comando de longa duração é executado, o container inicia, não tem nada para fazer e **encerra imediatamente**, sem produzir saída visível no terminal.

Na prática, essa imagem funciona como uma "base pronta com curl instalado": ela é útil como ponto de partida para outros containers (por exemplo, rodando `docker run -it minha-imagem bash` para entrar nela interativamente e usar o `curl`), mas sozinha, sem um comando definido, não executa nenhuma tarefa contínua.

## Print
- `01-docker-run-minha-imagem.png` — execução da imagem `minha-imagem`.
