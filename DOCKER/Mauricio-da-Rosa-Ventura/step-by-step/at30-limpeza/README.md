# Atividade 30 — Limpeza de recursos

## Objetivo

Remover containers parados e imagens não utilizadas.

## Explicação

Depois de 29 atividades criando containers, imagens, volumes e redes, é
normal acumular recursos que não são mais usados — cada um ocupando espaço em
disco. `docker container prune` remove **todos** os containers parados de
uma vez (equivalente a rodar `docker rm` em cada um); `docker image prune`
remove imagens que não têm nenhuma tag e não são usadas por nenhum container
(as imagens `<none>` órfãs, como a que sobrou na atividade 17). Nenhum dos
dois comandos mexe em containers **em execução** nem em imagens **em uso**,
então é seguro rodá-los periodicamente como faxina. `docker system df` mostra
o espaço em disco ocupado por cada categoria (imagens, containers, volumes,
build cache) antes e depois, tornando visível o que a limpeza recuperou.

## Como gerar a evidência

Com o Docker (Desktop ou Engine) aberto na sua máquina, rode, dentro desta pasta:

```
./run.sh
```

Isso executa os comandos reais desta atividade e grava a saída em
[`EVIDENCIA.md`](./EVIDENCIA.md).
