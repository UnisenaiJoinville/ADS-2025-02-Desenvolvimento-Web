# 5 - Atividade — diferença entre `ports` e `expose`

`ports` publica uma porta do container no computador. O mapeamento `8080:80`, por exemplo, faz o Nginx ficar acessível pelo navegador na porta 8080.

`expose` é usado para indicar uma porta utilizada na comunicação interna. Frontend e API podem conversar com o Nginx sem receber uma porta pública própria.

```text
Navegador → localhost:8080 → Nginx
                            ├─ frontend:5173
                            └─ api:3000
```

Com isso, o proxy concentra a entrada externa e os demais componentes permanecem dentro da rede da aplicação.
