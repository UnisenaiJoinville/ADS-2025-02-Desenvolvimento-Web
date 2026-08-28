# step-by-step-docker — 30 atividades práticas

Implementação das 30 atividades de `step-by-step-docker.md`, uma subpasta por
atividade. Cada subpasta tem:

- `README.md` — objetivo, explicação técnica e (quando a atividade pede) os
  arquivos como `Dockerfile`/`docker-compose.yml`/scripts.
- `run.sh` — script com os comandos reais da atividade.
- `EVIDENCIA.md` — gerado por `run.sh`, com a saída real dos comandos.

## Como rodar tudo

Com o Docker (Desktop/Engine) aberto, a partir desta pasta:

```
./executar-todas.sh
```

O script roda as 30 atividades em ordem (uma depende de recursos criados
pela anterior em alguns casos, como redes e volumes) e para com uma mensagem
clara se alguma delas falhar. Cada `EVIDENCIA.md` é sobrescrito com a saída
da execução mais recente.

Para rodar uma atividade isolada, entre na pasta dela e rode `./run.sh`.

## Índice

| Nº | Pasta | Atividade |
|----|-------|-----------|
| 01 | [`at01-instalacao/`](at01-instalacao/) | Instalação do Docker |
| 02 | [`at02-hello-world/`](at02-hello-world/) | Executando seu primeiro container |
| 03 | [`at03-listar-containers/`](at03-listar-containers/) | Listando containers |
| 04 | [`at04-container-interativo/`](at04-container-interativo/) | Criando um container interativo |
| 05 | [`at05-remover-container/`](at05-remover-container/) | Removendo um container |
| 06 | [`at06-imagem/`](at06-imagem/) | Criando uma imagem Docker |
| 07 | [`at07-executar-imagem/`](at07-executar-imagem/) | Executando uma imagem |
| 08 | [`at08-background/`](at08-background/) | Criando um container em segundo plano |
| 09 | [`at09-portas/`](at09-portas/) | Expondo portas |
| 10 | [`at10-volumes/`](at10-volumes/) | Usando volumes |
| 11 | [`at11-inspect/`](at11-inspect/) | Inspecionando um container |
| 12 | [`at12-exec/`](at12-exec/) | Conectando-se a um container em execução |
| 13 | [`at13-rede/`](at13-rede/) | Criando uma rede Docker |
| 14 | [`at14-conectando-containers/`](at14-conectando-containers/) | Conectando containers à rede |
| 15 | [`at15-compose/`](at15-compose/) | Usando Docker Compose |
| 16 | [`at16-parando-servicos/`](at16-parando-servicos/) | Parando serviços com Docker Compose |
| 17 | [`at17-atualizando-imagem/`](at17-atualizando-imagem/) | Atualizando uma imagem |
| 18 | [`at18-tagging/`](at18-tagging/) | Tagging de imagens |
| 19 | [`at19-publicando-imagem/`](at19-publicando-imagem/) | Publicando uma imagem |
| 20 | [`at20-baixando-imagem/`](at20-baixando-imagem/) | Baixando uma imagem do Docker Hub |
| 21 | [`at21-variaveis-ambiente/`](at21-variaveis-ambiente/) | Criando um container com variáveis de ambiente |
| 22 | [`at22-limitando-recursos/`](at22-limitando-recursos/) | Limitando recursos do container |
| 23 | [`at23-multistage/`](at23-multistage/) | Usando Dockerfile multi-stage |
| 24 | [`at24-monitorando/`](at24-monitorando/) | Monitorando containers |
| 25 | [`at25-script-inicializacao/`](at25-script-inicializacao/) | Criando um container com script de inicialização |
| 26 | [`at26-docker-secrets/`](at26-docker-secrets/) | Usando Docker Secrets |
| 27 | [`at27-backup-volumes/`](at27-backup-volumes/) | Backup de volumes |
| 28 | [`at28-restaurando-volumes/`](at28-restaurando-volumes/) | Restaurando volumes |
| 29 | [`at29-proxy-reverso/`](at29-proxy-reverso/) | Configurando um proxy reverso |
| 30 | [`at30-limpeza/`](at30-limpeza/) | Limpeza de recursos |
