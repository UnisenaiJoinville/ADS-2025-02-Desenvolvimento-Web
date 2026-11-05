# Aula 51 — Blindando o SSH

⏱️ **Tempo estimado:** 45 minutos
📋 **Tipo:** prática (SSH) · **cuidado redobrado**

---

## Objetivo

Configurar o servidor SSH para **proibir login de root**, **proibir senhas** e aceitar **só o seu usuário com chave**, sem se trancar para fora.

---

## Antes de começar

- [ ] Aula 50 concluída: `ssh deploy@SEU_IP` entra **com a chave** e `sudo` funciona
- [ ] Uma **sessão de root ainda aberta** em outro terminal (a sua rede de segurança)
- [ ] Você já localizou o **console de emergência** no portal (Aula 46)

> ⚠️ **Esta é a aula em que mais se erra.** Uma configuração errada no SSH pode trancar você para fora do próprio servidor. Siga a ordem à risca: **configurar → validar → recarregar → testar em outro terminal → só então fechar a sessão antiga.**

---

## O plano de segurança

```text
   ANTES                                   DEPOIS
   -----                                   ------
   root  + senha    -> entra               root  + qualquer coisa -> NEGADO
   deploy + senha   -> entra               deploy + senha         -> NEGADO
   deploy + chave   -> entra               deploy + chave         -> entra
   qualquer usuário -> pode tentar         só "deploy"            -> pode tentar
```

Depois disso, um robô que descobrisse a senha do `deploy` **ainda assim** não entraria: o servidor nem aceita o jeito "senha".

---

## Passo 1 — Entender onde fica a configuração

🖥️ **No servidor**, como `deploy` (reconecte com `ssh deploy@SEU_IP` se precisar):

```bash
sudo grep -n "^Include" /etc/ssh/sshd_config
ls /etc/ssh/sshd_config.d/
```

O Ubuntu moderno lê o arquivo principal `/etc/ssh/sshd_config` **e depois** todos os arquivos `*.conf` da pasta `sshd_config.d/`. Em vez de editar o arquivo principal (que as atualizações do sistema podem sobrescrever), colocamos a **nossa** configuração em um arquivo próprio.

Veja o que já existe lá:

```bash
sudo grep -r "PasswordAuthentication" /etc/ssh/sshd_config /etc/ssh/sshd_config.d/
```

> 🪤 **A armadilha do `50-cloud-init.conf`.** Muitas imagens de VPS trazem um arquivo `50-cloud-init.conf` com `PasswordAuthentication yes`. No SSH **vale o primeiro valor lido**, e os arquivos são lidos em **ordem alfabética**. Se o nosso arquivo se chamasse `99-hardening.conf`, ele seria lido **depois** e o `yes` do cloud-init ganharia, e a senha continuaria liberada sem você perceber.
>
> Por isso o nosso arquivo se chama **`10-hardening.conf`**: o `10` vem antes do `50`.

---

## Passo 2 — Escrever a configuração

```bash
sudo nano /etc/ssh/sshd_config.d/10-hardening.conf
```

Conteúdo:

```bash
# Ninguem entra como root, nem com chave
PermitRootLogin no

# Nada de senha: so chave
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
PermitEmptyPasswords no

# Apenas este usuario pode abrir sessao
AllowUsers deploy

# Menos tentativas e menos tempo para quem erra
MaxAuthTries 3
LoginGraceTime 30

# Recursos que nao usamos ficam desligados
X11Forwarding no
```

Salve (`Ctrl` + `O`, `Enter`) e saia (`Ctrl` + `X`).

### O que cada linha faz

