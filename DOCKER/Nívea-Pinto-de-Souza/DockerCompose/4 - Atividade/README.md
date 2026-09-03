# 4 - Atividade — Cenário 1 — Redis x RabbitMQ


## Comparação

| Aspecto | Redis | RabbitMQ |
|---|---|---|
| Papel principal | Cache, sessão, estruturas rápidas em memória | Broker de mensagens e filas |
| Objetivo | Reduzir latência e consultas repetidas | Desacoplar produtores e consumidores |
| Exemplo | Guardar por 30 s o resultado de uma consulta de produtos | Enfileirar envio de e-mail, emissão de nota ou processamento assíncrono |
| Persistência | Pode persistir, mas cache normalmente aceita expiração | Mensagens podem ser duráveis e confirmadas |
| Comunicação | A aplicação consulta/grava diretamente | Produtor publica; consumidor processa depois |

## Exemplo real
Em um e-commerce, o Redis pode armazenar o catálogo ou sessão do usuário para evitar consultas repetidas ao banco. Já o RabbitMQ pode receber um evento `pedido_criado` para que um worker envie e-mail, atualize integrações e execute tarefas sem bloquear a resposta HTTP do pedido.
