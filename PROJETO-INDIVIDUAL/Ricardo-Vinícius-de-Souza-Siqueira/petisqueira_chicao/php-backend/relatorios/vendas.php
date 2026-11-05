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

// 1. Resumo geral (só pedidos PAGOS contam como venda de verdade), no período
$stmtResumo = $pdo->prepare(
    "SELECT
        COUNT(*) AS total_vendas,
        COALESCE(SUM(valor_total), 0) AS receita_total,
        COALESCE(SUM(quantidade), 0) AS unidades_vendidas
     FROM pedidos
     WHERE status = 'pago' AND DATE(criado_em) BETWEEN :inicio AND :fim"
);
$stmtResumo->execute(['inicio' => $inicio, 'fim' => $fim]);
$resumo = $stmtResumo->fetch();

// 2. Pedidos ainda não pagos no período (carrinho abandonado / aguardando pagamento)
$stmtPendentes = $pdo->prepare(
    "SELECT
        COUNT(*) AS total_pendentes,
        COALESCE(SUM(valor_total), 0) AS valor_pendente
     FROM pedidos
     WHERE status = 'pendente' AND DATE(criado_em) BETWEEN :inicio AND :fim"
);
$stmtPendentes->execute(['inicio' => $inicio, 'fim' => $fim]);
$pendentes = $stmtPendentes->fetch();

// 3. Vendas por produto no período (quais cartões vendem mais)
$stmtPorProduto = $pdo->prepare(
    "SELECT
        pr.id,
        pr.nome,
        pr.valor,
        pr.ativo,
        COALESCE(SUM(CASE WHEN p.status = 'pago' AND DATE(p.criado_em) BETWEEN :inicio AND :fim THEN p.quantidade ELSE 0 END), 0) AS unidades_vendidas,
        COALESCE(SUM(CASE WHEN p.status = 'pago' AND DATE(p.criado_em) BETWEEN :inicio2 AND :fim2 THEN p.valor_total ELSE 0 END), 0) AS receita
     FROM produtos pr
     LEFT JOIN pedidos p ON p.produto_id = pr.id
     GROUP BY pr.id, pr.nome, pr.valor, pr.ativo
     ORDER BY receita DESC"
);
$stmtPorProduto->execute(['inicio' => $inicio, 'fim' => $fim, 'inicio2' => $inicio, 'fim2' => $fim]);
$porProduto = $stmtPorProduto->fetchAll();

// 4. Vendas por dia no período, só pagas — pra ver a evolução
$stmtPorDia = $pdo->prepare(
    "SELECT DATE(criado_em) AS dia, COUNT(*) AS quantidade, COALESCE(SUM(valor_total), 0) AS receita
     FROM pedidos
     WHERE status = 'pago' AND DATE(criado_em) BETWEEN :inicio AND :fim
     GROUP BY DATE(criado_em)
     ORDER BY dia ASC"
);
$stmtPorDia->execute(['inicio' => $inicio, 'fim' => $fim]);
$porDia = $stmtPorDia->fetchAll();

echo json_encode([
    'periodo' => ['inicio' => $inicio, 'fim' => $fim],
    'total_vendas' => (int) $resumo['total_vendas'],
    'receita_total' => (float) $resumo['receita_total'],
    'unidades_vendidas' => (int) $resumo['unidades_vendidas'],
    'total_pendentes' => (int) $pendentes['total_pendentes'],
    'valor_pendente' => (float) $pendentes['valor_pendente'],
    'por_produto' => $porProduto,
    'por_dia' => $porDia,
]);
