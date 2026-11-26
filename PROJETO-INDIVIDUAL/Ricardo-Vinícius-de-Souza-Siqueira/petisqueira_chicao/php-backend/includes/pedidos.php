<?php
// Funções compartilhadas pelos endpoints de pedidos.
require_once __DIR__ . '/cartoes.php';

// Carrega os itens (detalhe) de vários pedidos de uma vez e devolve
// um array [pedido_id => [itens...]].
function carregarItensDosPedidos(PDO $pdo, array $idsPedidos): array
{
    if (!$idsPedidos) {
        return [];
    }
    $marcadores = implode(',', array_fill(0, count($idsPedidos), '?'));
    $stmt = $pdo->prepare(
        "SELECT i.pedido_id, i.produto_id, pr.nome AS produto_nome, i.quantidade, i.valor_unitario, i.subtotal
         FROM itens_pedido i
         JOIN produtos pr ON pr.id = i.produto_id
         WHERE i.pedido_id IN ($marcadores)
         ORDER BY i.id"
    );
    $stmt->execute(array_values($idsPedidos));

    $porPedido = [];
    foreach ($stmt->fetchAll() as $linha) {
        $porPedido[$linha['pedido_id']][] = [
            'produto_id' => (int) $linha['produto_id'],
            'produto_nome' => $linha['produto_nome'],
            'quantidade' => (int) $linha['quantidade'],
            'valor_unitario' => (float) $linha['valor_unitario'],
            'subtotal' => (float) $linha['subtotal'],
        ];
    }
    return $porPedido;
}

// Formata um pedido para a resposta da API (nunca expõe codigo_acesso;
// o código do cartão só aparece depois de pago).
function formatarPedido(array $p, array $itens, ?array $cartao = null): array
{
    return [
        'id' => (int) $p['id'],
        'status' => $p['status'],
        'forma_pagamento' => $p['forma_pagamento'],
        'valor_total' => (float) $p['valor_total'],
        'nome_comprador' => $p['nome_comprador'],
        'email_comprador' => $p['email_comprador'],
        'codigo_cartao' => $p['status'] === 'pago' ? $p['codigo_cartao'] : null,
        'pago_em' => $p['pago_em'],
        'criado_em' => $p['criado_em'],
        'itens' => $itens,
        // saldo, validade e status do cartão (só existe depois de pago)
        'cartao' => $p['status'] === 'pago' ? $cartao : null,
    ];
}
