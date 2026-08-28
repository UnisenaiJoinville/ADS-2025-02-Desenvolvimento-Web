#!/bin/bash
# P2 (docker compose config nos 3 cenarios) e P4 (docker compose exec na api
# do cenario 1). Roda a partir desta pasta, com o Docker aberto.
#
# Pre-requisito: os .env de cada cenario ja devem existir (cp .env.example
# .env em cada pasta) e o cenario 1 precisa estar de pe (rode primeiro
# ../cenario-1-vue-node-mysql/coletar-evidencias.sh, ou pelo menos
# "docker compose up -d" naquela pasta) para o P4 funcionar.
set -uo pipefail
cd "$(dirname "$0")"

if ! docker info >/dev/null 2>&1; then
  echo "Docker nao esta rodando. Abra o Docker Desktop e tente de novo." >&2
  exit 1
fi

{
  echo "# Evidência — atividades práticas P2 e P4 (seção 10.2 do material)"
  echo
  echo "Gerado em: $(date '+%Y-%m-%d %H:%M:%S %z')"

  for c in cenario-1-vue-node-mysql cenario-2-react-express-postgres cenario-3-consolidacao; do
    echo
    echo "## P2 — \`docker compose config\` em $c"
    echo
    echo '```'
    [ -f "../$c/.env" ] || cp "../$c/.env.example" "../$c/.env"
    (cd "../$c" && docker compose config) 2>&1
    echo '```'
  done

  echo
  echo "## P4 — \`docker compose exec api\` no cenário 1"
  echo
  echo '```'
  echo "$ docker compose exec api sh -c \"node -v && whoami && ls\""
  (cd ../cenario-1-vue-node-mysql && docker compose exec -T api sh -c "node -v && whoami && ls") 2>&1
  echo '```'

} > EVIDENCIAS.md 2>&1

echo "Evidências gravadas em $(pwd)/EVIDENCIAS.md"
