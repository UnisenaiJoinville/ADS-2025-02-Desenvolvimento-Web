# Docker Tutorial Project

Resolução das 30 atividades passo a passo sobre Docker, organizadas **uma
pasta por atividade**, para facilitar a correção e a evidência do que foi
feito em cada uma.

## Estrutura

```
docker-tutorial-project/
├── enunciado/
│   └── enunciado-original.md      # enunciado original das 30 atividades
├── atividade-01/  ... atividade-30/
│   ├── README.md                  # objetivo, comandos e explicação de cada atividade
│   ├── Dockerfile                 # quando a atividade envolve build de imagem
│   └── docker-compose.yml         # quando a atividade envolve Compose
```

Atividades que são apenas comandos de terminal (ex: `docker ps`,
`docker rm`, `docker volume create`, `docker network create`, Secrets,
backup/restore de volume, tagging, push/pull, prune) não geram um
`Dockerfile` — para essas, o próprio `README.md` da pasta já traz o
comando completo e a explicação, o que basta para evidenciar o que foi
feito.

## Como usar

Entre em cada `atividade-XX/`, leia o `README.md` e rode os comandos
indicados. Quem tiver `Dockerfile` ou `docker-compose.yml`, é só:

```bash
cd atividade-06
docker build -t minha-imagem .
```

ou, para as que usam Compose:

```bash
cd atividade-15
docker compose up
```

## Pré-requisito

Docker instalado e rodando na máquina:
```bash
docker --version
```
