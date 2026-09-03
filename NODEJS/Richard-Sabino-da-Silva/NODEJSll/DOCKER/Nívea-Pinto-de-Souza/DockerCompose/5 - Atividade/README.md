# 5 - Atividade — Cenário 2 — ports x expose


## Resposta
`ports` publica uma porta do container no host. Por exemplo, `8080:80` faz o Nginx ficar acessível pelo navegador em `http://localhost:8080`.

`expose` apenas documenta/disponibiliza a porta para comunicação entre serviços na rede Docker, sem publicá-la diretamente no computador. No cenário 2, `frontend` expõe `5173` e `api` expõe `3000`, mas quem entra pelo host é o Nginx. Ele encaminha `/` para `http://frontend:5173` e `/api/` para `http://api:3000/`.

```text
Host :8080 -> Nginx :80
                 |-> frontend:5173  (expose)
                 `-> api:3000       (expose)
```
Isso reduz portas públicas e cria um ponto único de entrada.
