<?php
// Monta o HTML dos e-mails enviados pelo site. Fica separado do
// email.php (que só sabe "enviar", não sabe o conteúdo) pra ficar
// fácil de achar e editar o texto/visual dos e-mails.

// Troque essas informações pelas reais do restaurante, se mudarem.
const RESTAURANTE_NOME = 'Petisqueira Chicão';
const RESTAURANTE_ENDERECO = 'Rua Iguaçu, 298 - Santo Antônio, Joinville - SC';
const RESTAURANTE_TELEFONE = '(47) 93425-2506';

/**
 * E-mail de confirmação de reserva, mandado pro cliente quando o
 * admin muda o status da reserva para "confirmada".
 *
 * @param array $reserva  Linha da tabela `reservas` (com nome,
 *                         quantidade_pessoas, data_reserva, etc.)
 */
function montarEmailConfirmacaoReserva(array $reserva): string
{
    $nome = htmlspecialchars($reserva['nome'], ENT_QUOTES, 'UTF-8');
    $pessoas = (int) $reserva['quantidade_pessoas'];

    $dataFormatada = 'A combinar';
    if (!empty($reserva['data_reserva'])) {
        $data = new DateTime($reserva['data_reserva']);
        // Ex: "sexta-feira, 12 de setembro de 2026 às 20:00"
        $formatter = class_exists('IntlDateFormatter')
            ? new IntlDateFormatter('pt_BR', IntlDateFormatter::FULL, IntlDateFormatter::SHORT, null, null, "EEEE, d 'de' MMMM 'de' yyyy 'às' HH:mm")
            : null;
        $dataFormatada = $formatter ? $formatter->format($data) : $data->format('d/m/Y \à\s H:i');
    }

    $restauranteNome = RESTAURANTE_NOME;
    $restauranteEndereco = RESTAURANTE_ENDERECO;
    $restauranteTelefone = RESTAURANTE_TELEFONE;

    return <<<HTML
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color:#333;">
        <div style="background:#1a1a1a; padding: 22px 28px; border-radius: 10px 10px 0 0;">
            <h1 style="color:#f2c200; margin:0; font-size:22px;">{$restauranteNome}</h1>
        </div>
        <div style="border:1px solid #eee; border-top:none; padding: 28px; border-radius: 0 0 10px 10px;">
            <h2 style="margin-top:0; color:#1a1a1a;">Sua reserva está confirmada! 🎉</h2>
            <p>Olá, <strong>{$nome}</strong>!</p>
            <p>Sua mesa na {$restauranteNome} foi <strong style="color:#155724;">confirmada</strong>. Estes são os detalhes:</p>

            <table style="width:100%; border-collapse: collapse; margin: 18px 0;">
                <tr>
                    <td style="padding:8px 0; color:#888; font-size:13px; text-transform:uppercase;">Pessoas</td>
                    <td style="padding:8px 0; text-align:right; font-weight:bold;">{$pessoas}</td>
                </tr>
                <tr style="border-top:1px solid #eee;">
                    <td style="padding:8px 0; color:#888; font-size:13px; text-transform:uppercase;">Data e horário</td>
                    <td style="padding:8px 0; text-align:right; font-weight:bold;">{$dataFormatada}</td>
                </tr>
            </table>

            <p style="background:#fff8e1; border-left:4px solid #f2c200; padding:12px 16px; border-radius:4px;">
                📍 {$restauranteEndereco}<br>
                📞 {$restauranteTelefone}
            </p>

            <p>Se precisar remarcar ou cancelar, é só entrar em contato pelo telefone acima.</p>
            <p>Até breve!</p>
        </div>
    </div>
    HTML;
}


// Moldura comum dos e-mails (cabeçalho escuro com o nome do restaurante).
function moldurEmail(string $titulo, string $conteudoHtml): string
{
    $restauranteNome = RESTAURANTE_NOME;
    $titulo = htmlspecialchars($titulo, ENT_QUOTES, 'UTF-8');
    return <<<HTML
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color:#333;">
        <div style="background:#1a1a1a; padding: 22px 28px; border-radius: 10px 10px 0 0;">
            <h1 style="color:#f2c200; margin:0; font-size:22px;">{$restauranteNome}</h1>
        </div>
        <div style="border:1px solid #eee; border-top:none; padding: 28px; border-radius: 0 0 10px 10px;">
            <h2 style="margin-top:0; color:#1a1a1a;">{$titulo}</h2>
            {$conteudoHtml}
        </div>
    </div>
    HTML;
}

