# Laboratório — 30 Atividades Sequenciais de Docker

**Aluno:** Victor Cesar Silva

Comandos executados e, nas atividades 2, 3, 7, 11, 22 e 24, a explicação pedida.

---

## Bloco 1 — Primeiros passos (1 a 5)

### 1. Instalação do Docker
```bash
docker --version
# Docker version 28.5.1, build e180ab8
docker compose version
```

### 2. Executando o primeiro container
```bash
docker run hello-world
```
**Explicação:** o Docker procurou a imagem `hello-world` localmente, não encontrou, baixou
do Docker Hub (*Unable to find image locally* → *Pull complete*), criou um container a
partir dela, executou o binário que imprime a mensagem e encerrou. O container não some
sozinho: fica parado (`Exited`) e ainda aparece em `docker ps -a`. Isso demonstra o ciclo
completo — pull da imagem, criação do container, execução e término.

### 3. Listando containers
```bash
docker ps       # só em execução
docker ps -a    # todos, inclusive parados
```
**Explicação:** `docker ps` lista apenas containers com processo ativo. `docker ps -a`
inclui os que já terminaram (`Exited (0)`) ou falharam (`Exited (1)`). A diferença é
importante no diagnóstico: um container que subiu e morreu **não aparece** em `docker ps`,
e sem o `-a` a impressão é de que ele nunca existiu. Foi exatamente com `-a` que
identifiquei o backend morrendo por causa do healthcheck do RabbitMQ. Um container parado
continua ocupando disco até ser removido com `docker rm`.

### 4. Container interativo Ubuntu
```bash
docker run -it ubuntu bash
apt-get update
exit
docker ps -a          # o container aparece como Exited
```
As flags `-i` (stdin aberto) e `-t` (TTY) dão o terminal interativo. Ao sair do `bash`,
o processo principal termina e o container para — um container vive enquanto seu processo
principal viver. O pacote instalado se perdeu: estava na camada gravável, não na imagem.

### 5. Removendo um container
```bash
docker ps -a
docker rm <container_id>
docker rm -f <container_id>    # força, se estiver rodando
```

---

## Bloco 2 — Imagens e portas (6 a 9)

### 6. Criando uma imagem
```dockerfile
FROM ubuntu
RUN apt-get update && apt-get install -y curl
```
```bash
docker build -t minha-imagem .
docker images
```

### 7. Executando a imagem
```bash
docker run minha-imagem
```
**Explicação:** o container sobe e encerra imediatamente, sem imprimir nada. O motivo é
que o Dockerfile não define `CMD` nem `ENTRYPOINT`, então vale o comando padrão da imagem
`ubuntu` (`bash`) — e sem `-it` não há terminal, o bash não tem o que ler no stdin e
termina na hora. A imagem "faz" apenas uma coisa: entrega um Ubuntu com `curl` instalado.
Para usá-la de fato: `docker run -it minha-imagem curl --version`. Lição: uma imagem sem
processo de longa duração não gera container de longa duração.

### 8. Container em segundo plano
```bash
docker run -d nginx
docker ps
```
`-d` (detached) devolve o terminal e deixa o container rodando em background. Aqui ele
permanece de pé porque o Nginx é um processo que não termina.

### 9. Expondo portas
```bash
docker run -d -p 8080:80 nginx
curl http://localhost:8080
```
`-p 8080:80` publica: `host:container`. O Nginx ouve na 80 dentro do container e é
alcançado pela 8080 no host.

---

## Bloco 3 — Volumes, inspeção e rede (10 a 14)

### 10. Volumes
```bash
docker volume create meu-volume
docker run -d -v meu-volume:/data nginx
docker volume ls
```

