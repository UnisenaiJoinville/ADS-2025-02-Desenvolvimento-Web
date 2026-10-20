# Aula 55 — Enviando o projeto e criando os segredos

⏱️ **Tempo estimado:** 45 minutos
📋 **Tipo:** prática (terminal local + SSH)

---

## Objetivo

Empacotar o projeto, **enviá-lo** ao servidor com `scp` e criar, **só lá**, o arquivo `.env` com **segredos aleatórios**.

---

## Antes de começar

- [ ] Aula 54 concluída (o `nslookup` mostra o IP certo, ou você decidiu usar só o IP)
- [ ] Os arquivos da Aula 47 existem no projeto
- [ ] `ssh deploy@SEU_IP` (ou `ssh estoque`) funciona

---

## O caminho do código até o servidor

```text
  Seu PC                                         VPS
  ------                                         ---
  projeto/                                       ~/estoque-facil/
    src, public, database/producao,      scp       src, public, database/producao,
    deploy, package*.json,           ==========>   deploy, package*.json,
    Dockerfile.prod, compose.prod                  Dockerfile.prod, compose.prod
                                                   .env   <-- criado AQUI, nunca viaja
```

O `scp` (*secure copy*) copia arquivos **pelo mesmo túnel criptografado do SSH**, com as mesmas chaves. Não precisa de nenhum programa extra.

> 📌 Existem outras formas de publicar (Git + `git pull` no servidor, CI/CD, Docker Registry). Escolhemos o `scp` porque **não exige conta em nenhum serviço** e deixa claro o que está acontecendo. Na Aula 58 comentamos como evoluir.

---

## Passo 1 — Gerar o pacote com a data

💻 **No seu computador**, na **raiz do projeto**:

```powershell
$data = Get-Date -Format "yyyy-MM-dd-HHmm"
tar -czf "estoque-deploy-$data.tar.gz" src public database/producao deploy package.json package-lock.json Dockerfile.prod docker-compose.prod.yml .env.production.example
dir estoque-deploy-*.tar.gz
```

Colocar a **data no nome** guarda um histórico: se uma versão nova quebrar, você ainda tem a anterior para voltar (Aula 58).

### Conferir o que vai viajar

```powershell
tar -tzf "estoque-deploy-$data.tar.gz" | Select-String "\.env|node_modules|apostila|\.git"
```

**Não deve imprimir nada.** Se imprimir `.env`, **pare**: segredo no pacote significa segredo transitando e ficando em arquivo.

Veja os arquivos principais:

```powershell
tar -tzf "estoque-deploy-$data.tar.gz" | Select-String "Dockerfile|docker-compose|Caddyfile|schema|package"
```

---

## Passo 2 — Enviar

```powershell
scp "estoque-deploy-$data.tar.gz" deploy@SEU_IP:~/
```

| Parte | Significado |
|---|---|
| `scp` | Copia por SSH |
| `arquivo` | O que enviar |
| `deploy@SEU_IP:` | **Para onde**: usuário @ servidor, seguido de `:` |
| `~/` | A **pasta pessoal** do `deploy` (`/home/deploy`) |

> ⚠️ **Não esqueça do `:`** depois do IP. Sem ele, o `scp` cria um **arquivo local** chamado `deploy@SEU_IP`, em vez de enviar.

Se você configurou o atalho da Aula 51, pode escrever `scp "estoque-deploy-$data.tar.gz" estoque:~/`.

---

## Passo 3 — Desempacotar no servidor

🖥️ **No servidor:**

```bash
ls -lh ~/estoque-deploy-*.tar.gz
mkdir -p ~/estoque-facil
tar -xzf ~/estoque-deploy-*.tar.gz -C ~/estoque-facil
cd ~/estoque-facil
ls -la
```

| Comando | Função |
|---|---|
| `mkdir -p` | Cria a pasta (sem erro se já existir) |
| `tar -xzf` | **Extrai** (`x`) um `.gz` (`z`) de um arquivo (`f`) |
| `-C pasta` | Extrai **dentro** dessa pasta |
| `cd` | Entra na pasta |

Devem aparecer `src`, `public`, `database`, `deploy`, `Dockerfile.prod`, `docker-compose.prod.yml`, `package.json`, `package-lock.json` e o modelo `.env.production.example`.

> 📌 Repare no que **não** veio: **não existe `.env`**. É de propósito. O `.env` com os segredos será criado **aqui no servidor**, no próximo passo.

---

## Passo 4 — Criar o `.env` de produção

Agora o passo mais delicado: os **segredos**.

### Por que aleatórios?

| Senha | Quem adivinha |
|---|---|
| `root123`, `estoque123` | Qualquer robô, em segundos |
| `Estoque@2026` | Um atacante com dicionário, em minutos |
| 48 caracteres **aleatórios** | **Ninguém**, em prática |

Quem **gera** o segredo é o próprio servidor, com `openssl rand`, um gerador criptograficamente seguro. Você **nem precisa ver ou decorar** a senha: o sistema lê do arquivo.

### 4.1 — Criar o arquivo com as permissões certas

🖥️ **No servidor**, dentro de `~/estoque-facil`:

```bash
touch .env
chmod 600 .env
```

Primeiro criamos o arquivo **vazio e já trancado** (`600` = só o dono lê e escreve), e **depois** colocamos os segredos. Se fosse o contrário, haveria um instante em que o arquivo existiria legível por outros usuários.

### 4.2 — Preencher

Copie o bloco abaixo **inteiro**, trocando apenas `SITE_ADDRESS` pelo seu endereço (ou `:80` se for sem domínio):

