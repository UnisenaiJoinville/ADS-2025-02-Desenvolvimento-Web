# Aula 50 — Usuário comum, sudo e a chave SSH

⏱️ **Tempo estimado:** 40 minutos
📋 **Tipo:** prática (SSH + terminal local)

---

## Objetivo

Criar o usuário `deploy`, dar a ele o poder de administrar **sob demanda** (`sudo`) e instalar a sua **chave pública** para que ele entre **sem senha**.

---

## Antes de começar

- [ ] Aula 49 concluída
- [ ] A chave pública gerada na Aula 48 (`id_ed25519.pub`)
- [ ] Uma conexão `ssh root@SEU_IP` aberta

---

## Por que não trabalhar como root?

| Como `root` | Como usuário comum + `sudo` |
|---|---|
| Qualquer comando roda com poder total, **sem pedir nada** | Você precisa **escrever `sudo`** antes dos comandos perigosos: um momento para pensar |
| Um erro de digitação pode apagar o sistema | O erro costuma ser barrado por falta de permissão |
| É o usuário que **todo robô tenta** | `deploy` é um nome que o robô **não sabe** |
| Programas iniciados por você herdam poder total | Herdam o poder limitado do seu usuário |
| Não dá para saber **quem** fez o quê | O `sudo` registra quem executou cada comando |

Este é o **princípio do menor privilégio**: dar a cada pessoa e a cada programa só o poder de que ele precisa, e só quando precisa.

---

## Passo 1 — Criar o usuário

🖥️ **No servidor** (como root):

```bash
adduser deploy
```

| Pergunta | O que responder |
|---|---|
| `New password` | Uma senha **forte**. Ela vai servir **só para o `sudo`**: o login por SSH será por chave |
| `Retype new password` | A mesma |
| `Full Name`, `Room Number`, `Work Phone`... | Pode deixar tudo em branco (Enter) |
| `Is the information correct?` | `Y` |

> 💡 Escolhemos o nome `deploy` por ser comum, mas pode ser qualquer um (ex.: o seu primeiro nome). **Se mudar**, troque em **todos** os comandos seguintes, e em `AllowUsers` na Aula 51.

Conferir:

```bash
id deploy
ls -d /home/deploy
```

---

## Passo 2 — Dar permissão de `sudo`

```bash
usermod -aG sudo deploy
```

| Parte | Significado |
|---|---|
| `usermod` | Modifica um usuário |
| `-a` | **A**crescenta (sem isso, **substituiria** todos os grupos do usuário) |
| `-G sudo` | Ao grupo `sudo` |

> ⚠️ O `-a` é fundamental. `usermod -G sudo deploy` (sem `-a`) remove o usuário de todos os outros grupos.

Conferir:

```bash
id deploy
```

A lista de `groups=` deve incluir `27(sudo)`.

---

## Passo 3 — Instalar a chave pública

A chave pública vai para o arquivo `~/.ssh/authorized_keys` do usuário. Cada linha ali é um "cadeado" que pode abrir a porta.

### 3.1 — Copiar a chave

💻 **No seu computador**, em um terminal **separado** (deixe o do servidor aberto):

```powershell
type $env:USERPROFILE\.ssh\id_ed25519.pub
```

Selecione a linha **inteira** (começa em `ssh-ed25519` e termina no comentário) e copie com `Ctrl` + `C`.

### 3.2 — Criar a pasta com as permissões certas

🖥️ **No servidor:**

```bash
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
```

| Parte | Significado |
|---|---|
| `install -d` | Cria um diretório |
| `-m 700` | Permissão: **só o dono** lê, escreve e entra |
| `-o deploy -g deploy` | Dono e grupo: `deploy` |

### 3.3 — Colar a chave

```bash
nano /home/deploy/.ssh/authorized_keys
```

Cole a linha copiada (botão direito do mouse, no terminal do Windows). Salve com `Ctrl` + `O`, `Enter`, e saia com `Ctrl` + `X`.

> ⚠️ A chave precisa estar em **uma única linha**, sem quebras. Se o terminal quebrar a linha ao colar, o SSH não reconhece a chave.

