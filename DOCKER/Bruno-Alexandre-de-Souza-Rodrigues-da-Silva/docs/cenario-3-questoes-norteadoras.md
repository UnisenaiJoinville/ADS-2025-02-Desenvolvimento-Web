# Cenário 3 — Questões norteadoras (seção 8.2)

**Aluno:** Bruno Silva
**Projeto:** Biblioteca — controle de empréstimos

Respondi estas cinco perguntas **antes** de escrever o `docker-compose.yml`,
porque são elas que decidem o desenho da arquitetura.

---

## 1. Quais serviços precisam ser acessados pelo host e quais ficam só na rede interna?

Parti da pergunta ao contrário: quem é o cliente de cada serviço?

| Serviço | Quem chama | Publicado? |
|---|---|---|
| proxy | pessoa, pelo navegador | **sim**, 8095 |
| frontend | o proxy | não |
| api | o proxy | não |
| postgres | a api | não |
| redis | a api | não |
| rabbitmq | a api e o worker | só o painel, 15675 |
| worker | ninguém (ele consome a fila) | não |
| pgadmin | eu, quando preciso inspecionar | só com profile, 5051 |

A regra que segui: **publicar porta é exceção**. Só publiquei o que uma pessoa
abre no navegador. O frontend e a API não precisam de porta própria porque
sempre são alcançados através do proxy, e o proxy fala com eles pela rede
interna, pelo nome do serviço.

O RabbitMQ é um caso híbrido. A porta 5672, que a API e o worker usam, fica
interna. Só publiquei a 15675 (painel de gerenciamento), porque essa é a que eu
abro no navegador para mostrar a fila funcionando na apresentação.

## 2. Quais dados precisam sobreviver ao `docker compose down`?

Separei em três categorias:

**Precisa sobreviver — volume nomeado:**
- `postgres_data` — livros e empréstimos. É o dado real do sistema; perder isso
  é perder o trabalho.
- `rabbitmq_data` — mensagens que ainda não foram processadas. Se o worker cair
  com mensagem na fila, ela precisa estar lá quando ele voltar. Por isso a fila
  é `durable` e a mensagem é `persistent`.

**Pode sobreviver, mas não é crítico:**
- `redis_data` — é cache. Se sumir, a próxima requisição busca no banco e
  reconstrói. Coloquei volume mesmo assim para não perder o cache num restart
  bobo, mas o sistema funciona sem ele.

**Não precisa sobreviver:**
- código da aplicação (está na imagem)
- `node_modules` (é reinstalado no build)
- logs de container

Fiz o teste no Cenário 1 e vale aqui: `docker compose down` mantém os volumes,
`docker compose down -v` apaga. Por isso o `-v` só entra quando eu quero mesmo
resetar o banco para começar do zero.

## 3. Quais variáveis podem ser públicas no `.env.example` e quais são segredos?

O `.env.example` mostra **quais variáveis existem**, não **quais são os
valores**.

Podem ir com o valor real, porque não são segredo:

```env
POSTGRES_DB=biblioteca
POSTGRES_USER=biblioteca_user
```

O nome do banco e do usuário não dão acesso a nada sozinhos, e ajudam quem for
rodar o projeto a entender a estrutura.

São segredos e vão com valor falso:

```env
POSTGRES_PASSWORD=troque_esta_senha
RABBITMQ_PASSWORD=troque_esta_senha_mq
```

Qualquer coisa que **autentica** é segredo: senha, token, chave de API, string
de conexão completa.

O `.env` real fica no `.gitignore`, e eu coloquei o `.gitignore` **antes do
primeiro commit** de propósito. Se eu commitasse a senha e apagasse depois, ela
continuaria no histórico do Git para sempre — apagar o arquivo não apaga os
commits anteriores.

## 4. Como a equipe vai provar que o backend conversa com banco, Redis e mensageria?

Não quis provar com print de "está rodando", porque container de pé não
significa que ele conversa com os outros. Fiz três provas concretas:

**Prova 1 — o endpoint `/health` consulta as três dependências de verdade.**
Ele não devolve `ok` fixo: executa um `SELECT 1` no Postgres, um `ping` no Redis
e verifica o canal do RabbitMQ.

```json
{"status":"ok","dependencias":{"postgres":true,"redis":true,"rabbitmq":true}}
```

