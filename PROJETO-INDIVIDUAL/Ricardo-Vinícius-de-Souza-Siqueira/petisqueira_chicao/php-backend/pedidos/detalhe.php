<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/auth.php';

$id = $_GET['id'] ?? null;
$codigo = $_GET['codigo'] ?? '';

if (!$id) {
    responderErro(400, 'Informe o id do pedido (?id=...).');
}

$stmt = $pdo->prepare(
    'SELECT p.*, pr.nome AS produto_nome, pr.imagem AS produto_imagem
     FROM pedidos p
     JOIN produtos pr ON pr.id = p.produto_id
     WHERE p.id = ?'
);
$stmt->execute([$id]);
$pedido = $stmt->fetch();

// Mesma resposta para "não existe" e "não é seu": não revela quais ids existem.
if (!$pedido || !podeAcessarPedido($pedido, pegarUsuarioLogado($pdo), $codigo)) {
    responderErro(404, 'Pedido não encontrado.');
}

unset($pedido['codigo_acesso']);
echo json_encode($pedido);
