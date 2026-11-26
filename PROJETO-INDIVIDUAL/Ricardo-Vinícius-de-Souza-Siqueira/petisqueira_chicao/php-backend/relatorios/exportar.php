<?php
// Exporta relatórios em CSV (abre direto no Excel / Google Planilhas).
//
//   GET /relatorios/exportar.php?tipo=reservas|vendas&inicio=AAAA-MM-DD&fim=AAAA-MM-DD
//
// Só administrador. O período filtra pela data de criação do registro.

require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/auth.php';

exigirAdmin($pdo);
exigirMetodo('GET');

function dataValida($valor) {
    return is_string($valor) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $valor) && strtotime($valor) !== false;
}

$tipo = $_GET['tipo'] ?? '';
if (!in_array($tipo, ['reservas', 'vendas'], true)) {
    responderErro(400, 'Informe tipo=reservas ou tipo=vendas.');
}

$fim = dataValida($_GET['fim'] ?? null) ? $_GET['fim'] : date('Y-m-d');
$inicio = dataValida($_GET['inicio'] ?? null) ? $_GET['inicio'] : date('Y-m-d', strtotime($fim . ' -29 days'));
if ($inicio > $fim) {
    [$inicio, $fim] = [$fim, $inicio];
}

// Proteção contra "injeção de fórmula" no Excel: textos que começam com
// = + - @ viram texto comum (um apóstrofo na frente).
function celulaCsv($valor) {
    if (is_string($valor) && $valor !== '' && strpos("=+-@\t\r", $valor[0]) !== false) {
        return "'" . $valor;
    }
    return $valor;
}

function moeda($v) {
    return number_format((float) $v, 2, ',', '');
}

try {
    if ($tipo === 'reservas') {
        $stmt = $pdo->prepare(
            'SELECT id, criado_em, nome, telefone, email, quantidade_pessoas, data_reserva, status
             FROM reservas WHERE DATE(criado_em) BETWEEN ? AND ? ORDER BY criado_em, id'
        );
        $stmt->execute([$inicio, $fim]);
        $cabecalho = ['ID', 'Criada em', 'Nome', 'Telefone', 'E-mail', 'Pessoas', 'Data e hora da reserva', 'Status'];
        $linhas = array_map(fn($r) => [
            $r['id'], $r['criado_em'], $r['nome'], $r['telefone'], $r['email'],
            $r['quantidade_pessoas'], $r['data_reserva'] ?? '', $r['status'],
        ], $stmt->fetchAll());
    } else {
        // uma linha por ITEM de pedido (pedido mestre + itens detalhe)
        $stmt = $pdo->prepare(
            "SELECT p.id, p.criado_em, p.status, p.forma_pagamento, p.nome_comprador, p.email_comprador,
                    pr.nome AS produto, i.quantidade, i.valor_unitario, i.subtotal
             FROM pedidos p
             JOIN itens_pedido i ON i.pedido_id = p.id
             JOIN produtos pr ON pr.id = i.produto_id
             WHERE p.status = 'pago' AND DATE(p.criado_em) BETWEEN ? AND ?
             ORDER BY p.criado_em, p.id, i.id"
        );
        $stmt->execute([$inicio, $fim]);
        $cabecalho = ['Pedido', 'Data', 'Status', 'Pagamento', 'Comprador', 'E-mail', 'Produto', 'Quantidade', 'Valor unitário (R$)', 'Subtotal (R$)'];
        $linhas = array_map(fn($r) => [
            $r['id'], $r['criado_em'], $r['status'], $r['forma_pagamento'] ?? '', $r['nome_comprador'],
            $r['email_comprador'], $r['produto'], $r['quantidade'], moeda($r['valor_unitario']), moeda($r['subtotal']),
        ], $stmt->fetchAll());
    }
} catch (PDOException $erro) {
    responderErroInterno($erro, 'Erro ao gerar o arquivo.');
}

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="relatorio-' . $tipo . '-' . $inicio . '_a_' . $fim . '.csv"');

$saida = fopen('php://output', 'w');
fwrite($saida, "\xEF\xBB\xBF"); // BOM: o Excel reconhece os acentos (UTF-8)
fputcsv($saida, $cabecalho, ';');
foreach ($linhas as $linha) {
    fputcsv($saida, array_map('celulaCsv', $linha), ';');
}
fclose($saida);
