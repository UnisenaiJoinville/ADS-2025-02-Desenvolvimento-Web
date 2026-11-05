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
$atual = $stmt->fetch();

if (!$atual) {
    http_response_code(404);
    echo json_encode(['erro' => 'Reserva não encontrada.']);
    exit;
}

$statusPermitidos = ['pendente', 'confirmada', 'cancelada'];
$status = $dados['status'] ?? $atual['status'];

if (!in_array($status, $statusPermitidos, true)) {
    http_response_code(400);
    echo json_encode(['erro' => 'Status inválido. Use pendente, confirmada ou cancelada.']);
    exit;
}

$nome = $dados['nome'] ?? $atual['nome'];
$telefone = $dados['telefone'] ?? $atual['telefone'];
$email = $dados['email'] ?? $atual['email'];
$quantidade = $dados['quantidade_pessoas'] ?? $atual['quantidade_pessoas'];

// Manda o e-mail de confirmação pro cliente só quando o status está
// VIRANDO "confirmada" agora (não manda de novo se já estava
// confirmada e o admin só editou outro campo).
$vaiConfirmarAgora = $status === 'confirmada' && $atual['status'] !== 'confirmada';

try {
    $stmt = $pdo->prepare(
        'UPDATE reservas SET nome = ?, telefone = ?, email = ?, quantidade_pessoas = ?, status = ? WHERE id = ?'
    );
    $stmt->execute([$nome, $telefone, $email, $quantidade, $status, $id]);

    $emailEnviado = null;

    if ($vaiConfirmarAgora) {
        $reservaAtualizada = array_merge($atual, [
            'nome' => $nome,
            'quantidade_pessoas' => $quantidade,
            'status' => $status,
        ]);

        $corpo = montarEmailConfirmacaoReserva($reservaAtualizada);
        $emailEnviado = enviarEmail($email, $nome, 'Sua reserva foi confirmada! 🎉', $corpo);

        if ($emailEnviado) {
            $pdo->prepare('UPDATE reservas SET confirmacao_enviada_em = NOW() WHERE id = ?')->execute([$id]);
        }
    }

    $resposta = ['mensagem' => 'Reserva atualizada com sucesso!'];
    if ($vaiConfirmarAgora) {
        $resposta['email_confirmacao_enviado'] = $emailEnviado;
        if (!$emailEnviado) {
            $resposta['aviso'] = 'A reserva foi confirmada, mas não foi possível enviar o e-mail ' .
                                  'de confirmação para o cliente. Verifique a configuração de e-mail ' .
                                  '(veja php-backend/includes/email.php) ou reenvie manualmente.';
        }
    }

    echo json_encode($resposta);
} catch (PDOException $erro) {
    responderErroInterno($erro, 'Erro ao atualizar a reserva. Tente novamente.');
}
