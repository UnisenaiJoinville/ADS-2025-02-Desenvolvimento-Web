# Docker

Pasta destinada aos projetos de Docker dos alunos.

## Como enviar sua atividade

Você precisa ser **colaborador** deste repositório (o professor te adiciona pelo seu usuário do GitHub). Com isso, não precisa de fork — você clona o repositório direto e manda sua atividade por Pull Request.

1. Clone o repositório (só na primeira vez):

```
git clone https://github.com/UnisenaiJoinville/ADS-2025-02-Desenvolvimento-Web.git
cd ADS-2025-02-Desenvolvimento-Web
```

2. Procure, aqui dentro de `DOCKER/`, a **subpasta com o seu nome** (ex.: `DOCKER/Ana-Carolina-da-Silveira/`) e coloque os arquivos da sua atividade dentro dela.

3. Copie e cole os comandos abaixo no terminal (dentro da pasta do repositório), trocando `<SUA-SUBPASTA>` pelo nome exato da sua subpasta e a mensagem do commit pelo seu nome:

```
git checkout -b envio-<sua-subpasta>
git add "DOCKER/<SUA-SUBPASTA>"
git commit -m "Envio da atividade de Docker - <seu nome>"
git push origin envio-<sua-subpasta>
```

4. Abra um **Pull Request**: o GitHub mostra um botão **Compare & pull request** assim que você dá push na branch. Confira se o destino é a branch `main` e envie.

O merge na `main` só acontece depois que o professor revisar e aprovar o PR.
