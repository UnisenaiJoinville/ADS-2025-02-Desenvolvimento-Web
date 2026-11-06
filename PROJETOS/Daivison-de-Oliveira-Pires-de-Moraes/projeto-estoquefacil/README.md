# Estoque Fácil — projeto revisado para uso local

Sistema de estoque com Node.js 22+, Express, MySQL 8 e interface HTML/JavaScript/Vue. Funciona em **http://localhost:3000**, sem domínio, DNS, certificado ou servidor externo.

## Executar no Windows

1. Instale Node.js 22 LTS (ou superior) e Docker Desktop.
2. Abra o Docker Desktop e espere ficar pronto.
3. Extraia todo o ZIP. Dentro da pasta do projeto, execute **Iniciar-Windows.bat**.
4. Aguarde a primeira construção e acesse **http://localhost:3000**.
5. Clique em **Criar conta**. A primeira conta recebe o perfil **ADMIN**; as seguintes, **OPERATOR**.

Não existe usuário `admin/admin` nem conta de demonstração. A senha deve ter pelo menos 8 caracteres. O banco vem com 12 produtos e histórico de exemplo, sem dados de acesso. O cadastro inicial é serializado no banco para impedir dois primeiros administradores simultâneos.

## Executar pelo terminal (Windows, Linux ou macOS)

Na pasta que contém `package.json`:

```bash
node scripts/setup.js
docker compose up -d --build
```

O setup cria `.env` com senhas aleatórias e preserva um arquivo existente. A primeira execução precisa de internet para baixar imagens e pacotes. Depois da construção, a interface utiliza arquivos locais: Vue, Axios, Lucide, Chart.js e CSS já compilado.

```bash
docker compose ps
docker compose logs -f api
docker compose down
```

`down` mantém os dados. **Não utilize `down -v` para atualizar**: ele remove o volume do banco. Para recompilar após editar: `docker compose up -d --build`.

## O que está incluído

- Produtos e categorias: cadastro, edição, filtros, fornecedor, ordenação, paginação e CSV.
- Busca de produtos com sugestões, teclado, cancelamento e atraso de 300 ms entre digitações.
- Entradas, saídas e ajuste de inventário, com transação e bloqueio do produto no banco.
- Exclusão segura: produtos com histórico não podem ser apagados; a tela oferece inativação. Inativos permanecem nos relatórios e não recebem movimentações.
- Autenticação com senha protegida por bcrypt, JWT, perfis, renovação de sessão, troca de senha e recuperação local.
- Dashboard, preço médio, gráfico de 7/30/90 dias, relatórios de estoque, períodos, responsáveis, ranking, curva ABC acumulada, giro, parados e previsão de ruptura.
- Ícones, confirmação própria, proteção contra clique duplicado, indicadores de carregamento, foco nos modais e tema escuro persistente.
- Scripts de backup/restauração de teste, testes automatizados e apostila completa (71 Markdown).

## Regras importantes

- **Saldo inicial** pode ser informado no cadastro. Depois disso, altere o saldo em **Movimentações → Ajuste**, com uma observação obrigatória. A edição de produtos não sobrescreve o estoque.
- Ajuste guarda o **novo valor contado**, mais os saldos anterior e posterior. Nos relatórios, `signedQuantity` de ajuste é a diferença; `unitsAdjusted` aparece separado de entradas e saídas. O gráfico representa somente entradas e saídas.
- Só ADMIN exclui produtos e categorias. Operadores podem cadastrar, editar e movimentar. Inativação não apaga histórico.
- O token de acesso dura 15 minutos. Em **Meu perfil → Renovar sessão**, pode ser renovado com um token de 7 dias, rotativo e armazenado como hash no banco. Troca/reset de senha revoga sessões anteriores.
- O limite de login é de 5 falhas em 15 minutos por IP. Contas existentes também guardam falhas no banco, para resistir a troca de IP/reinício da API. O contador por IP é local ao processo.
- Recuperação de senha exibe o link **no terminal do servidor** (`docker compose logs api`); não envia e-mail. O link expira em 15 minutos e só pode ser usado uma vez.
- As portas estão limitadas a `127.0.0.1`. Esta entrega é para uso na própria máquina, sem publicação na internet. `TRUST_PROXY=false` é intencional.

Veja [COMO_EXECUTAR.md](COMO_EXECUTAR.md), [docs/ATIVIDADES.md](docs/ATIVIDADES.md), [docs/DECISOES.md](docs/DECISOES.md) e [RELATORIO_TESTES.md](RELATORIO_TESTES.md).
