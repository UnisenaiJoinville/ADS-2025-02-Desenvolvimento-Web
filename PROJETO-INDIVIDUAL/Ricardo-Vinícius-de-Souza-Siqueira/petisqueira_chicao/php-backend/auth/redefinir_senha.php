<?php
// Recuperação de senha, passo 2: o cliente chega pelo link do e-mail,
// digita a nova senha e o token (de uso único) é consumido.

require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/auth.php';

exigirMetodo('POST');
limitarRequisicoes($pdo, 'redefinir', 10, 3600);

$dados = pegarCorpoJson();
$token = trim((string) ($dados['token'] ?? ''));
$senha = (string) ($dados['senha'] ?? '');

if ($token === '' || strlen($token) > 200) {
    responderErro(400, 'Link inválido. Peça um novo link de recuperação.');
}
if (strlen($senha) < 8) {
    responderErro(400, 'A senha precisa ter no mínimo 8 caracteres.');
}
if (strlen($senha) > 72) {
    responderErro(400, 'A senha pode ter no máximo 72 caracteres.');
}

try {
    $stmt = $pdo->prepare('SELECT id, usuario_id FROM reset_senha WHERE token_hash = ? AND usado_em IS NULL AND expira_em > ?');
    $stmt->execute([hashToken($token), agora()]);
    $reset = $stmt->fetch();

    if (!$reset) {
        responderErro(400, 'Este link é inválido ou expirou. Peça um novo link de recuperação.');
    }

    $pdo->beginTransaction();

    // Consome o token primeiro; se outra requisição já usou, rowCount = 0.
    $uso = $pdo->prepare('UPDATE reset_senha SET usado_em = ? WHERE id = ? AND usado_em IS NULL');
    $uso->execute([agora(), $reset['id']]);

    if ($uso->rowCount() !== 1) {
        $pdo->rollBack();
        responderErro(400, 'Este link é inválido ou expirou. Peça um novo link de recuperação.');
    }

    // Troca a senha, zera bloqueios e derruba qualquer sessão aberta.
    $pdo->prepare(
        'UPDATE usuarios SET senha_hash = ?, tentativas_login = 0, bloqueado_ate = NULL,
         token_hash = NULL, token_expira_em = NULL WHERE id = ?'
    )->execute([password_hash($senha, PASSWORD_BCRYPT), $reset['usuario_id']]);

    $pdo->commit();
} catch (PDOException $erro) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    responderErroInterno($erro, 'Erro ao redefinir a senha. Tente novamente.');
}

echo json_encode(['mensagem' => 'Senha alterada com sucesso! Entre com a nova senha.']);
