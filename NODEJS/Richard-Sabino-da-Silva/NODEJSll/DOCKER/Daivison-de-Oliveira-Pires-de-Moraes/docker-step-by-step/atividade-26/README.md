# Atividade 26: Usando Docker Secrets

## Objetivo
Criar um secret e usá-lo em um serviço do Docker Swarm.

## Comandos executados
```bash
docker swarm init
echo "minha-senha" | docker secret create minha-senha -
docker service create --name meu-servico --secret minha-senha nginx
```

## O que foi observado / evidenciado
Docker Secrets só funciona em modo Swarm. O secret fica montado dentro do container em `/run/secrets/minha-senha`, criptografado em trânsito e repouso, sem aparecer em variáveis de ambiente ou no `docker inspect` — forma correta de lidar com senhas/chaves.
