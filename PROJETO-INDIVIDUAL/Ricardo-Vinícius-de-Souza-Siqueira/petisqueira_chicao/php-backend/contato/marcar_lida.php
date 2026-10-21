<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/auth.php';

exigirAdmin($pdo);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido.']);
    exit;
}

$dados = pegarCorpoJson();
$id = $dados['id'] ?? null;
$lida = array_key_exists('lida', $dados) ? (bool) $dados['lida'] : true;

if (!$id) {
    http_response_code(400);
    echo json_encode(['erro' => 'Informe o id da mensagem.']);
    exit;
}

$stmt = $pdo->prepare('UPDATE mensagens_contato SET lida = ? WHERE id = ?');
$stmt->execute([$lida ? 1 : 0, $id]);

if ($stmt->rowCount() === 0) {
    http_response_code(404);
    echo json_encode(['erro' => 'Mensagem não encontrada.']);
    exit;
}

echo json_encode(['mensagem' => 'Mensagem atualizada com sucesso!']);
