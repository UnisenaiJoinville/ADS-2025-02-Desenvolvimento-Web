# Atividade 04 — Criando um container interativo

## Objetivo

Rodar `docker run -it ubuntu bash`, instalar um pacote dentro e verificar o estado depois.

## Explicação

O comando original desta atividade (`docker run -it ubuntu bash`) abre uma
sessão de terminal interativa dentro de um container Ubuntu novo: `-i`
mantém o stdin aberto e `-t` aloca um pseudo-terminal, juntos simulam um
terminal normal. Como este script roda sem um humano digitando comandos ao
vivo, a evidência abaixo usa o equivalente não interativo — `docker run
ubuntu bash -c "apt-get update && apt-get install -y curl"` — que faz
exatamente a mesma coisa que abrir o bash interativamente e digitar os dois
comandos, mas de forma reprodutível em um script (ambos os comandos são
documentados no bloco de comandos abaixo). Depois de o processo terminar
(seja por `exit` no modo interativo, seja pelo fim do `bash -c` no modo
scriptado), o container passa para o estado `Exited`, mas continua existindo
até ser removido — e qualquer pacote instalado com `apt-get install` dentro
dele existe apenas na camada de escrita **daquele** container específico:
outro container criado com `docker run ubuntu` de novo começa do zero, sem o
`curl` instalado, porque parte da imagem original, não do container anterior.

## Como gerar a evidência

Com o Docker (Desktop ou Engine) aberto na sua máquina, rode, dentro desta pasta:

```
./run.sh
```

Isso executa os comandos reais desta atividade e grava a saída em
[`EVIDENCIA.md`](./EVIDENCIA.md).
