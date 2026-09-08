# 20 - Atividade — P3 — subir cenário 1 e coletar logs


## Comandos
```bash
cp .env.example .env
docker compose up -d --build
docker compose logs api
docker compose logs mysql
docker compose logs rabbitmq
```
O critério de aceite pede logs dos três serviços. O arquivo `EVIDENCIAS.md` está preparado para receber as saídas reais.
