# ADS-2025-02 · Desenvolvimento Web

Repositório da turma de Desenvolvimento Web — 2º semestre de 2025 (ADS, turma iniciada em 2025).

## Estrutura

- [`BANCO-DE-DADOS/`](BANCO-DE-DADOS/) — projetos de Banco de Dados
- [`NODEJS/`](NODEJS/) — projetos de Node.js
- [`DOCKER/`](DOCKER/) — projetos de Docker
- [`PROJETO-INDIVIDUAL/`](PROJETO-INDIVIDUAL/) — Projeto Individual

## Como enviar seu projeto

Este repositório exige **Pull Request** para qualquer alteração na `main`, e os alunos não têm permissão de escrita direta — por isso o envio é feito via **fork** (uma cópia do repositório na sua própria conta do GitHub).

1. Faça um fork: abra [github.com/UnisenaiJoinville/ADS-2025-02-Desenvolvimento-Web](https://github.com/UnisenaiJoinville/ADS-2025-02-Desenvolvimento-Web) e clique em **Fork** (canto superior direito). Isso cria uma cópia do repositório em `github.com/<seu-usuario>/ADS-2025-02-Desenvolvimento-Web`.

2. Clone o **seu fork** (troque `<seu-usuario>` pelo seu usuário do GitHub):

```
git clone https://github.com/<seu-usuario>/ADS-2025-02-Desenvolvimento-Web.git
cd ADS-2025-02-Desenvolvimento-Web
```

3. Abra a pasta da matéria correspondente e **procure a subpasta com o seu nome** (ex.: `NODEJS/Ana-Carolina-da-Silveira/`). Coloque os arquivos da sua atividade dentro dessa subpasta.

4. Copie e cole os comandos abaixo no terminal, dentro da pasta do repositório, trocando `<PASTA-DA-MATERIA>`, `<SUA-SUBPASTA>` e a mensagem do commit:

```
git checkout -b envio-<sua-subpasta>
git add "<PASTA-DA-MATERIA>/<SUA-SUBPASTA>"
git commit -m "Envio da atividade - <seu nome>"
git push origin envio-<sua-subpasta>
```

5. Abra um **Pull Request**: entre no seu fork no GitHub, clique em **Compare & pull request**, confira se o destino é `UnisenaiJoinville/ADS-2025-02-Desenvolvimento-Web` branch `main`, e envie.

Assim que o PR é aberto, um **check automático** (GitHub Actions) confere se os arquivos estão dentro da sua subpasta de aluno e se o PR não mexe em pasta de outra pessoa. Se o check falhar, veja a mensagem de erro no próprio PR, corrija e dê push de novo na mesma branch.

> Cada pasta de matéria (`BANCO-DE-DADOS/`, `NODEJS/`, `DOCKER/`, `PROJETO-INDIVIDUAL/`) também tem seu próprio README com esse passo a passo já com os comandos ajustados para aquela pasta.
