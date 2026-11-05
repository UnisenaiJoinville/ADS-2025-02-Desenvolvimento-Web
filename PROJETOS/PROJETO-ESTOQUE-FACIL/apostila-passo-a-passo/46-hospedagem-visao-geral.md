# Aula 46 — Hospedagem: visão geral e contratação da VPS

⏱️ **Tempo estimado:** 40 minutos
📋 **Tipo:** conceitos + prática (portal da hospedagem)

---

## Objetivo

Entender **o que muda** quando um sistema sai do seu computador e vai para a internet, conhecer a arquitetura que vamos montar e **contratar a VPS** que vai hospedar o Estoque Fácil.

---

## Antes de começar

- [ ] Sistema completo rodando localmente (aulas 00 a 45)
- [ ] Um meio de pagamento aceito pela hospedagem (cartão, PIX...)
- [ ] Um e-mail que você consulta de verdade (o provedor manda os dados de acesso por ele)

> 📌 **Convenção deste bloco.** Daqui até a Aula 59 você vai alternar entre dois lugares, e confundir um com o outro é o erro mais comum:
>
> | Marca | Onde o comando roda |
> |---|---|
> | 💻 **No seu computador** | PowerShell ou Git Bash do Windows |
> | 🖥️ **No servidor** | Terminal aberto via SSH, na VPS |
>
> Todo bloco de comando vem com uma dessas marcas. **Confira antes de apertar Enter.**

---

## O que é uma VPS?

**VPS** (*Virtual Private Server*, servidor virtual privado) é um computador **ligado 24 horas** em um datacenter, com **IP público** na internet, dividido em fatias por virtualização. Você aluga uma fatia e recebe um Linux limpo, com **acesso total**.

| | Seu computador | VPS |
|---|---|---|
| Fica ligado | Quando você quer | Sempre |
| Endereço | `localhost` (só você enxerga) | IP público (**o mundo inteiro** enxerga) |
| Quem cuida | Você, de vez em quando | **Você**, sempre |
| Quem tenta invadir | Ninguém | Robôs, **minutos** depois de ligar |

A última linha é a razão deste bloco existir. Na hospedagem compartilhada alguém cuida da segurança por você. Na VPS, **a segurança é sua responsabilidade**.

---

## Por que a segurança vem antes do deploy?

Todo endereço IPv4 da internet é varrido por programas automáticos o tempo todo. Eles não sabem quem você é: tentam `root` com senhas comuns (`123456`, `admin`, `password`) em **milhares** de servidores por hora.

> 💡 Você vai **ver isso acontecendo** no seu servidor, na Aula 48, olhando o registro de tentativas de acesso.

Não existe uma proteção mágica. Existem **camadas**, e cada uma cobre a falha da outra:

| Camada | O que faz | Aula |
|---|---|---|
| Acesso por **chave SSH** | Senha adivinhada não abre a porta | 48, 50, 51 |
| **Sem login de root** | O alvo mais óbvio some | 50, 51 |
| **Firewall** | Só as portas necessárias existem para o mundo | 52 |
| **Fail2ban** | Quem erra demais é bloqueado | 52 |
| **Atualizações automáticas** | Brechas conhecidas são corrigidas sozinhas | 52 |
| Containers **sem privilégios** | Se a API for invadida, o estrago é pequeno | 47 |
| Banco **sem porta pública** | O MySQL nem aparece para a internet | 47 |
| **HTTPS** | Senhas e tokens viajam criptografados | 54 |
| **Segredos** fortes, fora do código | Ninguém "adivinha" o `JWT_SECRET` | 55 |
| **Backups** testados | Se tudo falhar, os dados voltam | 57 |

---

## A arquitetura que vamos montar

```text
                         INTERNET
                            |
                  portas 80 e 443 (única entrada)
                            |
   +------------------------v-------------------------+
   |  VPS (Ubuntu)         Firewall UFW               |
   |                            |                     |
   |   +------------------------v-----------------+   |
   |   |  Docker  (rede interna, invisível)       |   |
   |   |                                          |   |
   |   |   [ Caddy ] --> [ API Node ] --> [ MySQL ] |   |
   |   |   HTTPS         porta 3000       porta 3306 |   |
   |   |   (exposto)     (interna)        (interna)  |   |
   |   +------------------------------------------+   |
   +--------------------------------------------------+

   Você administra tudo por SSH (porta 22, só com chave)
```

Repare no que **não** está exposto: a API (3000) e o MySQL (3306). No seu computador, o `docker-compose.yml` de aula publica as duas portas, porque é cômodo. Na VPS isso seria um erro grave.

O **Caddy** é um *proxy reverso*: é o "porteiro". Recebe os visitantes, cuida do HTTPS e entrega o pedido para a API por dentro da rede do Docker.

---

## Passo 1 — Escolher o plano

Abra https://www.borkcloud.com.br/ e veja os planos de **VPS**.

> ⚠️ **Preço e planos mudam.** No dia em que esta apostila foi escrita, o site anunciava VPS **a partir de R$ 35,99/mês**, com disco NVMe, rede com proteção anti-DDoS e ativação em poucos minutos. **Confira os valores atuais no site** antes de decidir.

