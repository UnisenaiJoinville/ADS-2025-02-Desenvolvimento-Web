<?php
// "Minha conta": devolve os dados do usuário logado, as reservas que
// ele fez estando logado e os pedidos (compras) dele.
//
// Segurança: o usuário é identificado SOMENTE pelo token (cabeçalho
// Authorization: Bearer <token>). Nada vem da URL, então ninguém
// consegue ver os dados de outra pessoa trocando um número na URL.
// Também nunca devolvemos senha_hash nem token.

// Nunca imprimir erros do PHP na resposta (quebraria o JSON que o front espera).
ini_set('display_errors', '0');

require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido.']);
    exit;
}

$logado = pegarUsuarioLogado($pdo);

if (!$logado) {
    http_response_code(401);
    echo json_encode(['erro' => 'Faça login para continuar.']);
    exit;
}

try {
    // 1. Dados pessoais (só os campos que podem ser exibidos)
    $stmt = $pdo->prepare('SELECT id, nome, email, telefone, criado_em FROM usuarios WHERE id = ?');
    $stmt->execute([$logado['id']]);
    $usuario = $stmt->fetch();

    // 2. Reservas feitas por este usuário (mais recentes primeiro)
    $stmt = $pdo->prepare(
        'SELECT id, data_reserva, quantidade_pessoas, status, criado_em
         FROM reservas
         WHERE usuario_id = ?
         ORDER BY criado_em DESC'
    );
    $stmt->execute([$logado['id']]);
    $reservas = $stmt->fetchAll();

    // 3. Pedidos deste usuário, já com o nome do produto
    $stmt = $pdo->prepare(
        'SELECT p.id, pr.nome AS produto_nome, p.quantidade, p.valor_total, p.status, p.criado_em
         FROM pedidos p
         JOIN produtos pr ON pr.id = p.produto_id
         WHERE p.usuario_id = ?
         ORDER BY p.criado_em DESC'
    );
    $stmt->execute([$logado['id']]);
    $pedidos = $stmt->fetchAll();
} catch (PDOException $erro) {
    // O detalhe técnico vai só para o log do servidor (não para o navegador).
    error_log('minha_conta.php: ' . $erro->getMessage());
    http_response_code(500);
    echo json_encode([
        'erro' => 'O banco de dados está desatualizado. No MySQL Workbench, execute o arquivo ' .
                  'php-backend/database/migration_minha_conta.sql e tente de novo.',
    ]);
    exit;
}

echo json_encode([
    'usuario' => $usuario,
    'reservas' => $reservas,
    'pedidos' => $pedidos,
]);
