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
