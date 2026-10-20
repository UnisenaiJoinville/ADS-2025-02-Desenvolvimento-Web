# Aula 59 — Teste final, checklist de segurança e exercícios

⏱️ **Tempo estimado:** 60 minutos
📋 **Tipo:** teste + revisão + atividade

---

## Objetivo

Verificar o servidor **de ponta a ponta**, revisar a lista de segurança, consultar o **dicionário de problemas** do bloco e praticar o diagnóstico com configurações propositalmente ruins.

---

## Antes de começar

- [ ] Aulas 46 a 58 concluídas
- [ ] Sistema no ar na VPS

---

## Parte 1 — O teste final

Percorra cada linha. A coluna **Como verificar** diz **de onde** rodar (💻 ou 🖥️) e o **Esperado** diz o que precisa aparecer.

### Acesso ao servidor

| # | Verificação | Como verificar | Esperado |
|---|---|---|---|
| 1 | Entro com chave | 💻 `ssh deploy@SEU_IP` | Entra (pede só a passphrase) |
| 2 | Root não entra | 💻 `ssh root@SEU_IP` | `Permission denied (publickey)` |
| 3 | Senha não vale | 💻 `ssh -o PubkeyAuthentication=no deploy@SEU_IP` | `Permission denied (publickey)` |
| 4 | Configuração efetiva do SSH | 🖥️ `sudo sshd -T \| grep -E "^(permitrootlogin\|passwordauthentication\|allowusers) "` | `no`, `no`, `deploy` |
| 5 | `sudo` pede senha | 🖥️ `sudo whoami` | Pede a senha e responde `root` |

### Rede e firewall

| # | Verificação | Como verificar | Esperado |
|---|---|---|---|
| 6 | Firewall ativo | 🖥️ `sudo ufw status verbose` | `active`; só 22 (LIMIT), 80, 443 |
| 7 | Fail2ban de pé | 🖥️ `sudo fail2ban-client status sshd` | Responde, com `Currently banned` |
| 8 | Portas que escutam | 🖥️ `sudo ss -tlnp \| grep -E ":80 \|:443 \|:3000 \|:3306 "` | **Só** 80 e 443 |
| 9 | **MySQL fechado** | 💻 `Test-NetConnection SEU_IP -Port 3306` | `TcpTestSucceeded : False` |
| 10 | **API direta fechada** | 💻 `Test-NetConnection SEU_IP -Port 3000` | `TcpTestSucceeded : False` |
| 11 | HTTPS aberto | 💻 `Test-NetConnection SEU_IP -Port 443` | `TcpTestSucceeded : True` |

### Containers

| # | Verificação | Como verificar | Esperado |
|---|---|---|---|
| 12 | Serviços saudáveis | 🖥️ `dc ps` | `db` e `api` **healthy**, `caddy` **Up** |
| 13 | API sem root | 🖥️ `dc exec api id` | `uid=1000(node)` |
| 14 | API só leitura | 🖥️ `dc exec api touch /app/x` | `Read-only file system` |
| 15 | Reinicia sozinho | 🖥️ `sudo reboot`, aguardar, `dc ps` | Tudo de volta |

### Aplicação e HTTPS

| # | Verificação | Como verificar | Esperado |
|---|---|---|---|
| 16 | Cadeado | 💻 Navegador em `https://SEU_DOMINIO` | Cadeado, sem avisos |
| 17 | Redireciona para HTTPS | 💻 `curl.exe -I http://SEU_DOMINIO` | `308` e `Location: https://...` |
| 18 | Cabeçalhos de segurança | 💻 `curl.exe -I https://SEU_DOMINIO/api/health` | `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`. **Sem** `X-Powered-By` |
| 19 | API exige login | 💻 `curl.exe -i https://SEU_DOMINIO/api/products` | `401` |
| 20 | Cadastro fechado | 💻 `curl.exe -i -X POST https://SEU_DOMINIO/api/auth/register` | `403` |
| 21 | Usuário de demonstração não existe | Tentar `professor@estoquefacil.com` / `123456` | Recusado |
| 22 | Minha conta funciona | Login pelo navegador, cadastrar um produto e uma movimentação | Funciona |

