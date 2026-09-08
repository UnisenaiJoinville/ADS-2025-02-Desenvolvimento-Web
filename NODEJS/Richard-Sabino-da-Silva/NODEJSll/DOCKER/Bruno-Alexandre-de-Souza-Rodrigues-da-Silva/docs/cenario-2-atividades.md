# Atividades do Cenário 2 (seção 7.4)

**Aluno:** Bruno Silva
**Pilha:** React/Vite + PostgreSQL + Node/Express + Redis + RabbitMQ + Nginx

---

## 1. Teórica — Diferença entre `ports` e `expose`

As duas dizem respeito a portas, mas resolvem coisas diferentes.

**`ports`** publica a porta para fora, no host. Ele cria um mapeamento
`porta_do_host:porta_do_container` e a partir daí eu consigo acessar o serviço
pelo navegador, pelo Insomnia ou por qualquer programa da minha máquina.

**`expose`** apenas documenta que o container escuta naquela porta e a deixa
disponível **para os outros containers da mesma rede**. Nada é publicado para o
host. Do meu navegador, aquele serviço continua inacessível.

### Exemplo do meu proxy

No Cenário 2 só um serviço usa `ports`:

```yaml
  proxy:
    image: nginx:1.27-alpine
    ports:
      - "8090:80"        # unico ponto de entrada do host
```

O frontend e a API usam `expose`:

```yaml
  frontend:
    expose:
      - "5173"           # so o proxy alcanca

  api:
    expose:
      - "3000"           # so o proxy alcanca
```

O Nginx conversa com eles pela rede interna, usando o nome do serviço:

```
location /     { proxy_pass http://frontend:5173; }
location /api/ { proxy_pass http://api:3000/; }
```

O resultado é que tudo entra por uma porta só. Confirmei no `docker compose ps`:

```
SERVICE    PORTS
proxy      0.0.0.0:8090->80/tcp     <- unico publicado
frontend   5173/tcp                 <- so interno
api        3000/tcp                 <- so interno
postgres   5432/tcp                 <- so interno
redis      6379/tcp                 <- so interno
```

**Observação:** usei a porta 8090 e não a 8080 do material, porque a 8080 já
estava ocupada por outro projeto na minha máquina.

---

## 2. Prática — Subir o cenário e acessar pelo proxy

```
$ docker compose up -d --build
$ curl -s -o /dev/null -w '%{http_code}' http://localhost:8090/
HTTP 200
```

O frontend abre normalmente pelo proxy. A API também responde pelo mesmo host,
no caminho `/api/`:

```
$ curl http://localhost:8090/api/health
{"status":"ok","servico":"api-cenario-2"}

$ curl http://localhost:8090/api/produtos
{"origem":"postgres","dados":[{"id":1,"nome":"Teclado","preco":"150.00"},...]}

$ curl http://localhost:8090/api/produtos
{"origem":"redis","dados":[{"id":1,"nome":"Teclado","preco":"150.00"},...]}
```

A segunda chamada já veio do Redis, mostrando o cache funcionando também neste
cenário. Evidência completa em `evidencias/cenario-2-evidencias.txt`.

---

## 3. Prática — Ativar o profile tools

Sem a flag, o PgAdmin não sobe junto com o resto:

```
$ docker compose ps --services --filter status=running
api frontend postgres proxy rabbitmq redis
```

Com a flag, ele entra:

```
$ docker compose --profile tools up -d
 Container cenario-2-bruno-pgadmin-1  Started

$ curl -s -o /dev/null -w '%{http_code}' http://localhost:5050
HTTP 302
```

O 302 é o PgAdmin redirecionando para a tela de login, ou seja, está no ar.

É exatamente para isso que o `profiles` serve: ferramentas de apoio que eu uso
de vez em quando não precisam consumir memória o tempo todo.

### Problema que apareceu

Na primeira tentativa o PgAdmin subiu e morreu logo em seguida. Fui nos logs
antes de mexer em qualquer coisa:

```
$ docker compose --profile tools ps -a
pgadmin    Exited (1)

$ docker compose --profile tools logs pgadmin
pgadmin-1  | 'admin@local.test' does not appear to be a valid email address.
```

O e-mail `admin@local.test` que está no material é rejeitado pela versão 8 do
PgAdmin, porque o domínio `.test` não passa na validação dele. Troquei para
`admin@local.com` e subiu.

Vale registrar que eu só descobri isso porque olhei o log. Pelo `docker compose
ps` normal o serviço simplesmente não aparecia, e eu poderia ter achado que o
profile é que não estava funcionando.

---

## 4. Análise — Por que o PostgreSQL não precisa publicar porta

Porque **ninguém fora da rede Docker precisa falar com ele**. O único cliente do
banco é a API, e ela está na mesma rede `app_net`. Ela alcança o banco pelo nome
do serviço (`postgres:5432`) sem que nenhuma porta seja publicada no host.

Publicar a porta 5432 traria três problemas concretos:

**Superfície de ataque desnecessária.** Uma porta publicada fica acessível na
rede da máquina. Num notebook em rede pública, isso significa expor um banco com
senha de desenvolvimento para quem estiver na mesma rede.

**Conflito de porta.** Se eu já tenho um PostgreSQL instalado na máquina ou
outro projeto usando a 5432, a pilha simplesmente não sobe. Foi o que aconteceu
comigo no Cenário 1 com a porta 3000, e a 5432 também já estava ocupada aqui.

**Acesso acidental ao banco errado.** Com a porta publicada, um cliente de banco
apontado para `localhost:5432` pode acabar conectado ao container errado sem que
eu perceba.

A regra prática que tirei disso: **publicar porta é exceção, não padrão**. Só
publico o que uma pessoa vai acessar do navegador ou de uma ferramenta externa.
No Cenário 2 isso são três coisas: o proxy (8090), o painel do RabbitMQ (15673)
e o PgAdmin (5050) — e o PgAdmin ainda por cima só quando eu peço, via profile.

Quando eu realmente precisar inspecionar o banco, tenho duas saídas sem abrir
porta: entrar no container com `docker compose exec postgres psql`, ou subir o
PgAdmin com o profile, que fala com o banco por dentro da rede.
