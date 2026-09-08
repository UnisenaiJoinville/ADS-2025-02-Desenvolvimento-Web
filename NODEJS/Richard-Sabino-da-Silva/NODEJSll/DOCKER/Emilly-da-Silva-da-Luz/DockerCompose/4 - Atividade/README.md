# 4 - Atividade — Redis e RabbitMQ

Redis e RabbitMQ aparecem na mesma arquitetura, mas resolvem necessidades diferentes.

| Ponto | Redis | RabbitMQ |
|---|---|---|
| Papel | Acesso rápido a dados | Transporte de mensagens |
| Uso | Cache e sessão | Filas e tarefas |
| Exemplo | Resultado temporário de uma consulta | Trabalho enviado ao worker |

Em um catálogo, uma busca muito repetida pode permanecer alguns segundos no Redis para diminuir consultas ao banco. Uma geração de relatório, por outro lado, pode ser enviada ao RabbitMQ e processada separadamente por um worker.

Assim, cache busca reduzir o tempo de resposta; mensageria ajuda a desacoplar etapas do processamento.