### Dados e manutenção

| # | Verificação | Como verificar | Esperado |
|---|---|---|---|
| 23 | `.env` trancado | 🖥️ `ls -l ~/estoque-facil/.env` | `-rw-------` |
| 24 | Backup existe | 🖥️ `ls -lh ~/backups` | Arquivos `.sql.gz` recentes |
| 25 | Cron agendado | 🖥️ `crontab -l` | A linha `15 3 * * *` |
| 26 | **Restauração testada** | Aula 57, Passo 3 | Dados voltaram em `restore_test` |
| 27 | Cópia fora do servidor | 💻 `dir $env:USERPROFILE\backups-estoque` | Pelo menos 1 backup |
| 28 | Atualizações automáticas | 🖥️ `cat /etc/apt/apt.conf.d/20auto-upgrades` | As duas linhas com `"1"` |
| 29 | Espaço em disco | 🖥️ `df -h /` | `Use%` abaixo de 80% |
| 30 | Logs com limite | 🖥️ `docker info --format '{{.LoggingDriver}}'` | `json-file` |

> 📌 Se algum item falhou, o problema está **na aula indicada pelo assunto**: SSH → 50 e 51; firewall e Fail2ban → 52; Docker → 53; HTTPS → 54; segredos → 55; publicação → 56; backup → 57.

---

## Parte 2 — O checklist de segurança (para guardar)

Imprima e use sempre que for subir **qualquer** servidor.

### Acesso

- [ ] Login de root por SSH **desligado**
- [ ] Login por senha por SSH **desligado**; só chave, **com passphrase**
- [ ] Usuário comum com `sudo`; `AllowUsers` restringindo quem entra
- [ ] Verifiquei a configuração **efetiva** (`sshd -T`), e não só o arquivo

### Rede

- [ ] Firewall **negando tudo** por padrão; só 22, 80 e 443 liberadas
- [ ] Fail2ban (ou equivalente) ativo
- [ ] Banco de dados e API **sem `ports`** no Compose
- [ ] Testei **de fora** (`Test-NetConnection`) que as portas internas estão fechadas

### Aplicação

- [ ] **HTTPS** com certificado válido e redirecionamento automático
- [ ] Segredos **gerados aleatoriamente**, no servidor, com permissão `600`
- [ ] Nenhum usuário nem senha de demonstração em produção
- [ ] Cadastro público **fechado** quando não é necessário
- [ ] Containers sem root, com sistema de arquivos só leitura
- [ ] Cabeçalhos HTTP não anunciam a tecnologia (`X-Powered-By`, `Server`)

### Dados

- [ ] Backups **automáticos**, com rotação
- [ ] Restauração **testada** pelo menos uma vez
- [ ] Uma cópia **fora do servidor** (regra 3-2-1)
- [ ] Logs com limite de tamanho; disco monitorado

### Manutenção

- [ ] Atualizações de segurança automáticas
- [ ] Sei fazer **deploy** e **rollback**
- [ ] Sei onde está o **console de emergência** do provedor
- [ ] Anotei o que **não** posso fazer em produção: `down -v`, `prune --volumes`, `chmod 777`

---

## Parte 3 — Dicionário de problemas do bloco

### Não consigo entrar por SSH

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| `Connection timed out` | IP errado, firewall do provedor ou do UFW | Confira o IP; use o **console de emergência** e veja `sudo ufw status` |
| `Connection refused` | `sshd` parado | Console: `sudo systemctl status ssh` |
| `Permission denied (publickey)` | Chave não está no `authorized_keys`, permissões erradas, ou `AllowUsers` errado | Console: confira `/home/deploy/.ssh/authorized_keys` (700/600) e `sudo sshd -T \| grep allowusers` |
| Funcionava e agora dá timeout | **Fail2ban bloqueou o seu IP** | Console: `sudo fail2ban-client set sshd unbanip SEU_IP` |
| `REMOTE HOST IDENTIFICATION HAS CHANGED` | Servidor reinstalado | Se foi você: `ssh-keygen -R SEU_IP` |

