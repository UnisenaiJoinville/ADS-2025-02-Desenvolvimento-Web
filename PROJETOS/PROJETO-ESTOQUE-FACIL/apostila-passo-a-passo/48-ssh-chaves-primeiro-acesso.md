# Aula 48 — SSH: chaves e primeiro acesso

⏱️ **Tempo estimado:** 45 minutos
📋 **Tipo:** conceitos + prática (terminal local e servidor)

---

## Objetivo

Entender o que é o **SSH**, gerar o seu **par de chaves**, entrar no servidor pela primeira vez e **ver com os próprios olhos** os ataques que já estão acontecendo.

---

## Antes de começar

- [ ] Aula 47 concluída
- [ ] IP e senha do servidor anotados (Aula 46)
- [ ] PowerShell ou Git Bash aberto

> 💻 No Windows 10 e 11 o cliente SSH já vem instalado. Confirme:
>
> ```powershell
> ssh -V
> ```
>
> Deve mostrar algo como `OpenSSH_9.x`. Se não mostrar, instale em *Configurações → Aplicativos → Recursos opcionais → Cliente OpenSSH*.

---

## O que é SSH?

**SSH** (*Secure Shell*) abre um **terminal remoto criptografado**: você digita no seu computador e o comando executa no servidor. Tudo que passa pelo "cano" (comandos, senhas, arquivos) viaja embaralhado.

Substituiu o antigo `telnet`, que mandava tudo **em texto aberto**.

```text
   Seu PC  ===== túnel criptografado (porta 22) =====>  VPS
   ssh usuario@IP                                     recebe e executa
```

---

## Senha ou chave?

Existem duas formas de provar quem você é:

| | Senha | Chave SSH |
|---|---|---|
| O que é | Um texto que você sabe | Um **par de arquivos** matematicamente ligados |
| Pode ser **adivinhada** por robô? | **Sim**, é a técnica deles | Na prática **não** (equivale a uma senha de centenas de caracteres aleatórios) |
| Pode ser **vazada** em um site? | Sim | Só a metade pública fica no servidor, e ela **não serve para entrar** |
| Dá para esquecer | Sim | Sim, se perder o arquivo |

### O par de chaves: o cadeado e a chave

| Arquivo | Analogia | Onde fica | Pode compartilhar? |
|---|---|---|---|
| `id_ed25519.pub` — **chave pública** | O **cadeado** | Vai para o **servidor** | ✅ Sim, é feita para isso |
| `id_ed25519` — **chave privada** | A **chave** do cadeado | **Só no seu computador** | ❌ **Nunca**, para ninguém |

O servidor guarda o cadeado. Quando você tenta entrar, ele lança um desafio que **só quem tem a chave privada consegue resolver**, sem que a chave privada precise viajar pela rede.

> ⚠️ **A chave privada é o seu acesso.** Quem copiar o arquivo `id_ed25519` entra no seu servidor como você. Não mande por e-mail, não coloque no Git, não tire foto, não cole em chat.

---

## Passo 1 — Gerar o seu par de chaves

💻 **No seu computador:**

```powershell
ssh-keygen -t ed25519 -C "seunome-estoque-facil"
```

| Parte | Significado |
|---|---|
| `ssh-keygen` | Programa que gera chaves |
| `-t ed25519` | O **algoritmo**: moderno, rápido, curto e seguro |
| `-C "..."` | Um **comentário** para você reconhecer a chave depois |

O programa faz duas perguntas:

**1. `Enter file in which to save the key`**: aperte **Enter** para aceitar o local padrão (`C:\Users\voce\.ssh\id_ed25519`).

> ⚠️ Se já existir uma chave, ele pergunta se quer sobrescrever. **Responda `n`** e use a que existe. Sobrescrever uma chave em uso tranca você para fora dos servidores onde ela estava.

**2. `Enter passphrase`**: digite uma **frase-senha** e confirme.

