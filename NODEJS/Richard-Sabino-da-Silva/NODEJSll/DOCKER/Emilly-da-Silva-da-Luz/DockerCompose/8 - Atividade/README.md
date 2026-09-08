# 8 - Atividade — PostgreSQL somente na rede interna

A API e o PostgreSQL estão na mesma rede Docker. Por isso, a conexão pode ser feita diretamente para `postgres:5432`, sem publicar a porta do banco no host.

O mapeamento `5432:5432` só seria necessário se um programa executado fora do Docker precisasse acessar o banco diretamente. Quando isso não é requisito, manter a porta interna reduz exposição e evita conflito com outro PostgreSQL instalado no computador.

Portanto, a ausência de `ports` no banco não impede a comunicação entre os containers.