### O site não abre

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| Não conecta | UFW sem 80/443, ou Caddy parado | `sudo ufw status`; `dc ps` |
| `502 Bad Gateway` | A API não está respondendo | `dc ps`, `dc logs api` |
| Aviso de certificado | Não emitiu ainda, ou DNS errado | `dc logs caddy`; `nslookup SEU_DOMINIO 1.1.1.1` |
| Certificado não emite | DNS não aponta para o servidor, ou a porta 80 está fechada | Aula 54; `sudo ufw status` |
| Abre em HTTP mas não em HTTPS | Está usando `SITE_ADDRESS=:80` | Coloque o domínio no `.env` e `dc up -d --force-recreate caddy` |
| Página antiga | Cache do navegador | `Ctrl` + `F5` |

### A API não sobe

| Sintoma no `dc logs api` | Causa | O que fazer |
|---|---|---|
| `Variavel de ambiente obrigatoria ausente: X` | Falta `X` no `.env` | Confira o `.env` (e que o arquivo está na pasta certa) |
| `JWT_SECRET deve ter pelo menos 32 caracteres` | Segredo curto ou o texto-modelo | Gere de novo: `openssl rand -hex 32` |
| `Access denied for user 'estoque'` | A senha do `.env` **não é** a que o MySQL gravou na primeira criação | Veja abaixo |
| `Nao foi possivel conectar ao MySQL` | Banco ainda subindo, ou nome do host errado | Espere; confira `DB_HOST=db` |

**Quando a senha do banco diverge.** As variáveis `MYSQL_*` só valem na **primeira vez** que o volume é criado. Se você mudou `DB_PASSWORD` depois, ou criou o `.env` de novo **sem** apagar o volume, as senhas não batem. Existem **duas** saídas:

| Situação | Solução |
|---|---|
| **Há dados** que você quer manter | `ALTER USER` dentro do MySQL, com o valor do `.env` (Aula 58, "A pegadinha da senha do banco") |
| O banco é **novo e vazio**, sem nada a perder | `dc down`, depois `docker volume rm estoque-prod_db-data`, depois `dc up -d`. ⚠️ **Apaga todos os dados do banco.** Só faça se tiver **certeza** de que está vazio |

### Disco, memória e desempenho

| Sintoma | Causa | O que fazer |
|---|---|---|
| `no space left on device` | Disco cheio | `df -h /`, `docker system df`, `docker image prune -f`, apagar pacotes e backups antigos |
| Container `Exited (137)`, banco reinicia | Falta de **memória** (o sistema matou o processo) | `free -h`; `sudo dmesg \| grep -i "killed process"`. Crie swap (Aula 49) ou contrate mais RAM |
| Tudo lento | Swap em uso constante | `free -h`, `docker stats --no-stream` |

### Arquivos e envio

| Sintoma | Causa | O que fazer |
|---|---|---|
| `bad interpreter: /bin/bash^M` | Script salvo com **CRLF** | `sed -i 's/\r$//' arquivo` e, no VS Code, trocar `CRLF` por `LF` |
| `.env` ignorado / valores estranhos | CRLF ou espaços no `.env` | `grep -c $'\r' .env` deve ser `0` |
| `scp` criou arquivo local | Faltou o `:` | `deploy@SEU_IP:~/` |
| `Permission denied` ao ler um arquivo | Dono errado | `ls -l` e `sudo chown deploy:deploy arquivo` |

---

## Parte 4 — Atividade: diagnóstico de configuração

No estilo das atividades de diagnóstico de código: **encontrar os problemas** em arquivos de configuração propositalmente ruins.

| Arquivo | Conteúdo | Problemas escondidos |
|---|---|---|
| [`atividade-59-1-diagnostico-configuracao.md`](../apostilas/atividade-59-1-diagnostico-configuracao.md) | Um `docker-compose.yml`, um `sshd_config` e um histórico de comandos de um servidor "montado às pressas" | **20** |
| [`atividade-59-1-resolucao.md`](../apostilas/atividade-59-1-resolucao.md) | O gabarito: cada problema, o risco e a correção | — |

**Como fazer:**

