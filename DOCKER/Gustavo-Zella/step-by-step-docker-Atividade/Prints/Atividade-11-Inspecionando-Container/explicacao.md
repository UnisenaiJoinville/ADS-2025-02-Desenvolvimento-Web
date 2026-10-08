# Atividade 11 — Inspecionando um container

## Observação importante
A atividade pede para inspecionar um **container** com `docker inspect <container_id>`. No print disponível, o comando executado foi na verdade:

```
docker inspect meu-volume
```

ou seja, o **volume** criado na Atividade 10 foi inspecionado, e não um container. Deixei o print porque o comando `docker inspect` e o tipo de informação retornada seguem exatamente a mesma lógica em ambos os casos — só que aplicados a objetos diferentes do Docker (container, imagem, volume, rede, etc). Vale a pena, se possível, gerar também um print de `docker inspect <container_id>` (por exemplo, do container do nginx) para atender à atividade com mais precisão.

## O que aconteceu
O `docker inspect` retorna um **JSON detalhado** com todos os metadados do objeto informado. No caso do volume `meu-volume`, as informações mostradas foram:

- **CreatedAt**: data e hora de criação do volume.
- **Driver**: `local`, indicando que o volume é gerenciado localmente pelo próprio Docker (sem uso de plugins de armazenamento externos).
- **Mountpoint**: `/var/lib/docker/volumes/meu-volume/_data` — o caminho real, dentro da máquina/VM do Docker, onde os dados desse volume ficam armazenados fisicamente.
- **Name**: nome do volume (`meu-volume`).
- **Scope**: `local`, indicando que o volume só existe nesta máquina (não é compartilhado entre múltiplos hosts, como aconteceria em um cluster Swarm).

Se o comando fosse rodado em um **container** (`docker inspect <container_id>`), o JSON retornado seria bem mais extenso, incluindo informações como: estado do container (rodando, parado, código de saída), configuração de rede (IP interno, portas mapeadas), volumes montados, variáveis de ambiente, comando executado na inicialização, limites de CPU/memória, entre outros. É uma das formas mais completas de depurar e entender exatamente como um container foi configurado e está se comportando.

## Print
- `01-docker-inspect-volume.png` — saída do `docker inspect meu-volume`.
