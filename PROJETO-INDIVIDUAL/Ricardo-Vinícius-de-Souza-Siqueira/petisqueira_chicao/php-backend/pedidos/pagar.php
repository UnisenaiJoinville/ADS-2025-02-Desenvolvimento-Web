<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/auth.php';

// ATENÇÃO — LEIA ANTES DE COLOCAR O SITE NO AR DE VERDADE:
// Este arquivo apenas MARCA o pedido como "pago" no banco. Ele NÃO
// processa nenhum pagamento real (não valida cartão, não gera
// cobrança). É um simulador pra testar o fluxo completo do site.
//
// Pra aceitar pagamentos de verdade, integre um gateway (Mercado
// Pago, Stripe, PagSeguro) — eles processam o pagamento com
// segurança e avisam via webhook quando foi realmente aprovado.

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido.']);
    exit;
}

$dados = pegarCorpoJson();
$id = $dados['id'] ?? null;
$codigo = $dados['codigo'] ?? '';

if (!$id) {
    http_response_code(400);
    echo json_encode(['erro' => 'Informe o id do pedido.']);
    exit;
}

$stmt = $pdo->prepare('SELECT * FROM pedidos WHERE id = ?');
$stmt->execute([$id]);
$pedido = $stmt->fetch();

// Só o dono do pedido (logado), um admin ou quem tem o código secreto pode pagar.
if ($pedido && !podeAcessarPedido($pedido, pegarUsuarioLogado($pdo), $codigo)) {
    $pedido = false;
}

if (!$pedido) {
    http_response_code(404);
    echo json_encode(['erro' => 'Pedido não encontrado.']);
    exit;
}

if ($pedido['status'] === 'pago') {
    http_response_code(400);
    echo json_encode(['erro' => 'Este pedido já foi pago anteriormente.']);
    exit;
}

if ($pedido['status'] === 'cancelado') {
    http_response_code(400);
    echo json_encode(['erro' => 'Este pedido foi cancelado e não pode mais ser pago.']);
    exit;
}

$stmt = $pdo->prepare("UPDATE pedidos SET status = 'pago' WHERE id = ? AND status = 'pendente'");
$stmt->execute([$id]);

echo json_encode([
    'mensagem' => 'Pagamento confirmado com sucesso! Obrigado pela compra.',
    'pedido_id' => (int) $id,
    'status' => 'pago',
]);
