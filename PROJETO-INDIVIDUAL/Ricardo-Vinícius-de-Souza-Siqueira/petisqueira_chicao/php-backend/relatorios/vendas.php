<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/auth.php';

// Relatório de vendas dos cartões presente — só admin.
exigirAdmin($pdo);

// --------------------------------------------------------------
// Período do relatório: ?inicio=2026-09-01&fim=2026-09-21
// Se não vier nada (ou vier em formato inválido), usa os últimos
// 30 dias por padrão. Pra ver um dia específico, manda inicio=fim.
// --------------------------------------------------------------
function dataValida($valor) {
    return is_string($valor) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $valor);
}

$fim = dataValida($_GET['fim'] ?? null) ? $_GET['fim'] : date('Y-m-d');
$inicio = dataValida($_GET['inicio'] ?? null) ? $_GET['inicio'] : date('Y-m-d', strtotime($fim . ' -29 days'));

if ($inicio > $fim) {
    [$inicio, $fim] = [$fim, $inicio];
}

try {
    // 1. Resumo (só pedidos PAGOS contam como venda), no período
    $stmtResumo = $pdo->prepare(
        "SELECT COUNT(*) AS total_vendas, COALESCE(SUM(valor_total), 0) AS receita_total
         FROM pedidos
         WHERE status = 'pago' AND DATE(criado_em) BETWEEN ? AND ?"
    );
    $stmtResumo->execute([$inicio, $fim]);
    $resumo = $stmtResumo->fetch();

    $stmtUnid = $pdo->prepare(
        "SELECT COALESCE(SUM(i.quantidade), 0)
         FROM itens_pedido i JOIN pedidos p ON p.id = i.pedido_id
         WHERE p.status = 'pago' AND DATE(p.criado_em) BETWEEN ? AND ?"
    );
    $stmtUnid->execute([$inicio, $fim]);
    $resumo['unidades_vendidas'] = $stmtUnid->fetchColumn();

    // 2. Pedidos ainda não pagos no período
    $stmtPendentes = $pdo->prepare(
        "SELECT COUNT(*) AS total_pendentes, COALESCE(SUM(valor_total), 0) AS valor_pendente
         FROM pedidos
         WHERE status = 'pendente' AND DATE(criado_em) BETWEEN ? AND ?"
    );
    $stmtPendentes->execute([$inicio, $fim]);
    $pendentes = $stmtPendentes->fetch();

    // 3. Vendas por produto (a partir dos ITENS dos pedidos pagos)
    $stmtPorProduto = $pdo->prepare(
        "SELECT pr.id, pr.nome, pr.valor, pr.ativo,
                COALESCE(SUM(CASE WHEN p.id IS NOT NULL THEN i.quantidade ELSE 0 END), 0) AS unidades_vendidas,
                COALESCE(SUM(CASE WHEN p.id IS NOT NULL THEN i.subtotal ELSE 0 END), 0) AS receita
         FROM produtos pr
         LEFT JOIN itens_pedido i ON i.produto_id = pr.id
         LEFT JOIN pedidos p ON p.id = i.pedido_id AND p.status = 'pago' AND DATE(p.criado_em) BETWEEN ? AND ?
         GROUP BY pr.id, pr.nome, pr.valor, pr.ativo
         ORDER BY receita DESC, pr.id"
    );
    $stmtPorProduto->execute([$inicio, $fim]);
    $porProduto = $stmtPorProduto->fetchAll();

    // 4. Vendas por dia (só pagas)
    $stmtPorDia = $pdo->prepare(
        "SELECT DATE(criado_em) AS dia, COUNT(*) AS quantidade, COALESCE(SUM(valor_total), 0) AS receita
         FROM pedidos
         WHERE status = 'pago' AND DATE(criado_em) BETWEEN ? AND ?
         GROUP BY DATE(criado_em)
         ORDER BY dia ASC"
    );
    $stmtPorDia->execute([$inicio, $fim]);
    $porDia = $stmtPorDia->fetchAll();
} catch (PDOException $erro) {
    responderErroInterno($erro, 'Erro ao gerar o relatório de vendas.');
}

// 5. Situação ATUAL dos cartões emitidos (não depende do período): quantos estão
// ativos, utilizados ou expirados e quanto saldo ainda existe em cada situação.
$situacaoCartoes = [
    'ativo' => ['quantidade' => 0, 'saldo' => 0.0],
    'utilizado' => ['quantidade' => 0, 'saldo' => 0.0],
    'expirado' => ['quantidade' => 0, 'saldo' => 0.0],
];
try {
    require_once __DIR__ . '/../includes/cartoes.php';
    expirarCartoesVencidos($pdo);
    foreach ($pdo->query('SELECT status, COUNT(*) AS q, COALESCE(SUM(saldo), 0) AS s FROM cartoes_emitidos GROUP BY status') as $l) {
        $situacaoCartoes[$l['status']] = ['quantidade' => (int) $l['q'], 'saldo' => (float) $l['s']];
    }
} catch (PDOException $erro) {
    error_log('vendas.php (cartoes): ' . $erro->getMessage()); // migration_v3 ainda não rodou
}

echo json_encode([
    'periodo' => ['inicio' => $inicio, 'fim' => $fim],
    'total_vendas' => (int) $resumo['total_vendas'],
    'receita_total' => (float) $resumo['receita_total'],
    'unidades_vendidas' => (int) $resumo['unidades_vendidas'],
    'total_pendentes' => (int) $pendentes['total_pendentes'],
    'valor_pendente' => (float) $pendentes['valor_pendente'],
    'por_produto' => $porProduto,
    'por_dia' => $porDia,
    'situacao_cartoes' => $situacaoCartoes,
]);
