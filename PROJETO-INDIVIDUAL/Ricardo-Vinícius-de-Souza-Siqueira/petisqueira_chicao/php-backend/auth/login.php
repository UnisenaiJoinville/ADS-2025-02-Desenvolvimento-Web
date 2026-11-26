<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/auth.php';

exigirMetodo('POST');
limitarRequisicoes($pdo, 'login', 30, 900); // teto por IP; além do bloqueio por conta abaixo

$dados = pegarCorpoJson();
$email = trim((string) ($dados['email'] ?? ''));
$senha = (string) ($dados['senha'] ?? '');

if ($email === '' || $senha === '') {
    responderErro(400, 'Informe e-mail e senha.');
}

try {
    $stmt = $pdo->prepare('SELECT * FROM usuarios WHERE email = ?');
    $stmt->execute([$email]);
    $usuario = $stmt->fetch();

    // Bloqueio temporário após muitas tentativas erradas (força bruta)
    if ($usuario && $usuario['bloqueado_ate'] && strtotime($usuario['bloqueado_ate']) > time()) {
        responderErro(429, 'Muitas tentativas de login. Aguarde 15 minutos e tente novamente.');
    }

    // Mesma mensagem para "e-mail não existe" e "senha errada"
    if (!$usuario || !password_verify($senha, $usuario['senha_hash'])) {
        if ($usuario) {
            $falhas = (int) $usuario['tentativas_login'] + 1;
            $pdo->prepare('UPDATE usuarios SET tentativas_login = ?, bloqueado_ate = ? WHERE id = ?')
                ->execute([
                    $falhas >= 5 ? 0 : $falhas,
                    $falhas >= 5 ? agora(15 * 60) : null,
                    $usuario['id'],
                ]);
        }
        responderErro(401, 'E-mail ou senha inválidos.');
    }

    // Token novo a cada login; no banco guardamos só o hash dele.
    $token = bin2hex(random_bytes(32));

    $pdo->prepare(
        'UPDATE usuarios SET token_hash = ?, token_expira_em = ?, tentativas_login = 0, bloqueado_ate = NULL WHERE id = ?'
    )->execute([hashToken($token), agora(7 * 86400), $usuario['id']]);
} catch (PDOException $erro) {
    responderErroInterno($erro, 'Erro ao fazer login. Tente novamente.');
}

echo json_encode([
    'mensagem' => 'Login realizado com sucesso!',
    'token' => $token,
    'usuario' => [
        'id' => (int) $usuario['id'],
        'nome' => $usuario['nome'],
        'email' => $usuario['email'],
        'is_admin' => (bool) $usuario['is_admin'],
    ],
]);
