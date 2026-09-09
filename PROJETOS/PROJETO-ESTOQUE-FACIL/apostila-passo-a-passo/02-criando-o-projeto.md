# Aula 02 — Criando o projeto

⏱️ **Tempo estimado:** 15 minutos
📋 **Tipo:** prática (terminal + VS Code)

---

## Objetivo

Criar a pasta do projeto, todas as subpastas que vamos usar e o arquivo `package.json`.

Ao final, o VS Code estará aberto com a estrutura pronta para receber o código.

---

## Antes de começar

- [ ] Aula 01 concluída (Node e Docker funcionando)

---

## Passo 1 — Escolher onde o projeto vai ficar

Vá para a pasta onde você guarda seus projetos. Por exemplo:

```bash
cd ~/Documents
```

> **O que é `cd`?** Significa *change directory* (mudar de pasta). O `~` é um atalho para a sua pasta de usuário.

Para saber em que pasta você está agora:

```bash
pwd
```

---

## Passo 2 — Criar a pasta do projeto

```bash
mkdir projeto-docker-nodejs
cd projeto-docker-nodejs
```

Confirme que você está dentro dela:

```bash
pwd
```

Deve terminar com `/projeto-docker-nodejs`.

> ⚠️ **Todos os comandos das próximas aulas devem ser rodados de dentro desta pasta.** Se algo der errado, o primeiro passo é rodar `pwd` e conferir onde você está.

---

## Passo 3 — Criar as subpastas

Cole estes dois comandos (um de cada vez):

```bash
mkdir -p database public/js src/config src/routes src/shared/errors src/shared/http
```

```bash
mkdir -p src/modules/categories src/modules/products src/modules/movements src/modules/dashboard
```

### Entendendo o comando

| Parte | Significado |
|---|---|
| `mkdir` | *make directory* — criar pasta |
| `-p` | Cria as pastas intermediárias que faltarem |
| `src/shared/errors` | Cria `src`, depois `shared` dentro dela, depois `errors` |

Sem o `-p`, você teria que criar uma pasta de cada vez, na ordem certa.

### Conferindo

```bash
ls -R
```

Você deve ver algo assim:

```text
.:
database  public  src

./public:
js

./src:
config  modules  routes  shared

./src/modules:
categories  dashboard  movements  products

./src/shared:
errors  http
```

> 💡 **Prefere usar o mouse?** Você pode criar essas pastas clicando com o botão direito no explorador de arquivos do VS Code → **New Folder**. O resultado é o mesmo. Só tome cuidado com a grafia: tudo em minúsculas, sem acento e sem espaço.

---

## Passo 4 — Abrir o projeto no VS Code

```bash
code .
```

> **O que é o ponto?** Significa "a pasta atual". Ou seja: "VS Code, abra a pasta em que eu estou".

Se o comando `code` não funcionar, abra o VS Code pelo menu do sistema e use **File → Open Folder**, escolhendo a pasta `projeto-docker-nodejs`.

Você deve ver as pastas `database`, `public` e `src` na barra lateral esquerda.

---

## Passo 5 — Criar o `package.json`

Este arquivo é a **identidade do projeto**: nome, versão, comandos e bibliotecas usadas.

### Como criar um arquivo no VS Code

1. Passe o mouse sobre o nome do projeto na barra lateral
2. Clique no ícone de **folha com um `+`** (*New File*)
3. Digite exatamente: `package.json`
4. Aperte **Enter**

O arquivo abre vazio. Agora digite (ou cole) o conteúdo:

```json
{
  "name": "estoque-facil",
  "version": "1.0.0",
  "description": "Sistema de gestao de estoque - Node.js, Express, MySQL e Docker",
  "type": "module",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "node --watch src/server.js"
  },
  "engines": {
    "node": ">=20.6.0"
  },
  "dependencies": {
    "express": "^4.21.2",
    "mysql2": "^3.11.5"
  }
}
```

**Salve com `Ctrl` + `S`** (ou `Cmd` + `S` no Mac).

