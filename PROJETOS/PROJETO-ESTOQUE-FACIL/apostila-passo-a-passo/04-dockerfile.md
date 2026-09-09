# Aula 04 — Dockerfile

⏱️ **Tempo estimado:** 20 minutos
📋 **Tipo:** prática (VS Code)

---

## Objetivo

Escrever o `Dockerfile`, que é a **receita** para construir a imagem da nossa API, e entender cada instrução dele.

---

## Antes de começar

- [ ] Aula 03 concluída (`.env` criado)

---

## O que é um Dockerfile?

É um arquivo de texto com uma **lista de instruções**. O Docker lê essa lista de cima para baixo e monta uma **imagem**.

```text
   Dockerfile  ---(docker build)--->  Imagem  ---(docker run)--->  Container
   (a receita)                       (o molde)                  (rodando)
```

Comparação com a cozinha:

| Docker | Cozinha |
|---|---|
| `Dockerfile` | A receita escrita no papel |
| Imagem | O bolo pronto, congelado |
| Container | O bolo descongelado, servido no prato |

Você pode servir **vários pratos** (containers) a partir do **mesmo bolo** (imagem).

---

## Passo 1 — Criar o `Dockerfile`

Crie na raiz do projeto um arquivo chamado exatamente `Dockerfile`.

> ⚠️ **Sem extensão!** Não é `Dockerfile.txt`, não é `dockerfile`. É `Dockerfile`, com **D** maiúsculo e mais nada.

Digite o conteúdo:

