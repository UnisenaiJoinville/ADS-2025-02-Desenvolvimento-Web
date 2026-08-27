# ADS-2025-02 · Desenvolvimento Web

Repositório da turma de Desenvolvimento Web — 2º semestre de 2025 (ADS, turma iniciada em 2025).

## Estrutura

- [`BANCO-DE-DADOS/`](BANCO-DE-DADOS/) — projetos de Banco de Dados
- [`NODEJS/`](NODEJS/) — projetos de Node.js
- [`DOCKER/`](DOCKER/) — projetos de Docker
- [`PROJETO-INDIVIDUAL/`](PROJETO-INDIVIDUAL/) — Projeto Individual

## Como enviar seu projeto

1. Clone o repositório (só na primeira vez):

```
git clone https://github.com/UnisenaiJoinville/ADS-2025-02-Desenvolvimento-Web.git
cd ADS-2025-02-Desenvolvimento-Web
```

2. Abra a pasta da matéria correspondente e **procure a subpasta com o seu nome** (ex.: `NODEJS/Ana-Carolina-da-Silveira/`). Coloque os arquivos da sua atividade dentro dessa subpasta.

3. Copie e cole os comandos abaixo no terminal, dentro da pasta do repositório, trocando `<PASTA-DA-MATERIA>`, `<SUA-SUBPASTA>` e a mensagem do commit:

```
git checkout -b envio-<sua-subpasta>
git add "<PASTA-DA-MATERIA>/<SUA-SUBPASTA>"
git commit -m "Envio da atividade - <seu nome>"
git push origin envio-<sua-subpasta>
```

4. Depois do push, entre no GitHub e abra um **Pull Request** da sua branch para a `main` (o repositório exige PR para alterações na `main`).

> Cada pasta de matéria (`BANCO-DE-DADOS/`, `NODEJS/`, `DOCKER/`, `PROJETO-INDIVIDUAL/`) também tem seu próprio README com esse passo a passo já com os comandos ajustados para aquela pasta.
