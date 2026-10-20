# Aula 52 — Firewall, Fail2ban e atualizações automáticas

⏱️ **Tempo estimado:** 50 minutos
📋 **Tipo:** prática (SSH) · **cuidado com a ordem dos comandos**

---

## Objetivo

Liberar **só as portas necessárias** com o UFW, bloquear automaticamente quem erra o acesso com o **Fail2ban** e deixar o servidor **se atualizar sozinho** em correções de segurança.

---

## Antes de começar

- [ ] Aula 51 concluída (SSH só com chave, e testado)
- [ ] Conectado como `deploy` (`ssh deploy@SEU_IP`)

🖥️ Todos os comandos desta aula rodam **no servidor**, como `deploy` (com `sudo`).

---

## Parte 1 — O firewall (UFW)

### O que é e por que usar

Um **firewall** decide **quais portas** do servidor existem para a internet. Cada serviço escuta em uma porta; cada porta aberta é uma superfície de ataque.

```text
   porta 22   SSH      -> precisamos (administrar)
   porta 80   HTTP     -> precisamos (site e certificado)
   porta 443  HTTPS    -> precisamos (site)
   porta 3306 MySQL    -> NUNCA para a internet
   outras     ...      -> não precisamos
```

O **UFW** (*Uncomplicated Firewall*) é o firewall simples do Ubuntu. A estratégia é **negar tudo e liberar só o necessário**, em vez de tentar bloquear o que é perigoso (você sempre esqueceria algo).

### Passo 1 — Ver o que está escutando

```bash
sudo ss -tulpn
```

| Coluna | Significado |
|---|---|
| `tcp`/`udp` | O protocolo |
| `Local Address:Port` | Onde escuta. `0.0.0.0` ou `*` = **qualquer um da internet**. `127.0.0.1` = só a própria máquina |
| `Process` | Qual programa |

Neste momento você deve ver o `sshd` na `:22`, e pouco mais. Guarde essa tela: vamos comparar depois.

### Passo 2 — Definir a política padrão

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
```

| Regra | Significado |
|---|---|
| `deny incoming` | **Bloqueia** tudo que **chega** de fora |
| `allow outgoing` | Libera o que **sai** (o servidor precisa baixar atualizações e imagens) |

### Passo 3 — Liberar o necessário

> 🚨 **A ordem importa.** Libere o SSH **antes** de ligar o firewall. Ligar com "negar tudo" sem liberar a 22 derruba a sua conexão **na hora**, e você terá que usar o console de emergência.

```bash
sudo ufw limit 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 443/udp
```

| Regra | Significado |
|---|---|
| `limit 22/tcp` | Libera o SSH, **mas** bloqueia temporariamente um IP que tente conectar **6 vezes em 30 segundos** (barra robôs de força bruta) |
| `allow 80/tcp` | HTTP: o Caddy usa para obter o certificado e redirecionar para HTTPS |
| `allow 443/tcp` | HTTPS |
| `allow 443/udp` | HTTP/3 (QUIC) |

### Passo 4 — Ligar

```bash
sudo ufw enable
```

Responde `y` ao aviso ("Command may disrupt existing ssh connections"). Como a 22 já está liberada, a sua sessão **continua**.

Confira:

```bash
sudo ufw status verbose
```

Esperado (a ordem pode variar):

```text
Status: active
Default: deny (incoming), allow (outgoing), disabled (routed)

To                         Action      From
--                         ------      ----
22/tcp                     LIMIT IN    Anywhere
80/tcp                     ALLOW IN    Anywhere
443/tcp                    ALLOW IN    Anywhere
443/udp                    ALLOW IN    Anywhere
(as mesmas linhas para v6)
```

Teste que **continua conectado**: abra **outro terminal** e rode `ssh deploy@SEU_IP`. Deve entrar.

### ⚠️ O Docker e o UFW: uma pegadinha séria

Esta é uma das informações mais importantes do bloco. Quando você **publica** uma porta no Docker (`ports: "3306:3306"`), ele escreve as próprias regras de rede **antes** do UFW olhar. A documentação oficial do Docker diz que o tráfego dos containers é desviado *antes* de passar pelo firewall do UFW.

Consequência:

| Você faz | Resultado |
|---|---|
| `ufw deny 3306` **e** publica `3306:3306` no Compose | ❌ **A porta fica aberta mesmo assim.** O UFW diz "negado", mas o Docker passou por cima |
| **Não** publica a porta | ✅ Ela nem existe para fora |

É por isso que, na Aula 47, o `db` e a `api` **não têm `ports`**. A proteção real do banco **não é o firewall: é não publicar a porta.** O UFW cuida do servidor; o desenho do Compose cuida dos containers. Você precisa dos dois.

---

## Parte 2 — Fail2ban

### O que é

O **Fail2ban** lê os registros do servidor e, quando um IP **erra demais**, manda o firewall **bloquear aquele IP** por um tempo. É o "segurança" que anota a placa do carro de quem tentou arrombar a porta várias vezes.

### Passo 5 — Instalar

```bash
sudo apt install -y fail2ban
```

### Passo 6 — Configurar

Nunca edite o `jail.conf` (as atualizações o sobrescrevem). Crie o **seu** arquivo, que tem prioridade:

```bash
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
# Tempo de bloqueio
bantime  = 1h
# Janela em que as falhas sao contadas
findtime = 10m
# Falhas toleradas dentro da janela
maxretry = 5

