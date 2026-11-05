<?php
// Utilitários de autenticação.
//
// Como funciona o login aqui: quando alguém faz login (auth/login.php),
// a gente gera um texto aleatório (o "token") e salva ele na coluna
// "token" da tabela usuarios. O front-end guarda esse token e manda
// ele de volta em toda requisição que precisa de login, no cabeçalho:
//   Authorization: Bearer <token>
//
// Isso é mais simples de entender que sessões/cookies, e funciona bem
// para uma API consumida por JavaScript.

require_once __DIR__ . '/../config/db.php';

// Nem todo ambiente PHP tem a função getallheaders() (ela é nativa
// no Apache, mas pode faltar em alguns servidores). Este é um
// "substituto" caso ela não exista.
if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $nome => $valor) {
            if (substr($nome, 0, 5) === 'HTTP_') {
                $chave = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($nome, 5)))));
                $headers[$chave] = $valor;
            }
        }
        return $headers;
    }
}

// Lê o token do cabeçalho Authorization e busca o usuário dono dele.
// Retorna null se não tiver token, ou se o token não bater com ninguém.
function pegarUsuarioLogado(PDO $pdo) {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;

    if (!$authHeader || stripos($authHeader, 'Bearer ') !== 0) {
        return null;
    }

    $token = trim(substr($authHeader, 7));

    if ($token === '') {
        return null;
    }

    // O token só vale enquanto não expirou (token_expira_em é definido no login).
    $stmt = $pdo->prepare('SELECT id, nome, email, is_admin FROM usuarios WHERE token = ? AND token_expira_em > NOW()');
    $stmt->execute([$token]);
    $usuario = $stmt->fetch();

    return $usuario ?: null;
}

// Exige que exista um usuário logado E que ele seja administrador.
// Se não passar em algum desses testes, já responde com o erro
// certo (401 ou 403) e ENCERRA o script ali mesmo (exit) — então
// o código que vem depois de exigirAdmin() só roda se tudo estiver ok.
function exigirAdmin(PDO $pdo) {
    $usuario = pegarUsuarioLogado($pdo);

    if (!$usuario) {
        http_response_code(401);
        echo json_encode(['erro' => 'Faça login para continuar.']);
        exit;
    }

    if (!$usuario['is_admin']) {
        http_response_code(403);
        echo json_encode(['erro' => 'Acesso restrito a administradores.']);
        exit;
    }

    return $usuario;
}

// Lê o corpo JSON da requisição (equivalente ao req.body do Express)
function pegarCorpoJson() {
    $dados = json_decode(file_get_contents('php://input'), true);
    return is_array($dados) ? $dados : [];
}

// Resposta de erro padrão (JSON) + encerra o script.
function responderErro($codigo, $mensagem) {
    http_response_code($codigo);
    echo json_encode(['erro' => $mensagem]);
    exit;
}

// Registra o erro técnico só no log do servidor e devolve ao navegador
// uma mensagem genérica (não expõe detalhes do banco de dados).
function responderErroInterno(Throwable $erro, $mensagem) {
    error_log($erro->getMessage());
    responderErro(500, $mensagem);
}

// Decide se quem fez a requisição pode ver/pagar um pedido:
//  - administrador; ou
//  - o dono do pedido (logado); ou
//  - quem tem o código de acesso secreto do pedido (compra sem login).
function podeAcessarPedido(array $pedido, $usuario, $codigo) {
    if ($usuario && $usuario['is_admin']) {
        return true;
    }
    if ($usuario && $pedido['usuario_id'] !== null && (int) $pedido['usuario_id'] === (int) $usuario['id']) {
        return true;
    }
    if ($pedido['codigo_acesso'] && is_string($codigo) && $codigo !== ''
        && hash_equals($pedido['codigo_acesso'], $codigo)) {
        return true;
    }
    return false;
}
