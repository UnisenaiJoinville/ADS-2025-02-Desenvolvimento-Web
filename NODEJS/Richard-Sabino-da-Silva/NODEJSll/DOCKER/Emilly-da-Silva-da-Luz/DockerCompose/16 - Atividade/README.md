# 16 - Atividade — Compose no onboarding

Sem uma configuração compartilhada, cada integrante precisa instalar e ajustar banco, cache, broker e runtime por conta própria. Esse processo demora e costuma gerar diferenças entre máquinas.

Dockerfiles, Compose, `.env.example` e README registram boa parte dessas decisões junto do código. Assim, uma pessoa nova consegue identificar os componentes e iniciar o ambiente com poucos comandos.

Além de agilizar a entrada no projeto, isso facilita reproduzir problemas, pois a equipe trabalha sobre configurações mais próximas.
