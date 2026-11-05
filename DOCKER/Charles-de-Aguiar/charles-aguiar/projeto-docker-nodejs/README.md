# 🛠️ Relatório de Diagnóstico de Código — Atividade de Code Review

Este documento apresenta a revisão de código realizada no arquivo `auth-service.js` alternativo. Foram identificados **10 problemas graves** que violam boas práticas de arquitetura, geram bugs de funcionamento e expõem o sistema a ataques críticos de segurança.

---

## 🔍 Tabela de Problemas Encontrados

| Linha | Classificação | Descrição do Problema | Correção Proposta |
| :---: | :---: | :--- | :--- |
| **5 / 31** | Arquitetura | **Vazamento do protocolo HTTP:** O Service recebe `request` e `response` diretamente do Express, quebrando o isolamento de camadas. | Receber objetos de dados puros destruturados: `({ email, password })`. |
| **9 / 36** | Arquitetura | **Acesso direto ao Banco:** O arquivo executa queries brutas (`pool.query`) em vez de delegar para o repositório de dados. | Isolar as queries e invocar métodos da camada de **Repository**. |
| **10** | Segurança | **SQL Injection Crítico:** Concatenação direta da variável `email` na string da query SQL. | Substituir por *Prepared Statements* usando placeholders (`?`). |
| **14** | Segurança | **Enumeração de Usuários:** Mensagem `"E-mail nao cadastrado"` entrega para atacantes quais contas existem na base. | Modificar para uma mensagem de erro genérica e opaca. |
| **19** | Bug / Segurança | **Validação Errada de Senha:** Comparação da senha em texto limpo com o hash do banco usando `!==` sempre falhará. | Utilizar o método assíncrono `await bcrypt.compare()`. |
| **20** | Segurança | **Enumeração de Credenciais:** Mensagem `"Senha incorreta"` confirma que o e-mail inserido é válido. | Utilizar a mesma mensagem genérica e opaca do erro de e-mail. |
| **24** | Segurança | **Exposição de Dados Sensíveis:** Inclusão do `password_hash` dentro do payload do JWT, que pode ser decodificado por qualquer pessoa. | Remover o hash de senha do payload do token de sessão. |
| **25** | Segurança | **Chave Secreta Exposta (Hardcoded):** A chave `"segredo123"` está exposta diretamente no código-fonte. | Migrar a credencial de assinatura para variáveis de ambiente (`process.env`). |
| **34** | Bug / Arquitetura | **Bloqueio da Thread Principal:** O uso de `bcrypt.hashSync` trava o loop de eventos do Node.js a cada novo cadastro. | Substituir pela versão assíncrona com `await bcrypt.hash()`. |
| **36-39** | Bug | **Falta de Checagem de Duplicidade:** O registro insere dados diretamente no banco sem validar se o e-mail já existe. | Executar uma busca prévia por e-mail e lançar erro caso já exista. |

---

## 💻 Código Totalmente Corrigido e Refatorado

Abaixo está o modelo corrigido implementando as soluções arquiteturais e as proteções de segurança necessárias:

```javascript
import bcrypt from "bcryptjs";
import { generateToken } from "../../shared/auth/token.js";
import { UnauthorizedError } from "../../shared/errors/app-error.js";
import * as repository from "./auth-repository.js"; 

export async function loginUser({ email, password }) {
  // Chamada via camada de repositório isolada
  const user = await repository.findByEmail(email);

  // Proteção contra User Enumeration (Mensagem Genérica)
  if (!user) {
    throw new UnauthorizedError("E-mail ou senha invalidos");
  }

  // Comparação correta com bcrypt assíncrono
  const passwordMatch = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatch) {
    throw new UnauthorizedError("E-mail ou senha invalidos");
  }

  // Geração de token sem expor dados sensíveis no payload
  const token = generateToken(user);

  return { user, token };
}

export async function registerUser({ name, email, password }) {
  // Validação prévia de duplicidade de conta
  const existing = await repository.findByEmail(email);
  if (existing) {
    throw new UnauthorizedError("Ja existe uma conta com esse e-mail");
  }

  // Criptografia assíncrona que não bloqueia o Node.js
  const passwordHash = await bcrypt.hash(password, 10);
  
  const newUser = await repository.create({ name, email, passwordHash });
  return newUser;
}
```


