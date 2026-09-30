# Estoque Fácil — solução da atividade

Este projeto foi montado seguindo a apostila enviada. A ideia é deixar o sistema pronto para abrir no VS Code, subir com Docker e testar no navegador.

## Dependências

- Docker Desktop
- Node.js 22+
- VS Code

O projeto usa Node.js + Express no backend, MySQL 8 no banco e Tailwind CSS via CDN no front-end.

## Passo a passo

### 1. Abrir no VS Code

Extraia o ZIP e abra a pasta `estoque-facil` no VS Code.

Abra **Terminal > New Terminal**.

Confira:

```bash
docker --version
docker compose version
node --version
```

### 2. Configurar o ambiente

O arquivo `.env` já está incluído para facilitar a execução.

Se precisar recriá-lo:

```bash
cp .env.example .env
```

No PowerShell:

```powershell
Copy-Item .env.example .env
```

### 3. Subir o projeto

Na raiz da pasta:

```bash
docker compose up --build
```

Espere o MySQL iniciar e a API conectar.

### 4. Testar a API

Abra:

`http://localhost:3000/api/health`

Deve aparecer algo parecido com:

```json
{"status":"ok","timestamp":"..."}
```

### 5. Abrir o sistema

- `http://localhost:3000/`
- `http://localhost:3000/produtos.html`
- `http://localhost:3000/movimentacoes.html`
- `http://localhost:3000/categorias.html`

### 6. Conferir os containers

```bash
docker compose ps
```

Para ver os logs:

```bash
docker compose logs api --tail 50
docker compose logs db --tail 50
```

### 7. Parar

```bash
docker compose down
```

Para zerar o banco e executar o `init.sql` novamente:

```bash
docker compose down -v
docker compose up --build
```

## O que foi feito

- API REST com Express
- CRUD de categorias
- CRUD de produtos
- Entrada e saída de estoque
- Transação no banco para manter o estoque consistente
- Dashboard com resumo do estoque
- Front-end com quatro telas
- Validação de dados
- Tratamento de erros HTTP
- MySQL em container
- Docker Compose para subir API e banco juntos

## Problemas comuns

### Porta 3308 ocupada

Altere no `.env`:

```text
DB_HOST_PORT=3309
```

Depois reinicie:

```bash
docker compose down
docker compose up --build
```

### Banco não sobe

Tente:

```bash
docker compose down -v
docker compose up --build
```

### API não responde

Veja:

```bash
docker compose logs api --tail 100
```

### Checklist para apresentar a atividade

- [ ] Docker funcionando
- [ ] API respondendo
- [ ] Dashboard abrindo
- [ ] Categorias funcionando
- [ ] Produtos funcionando
- [ ] Entrada aumentando estoque
- [ ] Saída diminuindo estoque
- [ ] Dashboard mostrando os valores
- [ ] Containers funcionando no Docker

## Observação

Os comentários do código são curtos e diretos, sem tentar deixar o projeto com cara de documentação automática. A ideia é conseguir ler, entender e explicar cada parte durante a apresentação.
