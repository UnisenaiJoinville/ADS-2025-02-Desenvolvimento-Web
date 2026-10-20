# Aula 57 — Backups do banco

⏱️ **Tempo estimado:** 50 minutos
📋 **Tipo:** prática (SSH + terminal local)

---

## Objetivo

Criar **backups automáticos** do banco, **testar a restauração** e guardar uma cópia **fora do servidor**.

---

## Antes de começar

- [ ] Aula 56 concluída (sistema no ar, com pelo menos alguns dados cadastrados)
- [ ] O `deploy/backup.sh` está no servidor, executável e **sem CRLF** (Aula 55)

---

## Por que backup é parte da segurança

Segurança não é só impedir invasão. É também responder: **"e se, apesar de tudo, os dados forem perdidos?"** Os dados podem sumir por vários motivos, e **só alguns** envolvem hacker:

| Causa | Exemplo |
|---|---|
| **Erro humano** | Um `docker compose down -v` no diretório errado, um `DELETE` sem `WHERE` |
| **Defeito do servidor** | Disco falhando, provedor com problema |
| **Atualização que deu errado** | Uma migração que corrompe tabelas |
| **Ataque** | *Ransomware*, ou invasor que apaga tudo |
| **Você mesmo** | "Mexi no servidor e não consigo voltar atrás" |

> 📌 **Backup que nunca foi restaurado não é backup, é esperança.** Metade desta aula é **testar a restauração**.

### A regra 3-2-1

| Número | Significado | Neste projeto |
|---|---|---|
| **3** cópias dos dados | Original + 2 backups | Banco + backup no servidor + backup no seu PC |
| **2** tipos de mídia | Não depender de um único disco | Disco da VPS + disco do seu computador |
| **1** cópia **fora do local** | Se o servidor sumir, a cópia sobrevive | O backup baixado para o seu PC |

> ⚠️ **Um backup no mesmo disco do banco protege contra erro humano, mas não contra a perda do servidor.** Por isso baixamos uma cópia no Passo 6.

---

## Passo 1 — O script de backup

O script já veio no pacote (Aula 47). Leia-o com atenção, linha por linha:

```bash
#!/usr/bin/env bash
# Backup do banco: gera um .sql.gz com data no nome e apaga os antigos.
# Uso:  bash deploy/backup.sh
set -euo pipefail

# Vai para a raiz do projeto, onde esta o docker-compose.prod.yml
cd "$(dirname "$0")/.."

DEST="${BACKUP_DIR:-$HOME/backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date +%F_%H%M)"
FILE="$DEST/estoque_${STAMP}.sql.gz"

mkdir -p "$DEST"
chmod 700 "$DEST"

# O mysqldump roda DENTRO do container e le a senha do ambiente dele:
# a senha nunca aparece na linha de comando do servidor.
# Gravamos num arquivo temporario e so renomeamos se tudo deu certo.
docker compose -f docker-compose.prod.yml exec -T db \
  sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysqldump -uroot --single-transaction --routines "$MYSQL_DATABASE"' \
  | gzip > "$FILE.tmp"

gzip -t "$FILE.tmp"
mv "$FILE.tmp" "$FILE"
chmod 600 "$FILE"

# Rotacao: remove backups mais velhos que KEEP_DAYS dias
find "$DEST" -name 'estoque_*.sql.gz' -mtime +"$KEEP_DAYS" -delete

echo "Backup criado: $FILE ($(du -h "$FILE" | cut -f1))"
```

### Entendendo o script

| Trecho | Significado |
|---|---|
| `set -euo pipefail` | **Modo seguro**: aborta no primeiro erro (`-e`), em variável inexistente (`-u`) e em falha **dentro de um pipe** (`pipefail`) |
| `cd "$(dirname "$0")/.."` | Vai para a raiz do projeto, **de onde quer que seja chamado** (importante para o `cron`) |
| `${BACKUP_DIR:-$HOME/backups}` | Usa a variável, **ou** o valor padrão depois do `:-` |
| `chmod 700 "$DEST"` | A pasta de backups é **só sua**: dump contém e-mails e hashes de senha |
| `exec -T db sh -c '...'` | Roda o `mysqldump` **dentro do container**. O `-T` desliga o terminal interativo (necessário em scripts/cron) |
| `MYSQL_PWD="$MYSQL_ROOT_PASSWORD"` | A senha vem do **ambiente do container**: não aparece na linha de comando do servidor, nem no seu `.bash_history` |
| `--single-transaction` | Tira uma "foto" consistente do banco **sem travar** as tabelas, então o sistema continua funcionando durante o backup |
| `\| gzip > "$FILE.tmp"` | Comprime e grava em um arquivo **temporário** |
| `gzip -t` | **Valida** que o arquivo comprimido não está corrompido |
| `mv ... "$FILE"` | Só **depois de validado** vira o nome final. Um backup incompleto nunca se passa por bom |
| `chmod 600` | Só o dono lê o arquivo |
| `find ... -mtime +14 -delete` | **Rotação**: apaga backups com mais de 14 dias, senão o disco enche |

