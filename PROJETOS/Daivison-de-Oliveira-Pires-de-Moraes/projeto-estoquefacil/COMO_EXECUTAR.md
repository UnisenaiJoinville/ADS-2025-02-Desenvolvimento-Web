# Execução e manutenção local

## Início rápido

**Requisitos:** Node.js 22+ e Docker Desktop aberto (Linux: Docker Engine e Compose v2).

Windows: extraia o ZIP e abra `Iniciar-Windows.bat`. Terminal em qualquer plataforma:

```bash
node scripts/setup.js
docker compose up -d --build
```

Acesse `http://localhost:3000`. No primeiro uso, crie sua conta. A primeira será ADMIN. Não há senha padrão. O banco traz apenas exemplos de estoque.

O MySQL pode levar algum tempo para inicializar. Confira `docker compose ps`; o banco precisa aparecer `healthy`. Aguarde também o serviço API ficar saudável. Logs: `docker compose logs --tail 100 api db`.

Se a porta 3000 estiver ocupada, altere `API_HOST_PORT=3001` em `.env` e use `http://localhost:3001`. Para conflito na porta do banco, altere `DB_HOST_PORT`. O banco e a API continuam usando internamente 3306 e 3000.

## Desenvolvimento direto com Node

```bash
npm ci
npm run build
node scripts/setup.js
```

Se estiver usando o banco do Compose, suba somente `docker compose up -d db`. No `.env`, altere `DB_HOST=127.0.0.1` e `DB_PORT=3308` (ou sua porta externa). As credenciais são as mesmas geradas pelo setup. Então:

```bash
npm run dev
```

O Compose força `DB_HOST=db` e `DB_PORT=3306` para a API dentro do container, mesmo que o `.env` tenha os valores locais. Não abra o HTML diretamente por `file://`: a interface precisa do servidor HTTP e da API.

Depois de modificar estilos ou bibliotecas, rode `npm run build`. O ZIP já inclui CSS e bibliotecas locais compilados, além do código para recriá-los.

## Testes reproduzíveis

```bash
npm ci
npm run build
npm test
npm run check
docker compose -f docker-compose.test.yml up -d --wait
npm run test:integration
npx playwright install chromium
npm run test:ui
```

No Linux, se faltarem dependências do navegador, instale-as conforme as instruções apresentadas pelo Playwright. Os testes de integração e interface usam bancos separados terminados em `_test`, limpando **somente esses bancos**. Não aponte testes para um banco de trabalho.

Configuração padrão de teste: MySQL em `127.0.0.1:3307`, usuário `root`, senha `testpass`. Variáveis opcionais: `TEST_DB_HOST`, `TEST_DB_PORT`, `TEST_DB_USER`, `TEST_DB_PASSWORD`, `TEST_DB_NAME`, `TEST_UI_DB_NAME`. O usuário de teste precisa criar/apagar bancos de teste.

```bash
docker compose -f docker-compose.test.yml down
```

## Backup e restauração de ensaio

Use Git Bash, WSL ou terminal Unix:

```bash
bash deploy/backup.sh
bash deploy/restore-test.sh backups/ARQUIVO.sql.gz
```

O segundo comando restaura exclusivamente em `restore_test`, sem substituir o banco de uso. Compare tabelas e contagens. Não foi criado agendamento nem conexão externa automaticamente. O script de disco pode ser chamado com `bash deploy/check-disk.sh /caminho/alertas.log`; uma sugestão de cron local Linux é `*/15 * * * * /caminho/check-disk.sh /caminho/alertas.log`.

## Atualização de banco existente

**Instalação nova:** o `init.sql` já contém tudo; não execute as migrações antigas de novo.

**Banco da versão anterior:** faça backup, confira quais alterações já existem e aplique apenas as faltantes. Os scripts 001–003 do material são históricos e há arquivos de rollback que não devem ser executados automaticamente. Para um banco já concluído até a aula 45, as alterações desta entrega estão em `004-revisao-local.sql` e `005-checks.sql`. Antes dos CHECKs, corrija eventuais saldos/preços inválidos. Não recrie volumes para atualizar dados importantes.

A troca das senhas em `.env` não altera automaticamente usuários de um banco já criado. Preserve o `.env` junto com seu ambiente local; ele não está incluído no ZIP.

## Ensaio do perfil de produção sem domínio

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Continua em localhost. Não há Caddy, DNS nem certificados. `database/producao/001-schema.sql` contém estrutura vazia, para uma instalação manual sem estoque de exemplo; o Compose principal monta apenas `database/init.sql`.