> ⚠️ **Atenção com JSON:** ele não aceita vírgula depois do último item nem comentários. Se o VS Code sublinhar algo de vermelho, confira as vírgulas e as aspas.

---

## Entendendo o que fizemos

Vamos linha por linha nas partes que importam:

### `"type": "module"`

Esta linha habilita os **ES Modules**, o padrão moderno de importação que usamos no Módulo 1:

```javascript
import express from "express";        // ES Modules — é o que vamos usar
const express = require("express");   // CommonJS — padrão antigo
```

> ⚠️ **Se você esquecer esta linha**, todo `import` vai dar erro `Cannot use import statement outside a module`. É um dos erros mais comuns de quem está começando.

### `"scripts"`

São atalhos para comandos. Em vez de digitar o comando inteiro, você digita `npm run dev`.

| Script | Comando real | Quando usar |
|---|---|---|
| `start` | `node src/server.js` | Em produção |
| `dev` | `node --watch src/server.js` | Durante o desenvolvimento |

**O que o `--watch` faz?** Ele fica de olho nos arquivos. Quando você salva qualquer `.js`, o servidor reinicia sozinho. Sem ele, você teria que parar e subir o servidor a cada alteração.

> 💡 Antigamente isso exigia instalar uma biblioteca chamada `nodemon`. Desde o Node 18 isso é nativo — uma dependência a menos.

### `"dependencies"`

As duas bibliotecas que o projeto precisa:

| Biblioteca | Para que serve |
|---|---|
| `express` | Framework web: rotas, middlewares, leitura de JSON |
| `mysql2` | Driver que conversa com o MySQL, com suporte a `async/await` |

**O que significa `^4.21.2`?** O acento circunflexo diz: "aceite esta versão ou qualquer atualização compatível" (4.21.3, 4.22.0...), mas **nunca** uma mudança grande como a 5.0.0.

### `"engines"`

Documenta que o projeto precisa do Node 20.6 ou superior. Serve como aviso para quem for rodar o projeto.

---

## ⚠️ Uma dúvida que sempre aparece

**"Professor, não é para rodar `npm install` agora?"**

**Não!** E este é um ponto importante da nossa arquitetura.

Quem vai instalar as dependências é o **Docker**, dentro do container, na Aula 04. Se você instalar na sua máquina agora, vai criar uma pasta `node_modules` local que:

- não é usada pelo container;
- ocupa espaço à toa;
- pode confundir você quando algo der errado.

> 📌 Guarde: **o projeto roda dentro do container, não na sua máquina.** Sua máquina só guarda os arquivos de código.

---

## ✅ Confira se deu certo

```bash
ls
```

Deve aparecer:

```text
database  package.json  public  src
```

Marque:

- [ ] A pasta `projeto-docker-nodejs` existe
- [ ] Dentro dela existem `database`, `public` e `src`
- [ ] `src` contém `config`, `modules`, `routes` e `shared`
- [ ] `src/modules` contém as 4 pastas dos módulos
- [ ] O arquivo `package.json` existe e está salvo
- [ ] O VS Code não mostra nenhum erro vermelho no `package.json`
- [ ] Você **não** rodou `npm install`

---

## 🔧 Se deu erro

| Problema | Causa | Solução |
|---|---|---|
| `mkdir: command not found` | Terminal errado no Windows | Use o **Git Bash**, não o PowerShell |
| `code: command not found` | Atalho do VS Code não instalado | Abra o VS Code manualmente e use **File → Open Folder** |
| VS Code sublinha o `package.json` de vermelho | Erro de sintaxe JSON | Confira vírgulas sobrando e aspas faltando |
| Criei a pasta no lugar errado | `cd` foi para outro lugar | `pwd` para ver onde está, `cd ..` para subir um nível |
| As pastas não aparecem no VS Code | Abriu a pasta errada | **File → Open Folder** e escolha `projeto-docker-nodejs` |

---

## ➡️ Próximo passo

Estrutura criada. Agora vamos configurar as senhas e endereços do banco.

**[Aula 03 — Variáveis de ambiente](03-variaveis-de-ambiente.md)**
