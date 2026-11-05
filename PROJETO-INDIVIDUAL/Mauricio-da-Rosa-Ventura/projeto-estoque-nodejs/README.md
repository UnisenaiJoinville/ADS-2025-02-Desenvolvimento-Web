# Estoque Facil

Sistema de gestao de estoque com Node.js, Express, MySQL, Docker e Vue.

## Como rodar

1. Copie o `.env.example` para `.env` e ajuste se precisar.
2. Instale as dependencias e gere o CSS do Tailwind (Aula 69).
   O `public/css/app.css` e gerado, e por isso nao esta no Git:
   sem este passo as telas abrem sem estilo.

   ```bash
   npm install
   npm run css:build
   ```

3. Suba os containers:

   ```bash
   docker compose up -d --build
   ```

4. Acesse http://localhost:3000 (conta de demonstracao:
   `professor@estoquefacil.com` / `123456`).

Enquanto mexe nas telas, deixe `npm run css:watch` rodando em outro
terminal para o CSS ser regerado a cada arquivo salvo.

## Migracoes

Bancos criados antes de cada etapa precisam das migracoes de
`database/migrations` (cada arquivo explica como rodar). A `004`
(Aula 65) impede excluir produto que tenha movimentacoes.
