<?php
// Conexão com o banco de dados, usando PDO (a forma mais segura
// e moderna de falar com o MySQL em PHP — usa "prepared statements"
// automaticamente, o que protege contra SQL Injection).

$configPath = __DIR__ . '/config.php';

if (!file_exists($configPath)) {
    http_response_code(500);
    header('Content-Type: application/json');
    error_log('Configuração ausente: ' . $configPath);
    echo json_encode([
        'erro' => 'Erro de configuração do servidor.',
    ]);
    exit;
}

require_once $configPath;

// Mesmo fuso horário no PHP e no MySQL (o Brasil não tem mais horário de verão).
date_default_timezone_set('America/Sao_Paulo');

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASSWORD,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET time_zone = '-03:00'",
        ]
    );
} catch (PDOException $erro) {
    http_response_code(500);
    header('Content-Type: application/json');
    error_log('Falha na conexão com o banco: ' . $erro->getMessage());
    echo json_encode(['erro' => 'Não foi possível conectar ao banco de dados.']);
    exit;
}
