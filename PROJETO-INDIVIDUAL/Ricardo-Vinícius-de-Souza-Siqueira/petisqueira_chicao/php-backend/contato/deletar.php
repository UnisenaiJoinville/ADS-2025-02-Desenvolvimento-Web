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

if (!$id) {
    http_response_code(400);
    echo json_encode(['erro' => 'Informe o id da mensagem.']);
    exit;
}

try {
    $stmt = $pdo->prepare('DELETE FROM mensagens_contato WHERE id = ?');
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['erro' => 'Mensagem não encontrada.']);
        exit;
    }

    echo json_encode(['mensagem' => 'Mensagem excluída com sucesso!']);
} catch (PDOException $erro) {
    responderErroInterno($erro, 'Erro ao excluir a mensagem. Tente novamente.');
}
