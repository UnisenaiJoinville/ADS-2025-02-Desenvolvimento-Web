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
$email = trim($dados['email'] ?? '');
$senha = $dados['senha'] ?? '';

if ($email === '' || $senha === '') {
    http_response_code(400);
    echo json_encode(['erro' => 'Informe e-mail e senha.']);
    exit;
}

// 1. Busca o usuário pelo e-mail
$stmt = $pdo->prepare('SELECT * FROM usuarios WHERE email = ?');
$stmt->execute([$email]);
$usuario = $stmt->fetch();

// 2. Bloqueio temporário após muitas tentativas erradas (força bruta)
if ($usuario && $usuario['bloqueado_ate'] && strtotime($usuario['bloqueado_ate']) > time()) {
    http_response_code(429);
    echo json_encode(['erro' => 'Muitas tentativas de login. Aguarde 15 minutos e tente novamente.']);
    exit;
}

// 3. Confere a senha (por segurança, a mensagem de erro é igual
//    tanto se o e-mail não existir quanto se a senha estiver errada)
if (!$usuario || !password_verify($senha, $usuario['senha_hash'])) {
    if ($usuario) {
        $falhas = (int) $usuario['tentativas_login'] + 1;
        // 5 erros seguidos bloqueiam o login por 15 minutos
        $pdo->prepare('UPDATE usuarios SET tentativas_login = ?, bloqueado_ate = ? WHERE id = ?')
            ->execute([
                $falhas >= 5 ? 0 : $falhas,
                $falhas >= 5 ? date('Y-m-d H:i:s', time() + 15 * 60) : null,
                $usuario['id'],
            ]);
    }
    http_response_code(401);
    echo json_encode(['erro' => 'E-mail ou senha inválidos.']);
    exit;
}

// 4. Gera um token novo (aleatório) e salva no banco —
//    é esse token que o front-end vai usar pra provar que está logado.
//    O token expira em 7 dias; login correto zera as tentativas erradas.
$token = bin2hex(random_bytes(32));

$stmt = $pdo->prepare(
    'UPDATE usuarios SET token = ?, token_expira_em = DATE_ADD(NOW(), INTERVAL 7 DAY),
     tentativas_login = 0, bloqueado_ate = NULL WHERE id = ?'
);
$stmt->execute([$token, $usuario['id']]);

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
