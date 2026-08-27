# Projeto Individual

Pasta destinada ao Projeto Individual de cada aluno.

## Como enviar sua atividade

Este repositório exige **Pull Request** para qualquer alteração na `main`, e os alunos não têm permissão de escrita direta — por isso o envio é feito via **fork** (uma cópia do repositório na sua própria conta do GitHub).

1. Faça um fork: abra [github.com/UnisenaiJoinville/ADS-2025-02-Desenvolvimento-Web](https://github.com/UnisenaiJoinville/ADS-2025-02-Desenvolvimento-Web) e clique em **Fork** (canto superior direito).

2. Clone o **seu fork** (troque `<seu-usuario>` pelo seu usuário do GitHub):

```
git clone https://github.com/<seu-usuario>/ADS-2025-02-Desenvolvimento-Web.git
cd ADS-2025-02-Desenvolvimento-Web
```

3. Procure, aqui dentro de `PROJETO-INDIVIDUAL/`, a **subpasta com o seu nome** (ex.: `PROJETO-INDIVIDUAL/Ana-Carolina-da-Silveira/`) e coloque os arquivos do seu projeto dentro dela.

4. Copie e cole os comandos abaixo no terminal (dentro da pasta do repositório), trocando `<SUA-SUBPASTA>` pelo nome exato da sua subpasta e a mensagem do commit pelo seu nome:

```
git checkout -b envio-<sua-subpasta>
git add "PROJETO-INDIVIDUAL/<SUA-SUBPASTA>"
git commit -m "Envio do Projeto Individual - <seu nome>"
git push origin envio-<sua-subpasta>
```

5. Abra um **Pull Request**: entre no seu fork no GitHub, clique em **Compare & pull request**, confira se o destino é `UnisenaiJoinville/ADS-2025-02-Desenvolvimento-Web` branch `main`, e envie.
