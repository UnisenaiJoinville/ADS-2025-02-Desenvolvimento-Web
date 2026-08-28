# 20 - Atividade — P3: logs do Cenário 1

Suba o ambiente e consulte separadamente os três serviços pedidos:

```bash
docker compose up -d --build
docker compose logs api
docker compose logs mysql
docker compose logs rabbitmq
```

Para acompanhar em tempo real, acrescente `-f`. O arquivo `EVIDENCIAS.md` possui campos para registrar um trecho de cada saída.
