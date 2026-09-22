# Aula 23 — Autenticação: entendendo antes de codar

⏱️ **Tempo estimado:** 30 minutos
📋 **Tipo:** teórica (nenhum código ainda)

---

## Objetivo

Entender **três decisões** que vamos tomar nas próximas aulas — e por que elas são assim:

1. Por que a senha **nunca** é guardada no banco.
2. O que é um **token** e por que ele resolve um problema que o HTTP cria.
3. Onde exatamente entra o "porteiro" que barra quem não fez login.

Não escreva código nesta aula. Vamos desenhar o mapa primeiro, como fizemos na [Aula 00](00-visao-geral.md).

---

## Antes de começar

- [ ] Aulas 00 a 22 concluídas (o Estoque Fácil funcionando por inteiro)
- [ ] Containers no ar: `docker compose ps` mostra os dois como `Up`

---

## 1. O problema: hoje qualquer um entra

Abra o navegador em `http://localhost:3000` e olhe para o dashboard.

Agora pense: **quem é você para o sistema?**

Ninguém. O sistema não faz ideia. E isso significa que:

- Qualquer pessoa na rede que abrir esse endereço vê todo o estoque.
- Qualquer pessoa pode excluir um produto.
- Não existe como saber **quem** registrou aquela saída de 20 unidades.

É o que vamos resolver a partir de agora.

### Duas palavras que parecem iguais e não são

| Palavra | Pergunta que responde | Exemplo no nosso sistema |
|---|---|---|
| **Autenticação** | *Quem é você?* | Você digitou e-mail e senha corretos |
| **Autorização** | *Você pode fazer isso?* | Só o gerente exclui produtos |

> 📌 Nas aulas 23 a 32 fazemos **autenticação**. A autorização (perfis, permissões) fica como exercício na [Aula 32](32-teste-final-autenticacao.md).

---

## 2. A senha: por que não podemos guardá-la

Vamos imaginar a solução ingênua:

```sql
-- NUNCA FAÇA ISSO
CREATE TABLE users (
  email    VARCHAR(160),
  password VARCHAR(100)   -- "123456" gravado do jeito que veio
);
```

Parece que funciona. O login seria só:

```sql
SELECT * FROM users WHERE email = ? AND password = ?;
```

**Qual é o problema?** Três, na verdade:

| Problema | Consequência |
|---|---|
| Quem tiver acesso ao banco lê todas as senhas | O DBA, o estagiário, o backup perdido, o invasor |
| As pessoas repetem senhas | A senha do seu sistema é a senha do e-mail e do banco delas |
| Você nunca "desvaza" um vazamento | Uma vez exposta, sempre exposta |

> 💡 Sistemas sérios não sabem a sua senha. Repare que quando você esquece a senha de um site, ele nunca te manda a senha antiga — ele manda um link para **criar outra**. Isso é prova de que ele não a tem.

### A solução: hash

Um **hash** é uma função matemática de mão única:

```text
                 função de hash
   "123456"  ──────────────────►  "$2b$10$xkAjZ..MHKdp.7cnXFMvVO..."
                                            (60 caracteres)

   "$2b$10$xkAjZ..."  ──────X──►  "123456"
                                  NÃO EXISTE caminho de volta
```

| Característica | O que significa |
|---|---|
| **Determinística** | A mesma senha, com o mesmo salt, dá sempre o mesmo hash |
| **Irreversível** | Do hash não se calcula a senha |
| **Sensível** | `"123456"` e `"123457"` geram hashes completamente diferentes |

### Então como o login funciona?

Este é o pulo do gato, e confunde todo mundo na primeira vez:

```text
  CADASTRO                              LOGIN
  --------                              -----
  senha "123456"                        senha digitada "123456"
       |                                        |
       v                                        v
    hash ──► grava no banco              o banco devolve o hash
                                                |
                                                v
                                   bcrypt.compare("123456", hash)
                                                |
                                                v
                                          true ou false
```

