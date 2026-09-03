# Docker e Docker Compose na Prática
## Projeto guiado passo a passo — Roteiro didático para sala de aula

> Material derivado de "Docker e Docker Compose para ambientes profissionais de
> desenvolvimento" (Carlos Uchôa e William Sestito) e de "Node.js Profissional —
> Projeto Guiado de Backend". Reorganizado em formato **incremental**: cada
> conceito só aparece quando o problema que ele resolve aparece primeiro.
>
> Filosofia: **problema → conceito → ferramenta**. Nunca "instale isso porque
> vamos usar isso".

---

## Como usar este material

Cada passo tem:

- **Problema** — a dor que motiva o próximo conceito.
- **Conceito** — o que o aluno precisa entender antes de digitar qualquer comando.
- **Prática** — comandos e arquivos para executar em aula, em ordem.
- **Checkpoint** — o que o aluno deve conseguir mostrar/explicar antes de avançar.

O projeto final entregue ao fim do roteiro é equivalente ao **Cenário 1** do
material original (Node.js + MySQL + Redis + RabbitMQ), mas construído peça por
peça em vez de recebido pronto. Quem quiser adicionar o frontend Vue (como no
Cenário 1 completo) encontra isso no Passo 9.

---

## Passo 0 — Preparar o ambiente

Antes de qualquer container, valide a instalação (siga a trilha do sistema
operacional da turma: Windows 11, Linux ou macOS, conforme o material de
instalação de vocês).

```bash
docker --version
docker compose version
docker run --rm hello-world
```

**Checkpoint:** todo aluno roda os três comandos acima sem erro e consegue
explicar em uma frase o que `docker run hello-world` acabou de fazer (baixou uma
imagem e executou um container a partir dela).

---

## Passo 1 — Uma API sem Docker (para sentir o problema)

**Problema:** antes de container, o aluno precisa sentir por que ele existe.
Sem isso, Docker vira "decoreba de comando".

Crie a pasta do projeto:

```bash
mkdir docker-projeto-guiado && cd docker-projeto-guiado
mkdir backend && cd backend
npm init -y
npm install express
```

`backend/server.js`:

```js
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});
```

Ajuste o `package.json` para `"type": "module"` e rode:

```bash
node server.js
```

Acesse `http://localhost:3000/health`.

**Pergunta disparadora para a turma:** "Se eu mandar esse projeto para o colega
do lado, ele vai conseguir rodar exatamente assim, na mesma versão do Node, sem
nenhum ajuste?" A resposta quase sempre é não — e é esse o problema que o Docker
resolve.

**Checkpoint:** API respondendo localmente, sem Docker.

---

## Passo 2 — Empacotando a API: o primeiro Dockerfile

**Conceito:**

| Termo | Definição |
|---|---|
| Imagem | Modelo imutável com tudo que a aplicação precisa para rodar |
| Container | Uma instância em execução dessa imagem |
| Dockerfile | Receita que descreve como construir a imagem |

`backend/Dockerfile`:

```dockerfile
FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
```

Construir e rodar:

```bash
docker build -t projeto-api .
docker run -p 3000:3000 projeto-api
```

Acesse `http://localhost:3000/health` de novo — agora rodando **dentro** de um
container, não na máquina do aluno.

**Checkpoint:** aluno explica com suas palavras a diferença entre imagem e
container, usando esse exemplo (`projeto-api` é a imagem; o que está rodando
depois do `docker run` é o container).

---

## Passo 3 — O problema de perder o container e a ideia de variável de ambiente

**Problema:** pare o container (`Ctrl+C`) e rode de novo com uma porta diferente:

```bash
docker run -p 4000:3000 -e PORT=3000 projeto-api
```

Mostre que a mesma imagem pode subir em portas diferentes, e que a aplicação
não deveria ter a porta "hardcoded" — daí a importância de variáveis de
ambiente, que voltam com força total quando entrar o banco de dados.

**Checkpoint:** aluno sobe dois containers da mesma imagem em portas
diferentes ao mesmo tempo (`3000` e `4000`) e entende que são dois processos
isolados.

---

## Passo 4 — Por que preciso de um banco, e por que não instalar na máquina

**Problema:** a API vai precisar de um banco de dados. Instalar MySQL
diretamente no Windows, Linux e macOS da turma gera versões diferentes,
portas conflitantes, senhas diferentes.

**Conceito:** volume (dado persistente) e rede (comunicação entre containers).

Primeiro, sem Compose ainda, só para sentir o problema de "dois containers que
precisam se falar":

