# 11 - Atividade — Atividade teórica — Containers não substituem segurança, versionamento e observabilidade

## Resposta
Containers isolam e padronizam a execução, mas não corrigem uma aplicação insegura. Ainda é necessário controlar versões, atualizar dependências, evitar execução como root, proteger segredos, limitar portas e permissões e revisar imagens.

Também é necessário versionar Dockerfiles e Compose para reproduzir builds. Observabilidade continua essencial porque um serviço em container pode falhar, consumir recursos, perder conectividade ou responder lentamente; por isso logs, métricas, healthchecks e rastreamento ainda são necessários.