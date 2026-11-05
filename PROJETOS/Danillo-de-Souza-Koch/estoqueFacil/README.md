# Estoque Facil

Sistema de gestao de estoque com Node.js, Express, MySQL e interface web.

## Desenvolvimento local

1. Copie `.env.example` para `.env` e ajuste as credenciais.
2. Instale dependencias e gere o CSS:

   ```sh
   npm install
   npm run css:build
   ```

3. Inicie os containers:

   ```sh
   docker compose up -d --build
   ```

4. Acesse `http://localhost:3000/login.html`.

Durante o desenvolvimento, use `npm run css:watch` para recompilar o CSS apos
alteracoes em HTML ou JavaScript. O arquivo `public/css/app.css` e gerado e nao
deve ser editado manualmente.

Se o banco local ja existia antes da protecao do historico, aplique a migracao
`database/migrations/004-produto-com-historico.sql` depois de fazer um backup.

## Preparacao para producao

O ambiente de producao usa arquivos separados do Compose local. Configure
`.env` com valores reais e secretos, um dominio apontado para o servidor e
entao execute:

```sh
docker compose -f docker-compose.prod.yml up -d --build
```

`.env.production.example` e apenas um modelo: substitua todos os marcadores e
gere segredos aleatorios no servidor. Nunca envie o `.env` real ao Git. O
banco de producao inicia vazio; crie a conta administrativa antes de restringir
o cadastro publico no `deploy/caddy/Caddyfile`.

Backups podem ser executados no servidor com `bash deploy/backup.sh`. Configure
o agendamento e teste a restauracao antes de depender deles.

O deploy em VPS exige acesso SSH, DNS e configuracao manual do servidor; os
arquivos deste repositorio apenas preparam a aplicacao e seus containers.