Nós **não descriptografamos** nada. Nós aplicamos o hash de novo e comparamos os resultados.

> ⚠️ **Guarde esta frase:** não existe `WHERE password = ?` em nenhum lugar do nosso código. A comparação de senha nunca acontece no SQL.

### Hash não é criptografia

| | Criptografia | Hash |
|---|---|---|
| Tem volta? | Sim, com a chave | Não |
| Serve para | Guardar algo que você vai precisar ler | Provar que alguém sabe algo |
| Exemplo | Mensagem do WhatsApp | Senha |

### Por que bcrypt e não SHA-256?

Você pode ter ouvido falar de MD5 ou SHA-256. Eles são hashes, mas **ruins para senhas**. Motivo:

Eles foram feitos para serem **rápidos**. Uma placa de vídeo moderna calcula bilhões de SHA-256 por segundo — ou seja, testa bilhões de senhas por segundo.

O **bcrypt** foi feito para ser **lento de propósito**, e o quanto ele é lento é configurável:

```text
custo 10  =  2^10  =  1024 rodadas  ≈  0,1 segundo por senha
```

| Para nós | Para o invasor |
|---|---|
| 0,1 s uma vez por login: imperceptível | 0,1 s × bilhões de tentativas: inviável |

E tem mais: o bcrypt embute um **salt** — um valor aleatório diferente para cada usuário.

```text
Ana   digita "123456"  ->  $2b$10$K7x9...  (salt K7x9...)
Bruno digita "123456"  ->  $2b$10$Pq2m...  (salt Pq2m...)
                                 ^
                    MESMA senha, hashes DIFERENTES
```

Sem salt, bastaria olhar o banco e ver "esses 40 usuários têm o mesmo hash, então têm a mesma senha — e já sei qual é".

### Lendo um hash bcrypt

```text
$2b$10$xkAjZ..MHKdp.7cnXFMvVON.XZmd/foxiswJJS61thFcP/WLquT6m
│  │ │  └──────────────────┘└───────────────────────────────┘
│  │ │      salt (22)              hash propriamente dito (31)
│  │ └── custo: 10
│  └──── versão do algoritmo
└─────── separador
```

O salt fica **dentro** do hash. É por isso que uma coluna só (`password_hash`) basta.

---

## 3. O token: o crachá da visita

Resolvido o problema da senha, aparece outro.

### O HTTP não tem memória

Cada requisição HTTP é independente. O servidor atende e esquece.

```text
  Requisição 1:  POST /api/auth/login    -> "ok, é a Ana mesmo"
  Requisição 2:  GET  /api/products      -> "quem é você?" 🤷
```

Se o servidor esquece, como as próximas telas sabem quem está falando?

### Solução ruim: mandar a senha toda vez

```text
GET /api/products
X-Senha: 123456          <- a senha trafegando a cada clique
```

Péssimo: a senha circula dezenas de vezes por minuto, e o servidor precisa rodar bcrypt (lento!) em toda requisição.

### Solução boa: um crachá temporário

É assim que funciona na portaria de um prédio:

```text
  1. Você chega e mostra o RG        (e-mail + senha, uma vez)
  2. A portaria emite um CRACHÁ      (o token)
  3. Você circula mostrando o crachá (o token em cada requisição)
  4. O crachá vence às 18h           (expiração)
```

### O que é um JWT

**JWT** = *JSON Web Token*. São três pedaços separados por ponto:

```text
eyJhbGciOiJIUzI1NiJ9 . eyJuYW1lIjoiQW5hIiwic3ViIjoiMiJ9 . PorPhLZZff5seKhz95uYOt3OUMw
└────── header ─────┘  └────────── payload ────────────┘  └────── assinatura ───────┘
   "qual algoritmo"          "quem é e até quando"      "prova de que fui eu que emiti"
```

