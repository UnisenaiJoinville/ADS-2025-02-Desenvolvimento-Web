<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../config/db.php';

// Rota pública — usada na página de pagamento (pagamento.html?id=2)
$id = $_GET['id'] ?? null;

if (!$id) {
    http_response_code(400);
    echo json_encode(['erro' => 'Informe o id do produto (?id=...).']);
    exit;
}

$stmt = $pdo->prepare('SELECT * FROM produtos WHERE id = ?');
$stmt->execute([$id]);
$produto = $stmt->fetch();

if (!$produto) {
    http_response_code(404);
    echo json_encode(['erro' => 'Produto não encontrado.']);
    exit;
}

echo json_encode($produto);
