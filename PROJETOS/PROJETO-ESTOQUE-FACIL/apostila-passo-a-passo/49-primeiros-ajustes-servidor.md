# Aula 49 — Primeiros ajustes do servidor

⏱️ **Tempo estimado:** 35 minutos
📋 **Tipo:** prática (SSH)

---

## Objetivo

Atualizar o sistema, acertar fuso horário e nome da máquina e, se faltar memória, criar uma área de **swap**.

---

## Antes de começar

- [ ] Aula 48 concluída (você consegue entrar com `ssh root@SEU_IP`)

🖥️ **Entre no servidor** (`ssh root@SEU_IP`). Todos os comandos desta aula rodam **lá**.

---

## Passo 1 — Atualizar o sistema

Imagens de servidor são feitas semanas ou meses antes de você contratar. Ao ligar, já existem **correções de segurança** pendentes. Este é o primeiro ato de qualquer administrador.

```bash
apt update
```

Baixa a **lista** de pacotes e versões disponíveis. **Não instala nada.**

```bash
apt upgrade -y
```

Instala as atualizações. O `-y` responde "sim" automaticamente.

| Comando | Analogia |
|---|---|
| `apt update` | Consultar o **catálogo** da loja |
| `apt upgrade` | **Comprar** o que está atualizado no catálogo |

> ⚠️ Rode sempre **os dois, nessa ordem**. Sem o `update` o `upgrade` trabalha com um catálogo velho.

Pode aparecer uma tela rosa/azul perguntando sobre serviços a reiniciar ou arquivos de configuração. Aceite as opções padrão (`Enter`). Se perguntar sobre o arquivo `sshd_config`, escolha **manter a versão local** (`keep the local version currently installed`).

Demora de 1 a 5 minutos.

### Precisa reiniciar?

```bash
ls /var/run/reboot-required
```

| Resultado | Significado |
|---|---|
| `No such file or directory` | Não precisa. Siga em frente |
| `/var/run/reboot-required` | Atualizou o **kernel** (o núcleo do sistema). É preciso reiniciar |

Se precisar:

```bash
reboot
```

A conexão cai. **Espere cerca de 1 minuto** e reconecte com `ssh root@SEU_IP`.

---

## Passo 2 — Fuso horário

Os registros (*logs*) e os backups levam data e hora no nome. Servidor com hora errada gera confusão na hora de investigar um problema.

```bash
timedatectl
```

Veja `Time zone:`. Para o horário de Brasília:

```bash
timedatectl set-timezone America/Sao_Paulo
timedatectl
```

Confira que `Time zone: America/Sao_Paulo` e que a linha `System clock synchronized: yes` aparece. Isso quer dizer que o relógio está sincronizado com a internet (NTP).

> 📌 O banco de dados dentro do container MySQL continua trabalhando em UTC, como no seu ambiente de aula. Não mexemos nisso de propósito: o comportamento do sistema em produção fica **igual** ao que você testou.

---

## Passo 3 — Nome da máquina

```bash
hostnamectl set-hostname estoque
hostnamectl
```

Só organização: o prompt passa a mostrar `usuario@estoque`, o que ajuda quando você tem vários terminais abertos e precisa saber **em qual máquina** está.

---

## Passo 4 — Memória *swap* (se necessário)

O **swap** usa um pedaço do disco como "memória de emergência". É bem mais lento que a RAM, mas evita que o sistema **mate o MySQL** quando a memória enche.

Primeiro, veja se já existe:

```bash
swapon --show
free -h
```

| Resultado | O que fazer |
|---|---|
| `swapon --show` mostra uma linha | Já tem swap. **Pule para o Passo 5** |
| Vazio e `Mem:` **2 GB ou mais** | Opcional. Recomendado mesmo assim, 2 GB de folga |
| Vazio e `Mem:` **menos de 2 GB** | **Faça.** É necessário |

### Criar 2 GB de swap

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

| Comando | O que faz |
|---|---|
| `fallocate -l 2G /swapfile` | Reserva um arquivo de 2 GB |
| `chmod 600 /swapfile` | **Só o root** lê e escreve. Swap pode conter pedaços de memória com senhas |
| `mkswap /swapfile` | Formata o arquivo como área de swap |
| `swapon /swapfile` | Liga o swap agora |

Para o swap **sobreviver a um reinício**, registre-o no `/etc/fstab` (a lista de discos que o sistema monta ao ligar):

```bash
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
```

`tee -a` **acrescenta** a linha ao arquivo (o `-a` é *append*; sem ele o arquivo seria **apagado e sobrescrito**).

Ajuste para o sistema só usar o swap em último caso:

```bash
echo 'vm.swappiness=10' > /etc/sysctl.d/99-swappiness.conf
sysctl --system
```

Confira:

```bash
free -h
swapon --show
```

A linha `Swap:` deve mostrar `2,0Gi`.

> ⚠️ **Se o servidor for do tipo "container" (OpenVZ/LXC)**, o `swapon` pode dar `Operation not permitted`. Nesse caso o provedor controla a memória: não insista, e escolha um plano com 2 GB de RAM.

---

## Passo 5 — Programas de apoio

```bash
apt install -y curl ca-certificates nano
```

Quase sempre já estão instalados. O comando só garante. Se já existirem, ele avisa e segue.

---

## Entendendo o que fizemos

Nenhum desses passos é "glamouroso", mas **servidor desatualizado é a causa nº 1 de invasão** em máquinas sem cuidado. Os atacantes não precisam ser gênios: eles usam falhas **já conhecidas e já corrigidas** contra quem não atualizou.

---

## ✅ Confira se deu certo

- [ ] `apt update` e `apt upgrade -y` terminaram sem erro
- [ ] `ls /var/run/reboot-required` não existe (ou já reiniciei)
- [ ] `timedatectl` mostra `America/Sao_Paulo`
- [ ] `free -h` mostra swap (se a RAM for menor que 2 GB, é obrigatório)
- [ ] O prompt mostra `estoque` ao reconectar

---

## 🔧 Se deu erro

| Problema | Causa | Solução |
|---|---|---|
| `Could not get lock /var/lib/dpkg/lock` | Outra atualização automática está rodando | Espere 2 minutos e repita. **Não apague o arquivo de lock** |
| `Temporary failure resolving` | Sem DNS/internet no servidor | `ping -c 2 1.1.1.1`. Se funcionar e o nome não, é DNS: abra chamado com o provedor |
| `fallocate: Operation not supported` | Sistema de arquivos não suporta | Use `dd if=/dev/zero of=/swapfile bs=1M count=2048` no lugar |
| Reiniciei e não conecto | O servidor ainda está ligando | Espere mais 1 minuto. Veja o status no portal |
| `sudo: unable to resolve host` após trocar o nome | O novo nome não está em `/etc/hosts` | Aparece só como aviso; resolve ao reiniciar. Para resolver agora: `echo "127.0.1.1 estoque" >> /etc/hosts` |

---

## ➡️ Próximo passo

Trabalhar como **root** o tempo todo é perigoso. Vamos criar um usuário comum, com a sua chave.

**[Aula 50 — Usuário comum, sudo e a chave SSH](50-usuario-sudo-chave.md)**
