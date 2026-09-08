# 24 - Atividade — P7: healthcheck

Nesta solução o healthcheck foi aplicado à API do cenário 2. O teste executa uma requisição HTTP local no endpoint `/health` usando Node.

```yaml
healthcheck:
  test: ["CMD", "node", "healthcheck.js"]
  interval: 10s
  timeout: 3s
  retries: 5
```

Para verificar:

```bash
docker compose up -d --build
docker compose ps
```

Após a inicialização, a coluna de estado deve indicar `healthy`. Registre a saída real em `EVIDENCIAS.md`.
