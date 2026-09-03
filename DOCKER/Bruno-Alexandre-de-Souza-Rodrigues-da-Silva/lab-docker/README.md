# Laboratório — 30 atividades de Docker

**Aluno:** Bruno Silva

Execução das 30 atividades do arquivo `step-by-step-docker.md`.

## Onde está cada coisa

| Arquivo | Atividades |
|---|---|
| `bloco-1.txt` | 1 a 5 — instalação, hello-world, listar e remover |
| `bloco-2.txt` | 6 a 9 — Dockerfile, build, background, portas |
| `bloco-3.txt` | 10 a 14 — volumes, inspect, exec, rede |
| `bloco-4.txt` | 15 e 16 — Docker Compose |
| `bloco-5.txt` | 17 a 20 — atualizar, tag, push, pull |
| `bloco-6.txt` | 21 a 25 — variáveis, limites, multi-stage, stats |
| `bloco-7.txt` | 26 a 30 — secrets, backup, proxy, limpeza |
| `SAIDAS-COMPLETAS.txt` | tudo junto |

As atividades que pedem explicação (2, 3, 7, 11, 22 e 24) têm a explicação
escrita logo abaixo da saída do comando.

## Atividades que não rodaram até o fim

Duas não foram concluídas e o motivo está registrado no arquivo, em vez de
serem puladas em silêncio:

- **Atividade 19 (push no Docker Hub):** precisa de conta e de renomear a
  imagem para `usuario/imagem`. O comando correto está anotado.
- **Atividade 26 (Docker Secrets):** só funciona com Docker Swarm ativo, que
  está fora do escopo da disciplina. No Compose o equivalente é o `env_file`
  com `.env` fora do Git, que foi o que usei nos cenários.

## Ajustes que precisei fazer

- **Atividade 30 (limpeza):** o comando `docker container prune` remove tudo da
  máquina. Como havia outros projetos rodando aqui, removi só os recursos do
  laboratório pelo nome.
- **Atividade 27 (backup):** no Git Bash do Windows o caminho `/backup` era
  convertido para `C:/Program Files/Git/backup`. Resolvi com
  `MSYS_NO_PATHCONV=1`.
- **Atividade 15:** removi a linha `version: '3'` do exemplo, que está obsoleta
  no Compose v2, e fixei a versão da imagem.
