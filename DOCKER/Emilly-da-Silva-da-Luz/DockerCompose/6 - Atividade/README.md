# 6 - Atividade — acessar o Cenário 2 pelo Nginx

## Execução
Na pasta `projeto`:

```bash
cp .env.example .env
docker compose up -d --build
docker compose ps
```

No PowerShell, o primeiro comando pode ser substituído por:

```powershell
Copy-Item .env.example .env
```

Depois, acesse `http://localhost:8080`. A página React deve ser entregue pelo Nginx. A rota `http://localhost:8080/api/health` é encaminhada para a API Node.
