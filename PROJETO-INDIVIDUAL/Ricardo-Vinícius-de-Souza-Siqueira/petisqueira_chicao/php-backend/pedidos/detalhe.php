<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/pedidos.php';

$id = $_GET['id'] ?? null;
$codigo = $_GET['codigo'] ?? '';

if (!$id || !is_numeric($id)) {
    responderErro(400, 'Informe o id do pedido (?id=...).');
}

try {
    $stmt = $pdo->prepare('SELECT * FROM pedidos WHERE id = ?');
    $stmt->execute([$id]);
    $pedido = $stmt->fetch();

    // Mesma resposta para "não existe" e "não é seu": não revela quais ids existem.
    if (!$pedido || !podeAcessarPedido($pedido, pegarUsuarioLogado($pdo), $codigo)) {
        responderErro(404, 'Pedido não encontrado.');
    }

    $itens = carregarItensDosPedidos($pdo, [$pedido['id']]);
    $cartoes = carregarCartoesDosPedidos($pdo, [(int) $pedido['id']]);
} catch (PDOException $erro) {
    responderErroInterno($erro, 'Erro ao carregar o pedido.');
}

echo json_encode(formatarPedido($pedido, $itens[$pedido['id']] ?? [], $cartoes[(int) $pedido['id']] ?? null));
