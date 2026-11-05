<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/auth.php';

// Rota administrativa — mostra TODOS os produtos, inclusive
// os desativados (usada no painel admin.html)
exigirAdmin($pdo);

$stmt = $pdo->query('SELECT * FROM produtos ORDER BY id');
echo json_encode($stmt->fetchAll());
