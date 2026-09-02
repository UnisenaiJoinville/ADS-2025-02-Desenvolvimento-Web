# 13 - Atividade — significado de `localhost`

Dentro de um container, `localhost` significa o próprio container. Ele não representa automaticamente o computador hospedeiro e nem outro serviço do Compose.

Para chegar a outro container, utiliza-se o nome do serviço resolvido pelo DNS interno. Se o banco foi declarado como `postgres`, por exemplo, a API pode conectar em `postgres:5432`.

Esse é um motivo comum para configurações funcionarem fora do Docker e falharem depois da containerização: o endereço do banco precisa refletir a nova topologia.
