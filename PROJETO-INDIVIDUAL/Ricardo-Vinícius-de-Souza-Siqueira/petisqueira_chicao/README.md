# Petisqueira Chicão — Projeto Completo (Frontend + PHP)

```
petisqueira_chicao/
├── README.md
├── frontend/                      → o site (HTML, CSS, JS, imagens)
└── php-backend/                   → a API em PHP
```

## Como rodar

### 1. Banco de dados

**Banco novo (ainda não existe):** no MySQL Workbench (ou terminal) rode, NESTA ORDEM:
1. `php-backend/database/schema.sql`
2. `php-backend/database/seed.sql`

**Banco que você já tinha criado antes:** rode apenas `php-backend/database/migration_v2.sql`
(arquivo inteiro, com o raio ⚡ sem nada selecionado). Ele só adiciona o que falta e pode ser
rodado mais de uma vez. Ele cria as tabelas `itens_pedido`, `reset_senha` e `limites_requisicao`,
copia os pedidos antigos para `itens_pedido` e troca o token de sessão por hash.
**Depois dessa migração todo mundo precisa fazer login de novo** (isso é esperado).

**Importante sobre acentuação:** se for importar pelo terminal (em vez do Workbench),
use sempre `--default-character-set=utf8mb4`:
```bash
mysql -u root -p --default-character-set=utf8mb4 < php-backend/database/schema.sql
mysql -u root -p --default-character-set=utf8mb4 < php-backend/database/seed.sql
```

**Cartão presente com saldo e validade (versão 3):** se o seu banco já existia, rode também
`php-backend/database/migration_v3.sql` (arquivo inteiro, pode rodar mais de uma vez). Ele cria
`cartoes_emitidos` e `usos_cartao` e já gera o cartão dos pedidos que estavam pagos. Banco novo: o
`schema.sql` já traz tudo.

Depois, torne a sua conta admin (depois de já ter se cadastrado pelo site):
```sql
UPDATE usuarios SET is_admin = TRUE WHERE email = 'seu-email-aqui@exemplo.com';
```

### 2. Colocar o projeto dentro do XAMPP

Copie a pasta `petisqueira_chicao` inteira (com `frontend` e `php-backend` dentro)
para dentro de `C:\xampp\htdocs\`. No final deve existir o caminho:
`C:\xampp\htdocs\petisqueira_chicao\php-backend\...`

### 3. Configurar e ligar o backend PHP

```bash
cd C:\xampp\htdocs\petisqueira_chicao\php-backend\config
copy config.example.php config.php
```
Abra `config.php` e preencha com os dados do seu MySQL. Confira também as opções novas
`SITE_URL` (endereço do front-end, usado no link do e-mail de recuperação de senha), `APP_DEBUG`
e `CAPACIDADE_POR_HORARIO`. **Atenção**: se você usa
um MySQL instalado separadamente (fora do XAMPP), confira a porta certa — pode não
ser a 3306 padrão. Se preferir, também pode usar o MySQL que já vem dentro do
XAMPP (nesse caso, ligue o módulo "MySQL" no painel do XAMPP também).

Abra o **XAMPP Control Panel** e clique em **"Start"** ao lado de **Apache**
(o status deve ficar verde, "Running"). Você NÃO precisa rodar `php -S` nem
nenhum outro comando — o Apache do XAMPP já executa os arquivos `.php` sozinho.

Teste abrindo no navegador:
`http://localhost/petisqueira_chicao/php-backend/produtos/listar.php`
Se aparecer uma lista em JSON com os cartões presente, está funcionando.


### 3.1 E-mail (SMTP de teste) e testes automatizados

O sistema envia 4 e-mails (reserva recebida, reserva confirmada, pagamento com o código do cartão e
recuperação de senha). Para o XAMPP, que não tem servidor de e-mail, use um SMTP de teste gratuito:

