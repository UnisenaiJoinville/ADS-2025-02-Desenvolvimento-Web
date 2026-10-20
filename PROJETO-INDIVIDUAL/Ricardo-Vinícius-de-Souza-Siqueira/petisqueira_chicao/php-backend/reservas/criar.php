<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido.']);
    exit;
}

$dados = pegarCorpoJson();

$nome = trim($dados['nome'] ?? '');
$telefone = trim($dados['telefone'] ?? '');
$email = trim($dados['email'] ?? '');
$quantidade = $dados['quantidade_pessoas'] ?? null;
$dataReserva = $dados['data_reserva'] ?? null;

if ($nome === '' || $telefone === '' || $email === '' || !$quantidade) {
    http_response_code(400);
    echo json_encode(['erro' => 'Preencha nome, telefone, email e quantidade de pessoas.']);
    exit;
}

if ((int) $quantidade <= 0) {
    http_response_code(400);
    echo json_encode(['erro' => 'Quantidade de pessoas inválida.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['erro' => 'Informe um e-mail válido.']);
    exit;
}

if ((int) $quantidade > 20) {
    http_response_code(400);
    echo json_encode(['erro' => 'Para grupos com mais de 20 pessoas, entre em contato pelo telefone.']);
    exit;
}

if (mb_strlen($nome) > 150 || mb_strlen($telefone) > 20 || mb_strlen($email) > 150) {
    http_response_code(400);
    echo json_encode(['erro' => 'Nome, telefone ou e-mail com tamanho inválido.']);
    exit;
}

if ($dataReserva) {
    $dt = DateTime::createFromFormat('Y-m-d H:i:s', $dataReserva) ?: DateTime::createFromFormat('Y-m-d\TH:i', $dataReserva);
    if (!$dt) {
        http_response_code(400);
        echo json_encode(['erro' => 'Data da reserva inválida.']);
        exit;
    }
    if ($dt < new DateTime()) {
        http_response_code(400);
        echo json_encode(['erro' => 'A data da reserva não pode estar no passado.']);
        exit;
    }
    // O restaurante abre de terça (2) a sábado (6), das 18:15 às 23:15.
    $diaSemana = (int) $dt->format('N');
    $minutos = (int) $dt->format('G') * 60 + (int) $dt->format('i');
    if ($diaSemana < 2 || $diaSemana > 6 || $minutos < 18 * 60 + 15 || $minutos > 23 * 60 + 15) {
        http_response_code(400);
        echo json_encode(['erro' => 'Reservas apenas de terça a sábado, entre 18:15 e 23:15.']);
        exit;
    }
    $dataReserva = $dt->format('Y-m-d H:i:s');
}

// Se o cliente estiver logado (mandou o token), guardamos o id dele.
// Reserva sem login também é permitida.
$usuario = pegarUsuarioLogado($pdo);
$usuarioId = $usuario['id'] ?? null;

$stmt = $pdo->prepare(
    'INSERT INTO reservas (usuario_id, nome, telefone, email, quantidade_pessoas, data_reserva)
     VALUES (?, ?, ?, ?, ?, ?)'
);
$stmt->execute([$usuarioId, $nome, $telefone, $email, (int) $quantidade, $dataReserva ?: null]);

http_response_code(201);
echo json_encode([
    'mensagem' => 'Reserva realizada com sucesso! Em breve entraremos em contato para confirmar.',
    'reserva_id' => (int) $pdo->lastInsertId(),
]);
