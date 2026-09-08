# Atividade 29: Configurando um proxy reverso

## Objetivo
Colocar um Nginx na frente de outro serviço, repassando as requisições internamente.

## Comandos executados
```bash
docker compose up -d
# http://localhost:8080
```

## O que foi observado / evidenciado
O container `proxy` recebe requisições externas na porta 8080 e repassa internamente (via rede Docker criada pelo Compose) para `meu-servico`, na porta 80. Usei Compose em vez de `docker run` soltos porque os dois containers precisam estar na mesma rede para se enxergarem pelo nome — o Compose já cuida disso.

## Arquivos desta pasta
- `nginx.conf`: configuração do proxy reverso. `docker-compose.yml`: sobe `meu-servico` e `proxy` na mesma rede.
