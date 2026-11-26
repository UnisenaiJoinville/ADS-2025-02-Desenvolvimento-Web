<?php
// ============================================================
// TESTE DE ENVIO DE E-MAIL (SMTP) — Petisqueira Chicão
// ============================================================
// Envia os 4 e-mails do sistema (RF03) pelo SMTP configurado no
// config.php, usando exatamente as mesmas funções da API
// (enviarEmail + modelos de email_templates.php).
//
// Como rodar, no terminal:
//   cd C:\xampp\htdocs\petisqueira_chicao\php-backend\tests
//   C:\xampp\php\php.exe testar_email.php
//   (opcional) C:\xampp\php\php.exe testar_email.php destino@exemplo.com
//
// Com o SMTP do Mailtrap/Ethereal configurado, as mensagens aparecem na
// caixa de entrada de testes: tire a captura de tela para o anexo.
// ============================================================

if (PHP_SAPI !== 'cli') {
    exit("Rode este arquivo pelo terminal (php testar_email.php).\n");
}

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/email.php';
require_once __DIR__ . '/../includes/email_templates.php';

$destino = $argv[1] ?? 'cliente.teste@exemplo.com';
$nome = 'Cliente Teste';

$usaSmtp = defined('SMTP_HOST') && defined('SMTP_USER') && defined('SMTP_PASS')
    && file_exists(__DIR__ . '/../vendor/autoload.php');
echo "Canal de envio: " . ($usaSmtp ? 'SMTP (' . SMTP_HOST . ':' . (defined('SMTP_PORT') ? SMTP_PORT : 587) . ') via PHPMailer' : 'mail() nativo do PHP') . "\n";
echo "Destinatário:   $destino\n\n";

$reserva = [
    'nome' => $nome, 'quantidade_pessoas' => 4,
    'data_reserva' => date('Y-m-d', strtotime('+7 days')) . ' 20:00:00',
];
$itens = [['quantidade' => 1, 'produto_nome' => 'Cartão Presente R$ 100', 'subtotal' => 100.00]];
$pedido = ['id' => 999, 'nome_comprador' => $nome, 'valor_total' => 100.00, 'codigo_cartao' => 'PC-TEST-2026'];
$cartao = ['saldo' => 100.00, 'validade' => date('Y-m-d', strtotime('+6 months')) . ' 23:59:59'];
$link = (defined('SITE_URL') ? rtrim(SITE_URL, '/') : 'http://localhost/petisqueira_chicao/frontend')
    . '/redefinir_senha.html?token=EXEMPLO-DE-LINK-DO-TESTE';

$emails = [
    'Reserva recebida'            => ['Recebemos o seu pedido de reserva', montarEmailReservaRecebida($reserva)],
    'Reserva confirmada'          => ['Reserva confirmada - Petisqueira Chicão', montarEmailConfirmacaoReserva($reserva)],
    'Pagamento / código do cartão' => ['Pagamento confirmado - seu cartão presente', montarEmailPedidoPago($pedido, $itens, $cartao)],
    'Recuperação de senha'        => ['Redefinir sua senha - Petisqueira Chicão', montarEmailRecuperarSenha($nome, $link)],
];

$falhas = 0;
$total = count($emails);
$i = 0;
foreach ($emails as $rotulo => [$assunto, $html]) {
    $i++;
    $ok = enviarEmail($destino, $nome, $assunto, $html);
    echo sprintf("[%s] %s\n", $ok ? 'ENVIADO' : 'FALHOU ', $rotulo);
    $falhas += $ok ? 0 : 1;
    if ($i < $total) {
        sleep(10); // o plano gratuito do Mailtrap aceita no máximo 1 e-mail por segundo
    }
}

echo $falhas === 0
    ? "\nOs 4 e-mails foram aceitos pelo servidor SMTP. Abra a caixa de entrada de testes e tire a captura.\n"
    : "\n$falhas e-mail(s) falharam. Confira SMTP_* no config.php, a pasta vendor/ e o log de erros do PHP.\n";
exit($falhas === 0 ? 0 : 1);