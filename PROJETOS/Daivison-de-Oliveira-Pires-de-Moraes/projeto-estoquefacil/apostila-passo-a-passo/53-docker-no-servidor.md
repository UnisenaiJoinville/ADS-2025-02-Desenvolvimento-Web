# Aula 53 — Instalando o Docker no servidor

⏱️ **Tempo estimado:** 30 minutos
📋 **Tipo:** prática (SSH)

---

## Objetivo

Instalar o **Docker Engine** e o **Docker Compose** na VPS pela fonte **oficial** e configurá-los para não encherem o disco de registros.

---

## Antes de começar

- [ ] Aula 52 concluída
- [ ] Conectado como `deploy`

🖥️ Todos os comandos desta aula rodam **no servidor**.

---

## Docker Desktop x Docker Engine

No seu computador você usa o **Docker Desktop**, um aplicativo com interface. No servidor Linux não existe tela: instalamos só o **Docker Engine** (o motor) e o **plugin Compose** (o `docker compose`). É a mesma tecnologia, sem a "casca".

---

## Passo 1 — Por que **não** usar o `apt install docker.io`

O Ubuntu tem um pacote `docker.io` pronto, mas costuma ser **mais antigo** e **sem o plugin Compose recente**. A forma recomendada pela própria documentação é adicionar o **repositório oficial do Docker**. É o que faremos.

> 📌 Repositório é um "servidor de pacotes". Ao adicionar o do Docker, o `apt` passa a baixar e atualizar o Docker direto da fonte. Para ter certeza de que o pacote é autêntico, ele confere uma **assinatura digital** (a chave GPG).

> 💡 Estes comandos seguem a documentação oficial para Ubuntu em **docs.docker.com/engine/install/ubuntu** na data em que a apostila foi escrita. Se algo falhar, confira a página, pois os endereços podem mudar.

---

## Passo 2 — Adicionar a chave e o repositório

```bash
sudo apt update
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
```

| Comando | Função |
|---|---|
| `install -m 0755 -d /etc/apt/keyrings` | Cria a pasta onde ficam as chaves de assinatura |
| `curl -fsSL ... -o ...` | Baixa a **chave pública** do Docker. `-f` falha em erro, `-s` silencioso, `-S` mostra erros, `-L` segue redirecionamentos |
| `chmod a+r` | Todos podem **ler** a chave (o `apt` precisa) |

Agora registre o repositório (copie o bloco **inteiro**, de `sudo tee` até o `EOF`):

```bash
sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
```

O `$(...)` descobre sozinho o nome da sua versão (`noble` para 24.04) e a arquitetura do processador.

Confira o arquivo:

```bash
cat /etc/apt/sources.list.d/docker.sources
```

Em `Suites:` deve aparecer `noble` (ou `jammy`, se for 22.04).

---

## Passo 3 — Instalar

```bash
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

| Pacote | O que é |
|---|---|
| `docker-ce` | O motor (*Community Edition*) |
| `docker-ce-cli` | O comando `docker` |
| `containerd.io` | O executor de containers por baixo do Docker |
| `docker-buildx-plugin` | Construtor de imagens moderno (o `docker build`) |
| `docker-compose-plugin` | O comando `docker compose` |

Teste:

```bash
sudo docker run --rm hello-world
sudo docker compose version
```

O primeiro baixa uma imagem minúscula e imprime `Hello from Docker!`. O segundo mostra a versão do Compose.

---

## Passo 4 — Usar o Docker sem `sudo`

Repare que precisamos escrever `sudo` antes de `docker`. Para evitar, coloque o seu usuário no grupo `docker`:

```bash
sudo usermod -aG docker deploy
```

O grupo só vale em uma **sessão nova**. Saia e entre de novo:

```bash
exit
```

💻 No seu computador: `ssh deploy@SEU_IP` (ou `ssh estoque`).

🖥️ Agora teste **sem** `sudo`:

```bash
docker run --rm hello-world
docker ps
```

> ⚠️ **Entenda o que você acabou de fazer.** Quem está no grupo `docker` pode montar **qualquer** pasta do servidor dentro de um container, com poder de root. Na prática, **estar no grupo `docker` equivale a ser root**. Aqui tudo bem: o `deploy` já tem `sudo` e é só você. Mas **nunca** coloque no grupo `docker` um usuário em quem você não confia como administrador.

---

## Passo 5 — Limitar o tamanho dos registros (*logs*)

Por padrão o Docker guarda **tudo** que seus containers imprimem em arquivos **sem limite de tamanho**. Numa VPS de 20 GB, meses de log da API podem **encher o disco**, e disco cheio derruba o banco de dados.

Configure o limite para **todos** os containers:

```bash
sudo nano /etc/docker/daemon.json
```

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

| Opção | Significado |
|---|---|
| `max-size: 10m` | Cada arquivo de log tem no máximo 10 MB |
| `max-file: 3` | Mantém os 3 mais recentes: no máximo **30 MB** por container |

Aplique:

```bash
sudo systemctl restart docker
docker info --format '{{.LoggingDriver}}'
```

Deve responder `json-file`.

> 📌 A regra vale para containers **criados depois** da mudança. Como ainda não criamos nenhum, tudo certo. Em um servidor que já tem containers, seria preciso recriá-los.

---

## Passo 6 — Garantir que o Docker liga com o servidor

```bash
sudo systemctl is-enabled docker
```

Deve responder `enabled`. Se um dia o servidor reiniciar, o Docker sobe sozinho e, graças ao `restart: unless-stopped` do nosso Compose, **o sistema volta sozinho** também.

---

## Entendendo o que fizemos

- **Fonte oficial** com assinatura digital: instalar software de origem desconhecida em servidor é um dos maiores riscos.
- **Grupo `docker`**: conveniência com consequência: equivale a root.
- **Limite de logs**: um problema "chato" que só aparece meses depois, quando o disco enche. Prevenir custa 5 linhas.

---

## ✅ Confira se deu certo

- [ ] `docker run --rm hello-world` funciona **sem** `sudo`
- [ ] `docker compose version` mostra a versão
- [ ] `docker info --format '{{.LoggingDriver}}'` responde `json-file`
- [ ] `/etc/docker/daemon.json` tem `max-size` e `max-file`
- [ ] `sudo systemctl is-enabled docker` responde `enabled`
- [ ] Sei explicar por que estar no grupo `docker` é perigoso

---

## 🔧 Se deu erro

| Problema | Causa | Solução |
|---|---|---|
| `permission denied while trying to connect to the Docker daemon` | A sessão ainda não carregou o grupo | `exit` e conecte de novo. Confira com `id` (deve listar `docker`) |
| `Unable to locate package docker-ce` | O repositório não foi adicionado | Revise o Passo 2: `cat /etc/apt/sources.list.d/docker.sources` e rode `sudo apt update` |
| `NO_PUBKEY` ou erro de assinatura | A chave não baixou ou está sem leitura | Repita o `curl` e o `chmod a+r` do Passo 2 |
| `Suites:` vazio no arquivo | O `$(...)` não rodou | Refaça o `tee`, copiando o bloco inteiro sem editar |
| `docker restart` falha após o `daemon.json` | JSON inválido (vírgula, aspas) | `sudo journalctl -u docker --no-pager \| tail`. Valide o JSON |
| `curl: (6) Could not resolve host` | Sem DNS | Veja a Aula 49 (`ping -c 2 1.1.1.1`) |

---

## ➡️ Próximo passo

Servidor pronto para receber containers. Falta o **endereço** para as pessoas chegarem nele: o domínio.

**[Aula 54 — Domínio, DNS e HTTPS](54-dominio-dns-https.md)**