---

## Passo 2 — Rodar à mão

🖥️ **No servidor**, em `~/estoque-facil`:

```bash
bash deploy/backup.sh
ls -lh ~/backups
```

Esperado:

```text
Backup criado: /home/deploy/backups/estoque_2026-10-06_1530.sql.gz (4.0K)
```

Veja o **conteúdo** do backup, para ter certeza de que é útil:

```bash
gunzip -c ~/backups/estoque_*.sql.gz | head -n 30
```

Você verá os comandos SQL (`CREATE TABLE`, `INSERT`) que recriam o banco. Um backup é **um arquivo de texto com o SQL para refazer tudo**.

```bash
gunzip -c ~/backups/estoque_*.sql.gz | grep -c "CREATE TABLE"
```

Deve responder `4` (categories, products, users, stock_movements).

---

## Passo 3 — **Testar a restauração** (sem tocar no banco de verdade)

Vamos restaurar o backup em um banco **temporário**, `restore_test`, e conferir os dados. O banco real **não é alterado**.

```bash
cd ~/estoque-facil
F=$(ls -t ~/backups/estoque_*.sql.gz | head -n 1)
echo "Usando: $F"
```

O `ls -t` ordena do mais novo para o mais antigo; o `head -n 1` pega o primeiro.

```bash
dc exec -T db sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot -e "DROP DATABASE IF EXISTS restore_test; CREATE DATABASE restore_test"'
gunzip -c "$F" | dc exec -T db sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot restore_test'
```

O `gunzip -c` **descomprime para a tela** (sem apagar o arquivo) e o `|` entrega ao `mysql`, que executa o SQL no banco `restore_test`.

Conferir:

```bash
dc exec -T db sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot restore_test -e "SHOW TABLES; SELECT COUNT(*) AS usuarios FROM users; SELECT COUNT(*) AS produtos FROM products;"'
```

Os números devem ser **iguais** aos do sistema real (pelo menos `usuarios = 1`, a sua conta).

Limpar:

```bash
dc exec -T db sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot -e "DROP DATABASE restore_test"'
```

> ✅ Se os dados apareceram, **o seu backup funciona**. Repita este teste de tempos em tempos (uma vez por mês, por exemplo). É o que separa quem tem backup de quem acha que tem.

---

## Passo 4 — Automatizar com o `cron`

O **cron** é o agendador do Linux. Cada linha diz *quando* rodar *o quê*.

```bash
crontab -e
```

Na primeira vez ele pergunta o editor: escolha `nano`. Vá para o **fim** do arquivo e acrescente:

```text
15 3 * * * /home/deploy/estoque-facil/deploy/backup.sh >> /home/deploy/backups/backup.log 2>&1
```

### Lendo a linha

```text
15  3  *  *  *   comando
|   |  |  |  |
|   |  |  |  +-- dia da semana (0-7)   * = qualquer
|   |  |  +----- mês (1-12)            * = qualquer
|   |  +-------- dia do mês (1-31)     * = qualquer
|   +----------- hora (0-23)           3
+--------------- minuto (0-59)         15
```

Leia: **"todo dia, às 03:15"**. Madrugada, quando há pouco uso. O fuso é o que configuramos na Aula 49.

| Trecho | Significado |
|---|---|
| `>> .../backup.log` | **Acrescenta** a saída em um arquivo de registro |
| `2>&1` | Manda também as **mensagens de erro** para o mesmo arquivo |

Salve (`Ctrl` + `O`, `Enter`, `Ctrl` + `X`) e confira:

```bash
crontab -l
```

> ⚠️ A pasta `~/backups` **precisa existir** antes do cron rodar, porque o `>>` abre o arquivo de log antes do script começar. Se você fez o Passo 2, ela já existe.

### Testar o cron sem esperar até as 03:15

Troque **temporariamente** a linha para `* * * * *` (todo minuto), espere 2 minutos, olhe o resultado e **volte para `15 3 * * *`**:

```bash
ls -lh ~/backups
tail -n 5 ~/backups/backup.log
```

> ⚠️ Esqueceu de voltar? Terá 1 backup por minuto (1.440 por dia). A rotação apaga os antigos só depois de 14 dias, então o disco enche. **Volte a linha ao normal.**

---

## Passo 5 — Restaurar **de verdade** (para quando acontecer)