### 3.4 — Acertar o dono e as permissões

```bash
chown deploy:deploy /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
ls -la /home/deploy/.ssh
```

Esperado:

```text
drwx------ 2 deploy deploy 4096 ... .
-rw------- 1 deploy deploy  100 ... authorized_keys
```

| Permissão | Significado |
|---|---|
| `drwx------` | Pasta: só o dono acessa |
| `-rw-------` | Arquivo: só o dono lê e escreve |

> 📌 O SSH **recusa** chaves cujos arquivos estejam com permissão aberta demais (`StrictModes`). Se a chave "não funciona", **quase sempre é permissão ou dono errado**.

---

## Passo 4 — Testar **antes** de continuar

Este passo é o mais importante da aula. **Não feche a sessão do root.**

💻 **No seu computador**, em um **novo terminal**:

```powershell
ssh deploy@SEU_IP
```

O esperado é que ele peça **a passphrase da chave** (e não a senha do usuário) e entre. O prompt vira:

```text
deploy@estoque:~$
```

Repare: agora é `$`, e não `#`. Você é um usuário comum.

Teste o `sudo`:

🖥️ **No servidor, como `deploy`:**

```bash
whoami
sudo whoami
```

| Comando | Resultado |
|---|---|
| `whoami` | `deploy` |
| `sudo whoami` | Pede a **senha do deploy** e responde `root` |

Se os dois funcionaram, o usuário está pronto.

> ⚠️ **Se o `ssh deploy@SEU_IP` pedir a *senha do usuário* em vez da passphrase**, a chave **não foi reconhecida** e ele caiu na senha. Funciona, mas indica um erro no Passo 3. Revise antes de seguir, ou a Aula 51 (que proíbe senha) vai te **trancar para fora**.

Pode fechar a sessão do `deploy`; mantenha a do root aberta por enquanto.

---

## Entendendo o que fizemos

Agora existem **duas** camadas para tomar o controle do servidor:

```text
1. Provar que tem a chave privada (e a passphrase)  ->  entra como "deploy"
2. Saber a senha do sudo                            ->  vira administrador
```

Um robô que adivinhasse a senha do `deploy` **ainda não** conseguiria entrar (na próxima aula desligamos a senha no SSH). E quem roubasse a chave **ainda** precisaria da senha do `sudo` para mexer no sistema.

---

## ✅ Confira se deu certo

- [ ] `id deploy` mostra o grupo `sudo`
- [ ] `ls -la /home/deploy/.ssh` mostra `drwx------` e `-rw-------`
- [ ] `ssh deploy@SEU_IP` entrou pedindo a **passphrase da chave**
- [ ] `sudo whoami` respondeu `root`
- [ ] Ainda tenho a sessão do root aberta

---

## 🔧 Se deu erro

| Problema | Causa | Solução |
|---|---|---|
| Pede a **senha** do deploy | A chave não foi aceita | Permissões ou dono errados. Repita o Passo 3.4. Veja o motivo: `journalctl -u ssh --no-pager \| tail -n 15` (procure `Authentication refused: bad ownership`) |
| `Permission denied (publickey)` | Chave errada ou sem chave no servidor | Compare a chave do `type ...id_ed25519.pub` com `cat /home/deploy/.ssh/authorized_keys` |
| `deploy is not in the sudoers file` | Não entrou no grupo `sudo` | Como root: `usermod -aG sudo deploy`, e **saia e entre de novo** |
| `sudo: a password is required` sem prompt | Sessão antiga, grupo ainda não carregou | `exit` e entre novamente |
| A chave colou com quebra de linha | Terminal quebrou a linha | Reabra o `nano`, apague e cole de novo; confira que é **1 linha** |
| Esqueci a senha do deploy | — | Como root: `passwd deploy` |

---

## ➡️ Próximo passo

Com o usuário e a chave funcionando, podemos **fechar a porta da frente**: proibir root e senhas no SSH.

**[Aula 51 — Blindando o SSH](51-blindando-ssh.md)**
