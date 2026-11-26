<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/auth.php';

exigirMetodo('POST');
limitarRequisicoes($pdo, 'cadastro', 10, 3600);

$dados = pegarCorpoJson();

$nome = trim((string) ($dados['nome'] ?? ''));
$email = trim((string) ($dados['email'] ?? ''));
$telefone = trim((string) ($dados['telefone'] ?? ''));
$senha = (string) ($dados['senha'] ?? '');

if ($nome === '' || $email === '' || $senha === '') {
    responderErro(400, 'Nome, email e senha são obrigatórios.');
}
if (!emailValido($email)) {
    responderErro(400, 'Informe um e-mail válido.');
}
if (mb_strlen($nome) > 150 || mb_strlen($telefone) > 20) {
    responderErro(400, 'Nome (máx. 150) ou telefone (máx. 20) com tamanho inválido.');
}
if (strlen($senha) < 8) {
    responderErro(400, 'A senha precisa ter no mínimo 8 caracteres.');
}
if (strlen($senha) > 72) {
    responderErro(400, 'A senha pode ter no máximo 72 caracteres.');
}

try {
    $stmt = $pdo->prepare('SELECT id FROM usuarios WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        responderErro(409, 'Já existe uma conta com este e-mail.');
    }

    // NUNCA salvar senha em texto puro: só o hash bcrypt.
    $senhaHash = password_hash($senha, PASSWORD_BCRYPT);

    $stmt = $pdo->prepare('INSERT INTO usuarios (nome, email, telefone, senha_hash, criado_em) VALUES (?, ?, ?, ?, ?)');
    $stmt->execute([$nome, $email, $telefone !== '' ? $telefone : null, $senhaHash, agora()]);
} catch (PDOException $erro) {
    // 23000 = e-mail duplicado numa corrida entre duas requisições (UNIQUE no banco)
    if ($erro->getCode() === '23000') {
        responderErro(409, 'Já existe uma conta com este e-mail.');
    }
    responderErroInterno($erro, 'Erro ao criar a conta. Tente novamente.');
}

http_response_code(201);
echo json_encode([
    'mensagem' => 'Conta criada com sucesso!',
    'usuario' => ['id' => (int) $pdo->lastInsertId(), 'nome' => $nome, 'email' => $email],
]);
