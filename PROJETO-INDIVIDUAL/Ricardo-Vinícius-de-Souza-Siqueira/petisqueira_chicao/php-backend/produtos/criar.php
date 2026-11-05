<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/auth.php';

exigirAdmin($pdo);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido.']);
    exit;
}

$dados = pegarCorpoJson();
$nome = trim($dados['nome'] ?? '');
$valor = $dados['valor'] ?? null;
$imagem = trim($dados['imagem'] ?? '');

if ($nome === '' || $valor === null || $valor === '') {
    http_response_code(400);
    echo json_encode(['erro' => 'Informe nome e valor do produto.']);
    exit;
}

if ((float) $valor <= 0) {
    http_response_code(400);
    echo json_encode(['erro' => 'O valor precisa ser maior que zero.']);
    exit;
}

$stmt = $pdo->prepare('INSERT INTO produtos (nome, valor, imagem, ativo) VALUES (?, ?, ?, 1)');
$stmt->execute([$nome, $valor, $imagem !== '' ? $imagem : null]);

http_response_code(201);
echo json_encode([
    'mensagem' => 'Produto criado com sucesso!',
    'produto' => [
        'id' => (int) $pdo->lastInsertId(),
        'nome' => $nome,
        'valor' => (float) $valor,
        'imagem' => $imagem,
        'ativo' => true,
    ],
]);