```dockerfile
# Imagem base: Node.js 22 em uma distribuicao Alpine (leve)
FROM node:22-alpine

# Pasta de trabalho dentro do container
WORKDIR /app

# Copiamos primeiro os manifestos de dependencia.
# Assim o Docker reaproveita o cache quando so o codigo muda.
COPY package*.json ./

RUN npm install

# Agora copiamos o restante do projeto
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

Salve com `Ctrl` + `S`.

---

## Passo 2 — Criar o `.dockerignore`

Crie na raiz o arquivo `.dockerignore`:

```bash
node_modules
npm-debug.log
.env
.git
.gitignore
apostilas
```

Salve.

Este arquivo funciona igual ao `.gitignore`, mas para o Docker: diz o que **não** deve ser copiado para dentro da imagem.

| Item | Por que ignorar |
|---|---|
| `node_modules` | Será instalado dentro do container, para a plataforma correta |
| `.env` | As variáveis chegam pelo Compose, não pela imagem |
| `.git` | Histórico do Git não serve para nada dentro do container |
| `apostilas` | Material didático não faz parte do programa |

> 📌 **Por que `node_modules` é tão importante aqui?** Alguns pacotes têm partes compiladas para o sistema operacional. Se você copiasse a pasta do Windows para dentro de um container Linux, ela poderia simplesmente não funcionar.

---

## Entendendo cada linha do Dockerfile

Vamos com calma, uma instrução por vez.

### `FROM node:22-alpine`

```dockerfile
FROM node:22-alpine
```

Diz de qual imagem **partimos**. Ninguém constrói do zero: pegamos uma imagem que já tem Linux + Node.js instalados.

| Parte | Significado |
|---|---|
| `node` | Nome da imagem oficial do Node.js |
| `22` | A versão do Node |
| `alpine` | Uma distribuição Linux minúscula |

**Por que Alpine?** Compare os tamanhos:

| Imagem | Tamanho aproximado |
|---|---|
| `node:22` | ~1.100 MB |
| `node:22-alpine` | ~130 MB |

Oito vezes menor. Baixa mais rápido, ocupa menos disco e tem menos programas instalados (o que também significa menos brechas de segurança).

### `WORKDIR /app`

```dockerfile
WORKDIR /app
```

Define a pasta padrão **dentro** do container. Todos os comandos seguintes rodam a partir dela.

É como fazer `cd /app`, mas valendo para todas as instruções seguintes. Se a pasta não existir, o Docker a cria.

> 💡 `/app` é apenas uma convenção. Poderia ser `/usr/src/app` ou qualquer outro nome. O importante é ser consistente.

### `COPY package*.json ./`

```dockerfile
COPY package*.json ./
```

Copia os arquivos de dependência da sua máquina para o container.

| Parte | Significado |
|---|---|
| `package*.json` | O `*` é curinga: pega `package.json` **e** `package-lock.json` |
| `./` | Destino: a pasta atual dentro do container (`/app`) |

**Por que copiar só esses arquivos, e não o projeto inteiro?** Esta é a pergunta mais importante da aula. Veja a seguir.

### `RUN npm install`

```dockerfile
RUN npm install
```

Instala as dependências (`express` e `mysql2`) **dentro** do container, durante a construção da imagem.

### `COPY . .`

```dockerfile
COPY . .
```

Agora sim, copia todo o restante do projeto.

| Ponto | Significado |
|---|---|
| Primeiro `.` | Origem: a pasta atual da **sua máquina** |
| Segundo `.` | Destino: a pasta atual do **container** (`/app`) |

> O `.dockerignore` que criamos no Passo 2 age exatamente aqui, filtrando o que não deve ser copiado.

### `EXPOSE 3000`

```dockerfile
EXPOSE 3000
```

**Documenta** que a aplicação usa a porta 3000.

> ⚠️ **Atenção:** esta instrução **não** abre a porta de verdade. É só documentação para quem lê o arquivo. Quem realmente publica a porta é o `docker-compose.yml` (Aula 05).

### `CMD ["npm", "run", "dev"]`

```dockerfile
CMD ["npm", "run", "dev"]
```

Define o comando executado quando o container **inicia**.

Repare no formato de lista, com cada palavra entre aspas. É o formato recomendado (chamado *exec form*), porque executa o comando diretamente, sem passar por um shell — o que faz o container responder corretamente aos sinais de parada.

---

## O conceito-chave: cache de camadas

Cada instrução do Dockerfile cria uma **camada**, e o Docker guarda cada camada em cache.

Quando você reconstrói a imagem, ele reaproveita as camadas que **não mudaram** e refaz só a partir da primeira que mudou.

### Por isso a ordem importa tanto

Compare os dois jeitos:

```dockerfile
# JEITO RUIM
COPY . .
RUN npm install
```

```dockerfile
# NOSSO JEITO
COPY package*.json ./
RUN npm install
COPY . .
```

Agora imagine que você **mudou uma linha** de um arquivo `.js`:

| | Jeito ruim | Nosso jeito |
|---|---|---|
| `COPY package*.json` | — | ✅ cache (não mudou) |
| `RUN npm install` | ❌ **roda de novo** (lento) | ✅ cache (não mudou) |
| `COPY . .` | — | ❌ roda de novo (rápido) |
| **Tempo** | ~40 segundos | ~1 segundo |

> 📌 **Regra geral:** coloque no Dockerfile **primeiro o que muda pouco** (dependências) e **por último o que muda muito** (seu código).

---

## A diferença entre `RUN` e `CMD`

Esta é a pergunta mais cobrada em provas sobre Docker.

| | `RUN` | `CMD` |
|---|---|---|
| **Quando executa** | Ao **construir** a imagem (`docker build`) | Ao **iniciar** o container (`docker run`) |
| **Quantas vezes** | Uma vez, e o resultado fica gravado na imagem | Toda vez que um container sobe |
| **Quantos por arquivo** | Vários | Só o último vale |
| **No nosso caso** | Instalar dependências | Ligar o servidor |

Pense assim:

- `RUN` = **preparar** o bolo (fica pronto no congelador)
- `CMD` = **servir** o bolo (acontece na hora)

---

## ✅ Confira se deu certo

```bash
ls -a
```

Deve conter `Dockerfile` e `.dockerignore`.

```bash
cat Dockerfile
```

Marque:

- [ ] O arquivo se chama `Dockerfile` (D maiúsculo, sem extensão)
- [ ] Tem 6 instruções: `FROM`, `WORKDIR`, `COPY`, `RUN`, `COPY`, `EXPOSE`, `CMD`
- [ ] O `COPY package*.json` vem **antes** do `RUN npm install`
- [ ] O `COPY . .` vem **depois** do `RUN npm install`
- [ ] O `.dockerignore` existe e lista `node_modules`

> ⚠️ **Ainda não vamos construir a imagem.** Isso acontece na Aula 10, quando o Compose estiver pronto. Se você tentar `docker build` agora, vai funcionar, mas a API ainda não existe para ser executada.

---

## 🔧 Se deu erro

| Problema | Causa | Solução |
|---|---|---|
| VS Code não reconhece a sintaxe | Nome errado do arquivo | Deve ser `Dockerfile`, sem `.txt` |
| Windows salvou como `Dockerfile.txt` | Extensões ocultas | No VS Code, renomeie removendo o `.txt` |
| Não sei se o arquivo está certo | — | `cat Dockerfile` mostra o conteúdo |

---

## ➡️ Próximo passo

Temos a receita da API. Agora vamos orquestrar API + banco juntos.

**[Aula 05 — Docker Compose](05-docker-compose.md)**