| Diretiva | Efeito |
|---|---|
| `PermitRootLogin no` | O usuário `root` **não pode** abrir sessão SSH, com senha ou chave |
| `PasswordAuthentication no` | Senha **não é** aceita para entrar |
| `KbdInteractiveAuthentication no` | Fecha o "atalho" de senha por perguntas interativas (PAM) |
| `PubkeyAuthentication yes` | Chave pública é o jeito de entrar |
| `PermitEmptyPasswords no` | Proíbe contas sem senha |
| `AllowUsers deploy` | **Lista de permissão**: só `deploy` entra. Qualquer outro usuário é barrado, mesmo que exista |
| `MaxAuthTries 3` | Desconecta após 3 tentativas erradas na mesma conexão |
| `LoginGraceTime 30` | Quem não se autentica em 30 segundos é derrubado (o padrão é 120) |
| `X11Forwarding no` | Desliga o redirecionamento de janelas gráficas (não usamos) |

> ⚠️ Se você escolheu outro nome de usuário na Aula 50, **troque `deploy`** em `AllowUsers`. Colocar um usuário que não existe tranca todo mundo para fora.

---

## Passo 3 — Validar **antes** de aplicar

```bash
sudo sshd -t
```

| Resultado | Significado |
|---|---|
| **Nenhuma saída** | ✅ Sintaxe correta |
| `Bad configuration option: ...` | ❌ Erro de digitação. Corrija o arquivo e rode de novo |

O `sshd -t` (*test*) só **verifica** o arquivo: não muda nada no servidor em funcionamento. **Nunca recarregue o SSH sem ele dar silêncio.**

Veja o que o servidor **vai** enxergar de fato (já com a ordem dos arquivos resolvida):

```bash
sudo sshd -T | grep -E "^(permitrootlogin|passwordauthentication|kbdinteractiveauthentication|allowusers|maxauthtries|x11forwarding) "
```

Esperado:

```text
maxauthtries 3
permitrootlogin no
passwordauthentication no
kbdinteractiveauthentication no
x11forwarding no
allowusers deploy
```

> 💡 O `sshd -T` (T maiúsculo) mostra a **configuração efetiva**. É a prova de que o `50-cloud-init.conf` não está ganhando. Se aparecer `passwordauthentication yes`, algum arquivo está sobrescrevendo o seu: use o `grep -r` do Passo 1 para achar.

---

## Passo 4 — Aplicar

```bash
sudo systemctl reload ssh
```

| Comando | Efeito |
|---|---|
| `reload` | Relê a configuração **sem derrubar** as sessões abertas |
| `restart` | Reinicia o serviço (derruba as conexões) |

Por isso usamos `reload`: a sua sessão atual continua viva, como **rede de segurança**.

---

## Passo 5 — Testar em **outro terminal**

**Não feche nada ainda.** Abra um terminal **novo** no seu computador.

💻 **Teste 1:** o seu usuário com chave **deve funcionar**:

```powershell
ssh deploy@SEU_IP
```

Pede a passphrase e entra. ✅

💻 **Teste 2:** root **deve ser barrado**:

```powershell
ssh root@SEU_IP
```

Esperado: `Permission denied (publickey).` ✅ (nem pede senha)

💻 **Teste 3:** senha **deve ser recusada** mesmo para o `deploy`:

```powershell
ssh -o PubkeyAuthentication=no deploy@SEU_IP
```

Esperado: `Permission denied (publickey).` ✅ (o `-o PubkeyAuthentication=no` finge que você não tem chave, para provar que a senha não resolve)

| Teste | Esperado | Se deu diferente |
|---|---|---|
| 1 — deploy com chave | **Entra** | ❌ **NÃO feche a sessão antiga.** Corrija (veja abaixo) |
| 2 — root | Negado | O `PermitRootLogin` não pegou. Reveja o `sshd -T` |
| 3 — deploy sem chave | Negado | O `PasswordAuthentication` não pegou. Reveja o `sshd -T` |

Somente quando os **três** testes derem o resultado esperado, você pode fechar a sessão de root antiga:

```bash
exit
```

---

## Se trancou para fora

Respire. Existem duas saídas:

