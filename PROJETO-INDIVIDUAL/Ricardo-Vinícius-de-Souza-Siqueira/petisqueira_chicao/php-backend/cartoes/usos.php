<?php
// Histórico de usos de um cartão presente (quanto foi descontado e quando).
// Só administrador. GET ?id=...
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/auth.php';

exigirAdmin($pdo);
exigirMetodo('GET');

$id = $_GET['id'] ?? null;
if (!$id || !is_numeric($id)) {
    responderErro(400, 'Informe o cartão (?id=...).');
}

try {
    $stmt = $pdo->prepare(
        "SELECT u.valor, u.saldo_apos, u.observacao, u.usado_em, us.nome AS registrado_por
         FROM usos_cartao u
         LEFT JOIN usuarios us ON us.id = u.registrado_por
         WHERE u.cartao_id = ?
         ORDER BY u.usado_em DESC, u.id DESC"
    );
    $stmt->execute([$id]);
    $usos = $stmt->fetchAll();
} catch (PDOException $erro) {
    responderErroInterno($erro, 'Erro ao buscar o histórico do cartão.');
}

echo json_encode(array_map(fn($u) => [
    'valor' => (float) $u['valor'],
    'saldo_apos' => (float) $u['saldo_apos'],
    'observacao' => $u['observacao'],
    'usado_em' => $u['usado_em'],
    'registrado_por' => $u['registrado_por'],
], $usos));