| Com passphrase | Sem passphrase |
|---|---|
| Se roubarem o arquivo, ele **ainda é inútil** sem a frase | Quem pegar o arquivo entra direto |

> 💡 **Use passphrase.** Ela é a segunda trava: a chave (algo que você **tem**) mais a frase (algo que você **sabe**). O Windows pode guardá-la para você (veja o fim da Aula 51), então não vira incômodo.

### Ver o que foi criado

```powershell
dir $env:USERPROFILE\.ssh
```

Aparecem `id_ed25519` (**privada**) e `id_ed25519.pub` (**pública**).

### Ver a chave pública

```powershell
type $env:USERPROFILE\.ssh\id_ed25519.pub
```

Sai **uma linha** parecida com:

```text
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... seunome-estoque-facil
```

Essa linha é segura de copiar e colar. Vamos usá-la na Aula 50.

> ❌ **Cuidado para não confundir:** `type ...id_ed25519` (sem `.pub`) mostraria a **privada**. Se aparecer `BEGIN OPENSSH PRIVATE KEY`, você abriu o arquivo errado: feche e não copie.

---

## Passo 2 — O primeiro acesso

💻 **No seu computador**, troque `SEU_IP` pelo IP do portal:

```powershell
ssh root@SEU_IP
```

| Parte | Significado |
|---|---|
| `ssh` | O cliente |
| `root` | O **usuário** no servidor |
| `@` | "em" |
| `SEU_IP` | **Onde** (o endereço do servidor) |

### A pergunta da impressão digital

Na primeira conexão aparece algo assim:

```text
The authenticity of host '203.0.113.10' can't be established.
ED25519 key fingerprint is SHA256:abc123...
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

Isso significa: "**nunca vi este servidor antes**. Esta é a impressão digital dele. É o servidor certo?"

Digite `yes` e Enter.

O SSH grava a impressão digital em `.ssh\known_hosts`. Nas próximas vezes ele **compara**. Se um dia ela mudar sem você ter reinstalado o servidor, ele grita um aviso enorme (`WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED`). Esse aviso pode significar um ataque de interceptação: **não ignore**.

Depois, digite a senha de root (**ela não aparece enquanto você digita**, nem asteriscos. É normal) e Enter.

### Como saber que entrou

O *prompt* muda para algo como:

```text
root@vps-12345:~#
```

Leia: `usuário@máquina:pasta#`. O `#` (em vez de `$`) indica que você é **root**, o administrador absoluto.

> ⚠️ Como root, **nada pede confirmação**. `rm -rf /` apaga o sistema inteiro sem perguntar. Esse é um dos motivos de criarmos outro usuário na Aula 50.

---

## Passo 3 — Trocar a senha de root

Se a senha veio por e-mail ou portal, ela circulou em lugares que você não controla. Troque agora:

🖥️ **No servidor:**

```bash
passwd
```

Digite a nova senha duas vezes. Use algo **longo** (frase de 4 ou 5 palavras serve). Guarde em um gerenciador de senhas.

---

## Passo 4 — Conhecer a máquina

🖥️ **No servidor**, rode cada comando e leia o resultado:

```bash
whoami
```

Quem você é no servidor. Deve ser `root`.

```bash
cat /etc/os-release
```

O sistema instalado. Procure `Ubuntu 24.04` (ou `22.04`) e `LTS`.

```bash
nproc
free -h
df -h /
```

| Comando | Mostra |
|---|---|
| `nproc` | Quantos núcleos de CPU |
| `free -h` | Memória (`-h` = *human*, em MB/GB). Olhe a linha `Mem:` e `Swap:` |
| `df -h /` | Espaço em disco. Olhe `Size` e `Avail` |

```bash
uptime
```

Há quanto tempo o servidor está ligado e a carga dele.

> 💡 Anote RAM e disco. Se `Mem` for menor que 2 GB, a Aula 49 tem o passo do *swap*.

