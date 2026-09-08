# Atividade 27 — Backup de volumes

## Objetivo

Fazer backup do conteúdo de um volume em um arquivo `.tar`.

## Explicação

Um volume Docker não é acessível diretamente pelo host como uma pasta comum
(no Linux ele até é, dentro de `/var/lib/docker/volumes/`, mas isso não deve
ser mexido manualmente). A forma correta e portátil de extrair os dados de um
volume é rodar um container **temporário e descartável** que monta o volume
de origem e também uma pasta do host, e usa o utilitário `tar` para empacotar
o conteúdo do volume em um único arquivo `.tar` dentro dessa pasta do host —
`--rm` garante que esse container auxiliar é removido automaticamente assim
que o `tar` termina, sem deixar lixo para trás. Antes do backup, este script
grava um arquivo de exemplo dentro do volume, só para o backup ter algo
para provar que preservou.

## Como gerar a evidência

Com o Docker (Desktop ou Engine) aberto na sua máquina, rode, dentro desta pasta:

```
./run.sh
```

Isso executa os comandos reais desta atividade e grava a saída em
[`EVIDENCIA.md`](./EVIDENCIA.md).
