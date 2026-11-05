# Aula 56 — Publicando o sistema

⏱️ **Tempo estimado:** 60 minutos
📋 **Tipo:** prática (SSH + navegador) · **o grande momento**

---

## Objetivo

**Subir** o Estoque Fácil na VPS, verificar que está no ar **e protegido**, criar a **sua conta** e fechar o cadastro público.

---

## Antes de começar

- [ ] Aula 55 concluída (`~/estoque-facil` com os arquivos e o `.env`)
- [ ] Se usa domínio: o `nslookup` mostra o IP do servidor (Aula 54)
- [ ] Conectado ao servidor como `deploy`

🖥️ Os comandos rodam **no servidor**, dentro de `~/estoque-facil`, salvo quando marcados com 💻.

```bash
cd ~/estoque-facil
```

---

## Passo 1 — Um atalho para não digitar tanto

Em produção, **todo** comando do Compose precisa do `-f docker-compose.prod.yml`. Crie um apelido:

```bash
echo "alias dc='docker compose -f docker-compose.prod.yml'" >> ~/.bashrc
source ~/.bashrc
dc ps
```

A partir daqui, **`dc`** equivale a `docker compose -f docker-compose.prod.yml`. O `dc ps` ainda não mostra nada, e está certo.

> 📌 Se preferir os comandos completos, **use-os**. Nos exemplos escreveremos `dc` por brevidade.

---

## Passo 2 — Ligar

```bash
dc up -d --build
```

| Parte | Significado |
|---|---|
| `up` | Cria e inicia os serviços |
| `-d` | Em segundo plano (*detached*) |
| `--build` | Constrói a imagem da API a partir do `Dockerfile.prod` |

Na primeira vez demora **de 2 a 5 minutos**: baixa as imagens do MySQL e do Caddy, instala as dependências e inicializa o banco.

Acompanhe:

```bash
dc ps
```

Espere `db` e `api` ficarem **`(healthy)`** e o `caddy` em `Up`:

```text
NAME                    STATUS
estoque-prod-db-1       Up 1 minute (healthy)
estoque-prod-api-1      Up 40 seconds (healthy)
estoque-prod-caddy-1    Up 30 seconds
```

Se algum estiver `unhealthy` ou reiniciando, vá direto para a seção **"Se deu erro"**.

---

## Passo 3 — Ler os registros (*logs*)

```bash
dc logs --tail=30 api
```

Esperado:

```text
Conexao com o MySQL estabelecida
Servidor rodando em http://localhost:3000
```

Veja o Caddy obtendo o certificado (só se usa domínio):

```bash
dc logs caddy | grep -iE "certificate|obtain|error" | tail -n 10
```

Procure por `certificate obtained successfully`. Se aparecerem erros de `challenge`/`DNS`, volte à Aula 54.

| Comando | Para que serve |
|---|---|
| `dc logs api` | Tudo que a API imprimiu |
| `dc logs --tail=30 api` | Só as 30 últimas linhas |
| `dc logs -f api` | **Acompanha ao vivo** (`Ctrl` + `C` para sair) |

---

## Passo 4 — Abrir no navegador

💻 Abra:

| Se tem domínio | Se não tem |
|---|---|
| `https://estoque.seudominio.com.br/login.html` | `http://SEU_IP/login.html` |

