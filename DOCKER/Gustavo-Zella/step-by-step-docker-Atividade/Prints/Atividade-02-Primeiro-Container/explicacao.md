# Atividade 2 — Executando seu primeiro container

## O que foi feito
Execução do comando:

```
docker run hello-world
```

## O que aconteceu
A mensagem **"Hello from Docker!"** foi exibida no terminal. Isso acontece porque, ao rodar o comando, o Docker executou os seguintes passos (explicados na própria saída do comando):

1. O cliente Docker contatou o **daemon Docker** (o processo em segundo plano que gerencia containers).
2. Como a imagem `hello-world` não existia localmente, o daemon a **baixou (pull) do Docker Hub**.
3. O daemon criou um **novo container** a partir dessa imagem.
4. O container executou o binário interno, que apenas imprime a mensagem de boas-vindas.
5. O Docker **transmitiu essa saída** de volta para o terminal e, em seguida, o container foi encerrado (seu trabalho já estava concluído).

Ou seja, esse teste confirma que toda a cadeia — cliente Docker → daemon → download de imagem → criação e execução de container → retorno de saída — está funcionando corretamente.

## Print
- `01-docker-run-hello-world.png` — saída completa do `docker run hello-world`.
