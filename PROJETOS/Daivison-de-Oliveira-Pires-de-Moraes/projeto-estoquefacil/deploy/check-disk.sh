#!/usr/bin/env bash
set -euo pipefail
log="${1:-./disk-alerts.log}"
usage="$(df -P . | awk 'NR==2 {gsub(/%/,"",$5); print $5}')"
if [ "$usage" -ge 80 ]; then printf '%s disco em %s%%\n' "$(date -Is)" "$usage" >> "$log"; fi
