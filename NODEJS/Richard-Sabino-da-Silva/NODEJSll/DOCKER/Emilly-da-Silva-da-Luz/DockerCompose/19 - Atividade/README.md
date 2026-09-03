# 19 - Atividade — P2: validar a configuração do Compose

Antes de iniciar os containers, a configuração pode ser validada com:

```bash
cp .env.example .env
docker compose config
```

No PowerShell:

```powershell
Copy-Item .env.example .env
docker compose config
```

O comando expande variáveis e mostra a configuração final. Se houver erro de YAML, variável obrigatória ou estrutura inválida, ele informa antes da subida dos serviços. A saída real deve ser colocada em `EVIDENCIAS.md`.
