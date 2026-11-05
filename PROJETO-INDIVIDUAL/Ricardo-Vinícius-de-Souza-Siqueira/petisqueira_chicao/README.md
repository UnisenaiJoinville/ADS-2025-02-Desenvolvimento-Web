# Petisqueira Chicão — Projeto Completo (Frontend + PHP)

```
petisqueira_chicao/
├── README.md
├── frontend/                      → o site (HTML, CSS, JS, imagens)
└── php-backend/                   → a API em PHP
```

## Como rodar

### 1. Banco de dados

Se você **ainda não criou o banco**, no MySQL Workbench (ou terminal) rode, NESTA ORDEM:
1. `php-backend/database/schema.sql`
2. `php-backend/database/seed.sql`

Se você **já tinha criado o banco antes** (numa tentativa anterior, com Node.js ou uma
versão antiga), rode `php-backend/database/migration_existente.sql` — ele só adiciona
o que falta, sem apagar nada que já existia.

**Banco criado antes da atualização de segurança?** Rode também `php-backend/database/migration_seguranca.sql`
(adiciona expiração do token, bloqueio de login e o código de acesso dos pedidos).

**Importante sobre acentuação:** se for importar pelo terminal (em vez do Workbench),
use sempre `--default-character-set=utf8mb4`, senão nomes com "ã", "ç" etc. ficam
corrompidos:
```bash
mysql -u root -p --default-character-set=utf8mb4 < php-backend/database/schema.sql
mysql -u root -p --default-character-set=utf8mb4 < php-backend/database/seed.sql
```

**Banco criado antes da aba "Minha conta"?** Se a página `minhaconta.html` mostrar erro
("banco de dados desatualizado" ou "HTTP 500"), abra no Workbench e execute inteiro o arquivo
`php-backend/database/migration_minha_conta.sql`. Ele só adiciona o que falta e pode ser rodado
mais de uma vez.

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
Abra `config.php` e preencha com os dados do seu MySQL. **Atenção**: se você usa
um MySQL instalado separadamente (fora do XAMPP), confira a porta certa — pode não
ser a 3306 padrão. Se preferir, também pode usar o MySQL que já vem dentro do
XAMPP (nesse caso, ligue o módulo "MySQL" no painel do XAMPP também).

Abra o **XAMPP Control Panel** e clique em **"Start"** ao lado de **Apache**
(o status deve ficar verde, "Running"). Você NÃO precisa rodar `php -S` nem
nenhum outro comando — o Apache do XAMPP já executa os arquivos `.php` sozinho.

Teste abrindo no navegador:
`http://localhost/petisqueira_chicao/php-backend/produtos/listar.php`
Se aparecer uma lista em JSON com os cartões presente, está funcionando.

### 4. Abrir o site

Como tudo está dentro do `htdocs`, o Apache também serve o front-end direto —
não precisa de Live Server nem de outro servidor. Só abrir:
`http://localhost/petisqueira_chicao/frontend/index.html`

O `frontend/js/api.js` já está configurado para chamar
`http://localhost/petisqueira_chicao/php-backend` — se você mudar o nome da
pasta dentro do `htdocs`, ajuste esse arquivo também.

### 5. Testar

Com o Apache do XAMPP ligado, acesse `http://localhost/petisqueira_chicao/frontend/index.html`:
- Crie uma conta em `criarconta.html` e faça login em `login.html`
- Faça uma reserva em `reserva.html`
- Compre um cartão presente em `loja.html` → escolha um produto → `checkout.html`
- Logado, clique em "Minha conta" (ou no ícone de pessoa, nas páginas da loja) no topo para abrir `minhaconta.html` (seus dados, reservas e pedidos).
  As reservas só aparecem ali se forem feitas **com o login ativo**.
- Acesse `admin.html` com a conta que você tornou admin, e gerencie reservas e produtos

## Endpoints da API (PHP)

| Método | Rota                              | O que faz                          | Precisa login? |
|--------|-------------------------------------|--------------------------------------|----------------|
| POST   | `/auth/cadastro.php`               | Cria uma conta                       | Não            |
| POST   | `/auth/login.php`                  | Login (devolve um token)             | Não            |
| POST   | `/auth/logout.php`                 | Encerra a sessão                     | Sim            |
| GET    | `/conta/minha_conta.php`           | Dados, reservas e pedidos do usuário | Sim            |
| GET    | `/produtos/listar.php`             | Lista produtos ativos (loja)         | Não            |
| GET    | `/produtos/detalhe.php?id=X`       | Detalhe de um produto                | Não            |
| GET    | `/produtos/admin_listar.php`       | Lista TODOS os produtos              | Admin          |
| POST   | `/produtos/criar.php`              | Cria um produto                      | Admin          |
| POST   | `/produtos/atualizar.php`          | Edita um produto (`{id, ...}`)       | Admin          |
| POST   | `/produtos/deletar.php`            | Desativa um produto (`{id}`)         | Admin          |
| POST   | `/reservas/criar.php`              | Cria uma reserva                     | Opcional       |
| GET    | `/reservas/listar.php`             | Lista todas as reservas              | Admin          |
| POST   | `/reservas/atualizar.php`          | Edita/muda status (`{id, status}`)   | Admin          |
| POST   | `/reservas/deletar.php`            | Exclui uma reserva (`{id}`)          | Admin          |
| POST   | `/pedidos/criar.php`               | Registra a compra de um produto      | Opcional       |
| GET    | `/pedidos/detalhe.php?id=X&codigo=Y` | Detalhe de um pedido               | Dono ou código |
| POST   | `/pedidos/pagar.php`               | Confirma o pagamento (`{id, codigo}`)| Dono ou código |
| GET    | `/relatorios/reservas.php`         | Relatório de reservas (totais/status)| Admin          |
| GET    | `/relatorios/vendas.php`           | Relatório de vendas dos cartões      | Admin          |

Rotas marcadas como "Admin" exigem o cabeçalho `Authorization: Bearer <token>`,
usando o token devolvido pelo login de uma conta com `is_admin = TRUE`.

## Sobre o pagamento

O `checkout.html` simula a confirmação de pagamento — **nenhuma cobrança real
acontece**. Antes de usar isso com clientes de verdade, você precisa integrar um
gateway de pagamento (Mercado Pago, Stripe, PagSeguro etc.) — veja os comentários
em `php-backend/pedidos/pagar.php`.

## Segurança (resumo)

- Senhas com bcrypt; consultas com PDO (prepared statements).
- Token de sessão com validade de 7 dias; 5 senhas erradas bloqueiam o login por 15 minutos.
- Pedidos só podem ser vistos/pagos pelo dono (logado), por um admin ou por quem tem o código secreto do pedido (compra sem login).
- CORS restrito às origens permitidas (`CORS_ORIGENS` no `config.php`).
- Erros técnicos vão para o log do servidor; o navegador recebe mensagens genéricas.
- Nunca suba `php-backend/config/config.php` para o GitHub (já está no `.gitignore`).
