# Atividade 25 — Criando um container com script de inicialização

## Objetivo

Adicionar um script `init.sh` ao Dockerfile e verificar sua execução.

## Arquivos desta atividade

- `init.sh`
- `Dockerfile`

## Explicação

Muitas imagens reais (bancos de dados, filas de mensagens) não iniciam o
processo principal diretamente: elas rodam primeiro um pequeno script de
inicialização (aqui, `init.sh`) que prepara o ambiente — checa variáveis
obrigatórias, cria diretórios, imprime informações de diagnóstico — antes de
iniciar o serviço de verdade. Este exemplo copia o `init.sh` para dentro da
imagem, marca como executável ainda durante o build (`RUN chmod +x`) e o
define como `CMD`, para que ele rode automaticamente assim que o container
iniciar.

## Como gerar a evidência

Com o Docker (Desktop ou Engine) aberto na sua máquina, rode, dentro desta pasta:

```
./run.sh
```

Isso executa os comandos reais desta atividade e grava a saída em
[`EVIDENCIA.md`](./EVIDENCIA.md).
