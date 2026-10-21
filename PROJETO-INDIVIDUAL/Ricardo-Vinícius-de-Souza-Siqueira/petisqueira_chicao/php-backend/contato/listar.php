<?php
require_once __DIR__ . '/../includes/cors.php';
require_once __DIR__ . '/../includes/auth.php';

exigirAdmin($pdo);

$stmt = $pdo->query('SELECT * FROM mensagens_contato ORDER BY criado_em DESC');
echo json_encode($stmt->fetchAll());
