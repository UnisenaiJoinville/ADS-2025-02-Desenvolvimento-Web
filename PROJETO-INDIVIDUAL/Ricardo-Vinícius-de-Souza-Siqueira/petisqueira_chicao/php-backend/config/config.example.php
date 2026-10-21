<?php
// Copie este arquivo para "config.php" (sem o .example) e preencha
// com os dados do seu MySQL.
//
// NUNCA suba o "config.php" real para o GitHub (ele tem sua senha).

define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_USER', 'root');
define('DB_PASSWORD', 'sua_senha_do_mysql');
define('DB_NAME', 'petisqueira_chicao');

// Ao publicar o site, informe o endereço do front-end para liberar o CORS
// (localhost já vem liberado por padrão):
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

