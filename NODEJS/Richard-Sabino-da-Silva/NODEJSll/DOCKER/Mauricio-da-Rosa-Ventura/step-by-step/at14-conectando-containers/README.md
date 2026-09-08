# Atividade 14 — Conectando containers à rede

## Objetivo

Subir dois containers na mesma rede e verificar a comunicação entre eles.

## Explicação

Com dois containers Nginx na mesma rede definida pelo usuário (`minha-rede`,
criada na atividade 13), um consegue alcançar o outro simplesmente usando o
nome (`--name`) como se fosse um hostname — é a resolução de DNS interna do
Docker mencionada na atividade anterior. Isso é validado abaixo rodando, de
dentro do `container1`, um `curl` para `http://container2`: se a rede e a
resolução de nomes estiverem funcionando, a resposta é a página padrão do
Nginx, mesmo sem nenhum IP fixo configurado manualmente.

## Como gerar a evidência

Com o Docker (Desktop ou Engine) aberto na sua máquina, rode, dentro desta pasta:

```
./run.sh
```

Isso executa os comandos reais desta atividade e grava a saída em
[`EVIDENCIA.md`](./EVIDENCIA.md).
