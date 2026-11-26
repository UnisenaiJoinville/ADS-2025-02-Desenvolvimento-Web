<?php
// Utilitários de autenticação e funções de apoio da API.
//
// Como funciona o login: ao fazer login (auth/login.php) o servidor gera
// um token aleatório e devolve ele ao navegador. No banco fica guardado
// APENAS o hash SHA-256 do token (coluna token_hash). Assim, se alguém
// copiar o banco de dados, não consegue usar os tokens para se passar
// por um usuário. O navegador manda o token em toda requisição que
// precisa de login, no cabeçalho:  Authorization: Bearer <token>

require_once __DIR__ . '/../config/db.php';

// Nem todo ambiente PHP tem getallheaders(); este é um substituto.
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

// Data/hora atual no formato do banco (fuso America/Sao_Paulo).
function agora($deslocamento = 0) {
    return date('Y-m-d H:i:s', time() + $deslocamento);
}

// Hash (SHA-256) usado para guardar tokens no banco.
function hashToken($token) {
    return hash('sha256', (string) $token);
}

// Lê o token do cabeçalho Authorization e busca o usuário dono dele.
// Retorna null se não tiver token, se ele expirou ou se não bater com ninguém.
function pegarUsuarioLogado(PDO $pdo) {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;

    if (!$authHeader || stripos($authHeader, 'Bearer ') !== 0) {
        return null;
    }

    $token = trim(substr($authHeader, 7));
    if ($token === '' || strlen($token) > 200) {
        return null;
    }

    $stmt = $pdo->prepare(
        'SELECT id, nome, email, is_admin FROM usuarios WHERE token_hash = ? AND token_expira_em > ?'
    );
    $stmt->execute([hashToken($token), agora()]);
    $usuario = $stmt->fetch();

    return $usuario ?: null;
}

// Exige usuário logado. Responde 401 e encerra se não houver.
function exigirLogin(PDO $pdo) {
    $usuario = pegarUsuarioLogado($pdo);
    if (!$usuario) {
        responderErro(401, 'Faça login para continuar.');
    }
    return $usuario;
}

// Exige usuário logado E administrador (a checagem é sempre feita aqui,
// no servidor — esconder o menu no front-end não protege nada).
function exigirAdmin(PDO $pdo) {
    $usuario = exigirLogin($pdo);
    if (!$usuario['is_admin']) {
        responderErro(403, 'Acesso restrito a administradores.');
    }
    return $usuario;
}

// Garante o método HTTP esperado (ex: 'POST').
function exigirMetodo($metodo) {
    if ($_SERVER['REQUEST_METHOD'] !== $metodo) {
        responderErro(405, 'Método não permitido.');
    }
}

// Lê o corpo JSON da requisição.
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

// IP de quem fez a requisição. Usamos só REMOTE_ADDR: cabeçalhos como
// X-Forwarded-For podem ser forjados por qualquer pessoa.
function ipCliente() {
    return substr($_SERVER['REMOTE_ADDR'] ?? 'desconhecido', 0, 45);
}

// Limite de tentativas (anti-spam / força bruta).
// Permite no máximo $max chamadas da ação $acao a cada $janelaSegundos,
// por IP (e opcionalmente por $extra, ex: o e-mail). Passou do limite →
// responde 429 e encerra. Cada chamada permitida é registrada no banco.
function limitarRequisicoes(PDO $pdo, $acao, $max, $janelaSegundos, $extra = '') {
    $chave = substr($acao . '|' . ipCliente() . ($extra !== '' ? '|' . hash('sha256', strtolower($extra)) : ''), 0, 190);

    // limpeza ocasional de registros antigos (1 a cada ~50 chamadas)
    if (random_int(1, 50) === 1) {
        $pdo->prepare('DELETE FROM limites_requisicao WHERE criado_em < ?')->execute([agora(-86400)]);
    }

    $stmt = $pdo->prepare('SELECT COUNT(*) FROM limites_requisicao WHERE chave = ? AND criado_em > ?');
    $stmt->execute([$chave, agora(-$janelaSegundos)]);

    if ((int) $stmt->fetchColumn() >= $max) {
        responderErro(429, 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.');
    }

    $pdo->prepare('INSERT INTO limites_requisicao (chave, criado_em) VALUES (?, ?)')->execute([$chave, agora()]);
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

// Valida um e-mail (rejeita quebras de linha, que permitiriam
// "header injection" em e-mails) e o tamanho máximo do banco.
function emailValido($email) {
    return is_string($email) && strlen($email) <= 150 && filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

// Gera um código legível de cartão presente, ex: PC-7K3M-9QX2 (sem 0/O/1/I).
function gerarCodigoCartao() {
    $alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $codigo = '';
    for ($i = 0; $i < 8; $i++) {
        $codigo .= $alfabeto[random_int(0, strlen($alfabeto) - 1)];
    }
    return 'PC-' . substr($codigo, 0, 4) . '-' . substr($codigo, 4, 4);
}