[sshd]
enabled = true
```

| Opção | Significado |
|---|---|
| `bantime = 1h` | Quem for bloqueado fica **1 hora** de fora |
| `findtime = 10m` + `maxretry = 5` | **5 falhas em 10 minutos** = bloqueio |
| `[sshd] enabled = true` | Vigia o SSH |

Salve e ligue:

```bash
sudo systemctl enable --now fail2ban
sudo systemctl status fail2ban --no-pager
```

Deve mostrar `active (running)`. Saia do `status` com `q`, se abrir um leitor.

### Passo 7 — Conferir

```bash
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

Em `sshd` aparecem `Currently failed`, `Total failed`, `Currently banned` e a lista de IPs bloqueados. Dentro de algumas horas você verá números reais: são os robôs sendo barrados.

> ⚠️ **Você pode se bloquear.** Se errar a passphrase várias vezes seguidas, é *você* quem é banido por 1 hora. Para liberar o seu IP (pelo console de emergência, se necessário):
>
> ```bash
> sudo fail2ban-client set sshd unbanip SEU_IP_DE_CASA
> ```

> 📌 Volte ao **Passo 5 da Aula 48** (`journalctl -u ssh ...`) em alguns dias e compare. Os robôs continuam tentando, mas agora **cada IP só tenta 5 vezes** e some.

---

## Parte 3 — Atualizações automáticas de segurança

Vulnerabilidades novas são descobertas toda semana. Se você depender de "lembrar de atualizar", um dia vai esquecer. O pacote `unattended-upgrades` instala **sozinho** as correções de **segurança**.

### Passo 8 — Instalar e ativar

```bash
sudo apt install -y unattended-upgrades
```

Crie o arquivo que liga a rotina diária:

```bash
sudo nano /etc/apt/apt.conf.d/20auto-upgrades
```

```text
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
```

| Linha | Significado |
|---|---|
| `Update-Package-Lists "1"` | Faz o `apt update` **1 vez por dia** |
| `Unattended-Upgrade "1"` | Instala as atualizações **1 vez por dia** |

### Passo 9 — Testar sem aplicar

```bash
sudo unattended-upgrade --dry-run --debug 2>&1 | tail -n 8
```

O `--dry-run` simula. Procure por uma linha que mencione `Allowed origins` e termine sem erros.

### O que ele **não** faz

| Item | Observação |
|---|---|
| Atualizar para **outra versão** do Ubuntu | Não. Só correções da versão que você já usa |
| **Reiniciar** quando o kernel muda | Não por padrão. Em atualizações de kernel, o servidor só passa a usar o novo depois de reiniciar. De tempos em tempos rode `ls /var/run/reboot-required` |
| Atualizar o **Docker** e as **imagens** (MySQL, Caddy) | Não. Isso é feito por você, na Aula 58 |

---

## Entendendo o que fizemos

Montamos três proteções que trabalham sozinhas, **sem você olhando**:

| Camada | Pergunta que responde |
|---|---|
| **UFW** | "Que portas existem para a internet?" Só 22, 80 e 443 |
| **Fail2ban** | "O que acontece com quem insiste em errar?" É bloqueado |
| **Atualizações** | "E se descobrirem uma falha amanhã?" Ela é corrigida sozinha |

Somadas ao SSH por chave (Aula 51), um robô passa a gastar muito mais esforço do que a invasão vale. É assim que se protege um servidor: **não por uma barreira perfeita, mas por camadas** que o tornam um alvo ruim.

---

## ✅ Confira se deu certo

- [ ] `sudo ufw status verbose` mostra `Status: active` e as portas 22, 80, 443 (tcp) e 443 (udp)
- [ ] Continuo conseguindo conectar em um terminal **novo**
- [ ] `sudo systemctl status fail2ban` mostra `active (running)`
- [ ] `sudo fail2ban-client status sshd` responde (mesmo com zero IPs bloqueados)
- [ ] `/etc/apt/apt.conf.d/20auto-upgrades` existe, com as duas linhas
- [ ] `unattended-upgrade --dry-run` terminou sem erro
- [ ] Sei explicar por que `ufw deny 3306` **não basta** se o Compose publicar a porta

---

## 🔧 Se deu erro

| Problema | Causa | Solução |
|---|---|---|
| Conexão caiu ao rodar `ufw enable` | Esqueceu de liberar a 22 antes | Console de emergência do portal: `sudo ufw allow 22/tcp` |
| `ufw: command not found` | UFW não instalado | `sudo apt install -y ufw` |
| `fail2ban` não inicia | Erro de digitação no `jail.local` | `sudo journalctl -u fail2ban --no-pager \| tail -n 20`: a mensagem aponta a linha |
| `fail2ban-client: Failed to access socket` | O serviço ainda está subindo ou não iniciou | Espere 10 segundos e repita; confira o `status` |
| Fui bloqueado pelo Fail2ban | Errei a passphrase várias vezes | Espere 1 hora, ou use o console para `unbanip` |
| `Could not get lock` no `apt install` | A atualização automática está rodando | Espere alguns minutos |

---

## ➡️ Próximo passo

Servidor protegido. Hora de instalar o **Docker** nele.

**[Aula 53 — Instalando o Docker no servidor](53-docker-no-servidor.md)**
