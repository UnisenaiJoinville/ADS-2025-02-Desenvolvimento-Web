<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/auth.php';

// Dados de contato dos clientes (telefone, e-mail) — só admin pode ver.
exigirAdmin($pdo);

$stmt = $pdo->query('SELECT * FROM reservas ORDER BY criado_em DESC');
echo json_encode($stmt->fetchAll());
