<?php
// Copie este arquivo para "config.php" (sem o .example) e preencha
// com os dados do seu MySQL.
//
// NUNCA suba o "config.php" real para o GitHub (ele tem sua senha).

define('DB_HOST', 'localhost');
define('DB_PORT', '3308');
define('DB_USER', 'root');
define('DB_PASSWORD', '');
define('DB_NAME', 'petisqueira_chicao');

// Endereço do FRONT-END (usado para montar o link do e-mail de
// "esqueci minha senha"). Sem barra no final.
define('SITE_URL', 'http://localhost/petisqueira_chicao/frontend');

// Capacidade máxima de pessoas por horário (hora cheia) nas reservas.
// define('CAPACIDADE_POR_HORARIO', 50);

// O endpoint legado de pagamento é apenas um simulador e fica bloqueado por
// padrão. Nunca habilite isto automaticamente; em produção use um gateway
// real com webhook e uma integração revisada.
define('SIMULATED_PAYMENTS_ENABLED', false);

// Em DESENVOLVIMENTO (XAMPP sem servidor de e-mail): com TRUE, o link de
// recuperação de senha é gravado no log de erros do PHP
// (xampp/apache/logs/error.log) quando o e-mail não puder ser enviado.
// Em PRODUÇÃO deixe FALSE.
define('APP_DEBUG', false);

// Ao publicar o site, informe o endereço do front-end para liberar o CORS.
// localhost só é liberado quando APP_DEBUG=true:
// define('CORS_ORIGENS', ['https://www.seusite.com.br']);

// ========================================================
// E-MAIL (usado para mandar a confirmação da reserva pro cliente,
// e pode ser usado pra avisar o admin quando chega mensagem de
// contato). Veja php-backend/includes/email.php para entender
// como isso é usado.
// ========================================================

// Nome e e-mail que aparecem como remetente nos e-mails enviados
// pelo site.
define('EMAIL_REMETENTE_NOME', 'Petisqueira Chicão');
define('EMAIL_REMETENTE_ENDERECO', 'contato@petisqueirachicao.com.br');

// Deixe as linhas SMTP_* comentadas (ou apague) para usar a função
// mail() nativa do PHP — funciona de graça em hospedagens que já
// vêm com servidor de e-mail configurado (a maioria das hospedagens
// compartilhadas brasileiras), mas geralmente NÃO funciona rodando
// localmente pelo XAMPP.
//
// Para usar um SMTP de verdade (Gmail, Outlook, o SMTP da sua
// hospedagem, etc.) — o jeito mais confiável — descomente as linhas
// abaixo, preencha com os dados do seu provedor, e instale o
// PHPMailer rodando isto dentro da pasta php-backend:
//   composer require phpmailer/phpmailer
//
// define('SMTP_HOST', 'smtp.gmail.com');
// define('SMTP_PORT', 587);
// define('SMTP_USER', 'seuemail@gmail.com');
// define('SMTP_PASS', 'sua_senha_de_app'); // Gmail exige "senha de app", não a senha normal
// define('SMTP_SECURE', 'tls'); // 'tls' ou 'ssl'

// ----- SMTP DE TESTE (Mailtrap) — usado nos testes de e-mail do relatório -----
// O Mailtrap (https://mailtrap.io, plano gratuito) é uma "caixa de entrada
// falsa": o PHPMailer envia de verdade por SMTP, mas NADA chega a clientes
// reais; as mensagens ficam numa caixa de entrada de testes para você ver
// e tirar captura de tela. Alternativas gratuitas: Ethereal (ethereal.email)
// ou uma conta Gmail com "senha de app".
//
// Passo a passo:
//   1. Crie a conta no Mailtrap > Email Testing > Inboxes > SMTP Settings.
//   2. Copie Host, Port, Username e Password para as linhas abaixo e
//      tire o "//" do começo de cada uma.
//   3. Confirme que existe a pasta php-backend/vendor (PHPMailer). Se não
//      existir, rode: composer install  (dentro de php-backend).
//   4. Teste: php tests/testar_email.php seu@email.com
//
// define('SMTP_HOST', 'sandbox.smtp.mailtrap.io');
// define('SMTP_PORT', 2525);
// define('SMTP_USER', 'COLE_O_USERNAME_DO_MAILTRAP');
// define('SMTP_PASS', 'COLE_A_PASSWORD_DO_MAILTRAP');
// define('SMTP_SECURE', 'tls');
