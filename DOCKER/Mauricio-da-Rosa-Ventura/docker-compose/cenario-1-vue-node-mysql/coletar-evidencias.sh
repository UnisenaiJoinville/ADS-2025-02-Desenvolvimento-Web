#!/bin/bash
# Sobe o Cenario 1, espera os serviços ficarem saudáveis, coleta as
# evidências pedidas pelo material (atividades parciais 6.3) e grava tudo em
# EVIDENCIAS.md. Rode a partir desta pasta, com o Docker aberto:
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
  echo "# Evidência de execução — Cenário 1 (VueJS + NodeJS + MySQL + Redis + RabbitMQ)"
  echo
  echo "Gerado em: $(date '+%Y-%m-%d %H:%M:%S %z')"

  echo
  echo "## 1. Subindo a pilha (\`docker compose up -d --build\`)"
  echo
  echo '```'
  docker compose up -d --build
  echo '```'

  echo
  echo "Aguardando mysql e rabbitmq ficarem healthy (até 90s)..."
  for i in $(seq 1 30); do
    if docker compose ps mysql | grep -qi "healthy" && docker compose ps rabbitmq | grep -qi "healthy"; then
      break
    fi
    sleep 3
  done

  echo
  echo "## 2. \`docker compose ps\` — status e portas"
  echo
  echo '```'
  docker compose ps
  echo '```'

  echo
  echo "## 3. Logs da api (\`docker compose logs api\`)"
  echo
  echo '```'
  docker compose logs --no-color --tail 80 api
  echo '```'

  echo
  echo "## 4. Logs do rabbitmq (\`docker compose logs rabbitmq\`)"
  echo
  echo '```'
  docker compose logs --no-color --tail 40 rabbitmq
  echo '```'

  echo
  echo "## 5. Testando a API (\`GET /health\` e \`GET /api/status\`)"
  echo
  echo '```'
  echo "$ curl -sS http://localhost:3000/health"
  curl -sS http://localhost:3000/health
  echo
  echo
  echo "$ curl -sS http://localhost:3000/api/status"
  curl -sS http://localhost:3000/api/status
  echo '```'

  echo
  echo "## 6. Logs do worker (prova de consumo assíncrono da fila)"
  echo
  echo '```'
  docker compose logs --no-color --tail 40 worker
  echo '```'

  echo
  echo "## 7. Persistência de dados após \`docker compose down\` + \`up\` (atividade parcial 6.3)"
  echo
  echo '```'
  echo "$ docker compose exec mysql mysql -u root -p\$MYSQL_ROOT_PASSWORD -e 'SELECT COUNT(*) AS total_antes FROM cenario1.eventos;'"
  docker compose exec -T mysql sh -c 'mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SELECT COUNT(*) AS total_antes FROM cenario1.eventos;"' 2>&1

  echo
  echo "$ docker compose down"
  docker compose down
  echo
  echo "$ docker compose up -d"
  docker compose up -d
  echo "Aguardando mysql voltar a ficar healthy..."
  for i in $(seq 1 30); do
    docker compose ps mysql | grep -qi "healthy" && break
    sleep 3
  done
  echo
  echo "$ docker compose exec mysql mysql -u root -p\$MYSQL_ROOT_PASSWORD -e 'SELECT COUNT(*) AS total_depois FROM cenario1.eventos;'"
  docker compose exec -T mysql sh -c 'mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SELECT COUNT(*) AS total_depois FROM cenario1.eventos;"' 2>&1
  echo '```'
  echo
  echo "Se \`total_antes\` e \`total_depois\` forem iguais (e maiores que zero), o"
  echo "volume nomeado \`mysql_data\` preservou os dados mesmo com o \`docker compose"
  echo "down\` recriando os containers — é a evidência pedida na atividade parcial."

} > EVIDENCIAS.md 2>&1

echo "Evidências gravadas em $(pwd)/EVIDENCIAS.md"
echo "Para derrubar tudo (inclusive os volumes): docker compose down -v"