Os dois primeiros pedaços são **apenas JSON codificado em Base64**. Qualquer pessoa consegue ler.

> 🔍 **Teste em sala:** copie um token e cole em https://jwt.io. Você vai ver o conteúdo em texto claro. Isso assusta na primeira vez, mas está correto.

### Se qualquer um lê, qual é a graça?

A graça está na **terceira parte**: a assinatura.

```text
   assinatura = função(header + payload, JWT_SECRET)
                                          └────────┘
                                   só o servidor conhece
```

| O invasor consegue | O invasor NÃO consegue |
|---|---|
| Ler o conteúdo do token | Alterar o conteúdo sem quebrar a assinatura |
| Copiar o token de outra pessoa | Fabricar um token novo sem o `JWT_SECRET` |

Se alguém trocar `"sub": "2"` por `"sub": "1"` para virar outro usuário, a assinatura deixa de bater e o servidor recusa.

> ⚠️ **Duas regras que valem ouro:**
> 1. Token **não é** lugar de segredo. Nunca coloque senha, hash ou número de cartão no payload.
> 2. O `JWT_SECRET` é a chave do reino. Vazou o segredo, qualquer um emite tokens válidos.

### Como o token viaja

Existe um cabeçalho HTTP padrão para isso:

```text
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
               └────┘ └───────────────────┘
               esquema        o token
```

*Bearer* = "portador". Ou seja: "quem estiver com este papel na mão".

---

## 4. Onde tudo isso entra no nosso sistema

Lembre do desenho da [Aula 00](00-visao-geral.md). Agora ele ganha **uma caixa nova**:

```text
    Navegador manda:  GET /api/products
                      Authorization: Bearer eyJ...
                  |
                  v
    +---------------------------+
    |  ensureAuthenticated      |   <── A CAIXA NOVA (middleware)
    |  "cadê o crachá?"         |       Confere a assinatura.
    +---------------------------+       Sem token válido: para aqui com 401.
                  |
                  v
    +---------------------------+
    |  routes                   |
    +---------------------------+
                  |
                  v
    +---------------------------+
    |  controller               |
    +---------------------------+
                  |
                  v
    +---------------------------+
    |  service                  |
    +---------------------------+
                  |
                  v
    +---------------------------+
    |  repository  ->  MySQL    |
    +---------------------------+
```

Um **middleware** é uma função que roda **no meio do caminho**, antes do controller. Ele pode:

- deixar passar (chamando `next()`), ou
- interromper (lançando um erro).

Você já usou middlewares sem saber:

```javascript
app.use(express.json());      // middleware: transforma o corpo em objeto
app.use(express.static(...)); // middleware: entrega os arquivos do public
```

---

## 5. O fluxo completo, do começo ao fim

```text
 ┌─ CADASTRO ────────────────────────────────────────────────┐
 │  POST /api/auth/register  { name, email, password }       │
 │       -> valida  -> e-mail já existe? -> bcrypt.hash      │
 │       -> INSERT INTO users                                │
 │       -> 201 { user, token }                              │
 └───────────────────────────────────────────────────────────┘

 ┌─ LOGIN ───────────────────────────────────────────────────┐
 │  POST /api/auth/login  { email, password }                │
 │       -> SELECT ... WHERE email = ?                       │
 │       -> bcrypt.compare(senha, hash)                      │
 │       -> gera o JWT                                       │
 │       -> 200 { user, token }                              │
 │                                                           │
 │  O navegador guarda o token no localStorage               │
 └───────────────────────────────────────────────────────────┘

 ┌─ USO NORMAL ──────────────────────────────────────────────┐
 │  GET /api/products                                        │
 │      Authorization: Bearer <token>                        │
 │       -> ensureAuthenticated confere a assinatura         │
 │       -> request.user = { id, name, email }               │
 │       -> segue para o controller normalmente              │
 └───────────────────────────────────────────────────────────┘

 ┌─ SAIR ────────────────────────────────────────────────────┐
 │  O navegador apaga o token. Só isso.                      │
 │  (o servidor não guarda sessão nenhuma)                   │
 └───────────────────────────────────────────────────────────┘
```

