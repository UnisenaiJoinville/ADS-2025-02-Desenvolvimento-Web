# Atividades Passo a Passo sobre Docker

## Atividade 1 — Instalação do Docker
```bash
docker --version
```

## Atividade 2 — Primeiro container
```bash
docker run hello-world
```

## Atividade 3 — Listando containers
```bash
docker ps -a
```

## Atividade 4 — Container interativo
```bash
docker run -it ubuntu bash
```
Dentro do container:
```bash
apt-get update
exit
```
Depois:
```bash
docker ps -a
```

## Atividade 5 — Removendo um container
```bash
docker ps -a
docker rm <container_id>
```

## Atividade 6 — Criando uma imagem Docker
```bash
cd atividade-06
docker build -t minha-imagem .
docker images
```

## Atividade 7 — Executando uma imagem
Ainda em `atividade-06`:
```bash
docker run minha-imagem
docker run --rm minha-imagem curl --version
```

## Atividade 8 — Container em segundo plano
```bash
docker run -d --name atividade8-nginx nginx
docker ps
```
Limpeza:
```bash
docker rm -f atividade8-nginx
```

## Atividade 9 — Expondo portas
```bash
docker run -d --name atividade9-nginx -p 8080:80 nginx
```
Abra `http://localhost:8080`.
Depois:
```bash
docker rm -f atividade9-nginx
```

## Atividade 10 — Volumes
```bash
docker volume create meu-volume
docker run -d --name atividade10-nginx -v meu-volume:/data nginx
docker volume ls
docker rm -f atividade10-nginx
```

## Atividade 11 — Inspecionando um container
```bash
docker run -d --name atividade11-nginx nginx
docker inspect atividade11-nginx
```

## Atividade 12 — Entrando em um container em execução
```bash
docker exec -it atividade11-nginx bash
```
Dentro dele:
```bash
apt-get update
apt-get install -y curl
exit
```
Depois:
```bash
docker rm -f atividade11-nginx
```

## Atividade 13 — Criando uma rede Docker
```bash
docker network create minha-rede
docker network ls
```

## Atividade 14 — Conectando containers à rede
```bash
docker run -d --network minha-rede --name container1 nginx
docker run -d --network minha-rede --name container2 nginx
docker exec container1 getent hosts container2
```
Depois:
```bash
docker rm -f container1 container2
```

## Atividade 15 — Docker Compose
```bash
cd atividade-15
docker compose up
```
Abra `http://localhost:8080`.

## Atividade 16 — Parando serviços com Compose
Dentro de `atividade-15`:
```bash
docker compose down
docker ps
```

## Atividade 17 — Atualizando uma imagem
```bash
cd ../atividade-17
docker build -t minha-imagem .
docker images
```

## Atividade 18 — Tagging de imagens
```bash
docker tag minha-imagem minha-imagem:v1
docker images
```

## Atividade 19 — Publicando no Docker Hub
```bash
cd ../atividade-19
bash publicar.sh
```

## Atividade 20 — Baixando imagem do Docker Hub
```bash
docker pull nginx
docker images
```

## Atividade 21 — Variável de ambiente
```bash
docker run --rm -e "MY_VAR=Hello" ubuntu env
```

## Atividade 22 — Limitando recursos
```bash
docker run --rm -m 512m --cpus="1.0" ubuntu
```

## Atividade 23 — Dockerfile multi-stage
```bash
cd atividade-23
docker build -t minha-imagem-multi .
docker run --rm -p 8082:80 minha-imagem-multi
```
Abra `http://localhost:8082` e pare com `Ctrl+C`.

## Atividade 24 — Monitorando containers
```bash
docker run -d --name atividade24-nginx nginx
docker stats
```

```bash
docker rm -f atividade24-nginx
```

## Atividade 25 — Script de inicialização
```bash
cd atividade-25
docker build -t atividade25 .
docker run --rm atividade25
```

## Atividade 26 — Docker Secrets
Exige Docker Swarm.
```bash
cd atividade-26
bash executar.sh
```
Veja os logs:
```bash
docker service logs atividade26_leitor-secret
```
Limpeza:
```bash
bash limpar.sh
```

## Atividade 27 — Backup de volumes
Garanta o volume e um dado de teste:
```bash
docker volume create meu-volume
docker run --rm -v meu-volume:/data ubuntu bash -c 'echo "arquivo de teste" > /data/exemplo.txt'
cd atividade-27
bash backup.sh
```

## Atividade 28 — Restaurando volumes
```bash
docker volume rm meu-volume
docker volume create meu-volume
cd ../atividade-28
cp ../atividade-27/backup.tar .
bash restaurar.sh
docker run --rm -v meu-volume:/data ubuntu cat /data/exemplo.txt
```

## Atividade 29 — Proxy reverso
```bash
cd atividade-29
docker compose up -d
```
Abra `http://localhost:8080`.
Depois:
```bash
docker compose down
```

## Atividade 30 — Limpeza
```bash
docker container prune
docker image prune
```
