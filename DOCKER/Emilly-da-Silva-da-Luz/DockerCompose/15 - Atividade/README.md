# 15 - Atividade — por que não depender de `latest`

`latest` não identifica de maneira confiável uma versão imutável. O mantenedor pode publicar uma nova imagem usando a mesma tag, fazendo computadores diferentes executarem conteúdos diferentes.

Isso dificulta reproduzir falhas e realizar rollback. Ao utilizar referências como `postgres:17-alpine` e `redis:7.4-alpine`, a versão utilizada fica explícita.

A atualização então deixa de acontecer por acaso e passa a ser uma decisão controlada da equipe.
