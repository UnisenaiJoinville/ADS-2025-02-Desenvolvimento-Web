# Atividade 21: Criando um container com variáveis de ambiente

## Objetivo
Injetar uma variável de ambiente em um container e confirmar sua presença.

## Comandos executados
```bash
docker run -e "MY_VAR=Hello" ubuntu env
```

## O que foi observado / evidenciado
`-e` injeta uma variável de ambiente acessível pelo processo em execução. Saída esperada inclui a linha `MY_VAR=Hello` entre as variáveis padrão do sistema.