### 11. Inspecionando um container
```bash
docker inspect <container_id>
```
**Explicação:** devolve um JSON completo com todo o estado do container. As seções mais
úteis: `State` (status, exit code e resultado do healthcheck — onde se descobre *por que*
um container morreu); `NetworkSettings` (IP, redes às quais está ligado e portas
publicadas — foi assim que confirmei os IPs internos); `Mounts` (volumes e bind mounts, e
se o dado está mesmo persistindo); `Config.Env` (todas as variáveis que chegaram, ótimo
para achar erro de `.env`). É a ferramenta de diagnóstico mais completa, e a que evita o
reflexo de "apagar tudo e tentar de novo". Filtrando:
`docker inspect -f '{{.State.Health.Status}}' <id>`.

### 12. Conectando-se a um container em execução
```bash
docker exec -it <container_id> bash
```
Diferente do `run`, o `exec` entra em um container **já em execução**, sem criar outro.
Em imagens Alpine, use `sh` — não há `bash`.

### 13. Criando uma rede
```bash
docker network create minha-rede
docker network ls
```

### 14. Comunicação entre containers
```bash
docker run -d --network minha-rede --name container1 nginx
docker run -d --network minha-rede --name container2 nginx
docker exec container2 sh -c "getent hosts container1"
# 172.18.0.2   container1
```
Na mesma rede, o DNS interno resolve o **nome** do container. Na rede `bridge` padrão
isso não funciona — só em redes criadas pelo usuário, que é o que o Compose faz.

---

## Bloco 4 — Docker Compose (15 e 16)

### 15. Subindo com Compose
```yaml
services:
  web:
    image: nginx
    ports:
      - "8080:80"
```
```bash
docker compose up -d
curl http://localhost:8080
```
Observação: a chave `version:` do exemplo original está **obsoleta** no Compose V2 e gera
aviso — foi omitida.

### 16. Parando serviços
```bash
docker compose down
docker compose ps -a     # nada listado
```
Remove containers e rede; volumes nomeados permanecem (só saem com `-v`).

---

## Bloco 5 — Ciclo de vida de imagens (17 a 20)

### 17. Atualizando uma imagem
```bash
# Dockerfile: RUN apt-get update && apt-get install -y curl vim
docker build -t minha-imagem .
docker images
```
Só as camadas a partir da linha alterada são reconstruídas; as anteriores vêm do cache.
Por isso o `COPY package*.json` vem **antes** do `COPY . .` nos Dockerfiles deste projeto:
mudar o código não invalida o `npm install`.

### 18. Tagging
```bash
docker tag minha-imagem minha-imagem:v1
docker images
```
A tag é um ponteiro: os dois nomes apontam para o mesmo ID. Tags versionadas permitem
rollback — impossível com `latest`.

### 19. Publicando no Docker Hub
```bash
docker login
docker tag minha-imagem victorcesarsilva/minha-imagem:v1
docker push victorcesarsilva/minha-imagem:v1
```
O push exige o nome no formato `usuario/imagem:tag` — sem o prefixo do usuário, o Docker
tenta publicar na biblioteca oficial e recebe *denied*.

### 20. Baixando do Docker Hub
```bash
docker pull nginx
docker images
```

---

## Bloco 6 — Recursos e otimização (21 a 25)

### 21. Variáveis de ambiente
```bash
docker run -e "MY_VAR=Hello" ubuntu env | grep MY_VAR
# MY_VAR=Hello
```

### 22. Limitando CPU e memória
```bash
docker run -m 512m --cpus="1.0" ubuntu
```
**Explicação:** os dois limites são aplicados via **cgroups** do kernel. `-m 512m` limita
a memória a 512 MB — se o processo ultrapassar, o kernel o mata por OOM (exit code 137),
sem afetar o resto da máquina. `--cpus="1.0"` limita o tempo de CPU ao equivalente a um
núcleo; o processo não é morto, apenas escalonado com menos fatia de tempo. Isso importa
porque, por padrão, um container pode consumir **toda** a memória do host: um vazamento no
worker derrubaria a máquina inteira. Em produção eu declararia limites por serviço no
compose (`deploy.resources.limits`).