1. Leia o arquivo de diagnóstico **sem olhar** o gabarito.
2. Para cada problema, anote: **o que está errado**, **o que um invasor poderia fazer** e **como corrigir**.
3. Compare com a resolução. Quem achou **15 ou mais** pode considerar o bloco dominado.

---

## Parte 5 — Exercícios

### 🟢 Nível 1 — Fixação

1. Explique, com as suas palavras, por que `ufw deny 3306` **não** protege um MySQL publicado com `ports: "3306:3306"`.
2. Qual a diferença entre `expose` e `ports` no Compose? Dê um exemplo de quando usar cada um.
3. Por que o `.env` é criado **no servidor** e não enviado no pacote?
4. O que significa a regra **3-2-1** de backup? Onde cada cópia está no nosso projeto?

### 🟡 Nível 2 — Prática

5. **Segundo usuário de SSH.** Crie `deploy2` com outra chave, adicione-o ao `AllowUsers` e teste que ele entra e que um terceiro usuário **não** entra.
6. **Reabrir e fechar o cadastro.** Comente as linhas do `Caddyfile`, crie uma segunda conta pelo site, e **feche** de novo. Teste com `curl.exe` os dois estados.
7. **Simule um desastre.** Em um **banco de teste** (não o de produção), apague uma tabela e **restaure** a partir do backup. Meça o tempo que levou.
8. **Alarme de disco.** Escreva um script que avise (grave em um arquivo de log) quando o `Use%` do disco passar de 80%, e agende no `cron`.

### 🔴 Nível 3 — Desafios

9. **Limitar tentativas de login na API.** Hoje o Fail2ban protege o SSH, mas **ninguém limita as tentativas em `/api/auth/login`**: um robô pode tentar milhares de senhas. Use o pacote `express-rate-limit`.
   > 💡 **Pista importante:** atrás do Caddy, todas as requisições chegam à API com o **IP do Caddy**. Sem `app.set("trust proxy", 1)`, o limitador enxerga **um único "usuário"** e bloqueia todo mundo junto, ou ninguém.
10. **Cabeçalhos com o `helmet`.** Adicione o `helmet` à API e compare os cabeçalhos antes e depois. Atenção: ele traz uma *Content-Security-Policy* que **bloqueia** os scripts de CDN (Tailwind e Vue) que as telas usam. Descubra o que quebra e como ajustar.
11. **Backup fora do servidor, automático.** Faça o seu **PC** (ou outra máquina) baixar o backup todo dia com `scp` agendado (Agendador de Tarefas do Windows). Alternativa: estude o `rclone` para enviar a um armazenamento externo.
12. **Monitoramento.** Configure um serviço externo de verificação de disponibilidade para `https://SEU_DOMINIO/api/health` com alerta por e-mail. Derrube o `api` de propósito (`dc stop api`) e meça em quanto tempo você é avisado.
13. **Deploy por Git.** Substitua o `tar` + `scp` por um repositório privado no GitHub, com **chave de deploy** só de leitura no servidor, e um `git pull` + `dc up -d --build`.

---

## 🎓 Conclusão do bloco

Você começou com um sistema que só rodava em `localhost` e terminou com um **serviço real na internet**: servidor protegido por **chaves, firewall e bloqueio automático**, **HTTPS**, banco **invisível**, **segredos** de verdade, **backups testados** e um fluxo de **atualização e rollback**.

Mais importante que os comandos é a forma de pensar:

| Princípio | Onde apareceu |
|---|---|
| **Defesa em camadas** | Chave + firewall + Fail2ban + containers sem root + HTTPS |
| **Menor privilégio** | Usuário `deploy`, container `node`, sistema de arquivos só leitura |
| **Negar por padrão** | UFW `deny incoming`, `AllowUsers`, *allowlist* no `tar` |
| **Reduzir a superfície** | Banco e API sem `ports`, cadastro fechado |
| **Falhar cedo** | `env.js` recusa segredo fraco; `set -euo pipefail`; `sshd -t` antes de aplicar |
| **Testar o que importa** | Restauração do backup, `Test-NetConnection` de fora, 3 testes do SSH |

---

## ➡️ Fim do roteiro

Voltar ao índice: **[README das mini-aulas](README.md)**
