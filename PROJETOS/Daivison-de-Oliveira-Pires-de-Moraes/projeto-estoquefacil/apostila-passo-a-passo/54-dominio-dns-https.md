# Aula 54 — Domínio, DNS e HTTPS

⏱️ **Tempo estimado:** 35 minutos
📋 **Tipo:** conceitos + prática (painel de DNS)

---

## Objetivo

Apontar um **nome** (`estoque.seudominio.com.br`) para o IP do servidor e entender como o **HTTPS** vai funcionar, para que as senhas e os tokens do sistema **não trafeguem abertos**.

---

## Antes de começar

- [ ] Aula 53 concluída
- [ ] Um domínio ou subdomínio (decidido na Aula 46), **ou** a decisão consciente de usar só o IP

---

## Por que HTTPS não é opcional

O Estoque Fácil tem **login**. A senha digitada na tela de login viaja do navegador até o servidor, e o **token JWT** viaja em **toda requisição** depois disso.

| | HTTP (sem cadeado) | HTTPS (com cadeado) |
|---|---|---|
| O que um curioso na rede vê | E-mail, senha e token em **texto limpo** | Texto embaralhado |
| Pode alterar a página no caminho | Sim | Não |
| Sabe que é o servidor certo | Não | Sim (certificado) |

> 🔗 Reveja a **Aula 23**: o hash protege a senha **guardada** no banco. O HTTPS protege a senha **em trânsito**. São duas proteções diferentes, e o sistema precisa das duas.

Quem roubar o token JWT de alguém **é** essa pessoa no sistema até o token expirar. Em HTTP, isso é só questão de estar na mesma rede Wi-Fi.

---

## Como funciona: DNS

O computador só entende **números** (IP). Gente prefere **nomes**. O **DNS** é a "lista telefônica" da internet: traduz um nome em um IP.

```text
  navegador:  "onde fica estoque.seudominio.com.br?"
        |
        v
      DNS:    "no IP 203.0.113.10"
        |
        v
  navegador conecta em 203.0.113.10
```

Para o nosso nome valer, você cadastra um **registro** dizendo "este nome aponta para este IP". O tipo de registro que faz isso é o **`A`** (IPv4).

---

## Como funciona: o certificado

O **certificado** é um "documento de identidade" do site, emitido por uma autoridade confiável. O **Let's Encrypt** emite certificados **de graça**, e o **Caddy** pede e **renova** o certificado sozinho.

Para emitir, o Let's Encrypt faz uma verificação: "**você controla este nome?**". Ele tenta acessar o seu servidor **pela porta 80**, usando o nome. Por isso precisamos de duas coisas **antes** de subir o sistema:

| Requisito | Onde já resolvemos |
|---|---|
| O nome **aponta** para o IP do servidor | **Esta aula** |
| As portas **80 e 443** estão liberadas | Aula 52 (UFW) |

---

## Passo 1 — Criar o registro `A`

O lugar varia conforme onde o seu domínio está. Procure no painel a área de **DNS**, **Zona DNS** ou **Gerenciar registros**.

| Caso | Onde fica |
|---|---|
| Domínio `.com.br` no Registro.br | Painel do domínio → **DNS** → editar zona |
| Domínio em outra empresa | Painel dela → DNS |
| Subdomínio gratuito (ex.: DuckDNS) | Você escolhe o nome no site e informa o IP |
| Domínio na própria hospedagem | Portal do cliente → DNS |

Crie **um registro** com:

| Campo | Valor |
|---|---|
| **Tipo** | `A` |
| **Nome / Host** | `estoque` (vira `estoque.seudominio.com.br`) |
| **Valor / Aponta para** | `SEU_IP` |
| **TTL** | `300` (5 minutos), ou o menor disponível |

> 💡 **TTL** (*time to live*) é por quanto tempo os provedores de internet guardam a resposta antes de perguntar de novo. Um TTL baixo faz as correções "pegarem" rápido enquanto você ainda está acertando as coisas. Depois que tudo estiver estável, pode subir.

> ⚠️ **Não crie registro `AAAA` (IPv6)** a menos que o servidor tenha IPv6 configurado e você saiba o endereço. Um `AAAA` errado faz o Let's Encrypt tentar por IPv6 e **falhar**.