1. **A sessão antiga ainda está aberta?** Use-a para desfazer: `sudo nano /etc/ssh/sshd_config.d/10-hardening.conf`, corrija e `sudo systemctl reload ssh`.
2. **Fechou tudo?** Use o **console de emergência** do portal (Aula 46). Ele funciona como "monitor e teclado" e **não depende do SSH**. Entre como `root` ou `deploy` com senha e corrija o arquivo.

> 📌 É para isso que `PermitRootLogin no` é seguro: ele só bloqueia **SSH**. O console do portal é outro caminho.

---

## Passo 6 (opcional) — Um atalho: `ssh estoque`

💻 **No seu computador**, crie/edite o arquivo `C:\Users\SEU_USUARIO\.ssh\config` (sem extensão):

```text
Host estoque
    HostName SEU_IP
    User deploy
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60
    AddKeysToAgent yes
```

Agora `ssh estoque` equivale a `ssh deploy@SEU_IP`. Funciona também para `scp estoque:...`. A linha `ServerAliveInterval 60` evita que a conexão caia por inatividade.

### Digitar a passphrase só uma vez por sessão

O Windows tem um "chaveiro" para isso, o `ssh-agent`. Em um **PowerShell como administrador**:

```powershell
Get-Service ssh-agent | Set-Service -StartupType Automatic
Start-Service ssh-agent
```

Depois, em um PowerShell normal:

```powershell
ssh-add $env:USERPROFILE\.ssh\id_ed25519
```

Ele pede a passphrase **uma vez** e guarda na memória. Fica protegido, mas sem incômodo.

---

## Entendendo o que fizemos

Antes, para entrar, um invasor precisava de **um** palpite certo (a senha de root). Agora precisa do **arquivo da chave privada, da passphrase e do nome de usuário certo**. Os robôs que varrem a internet tentando `root/123456` passam a bater numa porta que nem aceita o *jeito* que eles tentam.

> 📌 **Mudar a porta 22 não é segurança.** Parece uma boa ideia, mas é "segurança por obscuridade": um varredor de portas acha a nova porta em segundos. Deixamos a 22 e investimos em **chave + firewall + Fail2ban**, que realmente funcionam.

---

## ✅ Confira se deu certo

- [ ] `sudo sshd -t` não imprimiu nada
- [ ] `sudo sshd -T` mostrou `passwordauthentication no`, `permitrootlogin no` e `allowusers deploy`
- [ ] **Teste 1**: `ssh deploy@SEU_IP` entrou
- [ ] **Teste 2**: `ssh root@SEU_IP` foi negado
- [ ] **Teste 3**: com `-o PubkeyAuthentication=no`, foi negado
- [ ] Só depois dos 3 testes, fechei a sessão de root

---

## 🔧 Se deu erro

| Problema | Causa | Solução |
|---|---|---|
| `sshd -t` mostra `Bad configuration option` | Erro de digitação | Leia a mensagem: ela diz o arquivo e a linha |
| `sshd -T` mostra `passwordauthentication yes` | Outro arquivo ganhou (cloud-init) | `sudo grep -r PasswordAuthentication /etc/ssh/`. O seu arquivo precisa vir **antes** em ordem alfabética |
| `systemctl reload ssh` diz `Unit ssh.service not found` | Nome do serviço difere | Tente `sudo systemctl reload sshd` |
| Teste 1 falhou (`Permission denied`) | `AllowUsers` com nome errado, ou a chave não está no servidor | Use a sessão antiga para corrigir. **Não feche ela** |
| Fechei tudo e não consigo entrar | — | Console de emergência do portal (veja acima) |
| `WARNING: UNPROTECTED PRIVATE KEY FILE` | Permissões da chave no seu PC | Deixe a chave só na pasta `.ssh` do seu usuário |

---

## ➡️ Próximo passo

A porta da frente está trancada. Agora vamos **fechar todas as outras portas** com um firewall, bloquear quem insiste e ligar as atualizações automáticas.

**[Aula 52 — Firewall, Fail2ban e atualizações automáticas](52-firewall-fail2ban-atualizacoes.md)**
