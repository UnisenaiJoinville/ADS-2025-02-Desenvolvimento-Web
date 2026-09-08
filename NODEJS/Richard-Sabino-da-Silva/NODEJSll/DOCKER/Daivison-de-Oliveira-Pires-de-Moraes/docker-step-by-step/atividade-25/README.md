# Atividade 25: Criando um container com um script de inicialização

## Objetivo
Rodar um script customizado sempre que o container iniciar, antes do comando principal.

## Comandos executados
```bash
docker build -t minha-imagem-init .
docker run -it minha-imagem-init
```

## O que foi observado / evidenciado
O `ENTRYPOINT` define o script que sempre roda ao iniciar o container. O `exec "$@"` no final repassa o controle para o `CMD` (aqui, `bash`), permitindo tarefas de inicialização antes da aplicação principal.

## Arquivos desta pasta
- `init.sh`: script de inicialização. `Dockerfile`: copia e registra o script como `ENTRYPOINT`.
