# Atividade 28 — Restaurando volumes

## Objetivo

Restaurar o conteúdo de um backup `.tar` em um novo volume.

## Explicação

O caminho inverso da atividade 27: um container temporário monta um volume
**novo e vazio** (`meu-volume-restaurado`) e a mesma pasta do host onde está
o `backup.tar`, e usa `tar xvf` para extrair o conteúdo de volta — como o
`tar` da atividade 27 empacotou a partir da raiz (`/data`), a extração usa
`--strip-components=1` para descartar esse prefixo `data/` e gravar os
arquivos direto na raiz do novo volume. Ao final, um terceiro container
apenas lista o conteúdo do volume restaurado para confirmar visualmente que
os dados voltaram intactos.

## Como gerar a evidência

Com o Docker (Desktop ou Engine) aberto na sua máquina, rode, dentro desta pasta:

```
./run.sh
```

Isso executa os comandos reais desta atividade e grava a saída em
[`EVIDENCIA.md`](./EVIDENCIA.md).
