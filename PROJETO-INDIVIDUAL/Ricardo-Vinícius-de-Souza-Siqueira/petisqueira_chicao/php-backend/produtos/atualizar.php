<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/auth.php';

exigirAdmin($pdo);

// Usamos POST em vez de PUT de propósito, pra manter as coisas
// simples (PHP puro lida com PUT de um jeito meio estranho às vezes).
// Envie {id, ...os campos que quer mudar} no corpo da requisição.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido.']);
    exit;
}

$dados = pegarCorpoJson();
$id = $dados['id'] ?? null;

if (!$id) {
    http_response_code(400);
    echo json_encode(['erro' => 'Informe o id do produto.']);
    exit;
}

$stmt = $pdo->prepare('SELECT * FROM produtos WHERE id = ?');
$stmt->execute([$id]);
$atual = $stmt->fetch();

if (!$atual) {
    http_response_code(404);
    echo json_encode(['erro' => 'Produto não encontrado.']);
    exit;
}

if (array_key_exists('valor', $dados) && (float) $dados['valor'] <= 0) {
    http_response_code(400);
    echo json_encode(['erro' => 'O valor precisa ser maior que zero.']);
    exit;
}

// Só troca o que veio na requisição — o resto mantém como já estava
$nome = $dados['nome'] ?? $atual['nome'];
$valor = $dados['valor'] ?? $atual['valor'];
$imagem = $dados['imagem'] ?? $atual['imagem'];
$ativo = array_key_exists('ativo', $dados) ? ($dados['ativo'] ? 1 : 0) : $atual['ativo'];

$stmt = $pdo->prepare('UPDATE produtos SET nome = ?, valor = ?, imagem = ?, ativo = ? WHERE id = ?');
$stmt->execute([$nome, $valor, $imagem, $ativo, $id]);

echo json_encode(['mensagem' => 'Produto atualizado com sucesso!']);