---

## Passo 2 — Esperar e conferir

Propagar leva de **alguns minutos** a algumas horas. 💻 **No seu computador:**

```powershell
nslookup estoque.seudominio.com.br
```

Procure, na parte final da resposta:

```text
Nome:     estoque.seudominio.com.br
Address:  203.0.113.10        <- precisa ser o SEU_IP
```

| Resultado | Significado |
|---|---|
| `Address` = seu IP | ✅ Pronto |
| `Non-existent domain` | Ainda propagando, ou o nome está errado. Espere e repita |
| Outro IP | Registro apontando para o lugar errado. Corrija no painel |

Também funciona de outro jeito, perguntando direto a um DNS público (mostra a verdade sem cache local):

```powershell
nslookup estoque.seudominio.com.br 1.1.1.1
```

> 🚨 **Só avance quando o `nslookup` mostrar o IP certo.** Se você subir o Caddy antes, ele tenta emitir o certificado, **falha**, tenta de novo... e o Let's Encrypt tem **limite de tentativas falhas** por hora para cada nome. Estourar o limite te deixa esperando, mesmo depois de arrumar o DNS.

---

## Passo 3 — Anotar o endereço

O valor que vai no `.env` do servidor (Aula 55), na variável `SITE_ADDRESS`, é **só o nome**:

```text
SITE_ADDRESS=estoque.seudominio.com.br
```

Sem `https://` e sem barra no final.

---

## E se eu **não** tiver um domínio?

Você pode usar `SITE_ADDRESS=:80`. O Caddy atende em **HTTP puro**, e o sistema abre em `http://SEU_IP`.

| ✅ Serve para | ❌ Não serve para |
|---|---|
| Estudar, ver o sistema no ar, praticar o deploy | Dados reais, senhas que você usa em outros lugares |

> ⚠️ **Em HTTP, não use uma senha que você usa em outro serviço.** Qualquer pessoa no caminho entre você e o servidor pode lê-la. Crie uma senha **só para este sistema de teste**. Quando tiver um domínio, é só mudar o `SITE_ADDRESS` e reiniciar o Caddy: o resto continua igual.

---

## Entendendo o que fizemos

Nada mudou no servidor ainda: preparamos o **terreno**. O Caddy fará o resto sozinho:

```text
1. Você digita https://estoque.seudominio.com.br
2. DNS responde: 203.0.113.10
3. O Caddy, no primeiro acesso, prova ao Let's Encrypt que controla o nome
4. Recebe o certificado, guarda no volume caddy-data
5. Renova sozinho antes de vencer (você nunca mais pensa nisso)
6. Redireciona http:// para https:// automaticamente
```

---

## ✅ Confira se deu certo

- [ ] Criei o registro `A` apontando para o IP do servidor
- [ ] `nslookup estoque.seudominio.com.br` mostra o **meu** IP
- [ ] **Não** criei registro `AAAA` errado
- [ ] Anotei o nome exato para o `SITE_ADDRESS`
- [ ] (se sem domínio) Entendi o risco do HTTP e vou usar uma senha exclusiva

---

## 🔧 Se deu erro

| Problema | Causa | Solução |
|---|---|---|
| `nslookup` não acha o nome | Propagação ou nome digitado errado | Espere 10 minutos e confira cada letra no painel |
| Mostra um IP antigo | Cache | Rode `ipconfig /flushdns` e teste com `nslookup NOME 1.1.1.1` |
| O painel não aceita o registro `A` no nome raiz | Algumas empresas impedem em certos casos | Use um **subdomínio** (`estoque.`) em vez do domínio puro |
| Registrei o domínio hoje e não resolve | A ativação inicial pode demorar | Aguarde; confira no painel se o domínio está "ativo" |
| O domínio está no Registro.br e usa DNS de outra empresa | Os registros ficam no painel **dessa** empresa | Edite o DNS onde os servidores de nomes (*nameservers*) apontam |

---

## ➡️ Próximo passo

Servidor protegido, Docker instalado, nome apontado. Vamos **enviar o projeto** e criar os segredos de produção.

**[Aula 55 — Enviando o projeto e criando os segredos](55-enviando-projeto-segredos.md)**
