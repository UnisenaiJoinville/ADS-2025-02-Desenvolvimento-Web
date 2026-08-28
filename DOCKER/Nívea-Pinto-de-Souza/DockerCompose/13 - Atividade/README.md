# 13 - Atividade — Atividade teórica — Por que localhost não é outro container

## Resposta
Dentro de um container, `localhost`/`127.0.0.1` aponta para o próprio container. Ele não representa automaticamente o computador host e não aponta para outro serviço do Compose.

Para acessar outro container, deve-se usar o nome do serviço na rede Docker, como `mysql:3306`, `postgres:5432`, `redis:6379` ou `rabbitmq:5672`. O Compose fornece DNS interno para resolver esses nomes.