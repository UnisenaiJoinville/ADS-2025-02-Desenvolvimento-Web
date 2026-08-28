#!/bin/bash
# Sobe o Cenario 2 (inclusive o pgAdmin, via --profile tools), espera os
# serviços ficarem saudáveis, coleta as evidências pedidas pelo material
# (atividades parciais 7.4) e grava tudo em EVIDENCIAS.md.
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
  echo "# Evidência de execução — Cenário 2 (ReactJS + PostgreSQL + Node/Express + Redis + RabbitMQ + Nginx)"
  echo
  echo "Gerado em: $(date '+%Y-%m-%d %H:%M:%S %z')"

  echo
  echo "## 1. Subindo o cenário base (\`docker compose up -d --build\`)"
  echo
  echo '```'
  docker compose up -d --build
  echo '```'

  echo
  echo "Aguardando postgres e rabbitmq ficarem healthy (até 90s)..."
  for i in $(seq 1 30); do
    if docker compose ps postgres | grep -qi "healthy" && docker compose ps rabbitmq | grep -qi "healthy"; then
      break
    fi
    sleep 3
  done

  echo
  echo "## 2. \`docker compose ps\`"
  echo
  echo '```'
  docker compose ps
  echo '```'

  echo
  echo "## 3. Acessando a aplicação via proxy (\`http://localhost:8080\`)"
  echo
  echo '```'
  echo "$ curl -sS -o /dev/null -w 'GET /        -> HTTP %{http_code}\n' http://localhost:8080/"
  curl -sS -o /dev/null -w 'GET /        -> HTTP %{http_code}\n' http://localhost:8080/
  echo "$ curl -sS http://localhost:8080/api/health"
  curl -sS http://localhost:8080/api/health
  echo
  echo "$ curl -sS http://localhost:8080/api/status"
  curl -sS http://localhost:8080/api/status
  echo '```'

  echo
  echo "## 4. Subindo o pgAdmin com o profile \`tools\` (atividade parcial 7.4)"
  echo
  echo '```'
  echo "$ docker compose --profile tools up -d"
  docker compose --profile tools up -d
  sleep 2
  echo "$ curl -sS -o /dev/null -w 'GET :5050 -> HTTP %{http_code}\n' http://localhost:5050"
  curl -sS -o /dev/null -w 'GET :5050 -> HTTP %{http_code}\n' http://localhost:5050
  echo '```'
  echo
  echo "PgAdmin acessível em http://localhost:5050 (login: admin@local.test / admin, ver .env.example)."

  echo
  echo "## 5. Logs da api"
  echo
  echo '```'
  docker compose logs --no-color --tail 60 api
  echo '```'

  echo
  echo "## 6. \`docker compose ps\` mostrando os serviços \`healthy\`"
  echo
  echo '```'
  docker compose ps
  echo '```'

} > EVIDENCIAS.md 2>&1

echo "Evidências gravadas em $(pwd)/EVIDENCIAS.md"
echo "Para parar tudo, inclusive o pgadmin: docker compose --profile tools down"
