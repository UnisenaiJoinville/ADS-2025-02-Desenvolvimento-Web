# Atividade 10 — Usando volumes

## Objetivo

Criar um volume, montá-lo em um container e verificar sua existência.

## Explicação

Por padrão, tudo que um container escreve no próprio filesystem some quando
o container é removido — o que é péssimo para dados que precisam sobreviver
(o conteúdo de um banco de dados, por exemplo). Um *volume* é uma área de
armazenamento gerenciada pelo próprio Docker (fora do filesystem do
container), que pode ser montada em um ou mais containers e continua
existindo mesmo depois que o container que a usava é removido. `docker volume
create meu-volume` cria essa área; `-v meu-volume:/data` no `docker run`
monta esse volume no caminho `/data` dentro do container — qualquer arquivo
gravado ali por dentro do container é, na prática, gravado no volume, gerenciado
pelo Docker fora do ciclo de vida do container.

## Como gerar a evidência

Com o Docker (Desktop ou Engine) aberto na sua máquina, rode, dentro desta pasta:

```
./run.sh
```

Isso executa os comandos reais desta atividade e grava a saída em
[`EVIDENCIA.md`](./EVIDENCIA.md).
