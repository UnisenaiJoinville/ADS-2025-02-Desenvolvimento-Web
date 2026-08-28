# 16 - Atividade — Atividade teórica — Compose e onboarding

## Resposta
Docker Compose melhora o onboarding porque transforma a arquitetura local em configuração versionada. Um novo desenvolvedor não precisa instalar manualmente cada versão de banco, Redis, RabbitMQ e runtime.

Com `.env.example`, Dockerfiles, `docker-compose.yml` e README, ele consegue entender serviços, portas, dependências e variáveis e subir o ambiente com poucos comandos, como `docker compose up -d --build`. Isso reduz diferenças entre máquinas e o problema de “funciona na minha máquina”.