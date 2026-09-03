# 25 - Atividade — P8 — troubleshooting documentado


## Objetivo
Documentar pelo menos três problemas comuns e soluções. O projeto em `projeto/` também inclui um ambiente funcional de referência.

## Problemas e soluções
### 1. Porta já está em uso
**Sintoma:** erro de bind ao subir o Compose.  
**Causa:** outro processo usa a porta publicada.  
**Diagnóstico:** `docker compose ps`, `netstat -ano | findstr :8080` no Windows ou `ss -ltnp | grep 8080` no Linux.  
**Solução:** encerrar o processo conflitante ou trocar somente a porta do host, por exemplo `8081:80`.

### 2. API não conecta no banco
**Sintoma:** `ECONNREFUSED`, timeout ou host não encontrado.  
**Causa comum:** uso de `localhost` dentro da API.  
**Diagnóstico:** `docker compose logs api`, conferir `DB_HOST`.  
**Solução:** usar o nome do serviço (`mysql` ou `postgres`) e healthcheck/`depends_on`.

### 3. Banco reinicia em loop
**Sintoma:** container fica reiniciando.  
**Causa:** variáveis obrigatórias ausentes ou volume incompatível.  
**Diagnóstico:** `docker compose logs postgres`/`mysql` e `docker inspect`.  
**Solução:** revisar `.env`; em laboratório, se puder perder os dados, recriar com `docker compose down -v`.

### 4. RabbitMQ não abre o painel
**Causa:** porta `15672` não publicada ou imagem sem plugin management.  
**Solução:** usar `rabbitmq:4-management` e publicar `15672:15672`.

### 5. Problema com node_modules em bind mount
**Causa:** conflito entre dependências do host e do container.  
**Solução:** manter volume nomeado em `/app/node_modules`, separado do bind mount do código.
