# Estoque Fácil — atualizações das aulas 60 a 69

O código inclui busca de produtos, paginação, autocomplete, proteção de histórico, limitadores, gráfico, ícones e estrutura para Tailwind compilado.

**Importante:** o ambiente de edição não teve acesso ao registro npm. Assim, o `package-lock.json` não foi regenerado e `public/css/app.css` ainda precisa ser compilado. Antes de executar, rode `npm install` e `npm run css:build`. Para Docker, use `docker compose up -d --build` após instalar.

Em bancos existentes, execute `database/migrations/004-produto-com-historico.sql` uma única vez. Faça backup antes.

Não foram realizados testes integrados com MySQL, Docker ou navegador. Verifique as telas e os fluxos antes de usar em produção.
