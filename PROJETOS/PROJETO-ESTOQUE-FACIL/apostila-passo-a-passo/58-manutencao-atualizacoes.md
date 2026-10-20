# Aula 58 — Manutenção, atualizações e novas versões

⏱️ **Tempo estimado:** 50 minutos
📋 **Tipo:** prática (terminal local + SSH)

---

## Objetivo

Aprender a **operar** o sistema depois que ele está no ar: publicar uma **nova versão**, **voltar atrás** se der errado, acompanhar a saúde do servidor e fazer manutenção sem perder dados.

---

## Antes de começar

- [ ] Aula 57 concluída (backup funcionando)
- [ ] Sistema no ar

---

## O ciclo de uma nova versão

```text
 💻 Seu PC                                   🖥️ Servidor
 ---------                                   -----------
 1. Edita e TESTA localmente (docker compose up)
 2. Gera o pacote com data         ------>   3. BACKUP do banco
                                             4. Extrai o pacote
                                             5. dc up -d --build
                                             6. Confere o /api/health e os logs
                                             7. Deu errado? Volta o pacote anterior
```

> 📌 **Nunca edite arquivos direto no servidor** (com `nano`, por exemplo) para "consertar rapidinho". O servidor passa a ter uma versão que **não existe no seu computador**, e o próximo deploy a apaga sem aviso. A fonte da verdade é o **seu projeto local**. A única exceção: `.env` e o `Caddyfile` de cadastro (Aula 56), que são de configuração do servidor.

---

## Parte 1 — Publicar uma nova versão

### Passo 1 — Faça uma mudança pequena para testar

