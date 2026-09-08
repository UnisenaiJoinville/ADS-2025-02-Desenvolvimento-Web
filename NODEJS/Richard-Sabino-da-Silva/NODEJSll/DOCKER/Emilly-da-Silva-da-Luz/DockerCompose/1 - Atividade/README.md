# 1 - Atividade — comunicação na rede do Compose

## Resposta
Quando os containers fazem parte da mesma rede do Docker Compose, o Docker registra os serviços em um DNS interno. Assim, a API localiza suas dependências pelos nomes `mysql`, `redis` e `rabbitmq`, sem precisar conhecer o IP de cada container.

`localhost` não aponta para os outros serviços. Dentro da API, ele representa o próprio container da API. Portanto, `localhost:3306` procuraria um MySQL no lugar errado.

```text
API
├── mysql:3306
├── redis:6379
└── rabbitmq:5672 → worker
```

Usar nomes de serviço deixa a configuração estável mesmo quando um container é recriado e recebe outro IP.
