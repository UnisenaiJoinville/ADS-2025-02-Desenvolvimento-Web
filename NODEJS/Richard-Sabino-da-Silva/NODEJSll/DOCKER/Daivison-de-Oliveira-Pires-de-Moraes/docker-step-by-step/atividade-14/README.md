# Atividade 14: Conectando containers à rede

## Objetivo
Subir dois containers na mesma rede e testar a comunicação entre eles.

## Comandos executados
```bash
docker network create minha-rede
docker run -d --network minha-rede --name container1 nginx
docker run -d --network minha-rede --name container2 nginx
docker exec -it container1 curl http://container2
```

## O que foi observado / evidenciado
Como ambos estão na mesma rede customizada, o Docker resolve `container2` internamente para o IP correto — DNS embutido do Docker, essencial para arquiteturas com múltiplos serviços.