💻 **No seu computador**, em `public/index.html` (ou em qualquer tela), troque um texto visível, por exemplo o título. Teste localmente (`docker compose up -d`, http://localhost:3000) e confirme que a mudança apareceu.

### Passo 2 — Empacotar

```powershell
$data = Get-Date -Format "yyyy-MM-dd-HHmm"
tar -czf "estoque-deploy-$data.tar.gz" src public database/producao deploy package.json package-lock.json Dockerfile.prod docker-compose.prod.yml .env.production.example
scp "estoque-deploy-$data.tar.gz" deploy@SEU_IP:~/
```

### Passo 3 — Backup **antes** de mexer

🖥️ **No servidor:**

```bash
cd ~/estoque-facil
bash deploy/backup.sh
```

> 🚨 **Regra:** sempre faça um backup antes de publicar. Se a nova versão tiver uma migração de banco ou um bug que corrompa dados, você tem de onde voltar.

### Passo 4 — Extrair e reconstruir

```bash
tar -xzf ~/estoque-deploy-2026-10-06-1530.tar.gz -C ~/estoque-facil
dc up -d --build
```

(troque pelo nome do **seu** pacote; `ls ~/estoque-deploy-*` lista)

| O que acontece | |
|---|---|
| `tar -xzf` | Sobrescreve os arquivos do projeto. O `.env` **não** é tocado (não está no pacote) |
| `dc up -d --build` | Reconstrói a imagem da API, **recria só o que mudou** e mantém o banco rodando |

A API fica **alguns segundos** fora do ar enquanto o container novo sobe. Para um sistema pequeno, é aceitável.

### Passo 5 — Conferir

```bash
dc ps
dc logs --tail=20 api
dc exec api wget -qO- http://127.0.0.1:3000/api/health
```

O último comando pergunta **direto à API**, por dentro do container, se ela está viva (`{"status":"ok",...}`).

Depois abra o site no navegador (`Ctrl` + `F5`, para ignorar o cache): a mudança deve estar lá.

> 📌 O `.tar.gz` **não apaga** arquivos que foram removidos do projeto: só sobrescreve e cria. Se você **deletou** um arquivo no seu PC, ele continua no servidor. Para sistemas maiores isso vira motivo para adotar `rsync --delete` ou Git. Veja "Para onde evoluir", no fim.

---

## Parte 2 — Voltar atrás (*rollback*)

Subiu e quebrou? Rápido e sem drama: **reenvie o pacote anterior**.

```bash
ls -lt ~/estoque-deploy-*.tar.gz
```

Lista do mais novo para o mais antigo. Escolha o **anterior ao que quebrou**:

```bash
tar -xzf ~/estoque-deploy-2026-10-05-1010.tar.gz -C ~/estoque-facil
dc up -d --build
```

É por isso que o pacote leva a **data no nome** e que **não apagamos os antigos**.

> ⚠️ O rollback do **código** é fácil. O rollback do **banco** não é: se a versão ruim já gravou dados errados, é preciso restaurar o backup (Aula 57, Passo 5), e **perder o que foi gravado depois dele**. É o motivo de testar bem antes e de fazer o backup do Passo 3.

---

## Parte 3 — Alterações no **banco de dados**

O `001-schema.sql` **só roda na primeira criação** do banco (lembre da Aula 06). Em um banco que já existe, uma nova coluna ou tabela se aplica **à mão**, com uma *migração*, como fizemos nas aulas 24, 33 e 38.

🖥️ Com o arquivo da migração enviado ao servidor (por `scp`, junto do pacote), e **depois de um backup**:

```bash
dc exec -T db sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot "$MYSQL_DATABASE"' < caminho/da-migracao.sql
```

O `<` entrega o **arquivo do servidor** como entrada do comando que roda **dentro** do container.

> 📌 Mantenha **também** o `database/producao/001-schema.sql` atualizado com o resultado final, para que um banco novo nasça já completo.

---

## Parte 4 — Acompanhar a saúde do servidor

### Os quatro sinais

🖥️ Rode de vez em quando (ou quando algo parecer lento):

```bash
dc ps
```

Todos `Up`, e `db` e `api` `healthy`.

```bash
df -h /
```

| Coluna | Atenção quando |
|---|---|
| `Use%` | Passou de **80%**. Disco cheio derruba o banco |

```bash
free -h
```

Veja a linha `Mem:` (`available`) e a `Swap:` (`used`). Swap muito usado = falta de memória.

```bash
docker stats --no-stream
```

Mostra CPU e memória **por container**.

### Onde o disco costuma ir embora

```bash
docker system df
```

Mostra o espaço usado por imagens, containers e volumes. Cada `--build` deixa **imagens antigas** para trás. Limpe as que não servem mais:

```bash
docker image prune -f
```

| Comando | O que apaga |
|---|---|
| `docker image prune -f` | Só imagens **sem nome e sem uso** (*dangling*). **Seguro** |
| `docker volume prune` | Volumes **sem container**. ⚠️ **Não use**: pode levar embora dados |
| `docker system prune -a --volumes` | **Quase tudo.** ❌ **Nunca** em produção |

> 🚨 O **volume do banco** (`estoque-prod_db-data`) é onde moram os dados. Um comando de limpeza apressado, depois de um `dc down`, pode apagá-lo. Na dúvida, **não rode comandos `prune` com `--volumes`** e **não use `down -v`**.

### Ler os registros com critério

```bash
dc logs --since 1h api
dc logs -f caddy
sudo journalctl -u fail2ban --no-pager | tail -n 20
sudo fail2ban-client status sshd
```

---

## Parte 5 — Atualizações

| O quê | Quem faz | Como |
|---|---|---|
| **Pacotes do Ubuntu** (segurança) | Automático (Aula 52) | Confira se pede reinício: `ls /var/run/reboot-required` |
| **Kernel** | Você, reiniciando | `sudo reboot` em um horário calmo, **depois de um backup** |
| **Imagens** (MySQL, Caddy) | Você | `dc pull` e `dc up -d` |
| **Dependências do Node** | Você, localmente | `npm update` no seu PC, **teste**, e publique como nova versão |
| **Docker Engine** | Você | `sudo apt update && sudo apt upgrade` (vem do repositório da Aula 53) |

Atualizar as imagens:

```bash
bash deploy/backup.sh
dc pull
dc up -d
dc ps
```

> ⚠️ O `mysql:8.0` recebe correções de **patch** dentro da série 8.0. Isso é desejável. **Não troque para `mysql:9` ou `latest`** sem planejar: mudar de versão principal do banco é uma operação à parte.

### Trocar um segredo

| Segredo | Como trocar | Efeito |
|---|---|---|
| `JWT_SECRET` | Edite o `.env` (`openssl rand -hex 32` para gerar) e rode `dc up -d --force-recreate api` | **Todo mundo é deslogado.** Os tokens antigos deixam de valer. É o jeito certo de "derrubar" sessões em caso de suspeita de vazamento |
| `DB_PASSWORD` | **Não basta mudar o `.env`!** Veja abaixo | Se só mudar o `.env`, a API perde o acesso ao banco |

**A pegadinha da senha do banco.** As variáveis `MYSQL_*` só valem na **primeira criação** do banco. Depois disso, a senha vive **dentro** do MySQL. Para trocá-la:

```bash
# 1. Mude a senha dentro do MySQL
dc exec -T db sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot' <<'SQL'
ALTER USER 'estoque'@'%' IDENTIFIED BY 'COLE_A_NOVA_SENHA_AQUI';
SQL

# 2. Atualize DB_PASSWORD no .env com o MESMO valor
nano .env

# 3. Recrie a API para ela ler o .env novo
dc up -d --force-recreate api
```

---

## Para onde evoluir

Você montou o fluxo "na mão" de propósito: cada passo é visível. Em equipes e sistemas maiores, a evolução natural é:

| Hoje | Evolução | Ganho |
|---|---|---|
| `tar` + `scp` | **Git** + `git pull` no servidor, ou **CI/CD** (GitHub Actions) | Histórico completo, deploy por um `git push`, sem arquivos esquecidos |
| Construir a imagem **no servidor** | Construir no CI e enviar para um **registro de imagens** | Servidor só baixa e roda; deploy mais rápido |
| Uma só instância | Ambiente de **teste** (*staging*) separado | Errar longe da produção |
| Olhar os logs "quando lembra" | **Monitoramento** externo de disponibilidade e alertas | Você sabe que caiu **antes** do cliente |

---

## ✅ Confira se deu certo

- [ ] Publiquei uma mudança visível e ela apareceu no site
- [ ] Fiz o **backup antes** de publicar
- [ ] Fiz um **rollback** reenviando o pacote anterior e a versão antiga voltou
- [ ] Sei ler `df -h`, `free -h`, `dc ps` e `docker stats`
- [ ] Sei por que **não** devo rodar `down -v` nem `prune --volumes` em produção
- [ ] Entendi por que mudar só o `.env` **não** troca a senha do banco

---

## 🔧 Se deu erro

| Problema | Causa | Solução |
|---|---|---|
| A mudança não aparece no navegador | Cache do navegador | `Ctrl` + `F5`, ou aba anônima |
| A mudança não aparece mesmo assim | Esqueceu o `--build` | `dc up -d --build` |
| `tar: ... Cannot open` | Nome do pacote errado | `ls ~/estoque-deploy-*.tar.gz` |
| `no space left on device` | Disco cheio | `df -h /`, `docker system df`, `docker image prune -f`, apague backups e pacotes antigos |
| Depois do deploy, `502 Bad Gateway` | A API não subiu | `dc logs api`. Faça **rollback** e investigue com calma |
| `Access denied` depois de trocar a senha | Mudou só o `.env` | Faça o `ALTER USER` acima, **com o mesmo valor** do `.env` |
| `dc pull` trouxe o MySQL novo e o banco não sobe | Mudança de versão incompatível | Restaure o backup, volte a imagem para a versão anterior |

---

## ➡️ Próximo passo

Última aula do bloco: **testar o sistema inteiro**, conferir a lista de segurança e praticar o diagnóstico.

**[Aula 59 — Teste final, checklist de segurança e exercícios](59-teste-final-hospedagem.md)**