```bash
docker network create projeto-net

docker run -d \
  --name projeto-mysql \
  --network projeto-net \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=projeto \
  -v projeto_mysql_data:/var/lib/mysql \
  mysql:8.4
```

Pergunte à turma: "Como a API vai encontrar esse banco? Pelo IP do container?"
Mostre que o IP muda a cada `docker run`, e que a resposta certa é **resolver
pelo nome do serviço na rede Docker** — o que leva naturalmente ao Compose.

**Checkpoint:** aluno explica por que `localhost` dentro de um container não
aponta para outro container nem para o host.

---

## Passo 5 — Docker Compose: descrevendo tudo em um arquivo

**Problema:** rodar `docker network create`, depois `docker run` do banco, depois
`docker build` e `docker run` da API, na ordem certa, toda vez — é inviável em
equipe.

**Conceito:** Compose é um contrato técnico. Ele descreve, em um único
arquivo, quais serviços existem, como se conectam, o que persiste e quais
variáveis são necessárias.

Pare e remova os containers manuais do passo anterior:

```bash
docker rm -f projeto-mysql
docker network rm projeto-net
```

Na raiz do projeto, crie `.env`:

```env
MYSQL_DATABASE=projeto
MYSQL_USER=projeto_user
MYSQL_PASSWORD=projeto_pass
MYSQL_ROOT_PASSWORD=root_pass
```

E `docker-compose.yml`:

```yaml
name: projeto-guiado

services:
  api:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      DB_HOST: mysql
      DB_USER: ${MYSQL_USER}
      DB_PASSWORD: ${MYSQL_PASSWORD}
      DB_NAME: ${MYSQL_DATABASE}
    depends_on:
      mysql:
        condition: service_healthy
    networks: [app_net]

  mysql:
    image: mysql:8.4
    environment:
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 10
    networks: [app_net]

networks:
  app_net:

volumes:
  mysql_data:
```

Subir tudo com um comando:

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f api
```

**Checkpoint:** aluno consegue, sozinho, explicar cada bloco do arquivo
(`services`, `environment`, `depends_on`, `networks`, `volumes`) e sabe rodar
`docker compose down` vs `docker compose down -v`, entendendo a diferença
(o segundo apaga o volume e, portanto, os dados).

**Atividade prática sugerida:**

| Atividade | Produto esperado |
|---|---|
| Derrubar só com `docker compose down` e subir de novo | Dados do MySQL continuam lá |
| Derrubar com `docker compose down -v` e subir de novo | Banco volta vazio — evidenciar a diferença |

---

## Passo 6 — Adicionando Redis (cache)

**Problema:** toda requisição de leitura está batendo direto no banco.

**Conceito:** Redis como cache/sessão — rápido, em memória, não é o "banco
principal" da aplicação.

Adicione ao `docker-compose.yml`, dentro de `services`:

```yaml
  redis:
    image: redis:7.4-alpine
    volumes:
      - redis_data:/data
    networks: [app_net]
```

E em `redis_data:` na seção `volumes:` no final do arquivo.

Ligue a API ao Redis por variável de ambiente (`REDIS_HOST: redis`) do mesmo
jeito que foi feito com o MySQL — reforçando que o nome do serviço é o nome
do host dentro da rede Docker.

```bash
docker compose up -d --build
docker compose logs -f redis
```

**Checkpoint:** aluno explica em que situação usaria Redis em vez de MySQL
para guardar um dado (ex.: sessão de login, contador de visitas, cache de
consulta pesada).

---

## Passo 7 — Adicionando RabbitMQ e um worker (mensageria)

**Problema:** uma ação da API (ex.: "agendamento criado") precisa disparar um
processamento que não pode travar a resposta HTTP (enviar e-mail, gerar
relatório, notificar).

**Conceito:** fila/broker de mensagens — a API publica um evento, um processo
separado (worker) consome esse evento de forma assíncrona.

```yaml
  rabbitmq:
    image: rabbitmq:4-management
    ports:
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD}
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 10s
      timeout: 5s
      retries: 10
    networks: [app_net]

  worker:
    build: ./worker
    command: node worker.js
    environment:
      RABBITMQ_HOST: rabbitmq
    depends_on:
      rabbitmq:
        condition: service_healthy
    networks: [app_net]
```

Adicione `RABBITMQ_USER` e `RABBITMQ_PASSWORD` ao `.env`, crie a pasta
`worker/` com um `Dockerfile` simples (igual ao da API) e um `worker.js`
mínimo que só loga que está no ar — o consumo real de fila fica como exercício
guiado em aula.

Acesse o painel de gerenciamento em `http://localhost:15672`.

