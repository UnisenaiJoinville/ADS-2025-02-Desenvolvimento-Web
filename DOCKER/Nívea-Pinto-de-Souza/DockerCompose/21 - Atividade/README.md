# 21 - Atividade — P4 — executar comando dentro da API


## Comando principal
```bash
docker compose exec api sh
```
Depois, já dentro do container:
```sh
pwd
node --version
ls -la
exit
```

## Explicação
`docker compose exec` executa um processo dentro de um container já em execução. É útil para diagnóstico, inspeção de arquivos e testes pontuais sem abrir uma nova imagem/container separado.
