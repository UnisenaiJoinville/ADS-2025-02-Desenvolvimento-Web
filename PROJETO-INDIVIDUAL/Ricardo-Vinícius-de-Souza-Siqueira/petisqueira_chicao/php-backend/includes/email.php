
<?php
// Utilitário para enviar e-mails do sistema Petisqueira Chicão.
//
// Existem dois modos de envio:
//
// 1) SMTP com PHPMailer:
//    Utiliza as configurações SMTP_HOST, SMTP_USER e SMTP_PASS
//    definidas no config.php.
//
// 2) mail() nativa do PHP:
//    Utilizada como alternativa quando o SMTP não está configurado.
//
// Se o envio falhar, a função retorna false e registra o erro
// no log do PHP, sem interromper a operação principal do sistema.


/**
 * Envia um e-mail em formato HTML.
 *
 * @param string $paraEmail E-mail do destinatário.
 * @param string $paraNome Nome do destinatário.
 * @param string $assunto Assunto do e-mail.
 * @param string $corpoHtml Conteúdo HTML do e-mail.
 *
 * @return bool Retorna true se o envio funcionar.
 *              Retorna false se ocorrer algum erro.
 */
function enviarEmail(
    string $paraEmail,
    string $paraNome,
    string $assunto,
    string $corpoHtml
): bool {

    // Define o nome do remetente.
    $remetenteNome = defined('EMAIL_REMETENTE_NOME')
        ? EMAIL_REMETENTE_NOME
        : 'Petisqueira Chicão';

    // Define o endereço do remetente.
    $remetenteEmail = defined('EMAIL_REMETENTE_ENDERECO')
        ? EMAIL_REMETENTE_ENDERECO
        : 'nao-responda@localhost';

    // Verifica se as configurações SMTP existem.
    $temSmtpConfigurado =
        defined('SMTP_HOST') &&
        defined('SMTP_USER') &&
        defined('SMTP_PASS');

    // Localiza o autoload do PHPMailer.
    $autoloadPhpMailer = __DIR__ . '/../vendor/autoload.php';

    // Se o SMTP estiver configurado e o PHPMailer instalado,
    // utiliza o envio por SMTP.
    if ($temSmtpConfigurado && file_exists($autoloadPhpMailer)) {

        return enviarComPhpMailer(
            $paraEmail,
            $paraNome,
            $assunto,
            $corpoHtml,
            $remetenteNome,
            $remetenteEmail,
            $autoloadPhpMailer
        );
    }

    // Caso contrário, utiliza o mail() nativo do PHP.
    return enviarComMailNativo(
        $paraEmail,
        $paraNome,
        $assunto,
        $corpoHtml,
        $remetenteNome,
        $remetenteEmail
    );
}


/**
 * Envia e-mail utilizando PHPMailer e SMTP.
 *
 * @return bool
 */
function enviarComPhpMailer(
    string $paraEmail,
    string $paraNome,
    string $assunto,
    string $corpoHtml,
    string $remetenteNome,
    string $remetenteEmail,
    string $autoloadPhpMailer
): bool {

    // Inicializa a variável para permitir o fechamento
    // da conexão mesmo quando ocorrer algum erro.
    $mail = null;

    try {

        // Carrega a biblioteca PHPMailer.
        require_once $autoloadPhpMailer;

        // Cria uma nova instância para cada envio.
        $mail = new PHPMailer\PHPMailer\PHPMailer(true);

        // Ativa o envio por SMTP.
        $mail->isSMTP();

        // Configura o servidor SMTP.
        $mail->Host = SMTP_HOST;

        // Ativa a autenticação.
        $mail->SMTPAuth = true;

        // Usuário e senha do SMTP.
        $mail->Username = SMTP_USER;
        $mail->Password = SMTP_PASS;

        // Define o tipo de segurança.
        $seguranca = defined('SMTP_SECURE')
            ? SMTP_SECURE
            : 'tls';

        $mail->SMTPSecure = $seguranca;

        // Desativa TLS automático quando não existe segurança.
        if ($seguranca === '') {
            $mail->SMTPAutoTLS = false;
        }

        // Define a porta SMTP.
        $mail->Port = defined('SMTP_PORT')
            ? (int) SMTP_PORT
            : 587;

        // Tempo máximo de espera.
        $mail->Timeout = 15;

        // Codificação para caracteres especiais.
        $mail->CharSet = 'UTF-8';

        // Não mantém a conexão SMTP aberta.
        $mail->SMTPKeepAlive = false;

        // Configura o remetente.
        $mail->setFrom(
            $remetenteEmail,
            $remetenteNome
        );

        // Configura o destinatário.
        $mail->addAddress(
            $paraEmail,
            $paraNome
        );

        // Define que o conteúdo será HTML.
        $mail->isHTML(true);

        // Define o assunto.
        $mail->Subject = $assunto;

        // Define o corpo do e-mail.
        $mail->Body = $corpoHtml;

        // Define uma versão em texto simples.
        $mail->AltBody = strip_tags(
            str_replace(
                ['<br>', '<br/>', '<br />'],
                "\n",
                $corpoHtml
            )
        );

        // Realiza o envio.
        $mail->send();

        // Se chegou até aqui, o servidor aceitou o envio.
        return true;

    } catch (\Throwable $erro) {

        // Obtém os detalhes do erro do PHPMailer.
        $detalhe = $mail !== null
            ? $mail->ErrorInfo
            : '';

        // Registra o erro no log do PHP.
        error_log(
            '[email.php] Falha ao enviar via PHPMailer/SMTP: ' .
            $erro->getMessage() .
            ' | ' .
            $detalhe
        );

        return false;

    } finally {

        // Fecha a conexão SMTP mesmo quando ocorre um erro.
        if ($mail !== null) {

            try {

                $mail->smtpClose();

            } catch (\Throwable $erroFechamento) {

                error_log(
                    '[email.php] Erro ao fechar conexão SMTP: ' .
                    $erroFechamento->getMessage()
                );
            }
        }
    }
}


/**
 * Envia e-mail utilizando a função nativa mail() do PHP.
 *
 * @return bool
 */
function enviarComMailNativo(
    string $paraEmail,
    string $paraNome,
    string $assunto,
    string $corpoHtml,
    string $remetenteNome,
    string $remetenteEmail
): bool {

    // Define os cabeçalhos do e-mail.
    $cabecalhos = [

        'MIME-Version: 1.0',

        'Content-Type: text/html; charset=UTF-8',

        // Nome do remetente com suporte a acentos.
        'From: =?UTF-8?B?' .
        base64_encode($remetenteNome) .
        '?= <' .
        $remetenteEmail .
        '>',

        // Endereço para respostas.
        'Reply-To: ' . $remetenteEmail,
    ];

    // Codifica o assunto para aceitar caracteres especiais.
    $assuntoCodificado = '=?UTF-8?B?' .
        base64_encode($assunto) .
        '?=';

    // Tenta enviar o e-mail.
    $enviado = @mail(
        $paraEmail,
        $assuntoCodificado,
        $corpoHtml,
        implode("\r\n", $cabecalhos)
    );

    // Registra o erro caso o envio falhe.
    if (!$enviado) {

        error_log(
            '[email.php] Falha ao enviar via mail() nativo do PHP ' .
            'para ' . $paraEmail . '. ' .
            'Verifique se o servidor possui serviço de e-mail configurado.'
        );
    }

    return $enviado;
}
