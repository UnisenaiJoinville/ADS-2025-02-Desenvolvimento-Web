# Etapa 00 — Visão geral do projeto

📋 **Tipo:** leitura (nenhum código ainda)

---

## Objetivo

Ao final desta etapa você vai saber **o que** vamos construir, **por que** cada peça existe e **como** as partes conversam entre si.

Não escreva código ainda. Esta etapa é para entender o mapa antes de começar a viagem.

---

## 1. O que vamos construir

Um sistema chamado **Estoque Fácil**, parecido com o que uma loja pequena usaria para controlar mercadorias.

O sistema terá 4 telas:

| Tela | O que faz |
|---|---|
| **Dashboard** | Mostra cards com totais: quantos produtos, quanto dinheiro há em estoque, o que está acabando |
| **Produtos** | Cadastra, lista, edita e exclui produtos |
| **Movimentações** | Registra entradas (chegou mercadoria) e saídas (vendeu) |
| **Categorias** | Organiza os produtos em grupos |

E um detalhe importante: quando você registra uma **entrada de 50 unidades**, a quantidade do produto **aumenta 50**. Quando registra uma **saída de 20**, ela **diminui 20**. E se você tentar tirar mais do que tem, o sistema **recusa**.

Parece simples. Vamos ver que não é tão simples assim — e é aí que está o aprendizado.

---

## 2. Por que este projeto?

Sem um banco de dados, os dados ficam apenas em **memória**:

```javascript
const services = [];   // ao fechar o programa, tudo some
```

Isso serviu para aprender lógica, mas nenhum sistema real funciona assim. Agora vamos dar quatro passos adiante:

| Passo | O que muda |
|---|---|
| 1. **Persistir** | Os dados vão para um banco de dados (MySQL) e sobrevivem ao desligamento |
| 2. **Expor** | Outros programas acessam os dados por uma API HTTP |
| 3. **Empacotar** | Docker faz o projeto rodar igual em qualquer computador |
| 4. **Consumir** | Uma interface visual usa a nossa própria API |

---

## 3. As peças do sistema

Vamos usar 5 tecnologias. Veja o papel de cada uma:

| Tecnologia | Papel | Analogia |
|---|---|---|
| **Node.js** | Executa JavaScript fora do navegador | O motor |
| **Express** | Recebe requisições HTTP e devolve respostas | O atendente do balcão |
| **MySQL** | Guarda os dados de forma organizada e permanente | O arquivo/almoxarifado |
| **Docker** | Empacota tudo em containers isolados | As caixas padronizadas de mudança |
| **Tailwind CSS** | Deixa a interface bonita sem escrever CSS | O kit de decoração |

---

## 4. Como uma requisição percorre o sistema

Este desenho é o mais importante do projeto. Vamos voltar nele várias vezes.

```text
    VOCÊ clica em "Salvar" no navegador
                  |
                  v
    +---------------------------+
    |  routes                   |   "Alguém chamou POST /api/products"
    +---------------------------+
                  |
                  v
    +---------------------------+
    |  controller               |   Lê o corpo da requisição
    +---------------------------+   e prepara a resposta HTTP
                  |
                  v
    +---------------------------+
    |  service                  |   REGRAS DE NEGÓCIO:
    |     usa o validator       |   "esse SKU já existe?"
    +---------------------------+   "o preço é válido?"
                  |
                  v
    +---------------------------+
    |  repository               |   Escreve o SQL:
    +---------------------------+   INSERT INTO products...
                  |
                  v
    +---------------------------+
    |  MySQL                    |   Grava no disco
    +---------------------------+
```

E a resposta volta pelo mesmo caminho, ao contrário.

### A regra de ouro

**Cada camada só conhece a camada logo abaixo dela.**

Isso significa que, no nosso projeto:

| Camada | **NUNCA** faz isso |
|---|---|
| `controller` | Escrever SQL |
| `service` | Saber o que é `request` ou `response` |
| `repository` | Decidir regra de negócio |

> **Por que separar assim?** Imagine que amanhã você troque o MySQL pelo PostgreSQL. Você mexeria **só** nos arquivos `repository`. O resto do sistema nem fica sabendo. Ou imagine que você queira criar produtos por uma linha de comando em vez de HTTP: bastaria chamar o `service` direto, sem `controller`.

---

## 5. Os dados que vamos guardar

Três tabelas, relacionadas assim:

```text
 categories                 products                    stock_movements
 ----------                 --------                    ---------------
 id         <-------------- category_id                 id
 name                       id           <------------- product_id
 created_at                 name                        type ('IN' ou 'OUT')
                            sku (único)                 quantity
                            cost_price                  note
                            sale_price                  created_at
                            quantity      <- saldo
                            minimum_stock <- alerta
                            active
```