---

## Passo 5 — Ver os ataques acontecendo

Esta é a parte que costuma impressionar. 🖥️ **No servidor:**

```bash
journalctl -u ssh --no-pager | grep -E "Invalid user|Failed password" | tail -n 10
```

| Parte | Significado |
|---|---|
| `journalctl -u ssh` | Lê o registro (*log*) do serviço SSH |
| `--no-pager` | Imprime tudo direto, sem abrir um leitor paginado |
| `\|` | **Pipe**: entrega a saída de um comando como entrada do próximo |
| `grep -E "..."` | Filtra só as linhas com "Invalid user" **ou** "Failed password" |
| `tail -n 10` | Mostra só as 10 últimas |

Contagem total:

```bash
journalctl -u ssh --no-pager | grep -cE "Invalid user|Failed password"
```

Se a lista vier cheia, você verá nomes como `admin`, `ubuntu`, `test`, `oracle`, `postgres`, vindos de IPs do mundo todo: são **robôs** testando os usuários e senhas mais comuns.

> 📌 Se vier vazio, o servidor pode ser muito novo, ou o provedor filtra a porta 22 de fora. **Volte a olhar depois da Aula 52**: a diferença entre "antes" e "depois" do Fail2ban é a melhor demonstração da aula.
>
> Em instalações mínimas pode não existir `/var/log/auth.log`. O `journalctl` funciona sempre.

---

## Passo 6 — Sair

```bash
exit
```

(ou `Ctrl` + `D`). O prompt volta para o seu computador.

---

## Entendendo o que fizemos

- **Chave pública no servidor, privada com você**: a base de toda a segurança de acesso daqui para a frente.
- **Passphrase**: protege a chave caso o arquivo vaze.
- **`known_hosts`**: o SSH guarda a identidade do servidor e avisa se ela mudar.
- **Logs**: o servidor registra tudo. Saber ler `journalctl` é metade da administração.

Ainda estamos entrando por **senha de root**, o pior cenário possível. Nas próximas aulas, fecharemos essa porta.

---

## ✅ Confira se deu certo

- [ ] `dir $env:USERPROFILE\.ssh` mostra `id_ed25519` e `id_ed25519.pub`
- [ ] Defini uma **passphrase** na chave
- [ ] Entrei no servidor com `ssh root@SEU_IP`
- [ ] Troquei a senha de root com `passwd`
- [ ] Sei dizer quanta RAM e disco o servidor tem
- [ ] Vi (ou procurei) as tentativas de acesso no log
- [ ] Sei a diferença entre chave pública e privada, e **qual nunca compartilhar**

---

## 🔧 Se deu erro

| Problema | Causa | Solução |
|---|---|---|
| `Connection timed out` | IP errado, servidor desligado ou ainda ativando | Confira o IP no portal e se o servidor está "ligado" |
| `Connection refused` | O serviço SSH não está respondendo | Veja no portal se o servidor terminou de iniciar; tente de novo em 2 minutos |
| `Permission denied, please try again` | Senha errada | Lembre que a senha **não aparece** ao digitar. Copie-e-cole do portal |
| `REMOTE HOST IDENTIFICATION HAS CHANGED` | O servidor foi **reinstalado** (esperado) ou há interceptação | Se você reinstalou: `ssh-keygen -R SEU_IP` e conecte de novo. Se **não** reinstalou, desconfie |
| `ssh` não é reconhecido | Cliente não instalado | Instale o *Cliente OpenSSH* ou use o Git Bash |
| `Bad permissions` na chave | Outros usuários do Windows leem o arquivo | Mova a chave para a pasta do seu usuário (`.ssh`) |

---

## ➡️ Próximo passo

Vamos atualizar o sistema e preparar o servidor para aguentar o MySQL.

**[Aula 49 — Primeiros ajustes do servidor](49-primeiros-ajustes-servidor.md)**
