<?php
// Inclui isso no TOPO de todo arquivo de API.
// Define que toda resposta é JSON e libera o CORS APENAS para as
// origens permitidas (não usamos mais "*").
//
// Por padrão libera o localhost (XAMPP). Ao publicar o site, defina em
// config.php:  define('CORS_ORIGENS', ['https://seusite.com.br']);

$origensPermitidas = ['http://localhost', 'http://127.0.0.1'];

$configCors = __DIR__ . '/../config/config.php';
if (file_exists($configCors)) {
    require_once $configCors;
    if (defined('CORS_ORIGENS')) {
        $origensPermitidas = array_merge($origensPermitidas, CORS_ORIGENS);
    }
}

$origem = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origem !== '' && in_array($origem, $origensPermitidas, true)) {
    header('Access-Control-Allow-Origin: ' . $origem);
    header('Vary: Origin');
}

header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// O navegador manda uma requisição "OPTIONS" antes da de verdade,
// só pra perguntar "posso mandar essa requisição?" — aqui a gente
// já responde "pode" e encerra, sem processar nada.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
