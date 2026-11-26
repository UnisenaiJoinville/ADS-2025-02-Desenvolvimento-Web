<?php
// Cancela um pedido AINDA NÃO PAGO — só administrador.
// (Pedido pago não é cancelado por aqui: exigiria estorno no gateway.)
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/auth.php';

exigirAdmin($pdo);
exigirMetodo('POST');

$dados = pegarCorpoJson();
$id = $dados['id'] ?? null;

if (!$id || !is_numeric($id)) {
    responderErro(400, 'Informe o id do pedido.');
}

try {
    $up = $pdo->prepare("UPDATE pedidos SET status = 'cancelado' WHERE id = ? AND status = 'pendente'");
    $up->execute([$id]);
} catch (PDOException $erro) {
    responderErroInterno($erro, 'Erro ao cancelar o pedido.');
}

if ($up->rowCount() !== 1) {
    responderErro(409, 'Só é possível cancelar pedidos pendentes.');
}

echo json_encode(['mensagem' => 'Pedido cancelado.']);
