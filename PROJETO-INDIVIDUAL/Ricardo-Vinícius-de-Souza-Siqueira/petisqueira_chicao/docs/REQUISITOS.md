# Requisitos do sistema — Petisqueira Chicão

Lista para a seção "Engenharia de Requisitos" do relatório (item 3.1 do parecer do orientador).
A coluna "Onde está" aponta o arquivo que implementa o requisito; a coluna "Teste" aponta o
cenário em `php-backend/tests/testar_sistema.php` que o verifica (o quadro de resultados é gerado em
`php-backend/tests/resultado_testes.md`).

## Requisitos funcionais

| Código | Requisito | Onde está | Teste |
|---|---|---|---|
| RF01 | O visitante, com ou sem conta, pode reservar mesa informando nome, telefone, e-mail, nº de pessoas, data e horário (terça a sábado, 18:15–23:15, sem overbooking). Reserva feita sem login não aparece em "Minha conta". | `reservas/criar.php`, `reserva.html` | nº 1–4 |
| RF02 | O visitante pode enviar mensagem pelo "Fale Conosco"; campos obrigatórios são validados. | `contato/criar.php`, `contato.html` | Fale Conosco |
| RF03 | O sistema envia e-mails: reserva recebida (ao reservar), reserva confirmada (quando o administrador confirma), pagamento confirmado com o código do cartão e recuperação de senha. A falha no envio não cancela a operação. | `includes/email.php`, `includes/email_templates.php` | nº 5 e 9 (e-mail enviado por SMTP de teste); `tests/testar_email.php` |
| RF04 | O usuário pode criar conta (senha ≥ 8 caracteres), entrar, sair e recuperar a senha por e-mail. | `auth/*.php` | Cadastro, login, logout; recuperação de senha (nº 26–28) |
| RF05 | O cliente logado pode cancelar a própria reserva; uma reserva cancelada não pode ser reaberta. | `reservas/cancelar.php`, `reservas/atualizar.php` | Reserva cancelada é definitiva |
| RF06 | O cliente (com ou sem conta) monta um carrinho com vários cartões-presente e paga por Pix ou cartão de crédito (pagamento **simulado** nesta versão). Cada pedido pago gera um cartão com código, saldo e validade de 6 meses. | `pedidos/*.php`, `includes/cartoes.php`, `carrinho.html`, `checkout.html` | Compra com Pix / cartão; pagamento duplicado |
| RF07 | O cliente logado vê em "Minha conta" seus dados, reservas (com status por cor) e pedidos, com o atalho "Finalizar pagamento" para pedidos pendentes e o saldo/validade dos cartões. | `conta/minha_conta.php`, `minhaconta.html` | "Minha conta" sem login |
| RF08 | O administrador lista, edita, confirma, cancela e exclui reservas e pode reenviar o e-mail de confirmação. | `reservas/*.php`, `admin.html` | Admin altera status |
| RF09 | O administrador cadastra, edita e desativa cartões-presente (produtos) e registra o uso do saldo dos cartões emitidos (uso parcial, com histórico). Produto desativado some da loja. | `produtos/*.php`, `cartoes/*.php` | Uso parcial; Desativar cartão-presente |
| RF10 | O administrador consulta relatórios de reservas (totais e status por período) e de vendas (pedidos pagos, faturamento, situação dos cartões) e exporta CSV. | `relatorios/*.php` | Relatórios do administrador |

## Requisitos não funcionais

| Código | Requisito | Onde está | Teste |
|---|---|---|---|
| RNF01 | **Responsividade:** o site funciona em desktop e celular (Bootstrap 4.6). | `frontend/css`, `frontend/*.html` | telas do anexo (desktop e celular) |
| RNF02 | **Proteção de credenciais:** senha com bcrypt; token de sessão guardado só como hash SHA-256, válido por 7 dias e invalidado no logout; bloqueio de 15 min após 5 senhas erradas. | `auth/*.php`, `includes/auth.php` | Senha e token protegidos; Logout invalida o token; Bloqueio após 5 senhas erradas (nº 29) |
| RNF03 | **Controle de acesso:** as rotas do painel exigem `is_admin`; a checagem é feita no servidor em toda rota. | `exigirAdmin()` em `includes/auth.php` | Painel admin x cliente / sem login |
| RNF04 | **LGPD (Lei 13.709/2018):** coleta mínima de dados, para finalidade informada; caixa de consentimento em cadastro, reserva, contato e carrinho; página de Política de Privacidade. | `privacidade.html` e formulários | revisão das telas |
| RNF05 | **Integridade dos dados:** preço e total calculados no servidor; valor unitário gravado no item; capacidade por horário; saldo do cartão com trava de linha (`FOR UPDATE`) contra uso simultâneo; consultas com PDO (prepared statements). | `pedidos/criar.php`, `cartoes/utilizar.php` | Preço calculado no servidor |
| RNF06 | **Proteção contra abuso:** limite de tentativas por IP em login, cadastro, reservas, pedidos, contato e recuperação de senha. | `limitarRequisicoes()` | Limite de reservas por IP (nº 30) |
