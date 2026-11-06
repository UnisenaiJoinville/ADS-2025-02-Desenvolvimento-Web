#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
node scripts/setup.js
docker compose up -d --build --wait --wait-timeout 180
printf 'Acesse http://localhost:3000 apos a inicializacao.\n'
