# Cenário 1 — Vue + Node + MySQL + Redis + RabbitMQ

**Aluno:** Victor Cesar Silva

Pilha com frontend Vue, API Express, MySQL, Redis (cache), RabbitMQ (fila) e um worker em
container separado.

## Serviços

| Serviço | Imagem / build | Porta no host | Papel |
|---|---|---|---|
| `frontend` | Vue 3 + Vite | 5173 | interface |
| `api` | Node 22 + Express | 3002 → 3000 | REST, cache e publicação na fila |
| `worker` | Node 22 | — | consome a fila |
| `mysql` | `mysql:8.4` | — | banco, volume `mysql_data` |
| `redis` | `redis:7.4-alpine` | — | cache, volume `redis_data` |
| `rabbitmq` | `rabbitmq:4-management` | 15672 | broker (só o painel é publicado) |

> A API é publicada em **3002** porque 3000 e 3001 estavam ocupadas na máquina de
> desenvolvimento. Dentro da rede Docker nada muda: o container ouve na 3000.

## Como rodar

```bash
cp .env.example .env          # Copy-Item no PowerShell
docker compose up -d --build
docker compose ps
```

Acessos: frontend em http://localhost:5173, API em http://localhost:3002/health, painel do
RabbitMQ em http://localhost:15672 (login pelo `.env`).

## Testando o fluxo completo

```bash
curl -X POST http://localhost:3002/agendamentos \
  -H "Content-Type: application/json" -d '{"paciente":"Victor Cesar Silva"}'

curl http://localhost:3002/agendamentos    # 1ª vez: {"origem":"mysql",...}
curl http://localhost:3002/agendamentos    # 2ª vez: {"origem":"redis",...}

docker compose logs worker                 # mostra o consumo da mensagem
```

O campo `origem` alternando prova o cache; o log do worker prova a fila.

## Troubleshooting

**`port is already allocated`** — outra aplicação usa a porta. Descubra com
`netstat -ano | findstr :3002` (Windows) ou `sudo lsof -i :3002` (Linux/macOS) e mude o
lado esquerdo do mapeamento. O lado direito é a porta interna e não deve mudar.

**A api sobe e morre com `ECONNREFUSED ...:5672`** — o RabbitMQ ainda não aceitava
conexões. Já tratado com o healthcheck `check_port_connectivity` e `restart: on-failure`.
Diagnostique com `docker compose ps -a` (sem o `-a`, containers mortos não aparecem) e
`docker compose logs api`.

**`getaddrinfo ENOTFOUND` ou recusa ao usar `localhost`** — dentro do container,
`localhost` é o próprio container. Use o nome do serviço. Confirme com
`docker compose exec api sh -c "getent hosts mysql redis rabbitmq"`.

**`Access denied for user` após trocar a senha no `.env`** — a senha só é aplicada na
primeira inicialização do volume. Em ambiente local: `docker compose down -v` e suba de novo.

**Alteração no código não aparece** — rode `docker compose up -d --build`; se persistir,
`docker compose build --no-cache <serviço>`.

## Comandos úteis

```bash
docker compose logs -f api    # acompanha logs
docker compose exec api sh    # entra no container
docker compose down           # derruba, MANTÉM os dados
docker compose down -v        # derruba e APAGA os volumes
```
