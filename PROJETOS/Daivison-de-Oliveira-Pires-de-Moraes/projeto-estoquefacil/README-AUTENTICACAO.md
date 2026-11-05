# Estoque Fácil — Autenticação

Neste trabalho eu implementei a autenticação do sistema seguindo as etapas 23 até 32 da apostila.

## O que foi feito

- Cadastro de usuários
- Login com e-mail e senha
- Senha salva com hash usando `bcryptjs`
- Autenticação com JWT
- Middleware protegendo a API
- Tela de cadastro em Vue
- Tela de login em Vue
- Sessão salva no `localStorage`
- Proteção das páginas internas
- Mostrar usuário logado no menu
- Botão de sair
- Tratamento de token inválido ou expirado

## 1. Tecnologias

- Node.js
- Express
- MySQL
- Docker / Docker Compose
- Vue 3 via CDN
- Tailwind CSS via CDN
- bcryptjs
- jsonwebtoken

## 2. Como executar

### 2.1 Pré-requisitos

Ter instalado:

- Docker Desktop
- Docker Compose

### 2.2 Configurar o ambiente

Na raiz do projeto, crie um arquivo `.env` baseado no `.env.example`.

Exemplo:

```env
PORT=3000
DB_HOST=db
DB_PORT=3306
DB_USER=estoque
DB_PASSWORD=estoque123
DB_NAME=estoque_db
DB_ROOT_PASSWORD=root123
DB_HOST_PORT=3308
JWT_SECRET=troque-este-segredo-em-producao-estoque-facil-2026
JWT_EXPIRES_IN=1d
```

> Em um projeto real, o `JWT_SECRET` deve ser uma chave aleatória e não deve ser enviada para o Git.

### 2.3 Subir o projeto

No terminal:

```bash
docker compose up -d --build
```

O `--build` é importante porque foram adicionadas as bibliotecas `bcryptjs` e `jsonwebtoken`.

Depois, abra:

```text
http://localhost:3000/login.html
```

## 3. Banco de dados

A tabela `users` foi adicionada ao banco com:

- `id`
- `name`
- `email`
- `password_hash`
- `active`
- `created_at`
- `updated_at`

Existe também uma conta de demonstração:

```text
E-mail: professor@estoquefacil.com
Senha: 123456
```

A senha não fica salva como texto puro. O banco guarda somente o hash do bcrypt.

Se o banco já existia antes da autenticação, rode a migração:

```bash
docker compose exec -T db mysql -uestoque -pestoque123 estoque_db < database/migrations/001-create-users.sql
```

## 4. Como funciona a autenticação

O fluxo que eu implementei ficou assim:

```text
Cadastro
   ↓
Validação
   ↓
bcrypt.hash()
   ↓
Banco de dados

Login
   ↓
Busca usuário
   ↓
bcrypt.compare()
   ↓
JWT
   ↓
localStorage
   ↓
Authorization: Bearer <token>
   ↓
Middleware
   ↓
Sistema liberado
```

## 5. Back-end

### Validação

O arquivo `user-validator.js` verifica nome, e-mail, senha e confirmação de senha.

### Repositório

O `user-repository.js` é responsável pelas consultas no MySQL. O hash só é buscado na função usada pelo login.

### Service

O `auth-service.js` concentra as regras principais:

- verifica se o e-mail já existe;
- cria o hash da senha;
- compara a senha no login;
- gera o JWT;
- devolve somente os dados públicos do usuário.

### Middleware

O `ensure-authenticated.js` verifica o cabeçalho:

```text
Authorization: Bearer TOKEN
```

Sem token ou com token inválido, a API retorna `401`.

## 6. Rotas de autenticação

| Método | Rota | Função |
|---|---|---|
| POST | `/api/auth/register` | Criar conta |
| POST | `/api/auth/login` | Fazer login |
| GET | `/api/auth/me` | Ver usuário autenticado |
| GET | `/api/health` | Verificar se API está funcionando |

As rotas de cadastro e login são públicas. As rotas do sistema, como produtos, categorias, movimentações e dashboard, ficam protegidas pelo middleware.

## 7. Front-end

Foram criados:

```text
public/login.html
public/cadastro.html
public/js/login.js
public/js/cadastro.js
public/js/auth.js
```

O `auth.js` centraliza o uso do `localStorage`. Assim, as outras telas não precisam manipular diretamente as chaves da sessão.

As páginas internas usam `requireAuth()`. Se não existir sessão, o usuário é enviado para o login.

## 8. Testes e conferências

### Teste 1 — API funcionando

```bash
curl -i http://localhost:3000/api/health
```

Esperado: `200` e `status: ok`.

### Teste 2 — API protegida

```bash
curl -i http://localhost:3000/api/products
```

Sem login, deve retornar `401` com `Token nao informado`.

### Teste 3 — Login

Use:

```text
professor@estoquefacil.com
123456
```

Esperado: `200`, usuário e token JWT.

### Teste 4 — Senha errada

A mensagem esperada é:

```text
E-mail ou senha invalidos
```

O sistema não informa se o problema foi o e-mail ou a senha.

### Teste 5 — Cadastro

Ao criar uma conta pela tela de cadastro, o sistema deve enviar para o login com o e-mail preenchido.

### Teste 6 — Página sem login

Apague as informações do `localStorage` e tente abrir o dashboard. O sistema deve redirecionar para `/login.html`.

### Teste 7 — Sair

Depois de entrar, clique em **Sair**. A sessão deve ser removida e o sistema deve voltar para o login.

### Teste 8 — Token adulterado

Alterando o token salvo no navegador, a API deve rejeitar a requisição e a sessão deve ser removida.

## 9. Estrutura principal

```text
src/
├── modules/
│   └── auth/
│       ├── auth-controller.js
│       ├── auth-routes.js
│       ├── auth-service.js
│       ├── user-repository.js
│       └── user-validator.js
├── shared/
│   ├── auth/
│   │   ├── ensure-authenticated.js
│   │   └── token.js
│   └── errors/
│       └── app-error.js
└── routes/
    └── index.js

public/
├── login.html
├── cadastro.html
└── js/
    ├── auth.js
    ├── login.js
    └── cadastro.js
```

## 10. Problemas que apareceram / cuidados

- Depois de alterar o `package.json`, foi necessário reconstruir o container com `--build`.
- Se o banco já tinha sido criado, o `init.sql` não roda novamente; por isso foi criada uma migração.
- O `JWT_SECRET` precisa ter pelo menos 32 caracteres.
- O token deve ser enviado com `Bearer`.
- O botão de mostrar senha precisa ter `type="button"`, senão ele tenta enviar o formulário.

## 11. Validação feita durante o desenvolvimento

Eu conferi a sintaxe dos arquivos JavaScript do projeto (`44` arquivos), testei o `user-validator.js` com casos válidos e inválidos e conferi a ligação entre rotas, middleware, JWT, `api.js` e as telas protegidas.

O teste integrado com Docker/MySQL precisa ser executado no computador onde o Docker Desktop estiver disponível, porque este ambiente de desenvolvimento não possui o comando `docker`.

## 12. Resumo

A autenticação ficou dividida em camadas. O usuário faz cadastro ou login pelo Vue, a API valida os dados, o bcrypt protege a senha e o JWT identifica a sessão. Depois disso, o middleware verifica o token antes de liberar as funcionalidades do estoque.

Foi uma implementação seguindo as etapas 23 até 32, mantendo o padrão de organização que o projeto já tinha.
