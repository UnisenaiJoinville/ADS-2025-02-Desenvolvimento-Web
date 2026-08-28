# 21 - Atividade — P4: executar comandos dentro da API

Depois de iniciar o cenário:

```bash
docker compose exec api sh
```

Dentro do container, alguns comandos úteis são:

```sh
pwd
node -v
printenv | sort
ls
exit
```

`exec` reutiliza um container que já está executando. É útil para diagnóstico porque permite verificar arquivos, variáveis e versão do runtime sem criar outro container.
