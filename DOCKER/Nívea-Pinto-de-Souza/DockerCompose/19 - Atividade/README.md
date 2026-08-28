# 19 - Atividade — P2 — validar docker compose config


## Objetivo
Validar o arquivo Compose sem subir os containers.

## Comandos
```bash
cp .env.example .env
docker compose config
```
No PowerShell: `Copy-Item .env.example .env`.

Se o comando encerrar sem erro, a sintaxe e a interpolação básica do Compose estão válidas. Salve a saída em `EVIDENCIAS.md`.
