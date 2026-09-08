# Atividade 23: Usando Dockerfile multi-stage

## Objetivo
Construir uma imagem final enxuta separando etapa de build e etapa de execução.

## Comandos executados
```bash
docker build -t minha-imagem-multi .
docker run -d -p 8080:80 minha-imagem-multi
# http://localhost:8080
```

## O que foi observado / evidenciado
O multi-stage usa múltiplos `FROM`. O primeiro estágio builda a aplicação (com ferramentas pesadas de build); o segundo copia só o resultado (`--from=build`), descartando o resto. Gera imagens finais bem menores e mais seguras.

## Arquivos desta pasta
- `Dockerfile`, `package.json` e `index.html`: app de exemplo mínima para o `npm run build` funcionar de verdade.
