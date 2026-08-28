# DockerCompose — atividades do material

Esta pasta reúne as atividades identificadas no material **Docker e Docker Compose para ambientes profissionais de desenvolvimento**.

## Organização
- `1 - Atividade` a `4 - Atividade`: atividades parciais do Cenário 1.
- `5 - Atividade` a `8 - Atividade`: atividades parciais do Cenário 2.
- `9 - Atividade`: Cenário 3, projeto aplicado de consolidação.
- `10 - Atividade` a `17 - Atividade`: banco de atividades teóricas 1–8.
- `18 - Atividade` a `25 - Atividade`: banco de atividades práticas P1–P8.

## Importante sobre evidências
As atividades que exigem **prints, logs ou status real de containers** possuem `EVIDENCIAS.md`. Esses arquivos ficaram como modelo porque as evidências precisam ser geradas no computador em que o Docker estiver executando; não foram inventadas saídas de terminal.

## Pré-requisitos
- Docker Desktop ou Docker Engine.
- Docker Compose v2.
- Copiar `.env.example` para `.env` antes de subir cada projeto.

## Comandos mais usados
```bash
docker compose up -d --build
docker compose ps
docker compose logs -f api
docker compose down
```