## 🗣️ Gabarito de Entendimento (Perguntas Orais)

### 1. Por que não guardamos a senha?
Por conformidade de segurança e privacidade (LGPD). Se a base de dados for vazada, as senhas reais dos usuários não são expostas. Guardamos apenas um **hash criptográfico de via única**, que é matematicamente impossível de ser revertido para o texto original.

### 2. O que acontece se dois usuários tiverem a mesma senha?
Os hashes gerados e salvos no banco de dados serão **completamente diferentes**. Isso ocorre porque a biblioteca `bcrypt` utiliza um mecanismo de **Salt** (sal), adicionando um sufixo aleatório único para cada criptografia antes de gerar o hash final.

### 3. Por que o bcrypt é lento de propósito?
Para mitigar ataques de **Força Bruta** e **Dicionário** (*Key Stretching*). Se o processo de hash levasse microssegundos, atacantes testariam milhões de senhas por segundo. Sendo intencionalmente lento (demorando milissegundos), o processo torna ataques massivos inviáveis devido ao tempo computacional exigido.

### 4. O que tem dentro de um JWT e por que ele não pode ser falsificado?
É composto por três partes divididas por pontos: **Header** (algoritmo usado), **Payload** (dados públicos do usuário, como ID e e-mail) e **Signature** (Assinatura). Ele não pode ser falsificado porque a assinatura é gerada combinando os dados do token com uma **chave secreta que apenas o servidor conhece**. Qualquer alteração nos dados invalida a assinatura imediatamente.

### 5. Por que a mensagem de erro do login é genérica?
Para mitigar a **Enumeração de Usuários**. Se o sistema retornar mensagens específicas como *"E-mail não cadastrado"* ou *"Senha incorreta"*, um invasor consegue validar quais e-mails existem no banco de dados para refinar um ataque. A mensagem única *"E-mail ou senha inválidos"* mantém a base protegida.

### 6. Por que `ensureAuthenticated` é uma linha só no `routes/index.js`?
Porque a arquitetura do Express permite injetar middlewares de forma global ou agrupada em um **Router intermediário**. Aplicando a trava de segurança na raiz do grupo de rotas protegidas, todos os arquivos de rotas filhos herdam a verificação automaticamente, evitando repetição de código.

### 7. Se eu apagar o `requireAuth()` do dashboard, o que um usuário sem login consegue ver?
Ele conseguirá ver apenas a **casca visual estrutural (HTML/CSS)** da página, mas **nenhum dado real de produtos ou estoque será exibido**. Isso ocorre porque a segurança definitiva está implementada no backend: as rotas da API exigem o Bearer Token e, sem ele, a requisição é rejeitada.

### 8. Por que validamos nos dois lados se só o servidor importa?
No **front-end**, validamos por motivos de **usabilidade, UX e economia de rede** (evitando o envio de requisições sabidamente erradas). No **backend**, validamos para garantir **segurança real absoluta**, impedindo que requisições maliciosas feitas fora do navegador (via Postman, por exemplo) quebrem as regras de negócio.

### 9. O que o botão "Sair" faz no servidor?
**Absolutamente nada.** O padrão de arquitetura JWT é *stateless* (sem estado), significando que o servidor não rastreia sessões ativas na memória. O botão "Sair" atua exclusivamente no cliente (front-end), limpando o token armazenado no `localStorage` do navegador.

### 10. Qual a diferença entre `computed` e `methods` no Vue?
As propriedades **`computed`** guardam valores derivados baseados em dados reativos e possuem um mecanismo de **cache inteligente** (só reavaliam se a variável de dependência mudar). Os **`methods`** são funções comuns que são reexecutadas obrigatoriamente **toda vez** que são invocadas ou quando a página sofre qualquer renderização.