### 23. Multi-stage build
```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```
```bash
docker build -t minha-imagem-multi .
```
O Node existe só no estágio de build; a imagem final contém apenas Nginx e os arquivos
estáticos. Menor, mais rápida de distribuir e com muito menos superfície de ataque — sem
`npm`, sem `node_modules`, sem código-fonte. Aplicado de verdade no frontend dos
Cenários 2 e 3.

### 24. Monitorando containers
```bash
docker stats
```
**Explicação:** mostra em tempo real, por container: `CPU %` (percentual de um núcleo —
pode passar de 100% em multi-core); `MEM USAGE / LIMIT` (uso atual e o teto, que é a
memória do host quando não há limite definido); `MEM %`; `NET I/O` (tráfego acumulado
entrada/saída); `BLOCK I/O` (leitura/escrita em disco); e `PIDS` (número de processos —
crescimento contínuo aqui indica vazamento de processos). É a primeira ferramenta para
descobrir *qual* container está consumindo recursos. A limitação é ser um retrato do
instante: não guarda histórico. Para investigar algo que aconteceu antes, é preciso
métrica persistida (Prometheus + Grafana).

### 25. Script de inicialização
```bash
#!/bin/sh
echo "Iniciando container - Victor Cesar Silva"
exec "$@"
```
```dockerfile
COPY init.sh /init.sh
RUN chmod +x /init.sh
ENTRYPOINT ["/init.sh"]
CMD ["nginx", "-g", "daemon off;"]
```
O `exec "$@"` é essencial: substitui o shell pelo processo real, para que ele receba o
PID 1 e os sinais de parada — sem isso, `docker stop` demora 10 segundos e mata à força.
Atenção no Windows: o script precisa estar com fim de linha **LF**, senão dá
`exec format error`.

---

## Bloco 7 — Segredos, backup e limpeza (26 a 30)

### 26. Docker Secrets (Swarm)
```bash
docker swarm init
echo "minha-senha" | docker secret create senha-db -
docker service create --name api --secret senha-db nginx
docker secret ls
```
O segredo é montado em `/run/secrets/senha-db` **em memória**, nunca gravado na imagem
nem visível em `docker inspect` — a diferença essencial para uma variável de ambiente.
Requer Swarm: `docker secret` não funciona no Compose comum, e é a razão de este projeto
usar `.env` com `.gitignore` em ambiente local.

### 27. Backup de volume
```bash
docker run --rm \
  -v meu-volume:/data \
  -v $(pwd):/backup \
  ubuntu tar cvf /backup/backup.tar /data
```
Um container temporário (`--rm`) monta o volume e a pasta atual, e compacta um no outro.
No PowerShell, troque `$(pwd)` por `${PWD}`.

### 28. Restaurando volume
```bash
docker run --rm \
  -v meu-volume:/data \
  -v $(pwd):/backup \
  ubuntu bash -c "tar xvf /backup/backup.tar -C /data --strip-components=1"
```
O `--strip-components=1` evita que os arquivos sejam restaurados em `/data/data`.

### 29. Proxy reverso Nginx
Implementado de verdade no **Cenário 2**: só o Nginx publica porta (`8082:80`) e faz
`proxy_pass http://app:80` pela rede interna. O container `app` usa apenas `expose` e é
inalcançável do host.

```nginx
server {
    listen 80;
    location / {
        proxy_pass http://app:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 30. Limpeza de recursos
```bash
docker container prune    # remove containers parados
docker image prune        # remove imagens dangling (sem tag)
docker image prune -a     # remove toda imagem sem container usando
docker volume prune       # CUIDADO: apaga volumes não usados = perda de dados
docker system df          # quanto cada categoria ocupa
```
`docker system prune -a --volumes` limpa tudo de uma vez — e é o comando mais perigoso da
lista, porque apaga dados de banco de projetos que estejam apenas parados.
