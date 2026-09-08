# 25 - Atividade — P8: troubleshooting

## Caso 1 — porta do Nginx ocupada
**Sintoma:** erro ao publicar a porta 8080.  
**Diagnóstico:** verificar qual processo já utiliza a porta. No Windows: `netstat -ano | findstr :8080`.  
**Correção:** encerrar o processo ou alterar o lado do host, por exemplo `8082:80`.

## Caso 2 — API tenta usar `localhost` para o PostgreSQL
**Sintoma:** timeout ou `ECONNREFUSED`.  
**Diagnóstico:** `docker compose logs api` e conferência de `DB_HOST`.  
**Correção:** configurar `DB_HOST=postgres`, pois esse é o nome resolvido na rede Compose.

## Caso 3 — serviço dependente inicia antes do banco estar pronto
**Sintoma:** API falha logo após `docker compose up`.  
**Diagnóstico:** verificar `docker compose ps` e logs do banco.  
**Correção:** adicionar healthcheck ao banco e usar `depends_on` com `condition: service_healthy`.

## Caso 4 — PgAdmin não aparece
Se o serviço tiver `profiles: ["tools"]`, ele não inicia no comando padrão. Use `docker compose --profile tools up -d pgadmin`.

## Caso 5 — dados desapareceram depois de um reset
`docker compose down -v` remove os volumes. Para recriar containers sem apagar dados, use `docker compose down` sem `-v` ou recrie apenas o serviço desejado.
