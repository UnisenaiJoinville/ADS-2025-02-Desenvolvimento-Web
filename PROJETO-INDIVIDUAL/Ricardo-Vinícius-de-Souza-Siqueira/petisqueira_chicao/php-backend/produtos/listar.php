<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../config/db.php';

// Rota pública — usada pela loja (loja.html). Só mostra produtos ativos.
$stmt = $pdo->query('SELECT * FROM produtos WHERE ativo = 1 ORDER BY id');
echo json_encode($stmt->fetchAll());
