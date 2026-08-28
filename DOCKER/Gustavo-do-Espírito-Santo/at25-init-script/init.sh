#!/bin/sh
# Atividade 25 - script de inicializacao do container.
# Faz um "setup" ficticio e depois entrega o controle para o comando (CMD).
set -e

echo "=================================================="
echo " init.sh iniciado em: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo " Container hostname..: $(hostname)"
echo " Variavel APP_ENV....: ${APP_ENV:-nao definida}"
echo "--------------------------------------------------"
echo " [1/2] preparando diretorio de trabalho /app/data"
mkdir -p /app/data
echo " [2/2] escrevendo marcador de inicializacao"
echo "inicializado em $(date -u +%FT%TZ)" > /app/data/started.txt
echo " Setup concluido. Entregando controle para: $*"
echo "=================================================="

exec "$@"
