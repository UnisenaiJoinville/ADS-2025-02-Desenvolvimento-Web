<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido.']);
    exit;
}

$dados = pegarCorpoJson();

$nome = trim($dados['nome'] ?? '');
$email = trim($dados['email'] ?? '');
$telefone = trim($dados['telefone'] ?? '');
$senha = $dados['senha'] ?? '';

// 1. Validação básica
if ($nome === '' || $email === '' || $senha === '') {
    http_response_code(400);
    echo json_encode(['erro' => 'Nome, email e senha são obrigatórios.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 150) {
    http_response_code(400);
    echo json_encode(['erro' => 'Informe um e-mail válido.']);
    exit;
}

if (mb_strlen($nome) > 150 || mb_strlen($telefone) > 20) {
    http_response_code(400);
    echo json_encode(['erro' => 'Nome (máx. 150) ou telefone (máx. 20) com tamanho inválido.']);
    exit;
}

if (strlen($senha) > 72) {
    http_response_code(400);
    echo json_encode(['erro' => 'A senha pode ter no máximo 72 caracteres.']);
    exit;
}

if (strlen($senha) < 6) {
    http_response_code(400);
    echo json_encode(['erro' => 'A senha precisa ter no mínimo 6 caracteres.']);
    exit;
}

// 2. Verifica se o e-mail já existe
$stmt = $pdo->prepare('SELECT id FROM usuarios WHERE email = ?');
$stmt->execute([$email]);

if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(['erro' => 'Já existe uma conta com este e-mail.']);
    exit;
}

// 3. Criptografa a senha (NUNCA salvar senha em texto puro)
$senhaHash = password_hash($senha, PASSWORD_BCRYPT);

// 4. Salva o novo usuário
$stmt = $pdo->prepare('INSERT INTO usuarios (nome, email, telefone, senha_hash) VALUES (?, ?, ?, ?)');
$stmt->execute([$nome, $email, $telefone !== '' ? $telefone : null, $senhaHash]);

http_response_code(201);
echo json_encode([
    'mensagem' => 'Conta criada com sucesso!',
    'usuario' => ['id' => (int) $pdo->lastInsertId(), 'nome' => $nome, 'email' => $email],
]);
