<?php
// Conexão com o banco de dados, usando PDO (a forma mais segura
// e moderna de falar com o MySQL em PHP — usa "prepared statements"
// automaticamente, o que protege contra SQL Injection).

$configPath = __DIR__ . '/config.php';

if (!file_exists($configPath)) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'erro' => 'Arquivo config/config.php não encontrado. Copie config.example.php ' .
                   'para config.php e preencha com os dados do seu MySQL.',
    ]);
    exit;
}

require_once $configPath;

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASSWORD,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
} catch (PDOException $erro) {
    http_response_code(500);
    header('Content-Type: application/json');
    error_log('Falha na conexão com o banco: ' . $erro->getMessage());
    echo json_encode(['erro' => 'Não foi possível conectar ao banco de dados.']);
    exit;
}
