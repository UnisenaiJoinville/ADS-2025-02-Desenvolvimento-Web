# Atividade 02 — Executando seu primeiro container

## Objetivo

Rodar `docker run hello-world` e entender a saída.

## Explicação

`docker run hello-world` é o teste clássico de "Docker está funcionando".
Internamente, o comando faz quatro coisas em sequência: (1) o cliente Docker
pede ao daemon para rodar um container a partir da imagem `hello-world`; (2)
o daemon verifica se essa imagem já existe localmente e, como normalmente não
existe na primeira vez, faz o *pull* dela do Docker Hub; (3) o daemon cria um
container novo a partir dessa imagem e inicia o processo definido nela (um
binário simples que só imprime uma mensagem explicando o que aconteceu); (4)
o processo termina imediatamente após imprimir a mensagem, e o container fica
com status `Exited (0)` — 0 significa que terminou sem erro. É importante
entender que um container só continua rodando enquanto o processo principal
dele estiver rodando; aqui, como o processo é "imprimir uma mensagem e
terminar", o container não fica em pé, o que é o comportamento esperado (e
não uma falha).

## Como gerar a evidência

Com o Docker (Desktop ou Engine) aberto na sua máquina, rode, dentro desta pasta:

```
./run.sh
```

Isso executa os comandos reais desta atividade e grava a saída em
[`EVIDENCIA.md`](./EVIDENCIA.md).
