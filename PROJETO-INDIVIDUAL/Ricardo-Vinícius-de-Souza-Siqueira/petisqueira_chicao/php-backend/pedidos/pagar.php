<?php
require_once __DIR__ . '/../includes/cors.php';

// Este endpoint apenas simula a confirmação e fica indisponível por padrão.
// A habilitação nunca é automática; produção deve usar um gateway/webhook real.
if (!defined('SIMULATED_PAYMENTS_ENABLED') || SIMULATED_PAYMENTS_ENABLED !== true) {
    http_response_code(503);
    echo json_encode(['erro' => 'Pagamento indisponível neste ambiente.']);
    exit;
}

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/pedidos.php';
require_once __DIR__ . '/../includes/cartoes.php';
require_once __DIR__ . '/../includes/email.php';
require_once __DIR__ . '/../includes/email_templates.php';

// ATENÇÃO — LEIA ANTES DE COLOCAR O SITE NO AR DE VERDADE:
// Este arquivo apenas MARCA o pedido como "pago" no banco. Ele NÃO
// processa nenhum pagamento real (não valida nem recebe dados de
// cartão, não gera cobrança). É um simulador para testar o fluxo
// completo do site. Número, validade e CVV do cartão NUNCA são
// enviados ao servidor nem guardados.
//
// Para aceitar pagamentos de verdade, integre um gateway (Mercado
// Pago, Stripe, PagSeguro): o status "pago" só deve mudar quando o
// gateway avisar (webhook), nunca por dado vindo do navegador.

exigirMetodo('POST');
limitarRequisicoes($pdo, 'pagar', 30, 3600);

$dados = pegarCorpoJson();
$id = $dados['id'] ?? null;
$codigo = $dados['codigo'] ?? '';
$forma = $dados['forma_pagamento'] ?? '';

if (!$id || !is_numeric($id)) {
    responderErro(400, 'Informe o id do pedido.');
}
if (!in_array($forma, ['pix', 'cartao'], true)) {
    responderErro(400, 'Escolha a forma de pagamento: Pix ou cartão.');
}

try {
    $stmt = $pdo->prepare('SELECT * FROM pedidos WHERE id = ?');
    $stmt->execute([$id]);
    $pedido = $stmt->fetch();

    // Só o dono (logado), um admin ou quem tem o código secreto pode pagar.
    if (!$pedido || !podeAcessarPedido($pedido, pegarUsuarioLogado($pdo), $codigo)) {
        responderErro(404, 'Pedido não encontrado.');
    }
    if ($pedido['status'] === 'pago') {
        responderErro(409, 'Este pedido já foi pago anteriormente.');
    }
    if ($pedido['status'] === 'cancelado') {
        responderErro(409, 'Este pedido foi cancelado e não pode mais ser pago.');
    }

    // Tudo numa transação: marcar o pedido como pago E emitir o cartão
    // (saldo + validade). Se algo falhar, nada fica pela metade.
    $pdo->beginTransaction();

    // Gera o código do cartão (tenta de novo no caso raríssimo de repetir)
    $pago = false;
    for ($tentativa = 0; $tentativa < 5 && !$pago; $tentativa++) {
        $codigoCartao = gerarCodigoCartao();
        try {
            // "AND status = 'pendente'" impede pagar duas vezes (clique duplo / duas abas).
            $up = $pdo->prepare(
                "UPDATE pedidos SET status = 'pago', forma_pagamento = ?, codigo_cartao = ?, pago_em = ?
                 WHERE id = ? AND status = 'pendente'"
            );
            $up->execute([$forma, $codigoCartao, agora(), $id]);
            if ($up->rowCount() !== 1) {
                $pdo->rollBack();
                responderErro(409, 'Este pedido já foi processado.');
            }
            $pago = true;
        } catch (PDOException $e) {
            if ($e->getCode() !== '23000') { // 23000 = código repetido, tenta outro
                throw $e;
            }
        }
    }
    if (!$pago) {
        $pdo->rollBack();
        responderErro(500, 'Não foi possível concluir o pagamento. Tente novamente.');
    }

    // Emite o cartão: saldo = valor do pedido, validade de 6 meses
    $stmt->execute([$id]);
    $pedidoPago = $stmt->fetch();
    $cartao = emitirCartao($pdo, $pedidoPago);
    $pdo->commit();

    // E-mail com o código do cartão (se falhar, o código continua no site)
    $itens = carregarItensDosPedidos($pdo, [(int) $id]);
    $emailEnviado = enviarEmail(
        $pedidoPago['email_comprador'],
        $pedidoPago['nome_comprador'],
        'Pagamento confirmado - seu cartão presente',
        montarEmailPedidoPago($pedidoPago, $itens[(int) $id] ?? [], $cartao)
    );
} catch (PDOException $erro) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    responderErroInterno($erro, 'Erro ao confirmar o pagamento. Tente novamente.');
}

echo json_encode([
    'mensagem' => 'Pagamento confirmado com sucesso! Obrigado pela compra.',
    'pedido_id' => (int) $id,
    'status' => 'pago',
    'codigo_cartao' => $codigoCartao,
    'cartao' => $cartao,
    'email_enviado' => $emailEnviado,
]);
