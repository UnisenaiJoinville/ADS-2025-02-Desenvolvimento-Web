# 14 - Atividade — cache e mensageria

Redis é apropriado para manter temporariamente informações que seriam consultadas muitas vezes. A aplicação pode responder usando o cache e evitar repetir uma operação mais cara.

RabbitMQ trabalha com mensagens entre produtores e consumidores. Uma API pode registrar uma tarefa na fila e deixar que um worker cuide dela posteriormente.

Exemplo: o resumo de um dashboard pode ficar 30 segundos no Redis. Já a geração de um relatório grande pode ser colocada no RabbitMQ para processamento em segundo plano.
