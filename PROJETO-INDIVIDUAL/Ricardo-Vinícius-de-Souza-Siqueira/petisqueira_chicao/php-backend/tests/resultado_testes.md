# Resultado dos testes

Executado em 16/11/2026 19:46 — 30 de 30 testes aprovados.

| Nº | Requisito | Funcionalidade | Ação realizada | Resultado esperado | Resultado obtido | Situação |
|---|---|---|---|---|---|---|
| 1 | RF01 | Reserva sem login | Enviar reserva sem token; depois abrir "Minha conta" de um cliente | Reserva criada (201) e NÃO aparece em "Minha conta" | HTTP 201; reserva #27 não apareceu em "Minha conta" | Aprovado |
| 2 | RF01 | Reserva com login | Enviar reserva com o token do cliente; abrir "Minha conta" | Reserva criada (201) e aparece em "Minha conta" | HTTP 201; reserva #28 apareceu em "Minha conta" | Aprovado |
| 3 | RF01 | Reserva fora do funcionamento | Reservar numa segunda-feira (restaurante fechado) | Recusar com erro 400 | HTTP 400: Reservas apenas de terça a sábado, entre 18:15 e 23:15. | Aprovado |
| 4 | RF01 | Reserva no passado | Reservar numa data passada | Recusar com erro 400 | HTTP 400: A data da reserva não pode estar no passado. | Aprovado |
| 5 | RF03 | E-mail de confirmação enviado | Admin confirma a reserva; o sistema envia o e-mail pelo SMTP de teste | Status vira "confirmada", o e-mail é enviado e confirmacao_enviada_em é preenchida | Status "confirmada"; e-mail enviado pelo SMTP; confirmacao_enviada_em = 2026-11-16 19:45:52 | Aprovado |
| 6 | RF05 | Reserva cancelada é definitiva | Admin cancela e depois tenta confirmar a mesma reserva | Segunda ação recusada (409) | HTTP 409: Uma reserva cancelada não pode ser reaberta. Peça ao cliente para fazer uma nova reserva. | Aprovado |
| 7 | RF06 | Compra com Pix | Criar pedido de 2 cartões (sem login) e pagar com Pix | Pedido "pago", forma_pagamento gravada, cartão emitido com código, saldo = total e validade de ~6 meses | HTTP 200; status=pago; forma_pagamento=pix; código=PC-NT4J-6RNR; saldo=R$ 200,00; validade em 181 dias | Aprovado |
| 8 | RF06 | Compra com cartão de crédito | Criar pedido de 2 cartões (sem login) e pagar com cartão de crédito | Pedido "pago", forma_pagamento gravada, cartão emitido com código, saldo = total e validade de ~6 meses | HTTP 200; status=pago; forma_pagamento=cartao; código=PC-M9L4-LHJU; saldo=R$ 200,00; validade em 181 dias | Aprovado |
| 9 | RF03 | E-mail com o código do cartão | Pagar o pedido (Pix) e conferir se o e-mail com o código foi enviado | A resposta de pagamento informa email_enviado = true | email_enviado = true | Aprovado |
| 10 | RF06 | Pagamento duplicado | Tentar pagar de novo um pedido já pago | Recusar (409), sem gerar outro cartão | HTTP 409: Este pedido já foi pago anteriormente. | Aprovado |
| 11 | RNF05 | Preço calculado no servidor | Enviar pedido com valor_total = R$ 0,01 forjado no corpo da requisição | O servidor ignora o valor enviado e usa o preço do produto | valor_total gravado = R$ 100,00 | Aprovado |
| 12 | RF07 | "Minha conta" sem login | Chamar a API de "Minha conta" sem token | Acesso negado (401); o site redireciona para o login | HTTP 401: Faça login para continuar. | Aprovado |
| 13 | RNF03 | Painel admin x cliente | Cliente (sem is_admin) chama 5 rotas do painel | Todas bloqueadas com 403 | HTTP: reservas/listar.php=403, cartoes/admin_listar.php=403, relatorios/vendas.php=403, pedidos/admin_listar.php=403, contato/listar.php=403 | Aprovado |
| 14 | RNF03 | Painel admin sem login | Chamar a lista de reservas sem token | Bloqueado com 401 | HTTP 401 | Aprovado |
| 15 | RF08 | Admin altera status da reserva | Admin muda a reserva #28 de "pendente" para "confirmada" | Status gravado no banco como "confirmada" | status no banco = confirmada | Aprovado |
| 16 | RF09 | Uso parcial do cartão | Admin desconta R$ 50 do cartão e depois tenta descontar R$ 99.999 | Primeiro uso aceito (saldo diminui); segundo recusado (409) e saldo não muda | uso=HTTP 200; excesso=HTTP 409; saldo 200,00 → 150,00 | Aprovado |
| 17 | RF09 | Desativar cartão-presente | Admin cria um produto e o desativa; consultar a loja e tentar comprá-lo | Aparece na loja antes, some depois, e a compra é recusada (404) | na loja antes: sim; depois: não; compra HTTP 404 | Aprovado |
| 18 | RF10 | Relatórios do administrador | Admin abre os relatórios de reservas e de vendas | Os dois respondem 200 com dados em JSON | reservas=HTTP 200; vendas=HTTP 200; campos de vendas: periodo, total_vendas, receita_total, unidades_vendidas, total_pendentes, valor_pendente | Aprovado |
| 19 | RF02 | Fale Conosco com campo vazio | Enviar o formulário com a mensagem em branco | Recusar com erro 400 | HTTP 400: Preencha nome, e-mail e mensagem. | Aprovado |
| 20 | RF02 | Fale Conosco preenchido | Enviar o formulário completo | Mensagem gravada (201) | HTTP 201; mensagens gravadas: 1 | Aprovado |
| 21 | RF04 | Cadastro com senha curta | Cadastrar com senha de 4 caracteres | Recusar com erro 400 (mínimo 8) | HTTP 400: A senha precisa ter no mínimo 8 caracteres. | Aprovado |
| 22 | RF04 | Cadastro com e-mail repetido | Cadastrar de novo o mesmo e-mail | Recusar com erro 409 | HTTP 409 | Aprovado |
| 23 | RNF02 | Senha e token protegidos no banco | Ler a linha do usuário no banco | Senha em bcrypt (não em texto puro) e token guardado só como hash SHA-256 | senha_hash começa com $2y$; token_hash com 64 caracteres (≠ token do navegador) | Aprovado |
| 24 | RF04 | Login com senha errada | Tentar logar com senha incorreta | Recusar com erro 401 | HTTP 401 | Aprovado |
| 25 | RNF02 | Logout invalida o token | Fazer logout e reutilizar o mesmo token | Token deixa de valer (401) | logout HTTP 200; reuso do token HTTP 401 | Aprovado |
| 26 | RF04 | Recuperação de senha: pedir o link | Informar o e-mail de uma conta em "Esqueci minha senha" | Resposta 200 e um token de uso único (válido por 1 hora) gravado em reset_senha | HTTP 200; token pendente em reset_senha: sim | Aprovado |
| 27 | RF04 | Recuperação de senha: usar o link | Abrir o link, definir a nova senha e entrar com ela | Senha alterada (200); login com a nova senha funciona (200) e com a antiga é recusado (401) | redefinir=HTTP 200; login nova senha=HTTP 200; login senha antiga=HTTP 401 | Aprovado |
| 28 | RF04 | Recuperação de senha: reutilizar o link | Tentar usar o mesmo link uma segunda vez | Recusar com erro 400 (token de uso único) | HTTP 400: Este link é inválido ou expirou. Peça um novo link de recuperação. | Aprovado |
| 29 | RNF02 | Bloqueio após 5 senhas erradas | Fazer 6 tentativas de login com senha errada e, depois, tentar com a senha correta | 1ª a 5ª recusadas (401); a 6ª bloqueada (429) por 15 minutos; a senha correta também fica bloqueada (429) | tentativas 1–6 = HTTP 401, 401, 401, 401, 401, 429; senha correta = HTTP 429; bloqueado por ~15 min | Aprovado |
| 30 | RNF06 | Limite de reservas por IP | Enviar 11 requisições de reserva seguidas do mesmo IP (limite: 10 por hora) | As 10 primeiras são processadas (400, corpo vazio) e a 11ª é recusada com 429 (muitas tentativas) | HTTP das requisições 1–11: 400, 400, 400, 400, 400, 400, 400, 400, 400, 400, 429 | Aprovado |
