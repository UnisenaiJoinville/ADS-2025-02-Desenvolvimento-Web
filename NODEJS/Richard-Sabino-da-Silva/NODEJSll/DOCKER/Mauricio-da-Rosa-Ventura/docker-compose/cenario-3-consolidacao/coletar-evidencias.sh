#!/bin/bash
# Sobe o Cenario 3, espera os serviços ficarem saudáveis (inclusive a api,
# que tem healthcheck proprio), dispara um evento de ponta a ponta e coleta
# as evidências pedidas pelo material (secao 8, "entrega final de fixacao").
#
#   cp .env.example .env   # so na primeira vez
#   ./coletar-evidencias.sh
#
set -uo pipefail
cd "$(dirname "$0")"

if ! docker info >/dev/null 2>&1; then
  echo "Docker nao esta rodando. Abra o Docker Desktop e tente de novo." >&2
  exit 1
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Criei .env a partir de .env.example (edite se quiser trocar as senhas)."
fi

{
  echo "# Evidência de execução — Cenário 3 (consolidação)"
  echo
  echo "Gerado em: $(date '+%Y-%m-%d %H:%M:%S %z')"

  echo
  echo "## 1. Subindo a pilha (\`docker compose up -d --build\`)"
  echo
  echo '```'
  docker compose up -d --build
  echo '```'

  echo
  echo "Aguardando postgres, rabbitmq e api ficarem healthy (até 2 minutos)..."
  for i in $(seq 1 40); do
    if docker compose ps postgres | grep -qi "healthy" \
      && docker compose ps rabbitmq | grep -qi "healthy" \
      && docker compose ps api | grep -qi "healthy"; then
      break
    fi
    sleep 3
  done

  echo
  echo "## 2. \`docker compose ps\` — todos os serviços, status e portas"
  echo
  echo '```'
  docker compose ps
  echo '```'

  echo
  echo "## 3. Healthcheck e comunicação entre serviços (\`GET /health\`, \`GET /status\`)"
  echo
  echo '```'
  echo "$ curl -sS http://localhost:3001/health"
  curl -sS http://localhost:3001/health
  echo
  echo
  echo "$ curl -sS http://localhost:3001/status"
  curl -sS http://localhost:3001/status
  echo '```'

  echo
  echo "## 4. Disparando um evento de ponta a ponta (\`POST /eventos\`)"
  echo
  echo '```'
  echo '$ curl -sS -X POST http://localhost:3001/eventos -H "Content-Type: application/json" -d '"'"'{"tipo":"evento-de-teste"}'"'"
  curl -sS -X POST http://localhost:3001/eventos -H "Content-Type: application/json" -d '{"tipo":"evento-de-teste"}'
  echo
  echo '```'
  sleep 3

  echo
  echo "## 5. Logs do worker (prova de que o evento foi consumido e processado)"
  echo
  echo '```'
  docker compose logs --no-color --tail 40 worker
  echo '```'

  echo
  echo "## 6. Logs da api"
  echo
  echo '```'
  docker compose logs --no-color --tail 60 api
  echo '```'

  echo
  echo "## 7. \`docker inspect\` do healthcheck da api"
  echo
  echo '```'
  docker inspect --format '{{json .State.Health}}' "$(docker compose ps -q api)"
  echo '```'

} > EVIDENCIAS.md 2>&1

echo "Evidências gravadas em $(pwd)/EVIDENCIAS.md"
echo "Frontend: http://localhost:5174  |  RabbitMQ: http://localhost:15674"