Este é o procedimento de emergência. **Leia agora, para não aprender na hora do pânico.** *(Não execute em produção por enquanto.)*

```bash
cd ~/estoque-facil

# 1. Pare a API, para ninguem gravar durante a restauracao
dc stop api

# 2. Restaure o backup escolhido por cima do banco
gunzip -c ~/backups/estoque_2026-10-06_0315.sql.gz | dc exec -T db sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot "$MYSQL_DATABASE"'

# 3. Religue a API
dc start api
```

O `mysqldump` grava `DROP TABLE IF EXISTS` antes de cada `CREATE TABLE`, então a restauração **substitui** as tabelas atuais pelas do backup. Tudo que foi gravado **depois** do backup é perdido (por isso a frequência importa).

> 🚨 **Antes de restaurar por cima de um banco que ainda funciona**, faça um backup do estado atual (`bash deploy/backup.sh`). Assim, se a restauração piorar as coisas, você ainda tem para onde voltar.

---

## Passo 6 — Guardar uma cópia **fora** do servidor

💻 **No seu computador**, em uma pasta **fora** do projeto (para não ir parar no Git):

```powershell
mkdir $env:USERPROFILE\backups-estoque
scp "deploy@SEU_IP:backups/estoque_*.sql.gz" $env:USERPROFILE\backups-estoque\
dir $env:USERPROFILE\backups-estoque
```

| Parte | Significado |
|---|---|
| `scp origem destino` | Aqui a **origem** é remota e o **destino** é local: o sentido inverso do envio da Aula 55 |
| `backups/estoque_*.sql.gz` | O caminho é relativo à pasta pessoal do `deploy`. O `*` é expandido **no servidor** |

> 💡 Faça isso com a frequência que a sua perda máxima aceitável permitir: se perder uma semana de dados for um problema, baixe toda semana. **Para sistemas reais**, use uma automação (outra VPS, armazenamento de objetos, `rclone`). Esse é um dos desafios da Aula 59.

### Cuidado com o que o backup contém

O arquivo `.sql.gz` tem **todos os dados**: e-mails, hashes de senha, estoque. Trate-o como o próprio banco.

| Faça | Não faça |
|---|---|
| Guardar em pasta do seu usuário, de preferência em disco criptografado | Mandar por e-mail ou aplicativo de mensagem |
| Apagar cópias antigas que não precisa mais | Subir para um repositório público |
| Lembrar que dados pessoais de terceiros pedem cuidado (LGPD) | Deixar em computador compartilhado de laboratório |

---

## ✅ Confira se deu certo

- [ ] `bash deploy/backup.sh` criou um `.sql.gz` em `~/backups`
- [ ] `gunzip -c ... | grep -c "CREATE TABLE"` respondeu `4`
- [ ] **Restaurei em `restore_test`** e os dados bateram
- [ ] O banco `restore_test` foi apagado depois
- [ ] `crontab -l` mostra a linha `15 3 * * *` (e não `* * * * *`)
- [ ] Baixei uma cópia para o meu computador com `scp`
- [ ] Sei explicar a regra **3-2-1**
- [ ] Li o procedimento de restauração real (Passo 5)

---

## 🔧 Se deu erro

| Problema | Causa | Solução |
|---|---|---|
| `bad interpreter` ou `\r: command not found` | O script foi salvo com CRLF (Windows) | `sed -i 's/\r$//' deploy/backup.sh` |
| `Permission denied` ao executar | Sem permissão de execução | `chmod +x deploy/backup.sh` (ou use `bash deploy/backup.sh`) |
| `service "db" is not running` | Banco parado | `dc up -d` e tente de novo |
| Backup com `0` bytes | Falhou no meio | O `pipefail` + `gzip -t` deveriam abortar. Veja a mensagem de erro; confira `dc ps` |
| `dc: command not found` **dentro de script/cron** | Apelidos só valem no terminal interativo | O script usa o comando **completo** (`docker compose -f ...`): confira se não o trocou por `dc` |
| O cron não roda | Caminho errado ou pasta `backups` inexistente | `journalctl -u cron --no-pager \| tail`; confira o caminho **absoluto** |
| `scp` não acha `backups/...` | Ainda não há backup, ou o nome difere | `ssh deploy@SEU_IP "ls ~/backups"` |
| Restauração falha com `Unknown database` | O banco de destino não existe | Crie com `CREATE DATABASE restore_test` antes |

---

## ➡️ Próximo passo

Sistema no ar, protegido e com backup. Falta saber **operar**: atualizar, olhar logs e voltar atrás.

**[Aula 58 — Manutenção, atualizações e novas versões](58-manutencao-atualizacoes.md)**
