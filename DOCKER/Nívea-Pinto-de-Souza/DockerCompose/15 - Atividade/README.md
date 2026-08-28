# 15 - Atividade — Atividade teórica — Risco da tag latest

## Resposta
A tag `latest` pode apontar para conteúdos diferentes ao longo do tempo. Assim, a mesma configuração pode baixar uma versão nova e introduzir mudanças incompatíveis sem alteração no repositório. Isso prejudica reprodutibilidade, rollback e diagnóstico.

Em ambientes profissionais, é melhor fixar versões, como `mysql:8.4`, `redis:7.4-alpine` ou `nginx:1.27-alpine`, e atualizar de forma controlada.