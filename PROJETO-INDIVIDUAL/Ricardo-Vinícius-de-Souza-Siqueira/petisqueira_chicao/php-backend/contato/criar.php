<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/auth.php';

// Endpoint público — qualquer visitante do site (logado ou não)
// pode mandar uma mensagem pelo formulário "Fale Conosco".

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido.']);
    exit;
}

limitarRequisicoes($pdo, 'contato', 5, 3600);

$dados = pegarCorpoJson();

$nome = trim((string) ($dados['nome'] ?? ''));
$email = trim((string) ($dados['email'] ?? ''));
$mensagem = trim((string) ($dados['mensagem'] ?? ''));

if ($nome === '' || $email === '' || $mensagem === '') {
    http_response_code(400);
    echo json_encode(['erro' => 'Preencha nome, e-mail e mensagem.']);
    exit;
}

if (mb_strlen($nome) > 150 || mb_strlen($mensagem) > 2000) {
    http_response_code(400);
    echo json_encode(['erro' => 'Nome (máx. 150) ou mensagem (máx. 2000 caracteres) muito longos.']);
    exit;
}

if (!emailValido($email)) {
    http_response_code(400);
    echo json_encode(['erro' => 'Informe um e-mail válido.']);
    exit;
}

try {
    $stmt = $pdo->prepare('INSERT INTO mensagens_contato (nome, email, mensagem, criado_em) VALUES (?, ?, ?, ?)');
    $stmt->execute([$nome, $email, $mensagem, agora()]);

    http_response_code(201);
    echo json_encode(['mensagem' => 'Mensagem enviada com sucesso! Em breve retornaremos o contato.']);
} catch (PDOException $erro) {
    responderErroInterno($erro, 'Erro ao enviar a mensagem. Tente novamente.');
}
