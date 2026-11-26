<?php
// Lista os cartões presente emitidos (com comprador) — só administrador.
// Filtros opcionais: ?status=ativo|utilizado|expirado  e  ?q=texto
// (procura no código, no nome ou no e-mail do comprador).
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/cartoes.php';

exigirAdmin($pdo);
exigirMetodo('GET');

$status = $_GET['status'] ?? '';
$busca = trim((string) ($_GET['q'] ?? ''));

try {
    expirarCartoesVencidos($pdo);

    $sql = "SELECT c.*, p.nome_comprador, p.email_comprador, p.pago_em
            FROM cartoes_emitidos c
            JOIN pedidos p ON p.id = c.pedido_id
            WHERE 1 = 1";
    $params = [];

    if (in_array($status, ['ativo', 'utilizado', 'expirado'], true)) {
        $sql .= ' AND c.status = ?';
        $params[] = $status;
    }
    if ($busca !== '') {
        $sql .= ' AND (c.codigo LIKE ? OR p.nome_comprador LIKE ? OR p.email_comprador LIKE ?)';
        $like = '%' . str_replace(['%', '_'], ['\\%', '\\_'], mb_substr($busca, 0, 100)) . '%';
        array_push($params, $like, $like, $like);
    }
    $sql .= ' ORDER BY c.criado_em DESC, c.id DESC LIMIT 500';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $linhas = $stmt->fetchAll();
} catch (PDOException $erro) {
    responderErroInterno($erro, 'Erro ao listar os cartões. Rodou o migration_v3.sql?');
}

echo json_encode(array_map(fn($c) => formatarCartao($c) + [
    'nome_comprador' => $c['nome_comprador'],
    'email_comprador' => $c['email_comprador'],
    'pago_em' => $c['pago_em'],
], $linhas));
