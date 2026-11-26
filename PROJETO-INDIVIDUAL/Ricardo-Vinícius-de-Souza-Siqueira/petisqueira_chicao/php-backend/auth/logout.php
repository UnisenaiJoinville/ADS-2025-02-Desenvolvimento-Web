<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/auth.php';

exigirMetodo('POST');

$usuario = pegarUsuarioLogado($pdo);

if ($usuario) {
    // Apaga o hash do token: ele para de funcionar mesmo que alguém ainda o tenha guardado.
    $pdo->prepare('UPDATE usuarios SET token_hash = NULL, token_expira_em = NULL WHERE id = ?')
        ->execute([$usuario['id']]);
}

echo json_encode(['mensagem' => 'Sessão encerrada com sucesso.']);
