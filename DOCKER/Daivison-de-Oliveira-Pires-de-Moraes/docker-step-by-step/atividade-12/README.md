# Atividade 12: Conectando-se a um container em execução

## Objetivo
Executar um shell adicional dentro de um container já rodando.

## Comandos executados
```bash
docker exec -it <container_id> bash
# dentro do container:
apt-get install -y nano
exit
```

## O que foi observado / evidenciado
`docker exec` **não cria** um novo container — executa um processo adicional dentro de um container que já está rodando. Ao sair, só esse processo termina; o container continua ativo (diferente da Atividade 4).
