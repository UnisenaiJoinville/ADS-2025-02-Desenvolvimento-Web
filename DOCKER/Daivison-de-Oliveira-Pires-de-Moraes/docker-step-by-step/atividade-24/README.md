# Atividade 24: Monitorando containers

## Objetivo
Observar o consumo de recursos dos containers em tempo real.

## Comandos executados
```bash
docker stats
```

## O que foi observado / evidenciado
Mostra, por container: CPU %, memória usada/limite, tráfego de rede (NET I/O), leitura/escrita em disco (BLOCK I/O) e número de processos (PIDS). É o equivalente ao `top`/`htop`, por container, atualizado em tempo real.
