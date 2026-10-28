<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido.']);
    exit;
}

$dados = pegarCorpoJson();
$produtoId = $dados['produto_id'] ?? null;
$quantidade = $dados['quantidade'] ?? null;

if (!$produtoId || !$quantidade || (int) $quantidade <= 0) {
    http_response_code(400);
    echo json_encode(['erro' => 'Informe o produto e uma quantidade válida.']);
    exit;
}

// Busca o produto pra saber o preço — nunca confie no preço vindo do front-end!
$stmt = $pdo->prepare('SELECT * FROM produtos WHERE id = ? AND ativo = 1');
$stmt->execute([$produtoId]);
$produto = $stmt->fetch();

if (!$produto) {
    http_response_code(404);
    echo json_encode(['erro' => 'Produto não encontrado.']);
    exit;
}

$quantidade = (int) $quantidade;

if ($quantidade > 50) {
    http_response_code(400);
    echo json_encode(['erro' => 'Quantidade máxima por pedido: 50 unidades.']);
    exit;
}

$valorTotal = $produto['valor'] * $quantidade;

// Código secreto do pedido: quem comprou sem login usa ele para
// consultar e pagar o próprio pedido (ninguém consegue adivinhar).
$codigoAcesso = bin2hex(random_bytes(16));

$usuario = pegarUsuarioLogado($pdo);
$usuarioId = $usuario['id'] ?? null;

$stmt = $pdo->prepare(
    "INSERT INTO pedidos (usuario_id, produto_id, quantidade, valor_total, status, codigo_acesso)
     VALUES (?, ?, ?, ?, 'pendente', ?)"
);
$stmt->execute([$usuarioId, $produtoId, $quantidade, $valorTotal, $codigoAcesso]);

http_response_code(201);
echo json_encode([
    'mensagem' => 'Pedido registrado! Finalize o pagamento para confirmar.',
    'pedido' => [
        'id' => (int) $pdo->lastInsertId(),
        'produto' => $produto['nome'],
        'quantidade' => (int) $quantidade,
        'valor_total' => (float) $valorTotal,
        'status' => 'pendente',
        'codigo_acesso' => $codigoAcesso,
    ],
]);
