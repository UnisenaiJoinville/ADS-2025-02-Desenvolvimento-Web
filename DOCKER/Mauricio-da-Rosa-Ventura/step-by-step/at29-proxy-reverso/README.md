# Atividade 29 — Configurando um proxy reverso

## Objetivo

Criar um container Nginx como proxy reverso para outro serviço e testar o acesso.

## Arquivos desta atividade

- `app-content/index.html`
- `proxy.conf`

## Explicação

Um proxy reverso é o ponto único de entrada de uma aplicação: o cliente
sempre fala com o proxy (aqui, na porta 8081 do host), e é o proxy quem
decide para qual container de verdade (o "backend", aqui um segundo Nginx
servindo uma página HTML própria) encaminhar cada requisição — o mesmo papel
que o serviço `nginx`/`proxy` cumpre no Cenário 2 do material de Docker
Compose, roteando `/` para o frontend e `/api/` para a API. A configuração
abaixo (`proxy.conf`) usa `proxy_pass http://backend:80;`, resolvendo
`backend` pelo nome do container graças à rede definida pelo usuário
(a mesma técnica das atividades 13/14) — o proxy nunca precisa saber o IP do
backend, só o nome dele.

## Como gerar a evidência

Com o Docker (Desktop ou Engine) aberto na sua máquina, rode, dentro desta pasta:

```
./run.sh
```

Isso executa os comandos reais desta atividade e grava a saída em
[`EVIDENCIA.md`](./EVIDENCIA.md).
