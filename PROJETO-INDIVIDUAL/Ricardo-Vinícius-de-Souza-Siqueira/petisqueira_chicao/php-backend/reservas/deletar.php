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
$id = $dados['id'] ?? null;

if (!$id) {
    http_response_code(400);
    echo json_encode(['erro' => 'Informe o id da reserva.']);
    exit;
}

// A exclusão vai dentro de um try/catch porque o banco pode recusar
// o DELETE (por exemplo, se essa reserva estiver ligada a algum
// outro registro por uma chave estrangeira). Sem o try/catch, esse
// erro do MySQL "quebra" a página inteira (o PHP devolve um erro em
// HTML em vez de JSON), e o painel só consegue mostrar a mensagem
// genérica "Não foi possível conectar ao servidor.", escondendo o
// motivo real. Com o try/catch, a gente sempre devolve um JSON
// explicando o que aconteceu.
try {
    $stmt = $pdo->prepare('DELETE FROM reservas WHERE id = ?');
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['erro' => 'Reserva não encontrada.']);
        exit;
    }

    echo json_encode(['mensagem' => 'Reserva excluída com sucesso!']);
} catch (PDOException $erro) {
    // Código 23000 = violação de integridade referencial (chave
    // estrangeira). Ou seja: essa reserva está "amarrada" a outro
    // registro no banco e por isso não pode ser apagada direto.
    if ($erro->getCode() === '23000') {
        http_response_code(409);
        echo json_encode([
            'erro' => 'Essa reserva não pode ser excluída porque existe outro registro ' .
                      'vinculado a ela no banco de dados (chave estrangeira). Verifique se ' .
                      'não há pedidos, mensagens ou avaliações ligados a essa reserva.',
        ]);
        exit;
    }

    responderErroInterno($erro, 'Erro ao excluir a reserva. Tente novamente.');
}
