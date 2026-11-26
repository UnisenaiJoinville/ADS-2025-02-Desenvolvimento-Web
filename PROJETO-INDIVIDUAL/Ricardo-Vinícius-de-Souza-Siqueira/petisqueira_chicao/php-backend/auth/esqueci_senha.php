<?php
// Recuperação de senha, passo 1: o cliente informa o e-mail e recebe um
// link de uso único (vale 1 hora). A resposta é SEMPRE a mesma, exista
// ou não uma conta com aquele e-mail — assim ninguém descobre quais
// e-mails estão cadastrados.

require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/email.php';
require_once __DIR__ . '/../includes/email_templates.php';

exigirMetodo('POST');

$dados = pegarCorpoJson();
$email = trim((string) ($dados['email'] ?? ''));

if (!emailValido($email)) {
    responderErro(400, 'Informe um e-mail válido.');
}

// No máximo 5 pedidos por hora por IP e 3 por hora por e-mail.
limitarRequisicoes($pdo, 'esqueci_ip', 5, 3600);
limitarRequisicoes($pdo, 'esqueci_email', 3, 3600, $email);

$resposta = ['mensagem' => 'Se existir uma conta com este e-mail, enviamos um link para criar uma nova senha. Confira também a caixa de spam.'];

try {
    $stmt = $pdo->prepare('SELECT id, nome, email FROM usuarios WHERE email = ?');
    $stmt->execute([$email]);
    $usuario = $stmt->fetch();

    if (!$usuario) {
        echo json_encode($resposta);
        exit;
    }

    // Invalida links anteriores ainda não usados
    $pdo->prepare('UPDATE reset_senha SET usado_em = ? WHERE usuario_id = ? AND usado_em IS NULL')
        ->execute([agora(), $usuario['id']]);

    // Token aleatório; no banco vai só o hash
    $token = bin2hex(random_bytes(32));
    $pdo->prepare('INSERT INTO reset_senha (usuario_id, token_hash, expira_em, criado_em) VALUES (?, ?, ?, ?)')
        ->execute([$usuario['id'], hashToken($token), agora(3600), agora()]);

    $base = defined('SITE_URL') ? rtrim(SITE_URL, '/') : 'http://localhost/petisqueira_chicao/frontend';
    $link = $base . '/redefinir_senha.html?token=' . $token;

    $enviado = enviarEmail(
        $usuario['email'],
        $usuario['nome'],
        'Redefinir sua senha - Petisqueira Chicão',
        montarEmailRecuperarSenha($usuario['nome'], $link)
    );

    // Nunca registrar o link/token, nem mesmo em APP_DEBUG. Se o envio falhar,
    // o administrador deve corrigir o canal de e-mail e emitir novo link.
    if (!$enviado) {
        error_log('Falha ao enviar link de recuperação de senha; token não registrado.');
    }
} catch (PDOException $erro) {
    responderErroInterno($erro, 'Erro ao processar o pedido. Tente novamente.');
}

echo json_encode($resposta);