```bash
cat > .env <<EOF
SITE_ADDRESS=estoque.seudominio.com.br
PORT=3000
DB_HOST=db
DB_PORT=3306
DB_USER=estoque
DB_PASSWORD=$(openssl rand -hex 24)
DB_NAME=estoque_db
DB_ROOT_PASSWORD=$(openssl rand -hex 24)
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=1d
EOF
```

| Parte | Significado |
|---|---|
| `cat > .env <<EOF ... EOF` | Grava tudo que está entre as marcas `EOF` dentro do arquivo `.env` |
| `$(openssl rand -hex 24)` | Roda o comando e **coloca o resultado ali**: 24 bytes aleatórios em hexadecimal = 48 caracteres |
| `openssl rand -hex 32` | 32 bytes = **64 caracteres** (passa folgado dos 32 que o `env.js` exige) |
| `DB_HOST=db` | O **nome do serviço** no Compose, como na Aula 05 |

> ⚠️ Usamos **hexadecimal** (`0-9a-f`) de propósito: sem caracteres especiais que o shell ou o Compose poderiam interpretar (`$`, `#`, `"`, espaço).

> 🚨 **Guarde estes dois valores no seu gerenciador de senhas** se quiser acessar o banco manualmente: `DB_ROOT_PASSWORD` e `DB_PASSWORD`. Para vê-los: `grep PASSWORD .env`. **Faça isso em uma tela que ninguém esteja vendo**, e nunca cole em chat.

### 4.3 — Conferir sem expor os segredos

```bash
ls -l .env
grep -c "GERE" .env
awk -F= '/^[A-Z]/{print $1 "  (" length($2) " caracteres)"}' .env
grep -c $'\r' .env
```

| Comando | Esperado |
|---|---|
| `ls -l .env` | `-rw-------` (dono `deploy`) |
| `grep -c "GERE" .env` | `0` (nenhum texto de modelo sobrou) |
| `awk ...` | Lista os **nomes** e o **tamanho** dos valores. `DB_PASSWORD` e `DB_ROOT_PASSWORD` com **48**, `JWT_SECRET` com **64** |
| `grep -c $'\r'` | `0` (sem retorno de carro do Windows) |

O `awk` mostra o tamanho **sem revelar** o valor, perfeito para checar sem expor.

---

## Passo 5 — Preparar o script de backup

Já que estamos aqui, deixe o script de backup executável (vamos usá-lo na Aula 57):

```bash
chmod +x deploy/backup.sh
grep -c $'\r' deploy/backup.sh
```

O segundo comando deve responder **`0`**. Se responder um número maior, o arquivo foi salvo no Windows com final de linha **CRLF**, e o Linux **não consegue executá-lo** (erro `bad interpreter` / `\r: command not found`). Corrija:

```bash
sed -i 's/\r$//' deploy/backup.sh
```

> 💡 **Prevenção:** no VS Code, olhe o canto inferior direito. Se estiver `CRLF`, clique e troque por `LF` antes de salvar arquivos `.sh`.

---

## Entendendo o que fizemos

| Decisão | Motivo |
|---|---|
| `.env` **criado no servidor** | Segredo que nunca viaja não pode vazar no caminho nem ficar em um histórico de arquivos |
| `chmod 600` **antes** de preencher | Não existe janela em que outro usuário poderia ler |
| Segredos **gerados** pelo `openssl` | Aleatoriedade de verdade, e ninguém sabe a senha, nem você |
| `tar` com **lista de arquivos** | O que não está na lista não vaza |
| Pacote **com data** | Permite voltar atrás (Aula 58) |

> 🔗 Reveja a **Aula 07**: o `env.js` lê o `.env`, valida e **recusa iniciar** sem os valores certos (*fail fast*). É a rede de segurança caso o `.env` esteja incompleto: a API **não sobe** com segredo fraco, em vez de subir insegura.

---

## ✅ Confira se deu certo

- [ ] O pacote **não** contém `.env` (verificado com `Select-String`)
- [ ] O `scp` terminou e o arquivo está em `~/` no servidor
- [ ] `~/estoque-facil` tem `src`, `public`, `database`, `deploy` e os dois arquivos `.prod`
- [ ] `ls -l .env` mostra `-rw-------`
- [ ] `grep -c GERE .env` responde `0`
- [ ] `DB_PASSWORD` e `DB_ROOT_PASSWORD` têm 48 caracteres e `JWT_SECRET` 64
- [ ] `SITE_ADDRESS` tem o meu domínio (ou `:80`)
- [ ] `grep -c $'\r' deploy/backup.sh` responde `0`

---

## 🔧 Se deu erro

| Problema | Causa | Solução |
|---|---|---|
| `scp: Permission denied (publickey)` | Chave não carregada / usuário errado | Teste antes `ssh deploy@SEU_IP`. Se entrar, o `scp` também entra |
| `scp` criou um arquivo `deploy@SEU_IP` no PC | Faltou o `:` | Apague o arquivo local e repita com `deploy@SEU_IP:~/` |
| `tar: ... Cannot open: No such file` | O nome com data não casou | `ls ~/*.tar.gz` para ver o nome exato |
| `openssl: command not found` | Raro em Ubuntu | `sudo apt install -y openssl` |
| O `.env` ficou com `$(openssl ...)` literal | Usou aspas simples no `EOF` (`<<'EOF'`) | Refaça com `<<EOF` (sem aspas) |
| `-bash: .env: Permission denied` | O `.env` pertence ao root | `sudo chown deploy:deploy .env` |
| Colei um comando e quebrou | O terminal quebrou a linha | Cole em partes, ou digite o bloco `cat > .env` linha a linha |

---

## ➡️ Próximo passo

Tudo no lugar. É hora de **ligar**.

**[Aula 56 — Publicando o sistema](56-publicando-o-sistema.md)**
