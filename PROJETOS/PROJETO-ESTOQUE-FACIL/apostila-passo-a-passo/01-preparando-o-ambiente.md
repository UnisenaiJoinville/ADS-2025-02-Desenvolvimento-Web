# Aula 01 — Preparando o ambiente

⏱️ **Tempo estimado:** 20 minutos
📋 **Tipo:** prática (terminal)

---

## Objetivo

Confirmar que o Node.js e o Docker estão instalados e funcionando. Ao final, os quatro comandos de verificação devem responder sem erro.

> ⚠️ **Não pule esta aula.** 90% dos problemas nas aulas seguintes vêm de ambiente mal preparado.

---

## Antes de começar

Você precisa ter instalado:

| Programa | Link | Para quê |
|---|---|---|
| Node.js (LTS) | https://nodejs.org | Executar JavaScript no servidor |
| Docker Desktop | https://www.docker.com/products/docker-desktop | Rodar o banco e a API em containers |
| Visual Studio Code | https://code.visualstudio.com | Escrever o código |
| Git | https://git-scm.com | No Windows, ele traz o **Git Bash** |

---

## Passo 1 — Abrir o terminal certo

O terminal é onde vamos digitar comandos.

### No Windows

Use o **Git Bash** (instalado junto com o Git). Para abrir:

1. Aperte a tecla **Windows**
2. Digite `Git Bash`
3. Aperte **Enter**

> **Por que Git Bash e não o Prompt de Comando?** Os comandos desta apostila (`mkdir -p`, `cp`, `curl`) são do padrão Unix. No Git Bash eles funcionam igual ao Mac e Linux, então a apostila serve para a turma inteira.

### No Mac ou Linux

Use o **Terminal** normal.

### Dentro do VS Code (funciona em todos)

1. Abra o VS Code
2. Menu **Terminal** → **New Terminal** (ou `Ctrl` + `'`)
3. No Windows, clique na setinha ao lado do `+` e escolha **Git Bash**

---

## Passo 2 — Verificar o Node.js

Digite no terminal e aperte Enter:

```bash
node -v
```

**O que deve aparecer** (o número pode variar, desde que seja 20 ou maior):

```text
v22.15.0
```

Agora o npm, que vem junto com o Node:

```bash
npm -v
```

```text
10.9.2
```

### ⚠️ Se aparecer "command not found"

Significa que o Node não está instalado ou o terminal não o encontra.

1. Instale pelo site https://nodejs.org (escolha a versão **LTS**)
2. **Feche e abra o terminal de novo** — ele só enxerga programas novos depois de reiniciar
3. Teste outra vez

---

## Passo 3 — Abrir o Docker Desktop

Este passo é **manual** e todo mundo esquece:

1. Aperte a tecla **Windows** (ou abra o Launchpad no Mac)
2. Digite `Docker Desktop`
3. Aperte **Enter**
4. **Aguarde** até o ícone da baleia parar de se mexer

> 🐳 **Como saber se está pronto?** O ícone da baleia aparece na barra de tarefas (perto do relógio). Enquanto estiver "carregando", ele fica com uma animação. Espere ficar parado.

Na primeira vez isso pode demorar **1 a 3 minutos**. Tenha paciência.

---

## Passo 4 — Verificar o Docker

Com o Docker Desktop aberto, digite:

```bash
docker -v
```

```text
Docker version 27.4.0, build bde2b89
```

E agora o Compose, que é a ferramenta que vai orquestrar nossos containers:

```bash
docker compose version
```

```text
Docker Compose version v2.31.0-desktop.2
```

### ⚠️ Se aparecer "Cannot connect to the Docker daemon"

Este é **o erro mais comum do curso inteiro**. Ele significa uma coisa só: **o Docker Desktop não está aberto**.

Volte ao Passo 3, abra o programa, espere a baleia parar e teste de novo.

### ⚠️ Se aparecer "docker: command not found"

O Docker não está instalado. Baixe em https://www.docker.com/products/docker-desktop, instale, **reinicie o computador** e teste outra vez.

---

## Passo 5 — Teste real do Docker

Os comandos acima só mostram a versão. Vamos confirmar que o Docker **realmente funciona**:

```bash
docker run --rm hello-world
```

**O que deve aparecer:**

```text
Unable to find image 'hello-world:latest' locally
latest: Pulling from library/hello-world
...
Hello from Docker!
This message shows that your installation appears to be working correctly.
```

Se você viu **"Hello from Docker!"**, está tudo certo. 🎉

> **O que aconteceu aqui?** O Docker procurou a imagem `hello-world` no seu computador, não achou, baixou da internet, criou um container, executou, mostrou a mensagem e apagou o container (por causa do `--rm`). Em uma linha você viu o ciclo de vida inteiro de um container.

---

## Entendendo o que fizemos

### Por que usar Docker nesta disciplina?

Imagine a aula **sem** Docker. Cada aluno teria que:

1. Baixar e instalar o MySQL
2. Configurar usuário e senha
3. Criar o banco na mão
4. Torcer para a versão ser a mesma da do professor

Resultado: metade da aula vira suporte técnico.

**Com Docker**, um único comando sobe o banco já configurado, **idêntico** para todo mundo. E, ao terminar o curso, outro comando remove tudo sem deixar sujeira na máquina.

### Os três conceitos que você vai usar sempre

| Conceito | O que é | Analogia |
|---|---|---|
| **Imagem** | Um molde pronto, com sistema e programas instalados | A receita do bolo |
| **Container** | Uma instância em execução de uma imagem | O bolo assado |
| **Volume** | Um espaço em disco que sobrevive à morte do container | O congelador, que continua cheio mesmo depois de você lavar a forma |

Guarde esta frase, ela vai fazer sentido total na Aula 20:

> **Container é descartável. Volume é onde a informação vive.**

---

## ✅ Confira se deu certo

Marque cada item antes de seguir:

- [ ] `node -v` mostra `v20` ou superior
- [ ] `npm -v` mostra um número
- [ ] O ícone da baleia está parado na barra de tarefas
- [ ] `docker -v` mostra a versão
- [ ] `docker compose version` mostra a versão
- [ ] `docker run --rm hello-world` mostrou "Hello from Docker!"

**Só siga adiante se os 6 itens estiverem marcados.**

---

## 🔧 Se deu erro

| Erro | O que significa | Como resolver |
|---|---|---|
| `node: command not found` | Node não instalado ou terminal desatualizado | Instale e **reabra o terminal** |
| `docker: command not found` | Docker não instalado | Instale e **reinicie o computador** |
| `Cannot connect to the Docker daemon` | Docker Desktop fechado | Abra o Docker Desktop e espere a baleia parar |
| `permission denied` (Linux) | Seu usuário não está no grupo docker | `sudo usermod -aG docker $USER` e saia/entre da sessão |
| Docker Desktop não abre (Windows) | Falta habilitar a virtualização | Ative o WSL2 seguindo o assistente do próprio Docker Desktop |
| `docker run` fica travado baixando | Internet lenta ou firewall | Aguarde; se falhar, tente em outra rede |

---

## ➡️ Próximo passo

Ambiente pronto. Vamos criar a pasta do projeto.

**[Aula 02 — Criando o projeto](02-criando-o-projeto.md)**