Com domínio, o navegador deve mostrar o **cadeado**. Clique nele para ver o certificado (emitido pelo Let's Encrypt).

💻 Teste também o redirecionamento automático, no PowerShell:

```powershell
curl.exe -I http://estoque.seudominio.com.br
```

Deve responder `308 Permanent Redirect` com `Location: https://...`. O HTTP leva sozinho ao HTTPS.

E a API:

```powershell
curl.exe -i https://estoque.seudominio.com.br/api/health
```

Procure `{"status":"ok"...}` e confira os cabeçalhos de segurança (`Strict-Transport-Security`, `X-Frame-Options`...).

---

## Passo 5 — Provar que o banco e a API **não** estão expostos

Esta é a prova de que a Aula 47 funcionou.

💻 **No seu computador** (de **fora** do servidor):

```powershell
Test-NetConnection SEU_IP -Port 3306
Test-NetConnection SEU_IP -Port 3000
Test-NetConnection SEU_IP -Port 443
```

Olhe a linha **`TcpTestSucceeded`**:

| Porta | O que é | Esperado |
|---|---|---|
| 3306 | MySQL | `False` ✅ |
| 3000 | API direta | `False` ✅ |
| 443 | HTTPS (Caddy) | `True` ✅ |

> 🚨 Se a 3306 ou a 3000 responderem `True`, **algo está errado**: revise o `docker-compose.prod.yml` (`ports` indevido) e rode `dc up -d` de novo. Banco exposto na internet é um incidente de segurança.

🖥️ **Por dentro do servidor**, confira o que está escutando:

```bash
sudo ss -tlnp | grep -E ":80 |:443 |:3000 |:3306 "
```

Só **80** e **443** devem aparecer (`docker-proxy`). 3000 e 3306 **não**.

---

## Passo 6 — Criar a **sua** conta

O banco de produção nasceu **vazio**, sem o usuário `professor@estoquefacil.com`. Quem cria o primeiro usuário é você.

💻 No navegador, abra `/cadastro.html` e crie a sua conta com uma senha **forte e exclusiva** (use um gerenciador de senhas).

Entre em `/login.html` e confira o dashboard (zerado). Cadastre uma categoria e um produto para ver o sistema funcionando.

> ⚠️ Teste o login antigo: `professor@estoquefacil.com` / `123456`. **Deve falhar.** Esse usuário de demonstração não existe em produção.

---

## Passo 7 — Fechar o cadastro público

Agora que **a sua conta existe**, qualquer pessoa na internet ainda poderia abrir `/cadastro.html` e criar uma conta no **seu** sistema de estoque. Vamos fechar essa porta.

🖥️ **No servidor:**

```bash
nano deploy/caddy/Caddyfile
```

Localize estas duas linhas e **apague o `#`** do começo de cada uma:

```text
	# @cadastro path /api/auth/register /cadastro.html
	# respond @cadastro "Cadastro desativado" 403
```

Devem ficar:

```text
	@cadastro path /api/auth/register /cadastro.html
	respond @cadastro "Cadastro desativado" 403
```

> ⚠️ O Caddyfile usa **tabulação** para recuar. Apague **só** o `# ` e deixe o recuo como estava.

Salve e reinicie o Caddy:

```bash
dc restart caddy
```

Teste, no 💻 PowerShell:

```powershell
curl.exe -i -X POST https://estoque.seudominio.com.br/api/auth/register
curl.exe -i https://estoque.seudominio.com.br/cadastro.html
curl.exe -i https://estoque.seudominio.com.br/login.html
```

| Pedido | Esperado |
|---|---|
| `POST /api/auth/register` | `403` |
| `/cadastro.html` | `403` |
| `/login.html` | `200`: o login continua funcionando |

> 📌 **Por que bloquear no Caddy e não no código?** Porque não precisamos mexer na aplicação: a regra fica na camada de **infraestrutura**, e **reabrir** o cadastro (para criar um novo usuário) é só comentar de novo as duas linhas. Você tem agora um interruptor.
>
> Para criar novos usuários: comente as linhas, `dc restart caddy`, cadastre, **descomente** e reinicie de novo.

---

## Passo 8 — Testar que sobrevive a um reinício

O teste definitivo de um servidor de verdade:

```bash
sudo reboot
```

Aguarde ~1 minuto, reconecte com SSH e rode:

```bash
cd ~/estoque-facil && dc ps
```

Os três serviços devem ter voltado **sozinhos** (`restart: unless-stopped` + Docker habilitado na Aula 53). Abra o site: ele deve estar de pé.

---

## Entendendo o que fizemos

Você tem agora um sistema **no ar, com HTTPS, com banco isolado e sem usuários de demonstração**. Compare com o ambiente de aula:

```text
 AULA                                  PRODUÇÃO
 ----                                  --------
 http://localhost:3000                 https://estoque.seudominio.com.br
 MySQL aberto na porta 3308            MySQL invisível
 usuário professor / 123456            só a sua conta
 qualquer um pode se cadastrar         cadastro fechado
```

---

## ✅ Confira se deu certo

- [ ] `dc ps` mostra `db` e `api` **healthy** e o `caddy` **Up**
- [ ] O site abre com **cadeado** (ou em HTTP, se sem domínio)
- [ ] `Test-NetConnection` na **3306** e na **3000** deu `False`; na **443** deu `True`
- [ ] Criei a minha conta e consigo entrar
- [ ] O login `professor@estoquefacil.com` / `123456` **não** funciona
- [ ] Depois de fechar o cadastro: `POST /api/auth/register` e `/cadastro.html` respondem **403**
- [ ] Após `sudo reboot`, tudo voltou sozinho

---

## 🔧 Se deu erro

| Problema | Causa | Solução |
|---|---|---|
| `dc: command not found` | O `source ~/.bashrc` não rodou | Rode `source ~/.bashrc` ou saia e entre no SSH |
| `api` reiniciando | `.env` incompleto ou inválido | `dc logs api`. Mensagens do `env.js` dizem **exatamente** qual variável |
| `api` `unhealthy` | Banco não terminou de subir | Espere 1 minuto. Veja `dc logs db` |
| `Access denied for user 'estoque'` | A senha do `.env` **diverge** do que o MySQL gravou na **primeira** criação | Veja a Aula 59 ("Solução de problemas") |
| Navegador mostra **502 Bad Gateway** | O Caddy está de pé, mas a API não | `dc ps` e `dc logs api` |
| Navegador: **conexão recusada/expirou** | Firewall ou DNS | `sudo ufw status` (80/443?). Veja `nslookup` |
| Caddy: `challenge failed` / `no valid A records` | DNS não aponta para o servidor | Volte à Aula 54 e espere a propagação |
| Aviso de certificado inválido | Certificado ainda não emitido | Aguarde 1 minuto; veja `dc logs caddy` |
| `curl.exe` não encontrado | PowerShell antigo | Use `curl.exe` (com `.exe`) no Windows 10+ |
| O Caddyfile não funciona após editar | Apagou a tabulação | `dc logs caddy`. Se necessário, refaça com cuidado |

---

## ➡️ Próximo passo

No ar. Agora vem a parte que separa um sistema de aula de um sistema de verdade: **se tudo der errado, os dados voltam?**

**[Aula 57 — Backups do banco](57-backups-do-banco.md)**
