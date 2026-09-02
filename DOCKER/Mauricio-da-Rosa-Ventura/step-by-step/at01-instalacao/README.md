# Atividade 01 — Instalação do Docker

## Objetivo

Instalar o Docker e verificar que a instalação funcionou.

## Explicação

Docker é composto, no fundo, por um daemon (`dockerd`), que roda em segundo
plano e é quem de fato constrói imagens e executa containers, e por um
cliente de linha de comando (`docker`), que apenas envia comandos para esse
daemon através de uma API. No Windows e no macOS, o "Docker Desktop" empacota
esse daemon dentro de uma máquina virtual leve gerenciada automaticamente
(usando Hyper-V no Windows deste curso, ver Módulo 0); no Linux, o daemon
(Docker Engine) roda diretamente sobre o kernel do host, sem VM.

A verificação de instalação de uma máquina real é feita com `docker --version`
(mostra a versão do cliente) e `docker info` (mostra detalhes do daemon:
quantos containers existem, driver de storage, quantidade de CPU/memória
disponível para o Docker etc.). Se `docker info` falhar com uma mensagem de
conexão recusada ao socket, o daemon não está rodando — no Windows/macOS isso
normalmente significa abrir o Docker Desktop.

## Como gerar a evidência

Com o Docker (Desktop ou Engine) aberto na sua máquina, rode, dentro desta pasta:

```
./run.sh
```

Isso executa os comandos reais desta atividade e grava a saída em
[`EVIDENCIA.md`](./EVIDENCIA.md).