---

## 6. Os status HTTP que vamos usar

| Código | Nome | Quando usamos |
|---|---|---|
| `201` | Created | Conta criada com sucesso |
| `400` | Bad Request | Dado inválido (senha curta, e-mail sem `@`) |
| `401` | Unauthorized | **Não sei quem você é**: sem token, token inválido, senha errada |
| `403` | Forbidden | **Sei quem você é, mas não pode** (autorização — fica de exercício) |
| `409` | Conflict | Esse e-mail já tem conta |

> 📌 O nome `401 Unauthorized` é um erro histórico do próprio HTTP: ele deveria se chamar *Unauthenticated*. Quem trata de permissão é o `403`.

---

## 7. O que vamos construir nas próximas 9 aulas

| Aula | Entrega |
|---|---|
| [24](24-tabela-usuarios.md) | Tabela `users` + bibliotecas `bcryptjs` e `jsonwebtoken` |
| [25](25-auth-validator-repository.md) | `user-validator.js` e `user-repository.js` |
| [26](26-auth-service.md) | `auth-service.js` — o coração: hash e token |
| [27](27-auth-rotas-e-middleware.md) | Controller, rotas e o middleware que tranca a API |
| [28](28-vue-primeiros-passos.md) | **Vue.js**: o que é e por que muda tudo |
| [29](29-tela-cadastro-vue.md) | Tela de cadastro em Vue |
| [30](30-tela-login-vue.md) | Tela de login em Vue |
| [31](31-protegendo-o-front.md) | Guardar o token, proteger as telas, botão Sair |
| [32](32-teste-final-autenticacao.md) | Teste completo, erros comuns e exercícios |

E o front-end ganha duas telas novas:

```text
public/
├── login.html          <- NOVO (Vue)
├── cadastro.html       <- NOVO (Vue)
├── index.html          <- passa a exigir login
├── produtos.html       <- passa a exigir login
├── movimentacoes.html  <- passa a exigir login
├── categorias.html     <- passa a exigir login
└── js/
    ├── auth.js         <- NOVO: guarda a sessão
    ├── login.js        <- NOVO (Vue)
    └── cadastro.js     <- NOVO (Vue)
```

---

## ✅ Confira se você entendeu

Responda mentalmente antes de seguir:

1. O sistema consegue descobrir qual é a sua senha? Por quê?
2. Por que o bcrypt ser **lento** é uma vantagem?
3. Duas pessoas com a senha `"123456"` têm o mesmo hash no banco?
4. Se o token pode ser lido por qualquer um, por que ele é seguro?
5. Qual a diferença entre `401` e `403`?
6. Onde o middleware `ensureAuthenticated` roda: antes ou depois do controller?

<details>
<summary>Ver respostas</summary>

1. **Não.** Guardamos apenas o hash, e a função de hash não tem caminho de volta.
2. Porque o custo por tentativa é irrelevante para **um** login legítimo e proibitivo para **bilhões** de tentativas de força bruta.
3. **Não**, porque cada usuário recebe um *salt* aleatório diferente, que entra no cálculo.
4. Porque a segurança não está em esconder o conteúdo, e sim na **assinatura**: sem o `JWT_SECRET` ninguém consegue alterar nem fabricar um token válido.
5. `401` = não sei quem você é (falta autenticação). `403` = sei quem você é, mas você não tem permissão.
6. **Antes.** Ele fica no meio do caminho e decide se a requisição continua ou para ali.

</details>

---

## ➡️ Próximo passo

Chega de teoria. Vamos criar a tabela de usuários e instalar as duas bibliotecas.

**[Aula 24 — A tabela de usuários e as novas bibliotecas](24-tabela-usuarios.md)**
