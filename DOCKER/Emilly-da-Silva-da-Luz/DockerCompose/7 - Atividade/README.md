# 7 - Atividade — executar PgAdmin somente com profile

O serviço de administração foi configurado com `profiles: ["tools"]`. Assim, o ambiente normal não inicia o PgAdmin.

```bash
docker compose up -d --build
docker compose ps
```

Para ativá-lo:

```bash
docker compose --profile tools up -d pgadmin
```

Depois, abra `http://localhost:5050`. Nesta versão de laboratório, o login definido no Compose é `docker@local.dev` e a senha `docker123`.

O benefício do profile é manter ferramentas auxiliares desligadas enquanto não forem necessárias.