Leia assim:

- Um **produto** pertence a uma **categoria** (ou a nenhuma).
- Uma **movimentação** pertence a um **produto**.

### O detalhe que gera a etapa mais difícil

Repare que existem **duas** informações sobre quantidade:

| Onde | O que guarda |
|---|---|
| `stock_movements` | O **histórico**: "entraram 50 no dia 3", "saíram 20 no dia 7" |
| `products.quantity` | O **saldo atual**: "hoje tem 30" |

As duas precisam **sempre** bater. Se gravarmos a movimentação mas falharmos em atualizar o saldo, o sistema passa a mentir.

Resolver isso é o assunto da [Etapa 13](13-movimentacoes-transacoes.md), com um recurso chamado **transação**.

---

## 6. Como o projeto vai ficar organizado

```text
projeto-docker-nodejs/
│
├── docker-compose.yml     <- orquestra os 2 containers
├── Dockerfile             <- receita da imagem da API
├── .env                   <- senhas e configurações
├── package.json           <- dependências do projeto
│
├── database/
│   └── init.sql           <- cria as tabelas
│
├── public/                <- TUDO que o navegador vê
│   ├── index.html
│   ├── produtos.html
│   ├── movimentacoes.html
│   ├── categorias.html
│   └── js/
│
└── src/                   <- TUDO que roda no servidor
    ├── server.js          <- liga o servidor
    ├── app.js             <- configura o Express
    ├── config/            <- .env e conexão com o banco
    ├── routes/            <- lista de rotas
    ├── shared/            <- código usado por todos os módulos
    └── modules/           <- as 4 áreas do sistema
        ├── categories/
        ├── products/
        ├── movements/
        └── dashboard/
```

E dentro de cada módulo, sempre os mesmos 5 arquivos:

```text
modules/products/
├── product-validator.js    <- valida e limpa os dados que chegam
├── product-repository.js   <- fala com o banco (SQL)
├── product-service.js      <- regras de negócio
├── product-controller.js   <- lê requisição / escreve resposta
└── product-routes.js       <- define as URLs
```

> **Boa notícia:** depois que você entender **um** módulo, os outros três seguem exatamente o mesmo padrão. Por isso começamos pelo mais simples (categorias) na Etapa 11.

---

## 7. Convenção de nomes

Vamos usar duas línguas, cada uma no seu lugar:

| Onde | Idioma | Exemplo |
|---|---|---|
| Código e banco de dados | **Inglês** | `products`, `createProduct`, `quantity` |
| Textos que o usuário lê | **Português** | "Produto cadastrado", "Estoque baixo" |

> **Por quê?** É a convenção do mercado. Ela evita nomes híbridos e feios como `criarProduct` ou `salvarProduto()` recebendo `productData`. Além disso, todas as palavras-chave da programação já são em inglês (`function`, `return`, `if`), então o código fica coerente.

Nos **comentários do código** vamos escrever em português, mas **sem acentos**, para evitar problemas de codificação de caracteres entre sistemas diferentes.

---

## 8. O que você vai saber fazer ao final

Marque mentalmente estes objetivos:

- [ ] Subir um banco de dados MySQL sem instalar nada na máquina
- [ ] Criar uma API REST organizada em camadas
- [ ] Validar dados que chegam de fora antes de confiar neles
- [ ] Escrever SQL seguro, sem risco de invasão
- [ ] Garantir que duas operações aconteçam juntas ou nenhuma aconteça
- [ ] Fazer o banco calcular totais em vez de trazer tudo para o JavaScript
- [ ] Consumir uma API pelo navegador e montar telas com o resultado

---

## ✅ Confira se você entendeu

Antes de seguir, responda mentalmente:

1. Qual camada escreve SQL?
2. Se eu quiser mudar a mensagem de erro que o usuário vê, em qual camada eu mexo?
3. Por que `products.quantity` e `stock_movements` podem ficar diferentes um do outro?
4. Qual a diferença entre `cost_price` e `sale_price`?

<details>
<summary>Ver respostas</summary>

1. Somente o **repository**.
2. No **service** (é onde os erros de negócio são lançados) ou no **validator**.
3. Porque são duas gravações diferentes: se uma acontecer e a outra falhar, os números divergem. É o problema que as **transações** resolvem.
4. `cost_price` é quanto pagamos ao fornecedor; `sale_price` é quanto cobramos do cliente. A diferença entre eles é o lucro.

</details>

---

## ➡️ Próximo passo

Agora que você tem o mapa, vamos preparar as ferramentas.

**[Etapa 01 — Preparando o ambiente](01-preparando-o-ambiente.md)**
