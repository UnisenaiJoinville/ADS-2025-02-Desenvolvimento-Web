# Atividade 02: Executando o primeiro container

## Objetivo
Rodar o container de teste oficial do Docker.

## Comandos executados
```bash
docker run hello-world
```

## O que foi observado / evidenciado
O Docker verifica se a imagem `hello-world` existe localmente; como não existe, faz o *pull* do Docker Hub, cria um container a partir dela e executa. O container imprime uma mensagem de confirmação e encerra sozinho (sua única tarefa era essa).