1. Crie uma conta no [Mailtrap](https://mailtrap.io) (ou Ethereal, ou Gmail com senha de app) e copie
   Host, Port, Username e Password da caixa de entrada de testes.
2. No `config.php`, descomente e preencha o bloco **SMTP DE TESTE** (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
   `SMTP_PASS`, `SMTP_SECURE`). O PHPMailer já está na pasta `php-backend/vendor`
   (ou rode `composer install` dentro de `php-backend`).
3. Envie os 4 e-mails de teste e tire a captura da caixa de entrada para o anexo:
   `php tests/testar_email.php`
4. Rode a suíte completa (30 testes, incluindo e-mail, recuperação de senha, bloqueio após 5 senhas erradas
   e limite de requisições por IP): `php tests/testar_sistema.php`
   (precisa de `SIMULATED_PAYMENTS_ENABLED = true` no `config.php` do ambiente de testes).

### 4. Abrir o site

Como tudo está dentro do `htdocs`, o Apache também serve o front-end direto —
não precisa de Live Server nem de outro servidor. Só abrir:
`http://localhost/petisqueira_chicao/frontend/index.html`

O `frontend/js/api.js` já está configurado para chamar
`http://localhost/petisqueira_chicao/php-backend` — se você mudar o nome da
pasta dentro do `htdocs`, ajuste esse arquivo também.

### 5. Testar

Com o Apache do XAMPP ligado, acesse `http://localhost/petisqueira_chicao/frontend/index.html`:
- Crie uma conta em `criarconta.html` (senha com no mínimo 8 caracteres) e faça login em `login.html`
- **Esqueci minha senha:** em `login.html` → "Esqueceu a senha?". O link chega por e-mail. No XAMPP
  sem servidor de e-mail, coloque `define('APP_DEBUG', true);` no `config.php`: o link é gravado em
  `C:\xampp\apache\logs\error.log` (procure por "Link de recuperação").
- Faça uma reserva em `reserva.html` (data e horário são obrigatórios; terça a sábado, 18:15–23:15)
- Compre cartões presente: `loja.html` → produto → **Adicionar ao carrinho** (vários cartões diferentes)
  → `carrinho.html` → Finalizar pedido → `checkout.html` (Pix ou cartão simulado) → o código do cartão aparece na tela
- Logado, abra "Minha conta" (`minhaconta.html`): dados, reservas (com botão de cancelar) e pedidos com seus itens
- Acesse `admin.html` com a conta admin: reservas, cartões, mensagens, **pedidos** e relatórios (com exportação CSV)

## Testes automatizados e requisitos

- `docs/REQUISITOS.md` lista os requisitos funcionais (RF01–RF10) e não funcionais (RNF01–RNF06), com o arquivo
  que implementa cada um e o teste que o verifica.
- `php-backend/tests/testar_sistema.php` roda os cenários de teste contra o servidor real (Apache + MySQL ligados):
  reserva com e sem login, e-mail de confirmação, compra por Pix e por cartão, "Minha conta" sem login, cliente tentando
  abrir o painel admin, admin alterando status, uso e desativação de cartão-presente, relatórios, "Fale Conosco" com
  campo vazio, senha/token e logout.
  ```bash
  cd C:\xampp\htdocs\petisqueira_chicao\php-backend\tests
  C:\xampp\php\php.exe testar_sistema.php
  ```
  Ele mostra o resultado no terminal e grava `tests/resultado_testes.md` (quadro Nº · Requisito · Funcionalidade · Ação ·
  Esperado · Obtido · Situação), pronto para colar no relatório. Use só no banco de desenvolvimento: o script cria
  dados `@teste.local`, apaga tudo no final e limpa a tabela `limites_requisicao`.

## Endpoints da API (PHP)

| Método | Rota                                | O que faz                                      | Precisa login? |
|--------|-------------------------------------|------------------------------------------------|----------------|
| POST   | `/auth/cadastro.php`                | Cria uma conta                                 | Não            |
| POST   | `/auth/login.php`                   | Login (devolve um token)                       | Não            |
| POST   | `/auth/logout.php`                  | Encerra a sessão                               | Sim            |
| POST   | `/auth/esqueci_senha.php`           | Envia o link de recuperação por e-mail         | Não            |
| POST   | `/auth/redefinir_senha.php`         | Define a nova senha (`{token, senha}`)         | Não (token do e-mail) |
| GET    | `/conta/minha_conta.php`            | Dados, reservas e pedidos (com itens)          | Sim            |
| GET    | `/produtos/listar.php`              | Lista produtos ativos (loja)                   | Não            |
| GET    | `/produtos/detalhe.php?id=X`        | Detalhe de um produto                          | Não            |
| GET    | `/produtos/admin_listar.php`        | Lista TODOS os produtos                        | Admin          |
| POST   | `/produtos/criar.php`               | Cria um produto                                | Admin          |
| POST   | `/produtos/atualizar.php`           | Edita um produto (`{id, ...}`)                 | Admin          |
| POST   | `/produtos/deletar.php`             | Desativa um produto (`{id}`)                   | Admin          |
| POST   | `/reservas/criar.php`               | Cria uma reserva (data e horário obrigatórios) | Opcional       |
| POST   | `/reservas/cancelar.php`            | Cliente cancela a PRÓPRIA reserva (`{id}`)     | Sim            |
| GET    | `/reservas/listar.php`              | Lista todas as reservas                        | Admin          |
| POST   | `/reservas/atualizar.php`           | Edita/muda status (`{id, status}`)             | Admin          |
| POST   | `/reservas/deletar.php`             | Exclui uma reserva (`{id}`)                    | Admin          |
| POST   | `/pedidos/criar.php`                | Cria pedido com vários itens (`{itens:[{produto_id, quantidade}], nome, email}`) | Opcional |
| GET    | `/pedidos/detalhe.php?id=X&codigo=Y`| Pedido com itens                               | Dono ou código |
| POST   | `/pedidos/pagar.php`                | Confirma o pagamento (`{id, codigo, forma_pagamento}`) | Dono ou código |
| GET    | `/pedidos/admin_listar.php`         | Lista todos os pedidos com itens               | Admin          |
| POST   | `/pedidos/admin_cancelar.php`       | Cancela um pedido pendente (`{id}`)            | Admin          |
| GET    | `/cartoes/admin_listar.php?status=&q=` | Lista cartões emitidos (saldo, validade, status) | Admin     |
| POST   | `/cartoes/utilizar.php`             | Registra o uso: desconta um valor do saldo (`{id, valor, observacao}`) | Admin |
| GET    | `/cartoes/usos.php?id=X`            | Histórico de usos de um cartão                 | Admin          |
| GET    | `/relatorios/reservas.php`          | Relatório de reservas (totais/status)          | Admin          |
| GET    | `/relatorios/vendas.php`            | Relatório de vendas dos cartões                | Admin          |
| GET    | `/relatorios/exportar.php?tipo=reservas\|vendas&inicio=&fim=` | Exporta CSV           | Admin          |

Rotas "Admin" exigem o cabeçalho `Authorization: Bearer <token>` de uma conta com `is_admin = TRUE`
(a checagem é feita no servidor, em toda rota).

## Cartão presente: saldo, validade e status

- Cada pedido **pago** gera um cartão em `cartoes_emitidos`, com o código de resgate, saldo igual ao valor do
  pedido e **validade de 6 meses** (até 23:59:59 do último dia). Para mudar o prazo, altere `CARTAO_VALIDADE_MESES`
  em `php-backend/includes/cartoes.php`.
- O saldo pode ser usado **em mais de uma visita**: no painel, aba **Cartões emitidos**, busque o código e clique em
  **Registrar uso**. Cada uso fica no histórico (`usos_cartao`), com quem registrou. O servidor trava a linha do cartão
  (`FOR UPDATE`) para dois usos simultâneos não gastarem o mesmo saldo.
- Status: `ativo` → `utilizado` (saldo zerou) ou `expirado` (passou da validade). A expiração é aplicada sempre que
  os cartões são listados/consultados e também na hora de usar, então não precisa de rotina agendada.
- Cliente logado vê saldo, validade e status em **Minha conta**; o e-mail de pagamento confirmado também informa a validade.
- O relatório de vendas mostra a situação atual dos cartões (ativos, utilizados, expirados e o saldo de cada grupo).

## Sobre o pagamento

O `checkout.html` simula a confirmação de pagamento — **nenhuma cobrança real
acontece** e os dados de cartão digitados não saem do navegador. Antes de usar isso com clientes de verdade, você precisa integrar um
gateway de pagamento (Mercado Pago, Stripe, PagSeguro etc.) — veja os comentários
em `php-backend/pedidos/pagar.php`.

## Segurança (resumo)

- Senhas com bcrypt (mínimo 8 caracteres); consultas sempre com PDO (prepared statements).
- Token de sessão guardado no banco **somente como hash SHA-256**, com validade de 7 dias; logout e troca de senha o invalidam.
- 5 senhas erradas bloqueiam o login da conta por 15 minutos; além disso há limite de tentativas por IP em login, cadastro, reservas, pedidos, contato e recuperação de senha (tabela `limites_requisicao`).
- Recuperação de senha: token aleatório de uso único, guardado só como hash, válido por 1 hora; a resposta é a mesma exista ou não o e-mail.
- Autorização no servidor em toda rota admin; pedidos só podem ser vistos/pagos pelo dono (logado), por um admin ou por quem tem o código secreto do pedido; o cliente só cancela a própria reserva.
- O preço e o total do pedido são calculados no servidor; o valor unitário de cada item fica gravado no momento da compra. O status "pago" nunca vem do navegador.
- Dados de cartão **não** são enviados nem guardados (o pagamento é simulado).
- Reservas: data e horário obrigatórios, controle de capacidade por horário (sem overbooking), reserva cancelada não reabre.
- CORS restrito às origens permitidas (`CORS_ORIGENS`); erros técnicos vão para o log do servidor.
- Exportação CSV protegida contra "injeção de fórmula" do Excel.
- Fuso horário único: `America/Sao_Paulo` (PHP e MySQL).
- Nunca suba `php-backend/config/config.php` para o GitHub (já está no `.gitignore`).
