# 10 - Atividade — Atividade teórica — Imagem x container

## Resposta
Uma imagem é o molde imutável que contém sistema base, runtime, dependências e arquivos necessários. Um container é uma instância em execução dessa imagem.

**Analogia técnica:** a imagem é como uma classe/artefato versionado; o container é como uma instância criada a partir desse artefato.

**Exemplo Node.js:** um `Dockerfile` pode gerar a imagem `minha-api:1.0` com Node 24 e o código da API. Ao executar `docker run minha-api:1.0`, o Docker cria um container que executa `npm run dev` ou o comando definido na imagem.