Se qualquer uma cair, o campo vira `false`, o status vira `degradado` e o HTTP
vira 503.

**Prova 2 — o campo `origem` mostra o cache trabalhando.**

```
1a chamada: {"origem":"postgres", ...}
2a chamada: {"origem":"redis", ...}
```

A mudança de `postgres` para `redis` só acontece se a API realmente gravou e leu
do Redis.

**Prova 3 — o log do worker prova a fila ponta a ponta.** Ao criar um
empréstimo, a API responde na hora e publica na fila. O worker, que é **outro
container**, mostra no log:

```
Gerando comprovante do emprestimo 1 para Bruno Silva
Comprovante do emprestimo 1 pronto
```

Essa é a prova mais forte, porque a mensagem atravessou três containers: api →
rabbitmq → worker.

## 5. Como um colega em outro sistema operacional executa isso?

Essa pergunta mudou decisões concretas do projeto:

**Usei volume nomeado no banco, não bind mount.** No Linux, um bind mount cria
arquivos com o dono do processo do container, o que gera problema de permissão.
Volume nomeado é gerenciado pelo Docker e funciona igual nos três sistemas.

**Fixei versão em todas as imagens** (`postgres:17-alpine`, `redis:7.4-alpine`).
Se eu usasse `latest`, um colega que rodasse daqui a três meses poderia receber
uma versão diferente e o comportamento mudaria sem ninguém ter alterado nada.

**Escolhi imagens com suporte arm64**, porque quem estiver em Mac com Apple
Silicon não vai precisar de emulação. Todas as imagens que usei são multi-arch.

**Escrevi o README com as três trilhas separadas**, com os detalhes que só
aparecem em cada sistema: Hyper-V e edição do Windows no Windows 11 sem WSL,
grupo `docker` e a necessidade de logout no Linux, arquitetura no macOS.

**Documentei o conflito de porta**, porque foi o erro que mais apareceu comigo:
a máquina do colega pode ter outra coisa na mesma porta, e a solução é trocar o
mapeamento — não desistir.

O objetivo é que o colega execute dois comandos e funcione:

```bash
cp .env.example .env
docker compose up -d --build
```

---

## Análise crítica — o que seria diferente em produção

Esta seção vale 10% da nota e responde a pergunta "o que mudaria em produção?".

**Build das imagens.** Hoje uso `npm install` e rodo em modo dev. Em produção
usaria multi-stage build com `npm ci --omit=dev`: instala exatamente o que está
no lock file, sem dependências de desenvolvimento. A imagem fica menor e com
menos coisa que possa ser explorada. Fiz um exemplo de multi-stage na atividade
23 do laboratório e a imagem caiu de 259MB para 235MB num caso trivial — num
projeto real a diferença é maior.

**Usuário do container.** Todos rodam como root. Se alguém escapar do processo,
já está com privilégio máximo dentro do container. Em produção usaria
`USER node`, que a imagem oficial já traz pronto.

**Segredos.** O `.env` resolve o problema de não versionar senha, mas o arquivo
fica em texto puro no disco e qualquer processo da máquina consegue ler. Em
produção usaria Docker Secrets (que a atividade 26 do laboratório apresenta, mas
exige Swarm) ou um cofre externo.

**Banco em container.** Funciona muito bem para desenvolvimento, mas em produção
o banco geralmente é um serviço gerenciado. O volume local não faz backup
automático, não tem réplica e some junto com a máquina.

**Observabilidade.** Hoje tenho `docker compose logs`, que é suficiente para
depurar na minha máquina e inútil quando o sistema está no ar. Faltam log
estruturado em JSON, métricas e alerta. O `/health` que implementei é a base
disso, mas sozinho ele não avisa ninguém — alguém precisa estar consultando.

**Escala e disponibilidade.** É um container por serviço. Se a API cair, o
sistema cai. Em produção rodaria várias réplicas da API e do worker atrás de um
balanceador, com reinício automático. Isso já é território de orquestrador, e o
Compose não faz isso — é a fronteira onde entra Kubernetes ou Swarm.

**Rede.** Uso uma rede só. Em produção separaria pelo menos duas: uma para o que
recebe tráfego externo e outra só para os dados, de forma que o banco não fique
alcançável nem de dentro da rede da aplicação inteira.
