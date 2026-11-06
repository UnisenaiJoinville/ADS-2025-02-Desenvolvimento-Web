# Autenticação da versão revisada

A primeira conta criada é ADMIN; as próximas são OPERATOR. O acesso inicial é por cadastro, sem usuário/senha fixos. Nome: 3–60 caracteres. Senha: mínimo de 8 caracteres e máximo de 72 bytes UTF-8 (limite real do bcrypt).

| Método | Rota | Uso |
|---|---|---|
| POST | `/api/auth/register` | Cadastrar; devolve usuário, acesso e renovação |
| POST | `/api/auth/login` | Entrar; grava último acesso |
| GET | `/api/auth/me` | Consultar perfil atual |
| PUT | `/api/auth/me` | Alterar o próprio nome |
| PUT | `/api/auth/password` | Trocar senha conferindo a atual |
| POST | `/api/auth/refresh` | Rotacionar o token de renovação |
| POST | `/api/auth/logout` | Revogar o token de renovação informado |
| POST | `/api/auth/forgot-password` | Gerar link local no console |
| POST | `/api/auth/reset-password` | Usar o link uma única vez |

Acesso: `Authorization: Bearer TOKEN`. As rotas internas exigem uma conta ativa e a versão atual de sessão no banco. Senha trocada/resetada invalida tokens existentes. Só ADMIN exclui produtos/categorias; o papel vem da conta autenticada, nunca de um campo enviado pelo cliente.

O token de acesso expira em 15 minutos. A renovação dura 7 dias e é uma ação explícita em Meu perfil. O logout limpa os dados do navegador e revoga o refresh token; um JWT de acesso já copiado pode durar até a expiração, exceto quando houve revogação pela troca de senha.

Na recuperação, consulte `docker compose logs api`. O link usa localhost e expira em 15 minutos. Se mudou `API_HOST_PORT`, use a mesma porta no link. Não há serviço de e-mail nem domínio configurado.

Defina `REGISTRATION_OPEN=false` no `.env` e recrie a API para fechar cadastro após criar as contas desejadas. Isso bloqueia tanto a página quanto a rota POST. Para reabrir, volte a `true`.

As tentativas por IP ficam em memória; as falhas por conta ficam no MySQL. Os dois controles se complementam. `TRUST_PROXY=false` impede confiar em IPs inventados no cabeçalho em execução local direta.
