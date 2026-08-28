# 1 - Atividade — Cenário 1 — rede entre serviços


## Enunciado
Explique por que a API usa `mysql`, `redis` e `rabbitmq` por nome de serviço, e não por `localhost`.

## Resposta
No Docker Compose, cada serviço participa de uma rede virtual e recebe resolução DNS pelo próprio nome do serviço. Assim, de dentro do container `api`, o host `mysql` aponta para o container do MySQL, `redis` aponta para o Redis e `rabbitmq` aponta para o broker. `localhost`, por outro lado, sempre representa o próprio container em que o processo está rodando. Portanto, usar `localhost` na API faria a aplicação procurar MySQL, Redis ou RabbitMQ dentro do container da própria API.

## Diagrama de rede
```text
Navegador (host)
      |
      | :3000
      v
    [api]
   /  |   \
  /   |    \
mysql redis rabbitmq
  |            |
volume       worker
```
Todos os serviços se comunicam pela rede `app_net` usando DNS interno do Compose.
