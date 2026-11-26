<?php
// Regras do cartão presente: saldo, validade e status.
//
// Cada pedido PAGO gera um cartão (tabela cartoes_emitidos) com:
//  - o código de resgate (o mesmo de pedidos.codigo_cartao);
//  - saldo inicial = valor total do pedido;
//  - validade de CARTAO_VALIDADE_MESES meses a partir do pagamento.
// O saldo pode ser usado aos poucos; cada uso vira uma linha em usos_cartao.
//
// Regra de negócio: UM cartão por pedido. Comprar 2 cartões de R$ 100 gera um
// cartão de R$ 200, que o comprador pode usar em várias visitas (uso parcial).
// Quem quiser presentear duas pessoas faz dois pedidos.
//
// Status: ativo -> utilizado (saldo chegou a zero) ou expirado (passou da validade).

const CARTAO_VALIDADE_MESES = 6;

// Data de validade (fim do dia) a partir da data do pagamento.
// Ex.: pago em 31/08 + 6 meses = 28/02 (não "pula" para março).
function validadeDoCartao(string $dataPagamento): string
{
    $d = new DateTime($dataPagamento);
    $dia = (int) $d->format('j');
    $d->modify('first day of +' . CARTAO_VALIDADE_MESES . ' months');
    $d->setDate((int) $d->format('Y'), (int) $d->format('n'), min($dia, (int) $d->format('t')));
    return $d->format('Y-m-d') . ' 23:59:59';
}

// Cria o cartão de um pedido que acabou de ser pago. $pedido é a linha da
// tabela pedidos já com status 'pago', codigo_cartao e pago_em preenchidos.
function emitirCartao(PDO $pdo, array $pedido): array
{
    $validade = validadeDoCartao($pedido['pago_em']);
    $pdo->prepare(
        "INSERT INTO cartoes_emitidos (pedido_id, codigo, valor_inicial, saldo, validade, status, criado_em)
         VALUES (?, ?, ?, ?, ?, 'ativo', ?)"
    )->execute([
        $pedido['id'], $pedido['codigo_cartao'], $pedido['valor_total'], $pedido['valor_total'],
        $validade, $pedido['pago_em'],
    ]);

    return [
        'id' => (int) $pdo->lastInsertId(),
        'pedido_id' => (int) $pedido['id'],
        'codigo' => $pedido['codigo_cartao'],
        'valor_inicial' => (float) $pedido['valor_total'],
        'saldo' => (float) $pedido['valor_total'],
        'validade' => $validade,
        'status' => 'ativo',
    ];
}

// Marca como "expirado" todo cartão ativo que passou da validade.
// Chamado antes de listar/consultar, assim não precisa de rotina agendada.
function expirarCartoesVencidos(PDO $pdo): void
{
    $pdo->prepare("UPDATE cartoes_emitidos SET status = 'expirado' WHERE status = 'ativo' AND validade < ?")
        ->execute([agora()]);
}

// Formata um cartão para a resposta da API.
function formatarCartao(array $c): array
{
    return [
        'id' => (int) $c['id'],
        'pedido_id' => (int) $c['pedido_id'],
        'codigo' => $c['codigo'],
        'valor_inicial' => (float) $c['valor_inicial'],
        'saldo' => (float) $c['saldo'],
        'validade' => $c['validade'],
        'status' => $c['status'],
    ];
}

// Carrega os cartões de vários pedidos de uma vez: [pedido_id => cartão].
function carregarCartoesDosPedidos(PDO $pdo, array $idsPedidos): array
{
    if (!$idsPedidos) {
        return [];
    }
    try {
        expirarCartoesVencidos($pdo);
        $marcadores = implode(',', array_fill(0, count($idsPedidos), '?'));
        $stmt = $pdo->prepare("SELECT * FROM cartoes_emitidos WHERE pedido_id IN ($marcadores)");
        $stmt->execute(array_values($idsPedidos));
    } catch (PDOException $e) {
        // Tabela ainda não criada (migration_v3.sql não rodou): o resto do site continua funcionando.
        error_log('cartoes.php: ' . $e->getMessage());
        return [];
    }

    $porPedido = [];
    foreach ($stmt->fetchAll() as $linha) {
        $porPedido[(int) $linha['pedido_id']] = formatarCartao($linha);
    }
    return $porPedido;
}
