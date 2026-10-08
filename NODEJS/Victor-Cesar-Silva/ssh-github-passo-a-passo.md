# SSH + GitHub (Git Bash) — Pré-requisito da Atividade 17.2

**Aluno:** Victor Cesar Silva

Passos executados para conectar o repositório da Organização via SSH.

---

## 1. Gerar a chave ed25519

No **Git Bash**:

```bash
ssh-keygen -t ed25519 -C "victor.cesar.silva@example.com"
```

Aceite o caminho padrão (`~/.ssh/id_ed25519`) com Enter e defina uma passphrase.
O algoritmo `ed25519` é o recomendado hoje — mais curto e mais seguro que RSA.

Gera dois arquivos:
- `~/.ssh/id_ed25519` — chave **privada**, nunca sai da máquina, nunca vai para o Git.
- `~/.ssh/id_ed25519.pub` — chave **pública**, é a que se cola no GitHub.

## 2. Iniciar o ssh-agent e adicionar a chave

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

O agent guarda a chave destravada em memória, evitando digitar a passphrase a cada
operação. No Windows, ele não persiste entre sessões do Git Bash — para automatizar,
adicione as duas linhas ao `~/.bashrc`.

## 3. Copiar a chave pública

```bash
cat ~/.ssh/id_ed25519.pub
# ou, copiando direto para a área de transferência:
clip < ~/.ssh/id_ed25519.pub
```

## 4. Cadastrar no GitHub

**Settings → SSH and GPG keys → New SSH key**

- *Title*: um nome que identifique a máquina (ex.: `notebook-victor`)
- *Key type*: Authentication Key
- *Key*: cole o conteúdo do `.pub`

## 5. Testar a conexão

```bash
ssh -T git@github.com
```

Na primeira vez, confirme o fingerprint digitando `yes`. Resposta esperada:

```
Hi <usuario>! You've successfully authenticated, but GitHub does not provide shell access.
```

A mensagem "does not provide shell access" é **sucesso** — o GitHub não dá shell, só Git.

## 6. Conectar o repositório

```bash
git remote add origin git@github.com:<organizacao>/hello-node.git
git remote -v                    # deve mostrar git@github.com, não https://
git push -u origin main
```

Se o repositório já tiver sido clonado por HTTPS, basta trocar a URL:

```bash
git remote set-url origin git@github.com:<organizacao>/hello-node.git
```

---

## Problemas comuns

**`Permission denied (publickey)`** — a chave não foi adicionada ao agent ou não está no
GitHub. Rode `ssh-add -l` para listar as chaves carregadas e `ssh -T git@github.com -v`
para ver qual chave está sendo oferecida.

**`Could not open a connection to your authentication agent`** — o agent não está
rodando. Execute `eval "$(ssh-agent -s)"` novamente (é preciso a cada nova sessão do Git
Bash).

**Continua pedindo usuário e senha** — o remote ainda está em HTTPS. Confira com
`git remote -v` e corrija com `git remote set-url`.

**Rede corporativa bloqueando a porta 22** — use SSH sobre HTTPS criando `~/.ssh/config`:

```
Host github.com
  Hostname ssh.github.com
  Port 443
  User git
```