/**
 * E-mail de RECEBIMENTO da reserva (enviado assim que o cliente reserva,
 * ainda como "pendente"). Diferente do e-mail de CONFIRMAÇÃO, que só sai
 * quando o administrador confirma.
 */
function montarEmailReservaRecebida(array $reserva): string
{
    $nome = htmlspecialchars($reserva['nome'], ENT_QUOTES, 'UTF-8');
    $pessoas = (int) $reserva['quantidade_pessoas'];
    $data = (new DateTime($reserva['data_reserva']))->format('d/m/Y \à\s H:i');
    $tel = RESTAURANTE_TELEFONE;

    return moldurEmail('Recebemos o seu pedido de reserva', <<<HTML
        <p>Olá, <strong>{$nome}</strong>!</p>
        <p>Recebemos o seu pedido de reserva para <strong>{$pessoas} pessoa(s)</strong> em
        <strong>{$data}</strong>. Ela está <strong>pendente</strong>: você receberá outro
        e-mail quando a nossa equipe confirmar.</p>
        <p>Dúvidas? Ligue para {$tel}.</p>
    HTML);
}

/** E-mail de recuperação de senha, com o link de uso único (vale 1 hora). */
function montarEmailRecuperarSenha(string $nome, string $link): string
{
    $nome = htmlspecialchars($nome, ENT_QUOTES, 'UTF-8');
    $link = htmlspecialchars($link, ENT_QUOTES, 'UTF-8');

    return moldurEmail('Redefinir sua senha', <<<HTML
        <p>Olá, <strong>{$nome}</strong>!</p>
        <p>Recebemos um pedido para redefinir a senha da sua conta. Clique no botão abaixo
        para criar uma nova senha. O link vale por <strong>1 hora</strong> e só pode ser usado uma vez.</p>
        <p style="text-align:center; margin: 26px 0;">
            <a href="{$link}" style="background:#f2c200; color:#1a1a1a; padding:12px 26px; border-radius:6px; text-decoration:none; font-weight:bold;">Criar nova senha</a>
        </p>
        <p style="font-size:13px; color:#777;">Se você não pediu isso, ignore este e-mail: a sua senha continua a mesma.</p>
    HTML);
}

/** E-mail enviado quando o pagamento é confirmado, com o código do cartão presente. */
function montarEmailPedidoPago(array $pedido, array $itens, ?array $cartao = null): string
{
    $nome = htmlspecialchars($pedido['nome_comprador'], ENT_QUOTES, 'UTF-8');
    $codigo = htmlspecialchars($pedido['codigo_cartao'], ENT_QUOTES, 'UTF-8');
    $total = number_format((float) $pedido['valor_total'], 2, ',', '.');
    $linhas = '';
    foreach ($itens as $i) {
        $produto = htmlspecialchars($i['produto_nome'], ENT_QUOTES, 'UTF-8');
        $sub = number_format((float) $i['subtotal'], 2, ',', '.');
        $linhas .= "<tr><td style=\"padding:6px 0;\">{$i['quantidade']}x {$produto}</td>"
                 . "<td style=\"padding:6px 0; text-align:right;\">R$ {$sub}</td></tr>";
    }
    $id = (int) $pedido['id'];
    $validadeHtml = '';
    if ($cartao) {
        $validade = (new DateTime($cartao['validade']))->format('d/m/Y');
        $saldo = number_format((float) $cartao['saldo'], 2, ',', '.');
        $validadeHtml = "<p>Saldo: <strong>R$ {$saldo}</strong> &middot; Válido até <strong>{$validade}</strong>.</p>";
    }

    return moldurEmail('Pagamento confirmado!', <<<HTML
        <p>Olá, <strong>{$nome}</strong>! O pagamento do pedido <strong>#{$id}</strong> foi confirmado.</p>
        <table style="width:100%; border-collapse: collapse; margin: 14px 0;">{$linhas}
            <tr style="border-top:1px solid #eee;"><td style="padding:8px 0;"><strong>Total</strong></td>
            <td style="padding:8px 0; text-align:right;"><strong>R$ {$total}</strong></td></tr>
        </table>
        <p>O código do seu cartão presente é:</p>
        <p style="font-size:24px; letter-spacing:2px; text-align:center; background:#fff8e1; border-left:4px solid #f2c200; padding:14px;"><strong>{$codigo}</strong></p>
        {$validadeHtml}
        <p>Apresente este código no restaurante para utilizar o valor. O saldo pode ser usado em mais de uma visita, até a data de validade. Guarde este e-mail.</p>
    HTML);
}
