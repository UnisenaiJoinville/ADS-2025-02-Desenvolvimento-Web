#!/bin/bash
# Roda as 30 atividades em ordem, cada uma no seu proprio run.sh.
set -uo pipefail
cd "$(dirname "$0")"

if ! docker info >/dev/null 2>&1; then
  echo "Docker nao esta rodando. Abra o Docker Desktop (ou inicie o Docker Engine) e tente de novo." >&2
  exit 1
fi

FALHAS=()
echo "==> at01-instalacao"; (cd "at01-instalacao" && ./run.sh) || FALHAS+=("at01-instalacao")
echo "==> at02-hello-world"; (cd "at02-hello-world" && ./run.sh) || FALHAS+=("at02-hello-world")
echo "==> at03-listar-containers"; (cd "at03-listar-containers" && ./run.sh) || FALHAS+=("at03-listar-containers")
echo "==> at04-container-interativo"; (cd "at04-container-interativo" && ./run.sh) || FALHAS+=("at04-container-interativo")
echo "==> at05-remover-container"; (cd "at05-remover-container" && ./run.sh) || FALHAS+=("at05-remover-container")
echo "==> at06-imagem"; (cd "at06-imagem" && ./run.sh) || FALHAS+=("at06-imagem")
echo "==> at07-executar-imagem"; (cd "at07-executar-imagem" && ./run.sh) || FALHAS+=("at07-executar-imagem")
echo "==> at08-background"; (cd "at08-background" && ./run.sh) || FALHAS+=("at08-background")
echo "==> at09-portas"; (cd "at09-portas" && ./run.sh) || FALHAS+=("at09-portas")
echo "==> at10-volumes"; (cd "at10-volumes" && ./run.sh) || FALHAS+=("at10-volumes")
echo "==> at11-inspect"; (cd "at11-inspect" && ./run.sh) || FALHAS+=("at11-inspect")
echo "==> at12-exec"; (cd "at12-exec" && ./run.sh) || FALHAS+=("at12-exec")
echo "==> at13-rede"; (cd "at13-rede" && ./run.sh) || FALHAS+=("at13-rede")
echo "==> at14-conectando-containers"; (cd "at14-conectando-containers" && ./run.sh) || FALHAS+=("at14-conectando-containers")
echo "==> at15-compose"; (cd "at15-compose" && ./run.sh) || FALHAS+=("at15-compose")
echo "==> at16-parando-servicos"; (cd "at16-parando-servicos" && ./run.sh) || FALHAS+=("at16-parando-servicos")
echo "==> at17-atualizando-imagem"; (cd "at17-atualizando-imagem" && ./run.sh) || FALHAS+=("at17-atualizando-imagem")
echo "==> at18-tagging"; (cd "at18-tagging" && ./run.sh) || FALHAS+=("at18-tagging")
echo "==> at19-publicando-imagem"; (cd "at19-publicando-imagem" && ./run.sh) || FALHAS+=("at19-publicando-imagem")
echo "==> at20-baixando-imagem"; (cd "at20-baixando-imagem" && ./run.sh) || FALHAS+=("at20-baixando-imagem")
echo "==> at21-variaveis-ambiente"; (cd "at21-variaveis-ambiente" && ./run.sh) || FALHAS+=("at21-variaveis-ambiente")
echo "==> at22-limitando-recursos"; (cd "at22-limitando-recursos" && ./run.sh) || FALHAS+=("at22-limitando-recursos")
echo "==> at23-multistage"; (cd "at23-multistage" && ./run.sh) || FALHAS+=("at23-multistage")
echo "==> at24-monitorando"; (cd "at24-monitorando" && ./run.sh) || FALHAS+=("at24-monitorando")
echo "==> at25-script-inicializacao"; (cd "at25-script-inicializacao" && ./run.sh) || FALHAS+=("at25-script-inicializacao")
echo "==> at26-docker-secrets"; (cd "at26-docker-secrets" && ./run.sh) || FALHAS+=("at26-docker-secrets")
echo "==> at27-backup-volumes"; (cd "at27-backup-volumes" && ./run.sh) || FALHAS+=("at27-backup-volumes")
echo "==> at28-restaurando-volumes"; (cd "at28-restaurando-volumes" && ./run.sh) || FALHAS+=("at28-restaurando-volumes")
echo "==> at29-proxy-reverso"; (cd "at29-proxy-reverso" && ./run.sh) || FALHAS+=("at29-proxy-reverso")
echo "==> at30-limpeza"; (cd "at30-limpeza" && ./run.sh) || FALHAS+=("at30-limpeza")

echo
if [ ${#FALHAS[@]} -eq 0 ]; then
  echo "Todas as atividades rodaram sem erro."
else
  echo "Atividades com falha: ${FALHAS[*]}"
  echo "Revise o EVIDENCIA.md de cada uma para ver o motivo."
fi
