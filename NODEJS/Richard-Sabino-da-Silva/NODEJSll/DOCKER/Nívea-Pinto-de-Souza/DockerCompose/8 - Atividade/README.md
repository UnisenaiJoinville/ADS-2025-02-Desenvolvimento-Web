# 8 - Atividade — Cenário 2 — PostgreSQL sem porta pública


## Resposta
O PostgreSQL não precisa publicar uma porta no host quando somente a API acessa o banco. A API e o serviço `postgres` estão na mesma rede `app_net`, então a conexão pode ser feita pelo endereço `postgres:5432` usando DNS interno do Docker Compose.

Não expor `5432` no host reduz a superfície de acesso, evita conflitos com um PostgreSQL já instalado na máquina e deixa a arquitetura mais próxima do princípio de publicar apenas o que realmente precisa ser acessado externamente. O banco continua acessível aos containers autorizados na rede interna.
