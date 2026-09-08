# Atividade 07: Executando uma imagem

## Objetivo
Rodar a imagem criada anteriormente e observar seu comportamento.

## Comandos executados
```bash
docker build -t minha-imagem .
docker run minha-imagem
```

## O que foi observado / evidenciado
Essa imagem não tem `CMD`/`ENTRYPOINT` customizado — herda o padrão da imagem `ubuntu` (`bash`). Sem `-it`, o container inicia, não tem nada interativo a fazer e **encerra imediatamente**. Ele só instalou o `curl` durante o build; não executa nenhuma ação sozinho.

## Arquivos desta pasta
- `Dockerfile`: igual à Atividade 6, reincluído aqui para a pasta ser autocontida.
