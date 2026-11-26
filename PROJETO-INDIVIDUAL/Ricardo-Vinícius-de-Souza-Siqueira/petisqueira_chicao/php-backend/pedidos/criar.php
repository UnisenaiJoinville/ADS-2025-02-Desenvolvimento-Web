<?php
// Cria um pedido (MESTRE) com um ou vários itens (DETALHE).
//
// Corpo esperado:
//   { "itens": [ {"produto_id": 1, "quantidade": 2}, {"produto_id": 3, "quantidade": 1} ],
//     "nome": "...", "email": "..." }      <- nome/email só para quem NÃO está logado
//
// O preço NUNCA vem do navegador: é lido do banco e o total é calculado aqui.

require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/validation.php';
require_once __DIR__ . '/../includes/pedidos.php';

exigirMetodo('POST');
limitarRequisicoes($pdo, 'pedido', 20, 3600);

$dados = pegarCorpoJson();

// Compatibilidade: aceita também o formato antigo {produto_id, quantidade}
$itensEnviados = $dados['itens'] ?? null;
if ($itensEnviados === null && isset($dados['produto_id'])) {
    $itensEnviados = [['produto_id' => $dados['produto_id'], 'quantidade' => $dados['quantidade'] ?? 1]];
}

if (!is_array($itensEnviados) || count($itensEnviados) === 0) {
    responderErro(400, 'Adicione pelo menos um item ao pedido.');
}
if (count($itensEnviados) > 20) {
    responderErro(400, 'Máximo de 20 produtos diferentes por pedido.');
}

// Junta linhas repetidas do mesmo produto e valida cada quantidade
$quantidades = [];
foreach ($itensEnviados as $item) {
    $pid = is_array($item) ? ($item['produto_id'] ?? null) : null;
    $qtd = is_array($item) ? ($item['quantidade'] ?? null) : null;

    $pidInteiro = inteiroPositivoEstrito($pid);
    $qtdInteira = inteiroPositivoEstrito($qtd);
    if ($pidInteiro === null || $qtdInteira === null) {
        responderErro(400, 'Item inválido: informe o produto e uma quantidade inteira maior que zero.');
    }
    $quantidades[$pidInteiro] = ($quantidades[$pidInteiro] ?? 0) + $qtdInteira;
}
foreach ($quantidades as $qtd) {
    if ($qtd > 50) {
        responderErro(400, 'Quantidade máxima por produto: 50 unidades.');
    }
}

$usuario = pegarUsuarioLogado($pdo);

// Dados do comprador: o logado usa os da conta; o visitante informa nome e e-mail
// (sem isso não há como entregar o código do cartão).
if ($usuario) {
    $nomeComprador = $usuario['nome'];
    $emailComprador = $usuario['email'];
} else {
    $nomeComprador = trim((string) ($dados['nome'] ?? ''));
    $emailComprador = trim((string) ($dados['email'] ?? ''));

    if ($nomeComprador === '' || mb_strlen($nomeComprador) > 150) {
        responderErro(400, 'Informe o seu nome (máx. 150 caracteres).');
    }
    if (!emailValido($emailComprador)) {
        responderErro(400, 'Informe um e-mail válido para receber o código do cartão.');
    }
}

try {
    // Busca os preços atuais dos produtos ativos
    $ids = array_keys($quantidades);
    $marcadores = implode(',', array_fill(0, count($ids), '?'));
    $stmt = $pdo->prepare("SELECT id, nome, valor FROM produtos WHERE ativo = 1 AND id IN ($marcadores)");
    $stmt->execute($ids);
    $produtos = [];
    foreach ($stmt->fetchAll() as $p) {
        $produtos[(int) $p['id']] = $p;
    }

    foreach ($ids as $pid) {
        if (!isset($produtos[$pid])) {
            responderErro(404, 'Um dos produtos do pedido não está mais disponível.');
        }
    }

    // Totais em centavos (inteiros) para não ter erro de arredondamento
    $linhas = [];
    $totalCentavos = 0;
    foreach ($quantidades as $pid => $qtd) {
        $unitCentavos = (int) round(((float) $produtos[$pid]['valor']) * 100);
        $subCentavos = $unitCentavos * $qtd;
        $totalCentavos += $subCentavos;
        $linhas[] = [$pid, $qtd, $unitCentavos / 100, $subCentavos / 100];
    }

    $codigoAcesso = bin2hex(random_bytes(16));

    $pdo->beginTransaction();

    $pdo->prepare(
        "INSERT INTO pedidos (usuario_id, nome_comprador, email_comprador, valor_total, status, codigo_acesso, criado_em)
         VALUES (?, ?, ?, ?, 'pendente', ?, ?)"
    )->execute([$usuario['id'] ?? null, $nomeComprador, $emailComprador, $totalCentavos / 100, $codigoAcesso, agora()]);
    $pedidoId = (int) $pdo->lastInsertId();

    $stmtItem = $pdo->prepare(
        'INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, valor_unitario, subtotal) VALUES (?, ?, ?, ?, ?)'
    );
    foreach ($linhas as [$pid, $qtd, $unit, $sub]) {
        $stmtItem->execute([$pedidoId, $pid, $qtd, $unit, $sub]);
    }

    $pdo->commit();
} catch (PDOException $erro) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    responderErroInterno($erro, 'Erro ao registrar o pedido. Tente novamente.');
}

http_response_code(201);
echo json_encode([
    'mensagem' => 'Pedido registrado! Finalize o pagamento para confirmar.',
    'pedido' => [
        'id' => $pedidoId,
        'valor_total' => $totalCentavos / 100,
        'status' => 'pendente',
        'codigo_acesso' => $codigoAcesso,
    ],
]);