**Checkpoint:** aluno acessa o painel do RabbitMQ e explica a diferença entre
Redis (cache) e RabbitMQ (fila/broker) com um exemplo real do projeto.

---

## Passo 8 — Healthcheck, `depends_on` e diagnóstico de falhas

**Problema:** às vezes a API sobe antes do banco estar pronto para aceitar
conexões, e a aplicação quebra no primeiro request.

**Conceito:** `depends_on` com `condition: service_healthy` só libera o
próximo serviço depois que o healthcheck passar — não apenas depois que o
container "existir".

Comandos de diagnóstico para praticar em aula:

```bash
docker compose ps
docker compose logs -f api
docker compose exec api sh
docker inspect projeto-guiado-mysql-1
docker volume ls
docker network ls
```

**Atividade prática:** o professor derruba propositalmente uma variável do
`.env` (ex.: remove `MYSQL_PASSWORD`) e pede para a turma diagnosticar,
usando só `logs`, `ps` e `inspect`, sem rebuild às cegas.

**Checkpoint:** aluno resolve o erro proposto usando apenas as ferramentas de
diagnóstico, sem "apagar tudo e tentar de novo" como primeira reação.

---

## Passo 9 (opcional) — Adicionando o frontend (Vue) e completando o Cenário 1

Se a turma quiser fechar exatamente o Cenário 1 do material de referência,
adicione:

```yaml
  frontend:
    build: ./frontend
    command: npm run dev -- --host 0.0.0.0
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - frontend_node_modules:/app/node_modules
    depends_on:
      - api
    networks: [app_net]
```

E `frontend_node_modules:` na seção de volumes. A partir daqui a arquitetura é
equivalente à do Cenário 1 original, mas o aluno chegou até ela entendendo
**por que** cada peça foi adicionada, não copiando um arquivo pronto.

---

## Passo 10 — Boas práticas antes de fechar o projeto

Repasse com a turma, agora que cada item tem um "porquê" concreto do próprio
projeto:

| Prática | Onde isso apareceu no nosso projeto |
|---|---|
| `.env.example` versionado, `.env` real fora do Git | Evita vazar `MYSQL_ROOT_PASSWORD` |
| Fixar versão da imagem (`mysql:8.4`, não `mysql:latest`) | Evita quebra silenciosa ao atualizar |
| Volume nomeado para dado que precisa persistir | `mysql_data`, `redis_data` |
| Healthcheck em serviço que outros dependem | `mysql`, `rabbitmq` |
| `.dockerignore` (adicionar `node_modules`, `.git`) | Build mais rápido e imagem menor |

`backend/.dockerignore`:

```
node_modules
npm-debug.log
.env
```

---

## Entrega final (sugestão de rubrica para a turma)

| Item | Critério | Peso sugerido |
|---|---|---|
| `docker-compose.yml` | Sobe sem erro com `docker compose up -d --build` | 30% |
| Dockerfiles | Imagens funcionais para api, worker (e frontend, se aplicável) | 15% |
| `.env.example` | Sem segredos reais, nomes coerentes com o compose | 10% |
| README.md | Passo a passo de execução e troubleshooting | 20% |
| Demonstração | Execução em sala explicando cada serviço | 15% |
| Análise crítica | O que mudaria em produção (multi-stage build, secrets, etc.) | 10% |

---

## Referência rápida de comandos

```bash
docker compose up -d --build     # sobe tudo em segundo plano
docker compose ps                # status e portas
docker compose logs -f <serviço> # acompanhar logs
docker compose exec <serviço> sh # entrar no container
docker compose down              # derruba containers e rede
docker compose down -v           # derruba e apaga volumes (perde dados)
docker inspect <container>       # rede, mounts, variáveis, healthcheck
docker volume ls                 # volumes persistentes
docker network ls                # redes Docker
```

---

## De onde veio cada parte deste roteiro

- Fundamentos, cenários e boas práticas: material "Docker e Docker Compose
  para ambientes profissionais de desenvolvimento" (Uchôa e Sestito, ago/2026).
- Filosofia incremental (problema → conceito → ferramenta) e sequência de
  aulas: material "Node.js Profissional — Projeto Guiado de Backend".
- A reorganização passo a passo, os checkpoints e as perguntas disparadoras
  foram criados especificamente para uso didático em sala, a partir desses
  dois materiais.
