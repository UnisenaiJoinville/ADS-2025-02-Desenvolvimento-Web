<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/validation.php';
require_once __DIR__ . '/../includes/reservas.php';
require_once __DIR__ . '/../includes/email.php';
require_once __DIR__ . '/../includes/email_templates.php';

exigirMetodo('POST');
limitarRequisicoes($pdo, 'reserva', 10, 3600);

$dados = pegarCorpoJson();

$nome = trim((string) ($dados['nome'] ?? ''));
$telefone = telefoneNormalizado(trim((string) ($dados['telefone'] ?? '')));
$email = trim((string) ($dados['email'] ?? ''));
$quantidade = $dados['quantidade_pessoas'] ?? null;
$dataReserva = $dados['data_reserva'] ?? null;

if ($nome === '' || $telefone === null || $email === '' || $quantidade === null) {
    responderErro(400, 'Preencha nome, telefone, email e quantidade de pessoas.');
}
$quantidade = inteiroPositivoEstrito($quantidade, 20);
if ($quantidade === null) {
    responderErro(400, 'Quantidade de pessoas inválida.');
}
if (!emailValido($email)) {
    responderErro(400, 'Informe um e-mail válido.');
}
if (mb_strlen($nome) > 150 || mb_strlen($telefone) > 20) {
    responderErro(400, 'Nome ou telefone com tamanho inválido.');
}

// A data e o horário são OBRIGATÓRIOS (a capacidade é controlada por horário).
if ($dataReserva === null || !is_string($dataReserva)) {
    responderErro(400, 'Informe a data e o horário da reserva.');
}

$dt = dataReservaValida($dataReserva);
if (!$dt) {
    responderErro(400, 'Data da reserva inválida.');
}
if ($dt < new DateTime()) {
    responderErro(400, 'A data da reserva não pode estar no passado.');
}
// O restaurante abre de terça (2) a sábado (6), das 18:15 às 23:15.
$diaSemana = (int) $dt->format('N');
$minutos = (int) $dt->format('G') * 60 + (int) $dt->format('i');
if ($diaSemana < 2 || $diaSemana > 6 || $minutos < 18 * 60 + 15 || $minutos > 23 * 60 + 15) {
    responderErro(400, 'Reservas apenas de terça a sábado, entre 18:15 e 23:15.');
}
$dataReserva = $dt->format('Y-m-d H:i:s');

$usuario = pegarUsuarioLogado($pdo);
$usuarioId = $usuario['id'] ?? null;
$inicioHora = $dt->format('Y-m-d H:00:00');
$fimHora = (clone $dt)->setTime((int) $dt->format('G'), 0, 0)->modify('+1 hour')->format('Y-m-d H:i:s');

try {
    // A callback não encerra a requisição: erros de negócio retornam dados para
    // que executarComLockHorario consiga liberar o GET_LOCK no finally.
    $resultado = executarComLockHorario($pdo, $inicioHora, function () use (
        $pdo, $usuarioId, $nome, $telefone, $email, $quantidade, $dataReserva,
        $inicioHora, $fimHora
    ) {
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare(
                "SELECT COALESCE(SUM(quantidade_pessoas), 0) FROM reservas
                 WHERE status <> 'cancelada' AND data_reserva >= ? AND data_reserva < ?"
            );
            $stmt->execute([$inicioHora, $fimHora]);
            $ocupadas = (int) $stmt->fetchColumn();

            if ($ocupadas + $quantidade > capacidadePorHorario()) {
                $pdo->rollBack();
                return [
                    'ok' => false,
                    'codigo' => 409,
                    'mensagem' => 'Esse horário está lotado. Escolha outro horário ou ligue para o restaurante.',
                ];
            }

            $stmt = $pdo->prepare(
                'INSERT INTO reservas (usuario_id, nome, telefone, email, quantidade_pessoas, data_reserva, criado_em)
                 VALUES (?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([$usuarioId, $nome, $telefone, $email, $quantidade, $dataReserva, agora()]);
            $reservaId = (int) $pdo->lastInsertId();

            $pdo->commit();
            return ['ok' => true, 'reserva_id' => $reservaId];
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
    $reservaId = $resultado['reserva_id'];
} catch (PDOException $erro) {
    responderErroInterno($erro, 'Erro ao registrar a reserva. Tente novamente.');
} catch (RuntimeException $erro) {
    responderErroInterno($erro, 'Não foi possível reservar este horário. Tente novamente.');
}

// E-mail de RECEBIMENTO (a confirmação sai depois, quando o admin confirmar).
// Se o e-mail falhar, a reserva continua valendo.
enviarEmail($email, $nome, 'Recebemos o seu pedido de reserva', montarEmailReservaRecebida([
    'nome' => $nome,
    'quantidade_pessoas' => $quantidade,
    'data_reserva' => $dataReserva,
]));

http_response_code(201);
echo json_encode([
    'mensagem' => 'Reserva realizada com sucesso! Em breve entraremos em contato para confirmar.',
    'reserva_id' => $reservaId,
]);
