#!/bin/sh
echo "Container iniciado com sucesso!"
echo "Data/hora de inicializacao: $(date)"
exec "$@"
