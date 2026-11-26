<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/validation.php';
require_once __DIR__ . '/../includes/reservas.php';
require_once __DIR__ . '/../includes/email.php';
require_once __DIR__ . '/../includes/email_templates.php';

exigirAdmin($pdo);
exigirMetodo('POST');

$dados = pegarCorpoJson();
$id = inteiroPositivoEstrito($dados['id'] ?? null);

if ($id === null) {
    responderErro(400, 'Informe o id da reserva.');
}

// A data não é editável neste endpoint; esta leitura só identifica o lock do
// slot. O registro é relido com FOR UPDATE dentro da transação.
$stmt = $pdo->prepare('SELECT data_reserva FROM reservas WHERE id = ?');
$stmt->execute([$id]);
$preReserva = $stmt->fetch();

if (!$preReserva) {
    responderErro(404, 'Reserva não encontrada.');
}

if ($preReserva['data_reserva'] !== null) {
    try {
        $slot = (new DateTime($preReserva['data_reserva']))->format('Y-m-d H:00:00');
    } catch (Throwable $erro) {
        responderErroInterno($erro, 'Não foi possível atualizar a reserva.');
    }
} else {
    // Compatibilidade com registros antigos sem data; eles não participam da
    // capacidade por slot, mas ainda têm uma chave exclusiva para a operação.
    $slot = 'sem-horario:' . $id;
}

try {
    $resultado = executarComLockHorario($pdo, $slot, function () use ($pdo, $id, $dados) {
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare('SELECT * FROM reservas WHERE id = ? FOR UPDATE');
            $stmt->execute([$id]);
            $atual = $stmt->fetch();

            if (!$atual) {
                $pdo->rollBack();
                return ['ok' => false, 'codigo' => 404, 'mensagem' => 'Reserva não encontrada.'];
            }

            $statusPermitidos = ['pendente', 'confirmada', 'cancelada'];
            $status = $dados['status'] ?? $atual['status'];
            if (!in_array($status, $statusPermitidos, true)) {
                $pdo->rollBack();
                return ['ok' => false, 'codigo' => 400, 'mensagem' => 'Status inválido. Use pendente, confirmada ou cancelada.'];
            }

            $nome = trim((string) ($dados['nome'] ?? $atual['nome']));
            $telefone = telefoneNormalizado(trim((string) ($dados['telefone'] ?? $atual['telefone'])));
            $email = trim((string) ($dados['email'] ?? $atual['email']));
            $quantidade = array_key_exists('quantidade_pessoas', $dados)
                ? inteiroPositivoEstrito($dados['quantidade_pessoas'], 20)
                : inteiroPositivoEstrito((int) $atual['quantidade_pessoas'], 20);

            if ($nome === '' || mb_strlen($nome) > 150 || $telefone === null) {
                $pdo->rollBack();
                return ['ok' => false, 'codigo' => 400, 'mensagem' => 'Nome ou telefone inválido.'];
            }
            if (!emailValido($email)) {
                $pdo->rollBack();
                return ['ok' => false, 'codigo' => 400, 'mensagem' => 'Informe um e-mail válido.'];
            }
            if ($quantidade === null) {
                $pdo->rollBack();
                return ['ok' => false, 'codigo' => 400, 'mensagem' => 'Quantidade de pessoas deve ficar entre 1 e 20.'];
            }

            // Transições permitidas: uma reserva cancelada é definitiva.
            if ($atual['status'] === 'cancelada' && $status !== 'cancelada') {
                $pdo->rollBack();
                return [
                    'ok' => false,
                    'codigo' => 409,
                    'mensagem' => 'Uma reserva cancelada não pode ser reaberta. Peça ao cliente para fazer uma nova reserva.',
                ];
            }

            // A soma inclui a linha atual; subtraímos sua ocupação antiga e
            // adicionamos a nova somente se o novo status for ativo.
            if ($atual['data_reserva'] !== null && $status !== 'cancelada') {
                $dt = new DateTime($atual['data_reserva']);
                $inicioHora = $dt->format('Y-m-d H:00:00');
                $fimHora = (clone $dt)->setTime((int) $dt->format('G'), 0, 0)
                    ->modify('+1 hour')->format('Y-m-d H:i:s');
                $stmt = $pdo->prepare(
                    "SELECT COALESCE(SUM(quantidade_pessoas), 0) FROM reservas
                     WHERE status <> 'cancelada' AND data_reserva >= ? AND data_reserva < ?"
                );
                $stmt->execute([$inicioHora, $fimHora]);
                $ocupadas = (int) $stmt->fetchColumn() - ($atual['status'] === 'cancelada' ? 0 : (int) $atual['quantidade_pessoas']);

                if ($ocupadas + $quantidade > capacidadePorHorario()) {
                    $pdo->rollBack();
                    return [
                        'ok' => false,
                        'codigo' => 409,
                        'mensagem' => 'Esse horário está lotado. Reduza a quantidade ou escolha outra reserva.',
                    ];
                }
            }

            $stmt = $pdo->prepare(
                'UPDATE reservas SET nome = ?, telefone = ?, email = ?, quantidade_pessoas = ?, status = ? WHERE id = ?'
            );
            $stmt->execute([$nome, $telefone, $email, $quantidade, $status, $id]);

            $vaiConfirmarAgora = $status === 'confirmada' && $atual['status'] !== 'confirmada';
            $reservaAtualizada = array_merge($atual, [
                'nome' => $nome,
                'telefone' => $telefone,
                'email' => $email,
                'quantidade_pessoas' => $quantidade,
                'status' => $status,
            ]);

            $pdo->commit();
            return [
                'ok' => true,
                'vai_confirmar' => $vaiConfirmarAgora,
                'reserva' => $reservaAtualizada,
            ];
        } catch (Throwable $erro) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $erro;
        }
    });

    if (!$resultado['ok']) {
        responderErro($resultado['codigo'], $resultado['mensagem']);
    }

    $emailEnviado = null;
    if ($resultado['vai_confirmar']) {
        $reservaAtualizada = $resultado['reserva'];
        $corpo = montarEmailConfirmacaoReserva($reservaAtualizada);
        $emailEnviado = enviarEmail(
            $reservaAtualizada['email'],
            $reservaAtualizada['nome'],
            'Sua reserva foi confirmada! 🎉',
            $corpo
        );

        if ($emailEnviado) {
            $pdo->prepare('UPDATE reservas SET confirmacao_enviada_em = ? WHERE id = ?')
                ->execute([agora(), $id]);
        }
    }

    $resposta = ['mensagem' => 'Reserva atualizada com sucesso!'];
    if ($resultado['vai_confirmar']) {
        $resposta['email_confirmacao_enviado'] = $emailEnviado;
        if (!$emailEnviado) {
            $resposta['aviso'] = 'A reserva foi confirmada, mas não foi possível enviar o e-mail de confirmação agora.';
        }
    }
    echo json_encode($resposta);
} catch (PDOException $erro) {
    responderErroInterno($erro, 'Erro ao atualizar a reserva. Tente novamente.');
} catch (RuntimeException $erro) {
    responderErroInterno($erro, 'Não foi possível atualizar a reserva. Tente novamente.');
}
