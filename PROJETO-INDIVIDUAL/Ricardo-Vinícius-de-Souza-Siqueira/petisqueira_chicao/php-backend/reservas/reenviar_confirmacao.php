<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/email.php';
require_once __DIR__ . '/../includes/email_templates.php';

exigirAdmin($pdo);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido.']);
    exit;
}

$dados = pegarCorpoJson();
$id = $dados['id'] ?? null;

if (!$id) {
    http_response_code(400);
    echo json_encode(['erro' => 'Informe o id da reserva.']);
    exit;
}

$stmt = $pdo->prepare('SELECT * FROM reservas WHERE id = ?');
$stmt->execute([$id]);
$reserva = $stmt->fetch();

if (!$reserva) {
    http_response_code(404);
    echo json_encode(['erro' => 'Reserva não encontrada.']);
    exit;
}

if ($reserva['status'] !== 'confirmada') {
    http_response_code(400);
    echo json_encode(['erro' => 'Só é possível reenviar a confirmação de reservas com status "confirmada".']);
    exit;
}

$corpo = montarEmailConfirmacaoReserva($reserva);
$enviado = enviarEmail($reserva['email'], $reserva['nome'], 'Sua reserva foi confirmada! 🎉', $corpo);

if ($enviado) {
    $pdo->prepare('UPDATE reservas SET confirmacao_enviada_em = NOW() WHERE id = ?')->execute([$id]);
    echo json_encode(['mensagem' => 'E-mail de confirmação reenviado com sucesso!']);
} else {
    http_response_code(502);
    echo json_encode([
        'erro' => 'Não foi possível enviar o e-mail. Verifique a configuração de e-mail em ' .
                  'php-backend/config/config.php e o log de erros do PHP.',
    ]);
}
