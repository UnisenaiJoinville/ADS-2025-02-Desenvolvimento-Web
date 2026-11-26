<?php
// Lista todos os pedidos (com os itens) — só administrador.
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/pedidos.php';

exigirAdmin($pdo);

try {
    $pedidos = $pdo->query('SELECT * FROM pedidos ORDER BY criado_em DESC, id DESC LIMIT 500')->fetchAll();
    $itens = carregarItensDosPedidos($pdo, array_column($pedidos, 'id'));
    $cartoes = carregarCartoesDosPedidos($pdo, array_map('intval', array_column($pedidos, 'id')));
} catch (PDOException $erro) {
    responderErroInterno($erro, 'Erro ao listar os pedidos.');
}

echo json_encode(array_map(fn($p) => formatarPedido($p, $itens[$p['id']] ?? [], $cartoes[(int) $p['id']] ?? null), $pedidos));