O que escolher para o Estoque Fácil:

| Item | Recomendado | Por quê |
|---|---|---|
| **Sistema operacional** | **Ubuntu 24.04 LTS** (ou 22.04 LTS) | É o que esta apostila usa. **LTS** = suporte de longo prazo, com correções de segurança por anos |
| **Memória (RAM)** | **2 GB** ou mais | MySQL 8 + Node + Caddy. Com 1 GB só funciona com *swap* (Aula 49) e fica apertado |
| **Disco** | 20 GB ou mais | Imagens Docker, banco e backups |
| **CPU** | 1 vCPU basta | Para aula e uso pequeno |
| **Localização** | Brasil | Menor latência para quem vai usar |

> 💡 Se o seu plano tiver **menos** de 2 GB, não desista: a Aula 49 mostra como criar o *swap*. Só não espere desempenho.

---

## Passo 2 — Contratar e anotar os dados de acesso

1. Faça o cadastro e contrate o plano escolhido, selecionando **Ubuntu 24.04 LTS** como sistema.
2. Aguarde a ativação (o site fala em poucos minutos).
3. Entre no **portal do cliente** e localize os dados do servidor.

Você precisa anotar **quatro coisas**:

| Dado | Exemplo | Para que serve |
|---|---|---|
| **Endereço IP** | `203.0.113.10` | O "endereço" do seu servidor. Vamos chamá-lo de `SEU_IP` |
| **Usuário** | `root` | O administrador de fábrica |
| **Senha** | (do portal ou do e-mail) | Só para o **primeiro** acesso |
| **Console de emergência** | botão no portal | Acesso de "tela e teclado" se você se trancar para fora |

> 📌 O formato exato dos dados (senha por e-mail, senha no portal, chave SSH) **depende do provedor**. Se o seu portal entregar uma **chave SSH** em vez de senha, tudo continua valendo: na Aula 48 você apenas usa essa chave no primeiro acesso.

> ⚠️ **Procure agora o console de emergência no portal** (algo como "Console", "VNC" ou "Acesso remoto"). Ele salva o dia na Aula 51, se você errar uma configuração de SSH. Descobrir onde fica **antes** de precisar evita pânico.

### Cuidado com os dados

| Faça | Não faça |
|---|---|
| Guardar a senha em um **gerenciador de senhas** | Mandar a senha do servidor em grupo de WhatsApp |
| Trocar a senha de root no primeiro acesso | Deixar a senha do e-mail do provedor como está |
| Ativar verificação em dois passos no portal, se existir | Usar a mesma senha do portal em outros sites |

---

## Passo 3 — Decidir sobre o domínio

Para ter **HTTPS** (o cadeado no navegador) você precisa de um **nome de domínio** apontando para o IP, algo como `estoque.seudominio.com.br`.

| Opção | Custo | Observação |
|---|---|---|
| Domínio próprio (ex.: `.com.br` no Registro.br) | Pago, anual | Recomendado. Confira o preço no site do registro |
| Subdomínio gratuito (serviços como o DuckDNS) | Grátis | Serve bem para estudar |
| **Nenhum** (só o IP) | Zero | Funciona, mas **sem HTTPS**. Senhas e tokens trafegam abertos |

> ⚠️ Sem HTTPS, qualquer pessoa na mesma rede Wi-Fi que você pode **ler o login e a senha**. Para aula tudo bem. Para dados reais, **não**.

A Aula 54 explica o domínio em detalhes. Por ora, só decida qual caminho vai seguir.

---

## Entendendo o que fizemos

Não digitamos nenhum código nesta aula, mas tomamos as decisões que moldam as próximas:

- **Ubuntu LTS**: todos os comandos do bloco assumem esse sistema.
- **Linux sem interface gráfica**: tudo será por texto, via SSH. É assim que servidores reais são administrados.
- **Defesa em camadas**: nenhuma proteção sozinha basta; juntas, tornam o servidor um alvo caro demais para robôs que procuram gente descuidada.

---

## ✅ Confira se deu certo

- [ ] Tenho a VPS contratada com Ubuntu
- [ ] Anotei o **IP**, o **usuário** e a **senha** (em local seguro)
- [ ] Sei onde fica o **console de emergência** no portal
- [ ] Decidi como vou fazer o domínio (próprio, gratuito ou nenhum por enquanto)
- [ ] Entendi a diferença entre 💻 e 🖥️

---

## 🔧 Se deu erro

| Problema | Causa provável | Solução |
|---|---|---|
| Os dados de acesso não chegaram | E-mail em spam ou servidor ainda ativando | Confira o spam, espere alguns minutos e olhe o portal do cliente |
| Contratei sem escolher o sistema | O servidor veio com outra distribuição | No portal, procure "reinstalar" / "trocar sistema" e escolha Ubuntu LTS (apaga o servidor, mas ele ainda está vazio) |
| Não achei o console de emergência | Cada provedor chama de um jeito | Procure no portal ou pergunte ao suporte **agora** |

---

## ➡️ Próximo passo

Antes de mexer no servidor, vamos preparar **os arquivos de produção** aqui no seu computador.

**[Aula 47 — Preparando os arquivos para produção](47-preparando-arquivos-producao.md)**
