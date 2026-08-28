# 14 - Atividade — Atividade teórica — Redis como cache x RabbitMQ como broker

## Resposta
Redis, quando usado como cache, armazena dados de acesso rápido para reduzir consultas ao banco e diminuir latência. Os dados podem ter TTL e ser reconstruídos caso expirem.

RabbitMQ atua como broker de mensagens: recebe mensagens de produtores, mantém filas e entrega aos consumidores. Ele é indicado para tarefas assíncronas, eventos e desacoplamento entre serviços.

Exemplo: cachear catálogo no Redis; enfileirar envio de e-mail no RabbitMQ.