<?php
// O cliente LOGADO cancela a própria reserva (pela página "Minha conta").
// Só é possível cancelar reservas que pertencem a ele e que ainda não
// aconteceram. Visitantes sem conta cancelam ligando para o restaurante.

require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/auth.php';

exigirMetodo('POST');
$usuario = exigirLogin($pdo);

$dados = pegarCorpoJson();
$id = $dados['id'] ?? null;

if (!$id || !is_numeric($id)) {
    responderErro(400, 'Informe o id da reserva.');
}

try {
    // "AND usuario_id = ?" garante que ninguém cancele a reserva de outra pessoa.
    $stmt = $pdo->prepare('SELECT id, status, data_reserva FROM reservas WHERE id = ? AND usuario_id = ?');
    $stmt->execute([$id, $usuario['id']]);
    $reserva = $stmt->fetch();

    if (!$reserva) {
        responderErro(404, 'Reserva não encontrada.');
    }
    if ($reserva['status'] === 'cancelada') {
        responderErro(409, 'Esta reserva já está cancelada.');
    }
    if ($reserva['data_reserva'] && strtotime($reserva['data_reserva']) < time()) {
        responderErro(409, 'Esta reserva já passou e não pode ser cancelada.');
    }

    $pdo->prepare("UPDATE reservas SET status = 'cancelada' WHERE id = ? AND usuario_id = ?")
        ->execute([$id, $usuario['id']]);
} catch (PDOException $erro) {
    responderErroInterno($erro, 'Erro ao cancelar a reserva. Tente novamente.');
}

echo json_encode(['mensagem' => 'Reserva cancelada.']);
