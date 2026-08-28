# 2 - Atividade — iniciar o Cenário 1 e verificar logs

## Procedimento
Na pasta `projeto`, crie o `.env` a partir do `.env.example` e execute:

```bash
docker compose up -d --build
docker compose ps
docker compose logs api
docker compose logs rabbitmq
```

A saída de `ps` deve mostrar os containers ativos. Nos logs da API deve aparecer a inicialização do servidor e, no RabbitMQ, mensagens indicando que o broker está pronto para receber conexões.

O arquivo `EVIDENCIAS.md` indica os registros que precisam ser anexados à entrega.
