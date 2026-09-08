# Evidências — Atividade 22

## Evidência documental da implementação

A comprovação desta versão foi preparada a partir dos próprios arquivos entregues. Assim, é possível conferir tecnicamente a configuração relacionada ao exercício sem deixar espaços vazios para inserir imagens posteriormente.

> A imagem desta pasta representa uma evidência documental da configuração. Ela não é apresentada como captura de uma execução real do Docker.

## Trecho identificado

```yaml
services:
    build: ./frontend
    ports:
    volumes:
    depends_on:
    networks: [catalog_net]
    build: ./backend
    ports:
    volumes:
    depends_on:
        condition: service_healthy
        condition: service_started
        condition: service_healthy
    networks: [catalog_net]
    image: mysql:8.4
    volumes:
    healthcheck:
    networks: [catalog_net]
    image: redis:7.4-alpine
    volumes:
    networks: [catalog_net]
    image: rabbitmq:4-management
```

## Conferência

O trecho pode ser comparado diretamente com os arquivos da subpasta `projeto`. Conforme a atividade, ele permite verificar serviços, portas, volumes, dependências, profiles e healthchecks utilizados.

O arquivo `EVIDENCIA_DOCUMENTAL.png` apresenta a mesma comprovação em formato visual.
