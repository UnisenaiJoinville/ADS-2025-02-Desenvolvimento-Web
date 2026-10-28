<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido.']);
    exit;
}

$usuario = pegarUsuarioLogado($pdo);

if ($usuario) {
    // Apaga o token — assim ele para de funcionar mesmo que
    // alguém ainda tenha ele guardado
    $stmt = $pdo->prepare('UPDATE usuarios SET token = NULL WHERE id = ?');
    $stmt->execute([$usuario['id']]);
}

echo json_encode(['mensagem' => 'Sessão encerrada com sucesso.']);
