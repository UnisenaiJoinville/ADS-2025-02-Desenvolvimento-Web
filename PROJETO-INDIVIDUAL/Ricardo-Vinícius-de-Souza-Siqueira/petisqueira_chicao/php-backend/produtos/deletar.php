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
    echo json_encode(['erro' => 'Informe o id do produto.']);
    exit;
}

// Isso NÃO apaga o produto do banco — só marca como "ativo = 0".
// Fazemos assim porque, se o produto já foi comprado antes (existe
// um pedido referenciando ele), apagar de verdade quebraria o
// histórico de pedidos antigos. Um produto desativado simplesmente
// para de aparecer na loja.
$stmt = $pdo->prepare('UPDATE produtos SET ativo = 0 WHERE id = ?');
$stmt->execute([$id]);

if ($stmt->rowCount() === 0) {
    http_response_code(404);
    echo json_encode(['erro' => 'Produto não encontrado.']);
    exit;
}

echo json_encode(['mensagem' => 'Produto desativado com sucesso! Ele não aparece mais na loja.']);
