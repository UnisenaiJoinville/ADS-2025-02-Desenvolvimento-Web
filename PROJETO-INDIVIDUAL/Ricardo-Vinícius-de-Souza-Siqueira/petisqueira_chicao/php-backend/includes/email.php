<?php
// Utilitário para mandar e-mail (confirmação de reserva, etc.).
//
// Tem dois "modos":
//
// 1) SMTP de verdade, com a biblioteca PHPMailer — usado automaticamente
//    se você definiu as constantes SMTP_HOST/SMTP_USER/SMTP_PASS no
//    config.php E instalou o PHPMailer (composer require phpmailer/phpmailer
//    dentro da pasta php-backend). Esse é o jeito confiável, recomendado
//    pra produção.
//
// 2) mail() nativa do PHP — usada como alternativa se o SMTP não estiver
//    configurado. É mais simples (não precisa instalar nada), mas só
//    funciona se o servidor onde o site está hospedado já tiver um
//    servidor de e-mail configurado (a maioria das hospedagens
//    compartilhadas tem; o XAMPP local geralmente NÃO tem).
//
// Em ambos os casos, se o envio falhar, a função NUNCA lança um erro
// fatal — ela devolve false e grava o motivo no log de erros do PHP
// (error_log), pra não derrubar a requisição que chamou ela (por
// exemplo, o admin confirmando a reserva não pode "quebrar" só porque
// o e-mail falhou).

/**
 * Manda um e-mail em HTML.
 *
 * @param string $paraEmail  E-mail do destinatário.
 * @param string $paraNome   Nome do destinatário (aparece no "Para:").
 * @param string $assunto    Assunto do e-mail.
 * @param string $corpoHtml  Corpo do e-mail, em HTML.
 * @return bool  true se conseguiu enviar (ou pelo menos entregar pro
 *               servidor de envio), false se deu erro.
 */
function enviarEmail(string $paraEmail, string $paraNome, string $assunto, string $corpoHtml): bool
{
    $remetenteNome = defined('EMAIL_REMETENTE_NOME') ? EMAIL_REMETENTE_NOME : 'Petisqueira Chicão';
    $remetenteEmail = defined('EMAIL_REMETENTE_ENDERECO') ? EMAIL_REMETENTE_ENDERECO : 'nao-responda@localhost';

    $temSmtpConfigurado = defined('SMTP_HOST') && defined('SMTP_USER') && defined('SMTP_PASS');
    $autoloadPhpMailer = __DIR__ . '/../vendor/autoload.php';

    if ($temSmtpConfigurado && file_exists($autoloadPhpMailer)) {
        return enviarComPhpMailer($paraEmail, $paraNome, $assunto, $corpoHtml, $remetenteNome, $remetenteEmail, $autoloadPhpMailer);
    }

    return enviarComMailNativo($paraEmail, $paraNome, $assunto, $corpoHtml, $remetenteNome, $remetenteEmail);
}

function enviarComPhpMailer(
    string $paraEmail,
    string $paraNome,
    string $assunto,
    string $corpoHtml,
    string $remetenteNome,
    string $remetenteEmail,
    string $autoloadPhpMailer
): bool {
    require_once $autoloadPhpMailer;

    $mail = new PHPMailer\PHPMailer\PHPMailer(true);

    try {
        $mail->isSMTP();
        $mail->Host = SMTP_HOST;
        $mail->SMTPAuth = true;
        $mail->Username = SMTP_USER;
        $mail->Password = SMTP_PASS;
        $mail->SMTPSecure = defined('SMTP_SECURE') ? SMTP_SECURE : 'tls';
        $mail->Port = defined('SMTP_PORT') ? (int) SMTP_PORT : 587;
        $mail->CharSet = 'UTF-8';

        $mail->setFrom($remetenteEmail, $remetenteNome);
        $mail->addAddress($paraEmail, $paraNome);
        $mail->isHTML(true);
        $mail->Subject = $assunto;
        $mail->Body = $corpoHtml;
        $mail->AltBody = strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $corpoHtml));

        $mail->send();
        return true;
    } catch (\Throwable $erro) {
        error_log('[email.php] Falha ao enviar via PHPMailer/SMTP: ' . $erro->getMessage());
        return false;
    }
}

function enviarComMailNativo(
    string $paraEmail,
    string $paraNome,
    string $assunto,
    string $corpoHtml,
    string $remetenteNome,
    string $remetenteEmail
): bool {
    $cabecalhos = [
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        // encode-word simples pro nome do remetente aceitar acentos
        'From: =?UTF-8?B?' . base64_encode($remetenteNome) . '?= <' . $remetenteEmail . '>',
        'Reply-To: ' . $remetenteEmail,
    ];

    $assuntoCodificado = '=?UTF-8?B?' . base64_encode($assunto) . '?=';

    $enviado = @mail($paraEmail, $assuntoCodificado, $corpoHtml, implode("\r\n", $cabecalhos));

    if (!$enviado) {
        error_log(
            '[email.php] Falha ao enviar via mail() nativo do PHP para ' . $paraEmail . '. ' .
            'Isso é esperado se o servidor (ex: XAMPP local) não tiver um servidor de e-mail ' .
            'configurado. Configure SMTP_HOST/SMTP_USER/SMTP_PASS no config.php e instale o ' .
            'PHPMailer para um envio confiável.'
        );
    }

    return $enviado;
}
