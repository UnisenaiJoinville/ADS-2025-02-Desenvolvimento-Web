<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/auth.php';

// Relatório de reservas — só admin.
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

// Garante que inicio <= fim (se vier trocado, inverte)
if ($inicio > $fim) {
    [$inicio, $fim] = [$fim, $inicio];
}

// 1. Totais por status, dentro do período selecionado
$stmtStatus = $pdo->prepare(
    "SELECT status, COUNT(*) AS quantidade
     FROM reservas
     WHERE DATE(criado_em) BETWEEN :inicio AND :fim
     GROUP BY status"
);
$stmtStatus->execute(['inicio' => $inicio, 'fim' => $fim]);
$porStatus = $stmtStatus->fetchAll();

// Garante que os 3 status sempre apareçam no relatório, mesmo com 0
$totaisPorStatus = ['pendente' => 0, 'confirmada' => 0, 'cancelada' => 0];
foreach ($porStatus as $linha) {
    $totaisPorStatus[$linha['status']] = (int) $linha['quantidade'];
}

// 2. Total geral de reservas e de pessoas esperadas (só confirmadas), no período
$stmtTotais = $pdo->prepare(
    "SELECT
        COUNT(*) AS total_reservas,
        COALESCE(SUM(quantidade_pessoas), 0) AS total_pessoas,
        COALESCE(SUM(CASE WHEN status = 'confirmada' THEN quantidade_pessoas ELSE 0 END), 0) AS pessoas_confirmadas
     FROM reservas
     WHERE DATE(criado_em) BETWEEN :inicio AND :fim"
);
$stmtTotais->execute(['inicio' => $inicio, 'fim' => $fim]);
$totais = $stmtTotais->fetch();

// 3. Reservas por dia, dentro do período — pra montar o gráfico
$stmtPorDia = $pdo->prepare(
    "SELECT DATE(criado_em) AS dia, COUNT(*) AS quantidade
     FROM reservas
     WHERE DATE(criado_em) BETWEEN :inicio AND :fim
     GROUP BY DATE(criado_em)
     ORDER BY dia ASC"
);
$stmtPorDia->execute(['inicio' => $inicio, 'fim' => $fim]);
$porDia = $stmtPorDia->fetchAll();

echo json_encode([
    'periodo' => ['inicio' => $inicio, 'fim' => $fim],
    'total_reservas' => (int) $totais['total_reservas'],
    'total_pessoas' => (int) $totais['total_pessoas'],
    'pessoas_confirmadas' => (int) $totais['pessoas_confirmadas'],
    'por_status' => $totaisPorStatus,
    'por_dia' => $porDia,
]);
