# 12 - Atividade — volume nomeado x bind mount

O volume nomeado é administrado pelo Docker e é adequado para dados que precisam continuar existindo quando o container é recriado, como os arquivos internos de um banco.

O bind mount conecta diretamente uma pasta do computador ao container. Em desenvolvimento, isso facilita editar o código no host e enxergar a alteração dentro do ambiente containerizado.

```yaml
volumes:
  - mysql_data:/var/lib/mysql
  - ./backend:/app
```

No exemplo, o primeiro item atende à persistência e o segundo favorece o desenvolvimento com atualização do código.
