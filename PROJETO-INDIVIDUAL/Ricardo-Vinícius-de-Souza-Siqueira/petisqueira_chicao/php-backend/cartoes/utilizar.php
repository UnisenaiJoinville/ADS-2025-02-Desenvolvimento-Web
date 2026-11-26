<?php
// Registra o USO de um cartão presente no restaurante: desconta um valor do
// saldo. Só administrador. Corpo: { id, valor, observacao? }
//
// Regras: o cartão precisa estar ativo (não expirado e com saldo) e o valor
// não pode passar do saldo. Se o saldo chegar a zero o status vira "utilizado".
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/cartoes.php';

$admin = exigirAdmin($pdo);
exigirMetodo('POST');
limitarRequisicoes($pdo, 'usar_cartao', 200, 3600);

$dados = pegarCorpoJson();
$id = $dados['id'] ?? null;
$valor = $dados['valor'] ?? null;
$observacao = trim((string) ($dados['observacao'] ?? ''));

if (!$id || !is_numeric($id)) {
    responderErro(400, 'Informe o cartão.');
}
if (!is_numeric($valor) || (float) $valor <= 0) {
    responderErro(400, 'Informe um valor maior que zero.');
}
if (mb_strlen($observacao) > 255) {
    responderErro(400, 'A observação pode ter no máximo 255 caracteres.');
}

// Trabalha em centavos (inteiros) para não ter erro de arredondamento.
$centavosUso = (int) round((float) $valor * 100);
if ($centavosUso < 1) {
    responderErro(400, 'O valor mínimo de uso é R$ 0,01.');
}

try {
    $pdo->beginTransaction();

    // FOR UPDATE: trava a linha, assim dois usos ao mesmo tempo não gastam o mesmo saldo.
    $stmt = $pdo->prepare('SELECT * FROM cartoes_emitidos WHERE id = ? FOR UPDATE');
    $stmt->execute([$id]);
    $cartao = $stmt->fetch();

    if (!$cartao) {
        $pdo->rollBack();
        responderErro(404, 'Cartão não encontrado.');
    }

    $dataValidade = date('d/m/Y', strtotime($cartao['validade']));
    if ($cartao['status'] === 'expirado' || strtotime($cartao['validade']) < time()) {
        $pdo->prepare("UPDATE cartoes_emitidos SET status = 'expirado' WHERE id = ? AND status = 'ativo'")->execute([$id]);
        $pdo->commit();
        responderErro(409, "Este cartão expirou em {$dataValidade}.");
    }
    if ($cartao['status'] === 'utilizado') {
        $pdo->rollBack();
        responderErro(409, 'Este cartão já foi totalmente utilizado (sem saldo).');
    }

    $centavosSaldo = (int) round((float) $cartao['saldo'] * 100);
    if ($centavosUso > $centavosSaldo) {
        $pdo->rollBack();
        responderErro(409, 'O valor é maior que o saldo do cartão (R$ ' . number_format($centavosSaldo / 100, 2, ',', '.') . ').');
    }

    $novoSaldo = ($centavosSaldo - $centavosUso) / 100;
    $novoStatus = $centavosSaldo - $centavosUso === 0 ? 'utilizado' : 'ativo';

    $pdo->prepare('UPDATE cartoes_emitidos SET saldo = ?, status = ? WHERE id = ?')
        ->execute([number_format($novoSaldo, 2, '.', ''), $novoStatus, $id]);
    $pdo->prepare(
        'INSERT INTO usos_cartao (cartao_id, valor, saldo_apos, observacao, registrado_por, usado_em)
         VALUES (?, ?, ?, ?, ?, ?)'
    )->execute([
        $id, number_format($centavosUso / 100, 2, '.', ''), number_format($novoSaldo, 2, '.', ''),
        $observacao !== '' ? $observacao : null, $admin['id'], agora(),
    ]);

    $pdo->commit();
} catch (PDOException $erro) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    responderErroInterno($erro, 'Erro ao registrar o uso do cartão.');
}

echo json_encode([
    'mensagem' => $novoStatus === 'utilizado'
        ? 'Uso registrado. O saldo do cartão chegou a zero.'
        : 'Uso registrado com sucesso.',
    'saldo' => $novoSaldo,
    'status' => $novoStatus,
]);
