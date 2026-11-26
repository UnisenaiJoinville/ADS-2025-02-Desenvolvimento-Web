<?php
// ============================================================
// TESTES AUTOMATIZADOS DA API — Petisqueira Chicão
// ============================================================
// Executa os cenários de teste do relatório técnico contra o servidor
// REAL (Apache + MySQL do XAMPP) e gera o quadro "Resultado esperado x
// Resultado obtido" pronto para colar no documento.
//
// Como rodar (com Apache e MySQL ligados), no terminal:
//
//   cd C:\xampp\htdocs\petisqueira_chicao\php-backend\tests
//   C:\xampp\php\php.exe testar_sistema.php
//
// (se a URL da API for outra, passe como argumento:
//   php testar_sistema.php http://localhost/outra_pasta/php-backend )
//
// Saída: tabela no terminal + arquivo resultado_testes.md (nesta pasta).
//
// PRÉ-REQUISITO PARA OS TESTES DE E-MAIL: configure um SMTP de teste
// (Mailtrap/Ethereal) no config.php — veja o bloco "SMTP DE TESTE" do
// config.example.php. Sem SMTP os testes de e-mail são REPROVADOS de
// propósito, porque o requisito RF03 exige que o envio funcione.
//
// ATENÇÃO: use só no banco de DESENVOLVIMENTO. O script cria dados de
// teste (e-mails @teste.local) e apaga tudo no final. Ele também limpa
// a tabela limites_requisicao, senão o limite de tentativas por IP
// bloquearia rodadas seguidas.
// ============================================================

if (PHP_SAPI !== 'cli') {
    exit("Rode este arquivo pelo terminal (php testar_sistema.php).\n");
}

require_once __DIR__ . '/../config/db.php'; // $pdo (mesmo banco da API)

$base = rtrim($argv[1] ?? 'http://localhost/petisqueira_chicao/php-backend', '/');
$sufixo = date('His') . random_int(100, 999);
$senha = 'Senha-de-teste-123';
$emailCliente = "cliente_$sufixo@teste.local";
$emailAdmin = "admin_$sufixo@teste.local";

$resultados = [];
$criados = ['produtos' => [], 'reservas' => [], 'pedidos' => [], 'mensagens' => [], 'usuarios' => []];
$pagPix = [];

// ---------- utilitários ----------

function chamar(string $metodo, string $url, ?array $corpo = null, ?string $token = null): array
{
    $ch = curl_init($url);
    $headers = ['Content-Type: application/json', 'Origin: http://localhost'];
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $metodo,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 30,
    ]);
    if ($corpo !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($corpo));
    }
    $texto = curl_exec($ch);
    $codigo = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $erroCurl = curl_error($ch);
    curl_close($ch);

    return ['http' => $codigo, 'json' => json_decode((string) $texto, true), 'texto' => (string) $texto, 'erro' => $erroCurl];
}

// O SMTP de teste gratuito (Mailtrap) recusa e-mails enviados em sequência rápida
// ("550 Too many emails per second"). Por isso, toda chamada que dispara e-mail
// passa por chamarComEmail(), que garante um intervalo mínimo entre os envios.
const INTERVALO_EMAIL_SEGUNDOS = 10;
$ultimoEnvioEmail = 0.0;

function chamarComEmail(string $metodo, string $url, ?array $corpo = null, ?string $token = null): array
{
    global $ultimoEnvioEmail;
    $espera = INTERVALO_EMAIL_SEGUNDOS - (microtime(true) - $ultimoEnvioEmail);
    if ($ultimoEnvioEmail > 0 && $espera > 0) {
        echo sprintf("  (aguardando %.0fs para respeitar o limite do SMTP de teste...)\n", $espera);
        usleep((int) ($espera * 1_000_000));
    }
    $resposta = chamar($metodo, $url, $corpo, $token);
    $ultimoEnvioEmail = microtime(true);
    return $resposta;
}

// Registra um teste: $ok diz se passou; $obtido descreve o que aconteceu de fato.
function registrar(string $req, string $func, string $acao, string $esperado, bool $ok, string $obtido): void
{
    global $resultados;
    $resultados[] = [
        'n' => count($resultados) + 1, 'req' => $req, 'func' => $func, 'acao' => $acao,
        'esperado' => $esperado, 'ok' => $ok, 'obtido' => $obtido,
    ];
}

function proximoDiaUtil(int $diasAFrente): string
{
    // Próxima data (terça a sábado) com pelo menos $diasAFrente dias de antecedência.
    $d = new DateTime("+$diasAFrente days");
    while ((int) $d->format('N') < 2 || (int) $d->format('N') > 6) {
        $d->modify('+1 day');
    }
    return $d->format('Y-m-d');
}

function limparDados(PDO $pdo, array $criados): void
{
    foreach ($criados['pedidos'] as $id) {
        $pdo->prepare('DELETE FROM pedidos WHERE id = ?')->execute([$id]); // itens e cartão saem em cascata
    }
    foreach ($criados['reservas'] as $id) {
        $pdo->prepare('DELETE FROM reservas WHERE id = ?')->execute([$id]);
    }
    foreach ($criados['mensagens'] as $id) {
        $pdo->prepare('DELETE FROM mensagens_contato WHERE id = ?')->execute([$id]);
    }
    foreach ($criados['produtos'] as $id) {
        $pdo->prepare('DELETE FROM produtos WHERE id = ?')->execute([$id]);
    }
    foreach ($criados['usuarios'] as $email) {
        $pdo->prepare('DELETE FROM usuarios WHERE email = ?')->execute([$email]);
    }
}

// ---------- preparação ----------

try {
    $pdo->exec('DELETE FROM limites_requisicao');
} catch (PDOException $e) {
    exit("Não consegui acessar o banco. Confira o config.php e se rodou o schema.sql.\n" . $e->getMessage() . "\n");
}

$teste = chamar('GET', "$base/produtos/listar.php");
if ($teste['http'] !== 200 || !is_array($teste['json'])) {
    exit("A API não respondeu em $base (HTTP {$teste['http']}). Apache ligado? URL correta?\n{$teste['erro']}\n");
}
$produtosAtivos = $teste['json'];
if (!$produtosAtivos) {
    exit("Nenhum produto ativo. Rode o seed.sql antes dos testes.\n");
}
$produtoId = (int) $produtosAtivos[0]['id'];
$produtoValor = (float) $produtosAtivos[0]['valor'];

// Cria o cliente e o administrador de teste.
chamar('POST', "$base/auth/cadastro.php", ['nome' => 'Cliente Teste', 'email' => $emailCliente, 'telefone' => '47999990000', 'senha' => $senha]);
chamar('POST', "$base/auth/cadastro.php", ['nome' => 'Admin Teste', 'email' => $emailAdmin, 'telefone' => '47999990001', 'senha' => $senha]);
$criados['usuarios'] = [$emailCliente, $emailAdmin];
$pdo->prepare('UPDATE usuarios SET is_admin = 1 WHERE email = ?')->execute([$emailAdmin]);

$loginCli = chamar('POST', "$base/auth/login.php", ['email' => $emailCliente, 'senha' => $senha]);
$loginAdm = chamar('POST', "$base/auth/login.php", ['email' => $emailAdmin, 'senha' => $senha]);
$tokenCli = $loginCli['json']['token'] ?? null;
$tokenAdm = $loginAdm['json']['token'] ?? null;
if (!$tokenCli || !$tokenAdm) {
    limparDados($pdo, $criados);
    exit("Não foi possível criar/logar os usuários de teste.\nCliente: {$loginCli['texto']}\nAdmin: {$loginAdm['texto']}\n");
}

$dataBase = proximoDiaUtil(3);

// ============================================================
// CENÁRIOS
// ============================================================

// ---- RF01: reserva sem login x com login ----
$r1 = chamarComEmail('POST', "$base/reservas/criar.php", [
    'nome' => 'Visitante Teste', 'telefone' => '47988880000', 'email' => "visitante_$sufixo@teste.local",
    'quantidade_pessoas' => 2, 'data_reserva' => "$dataBase 19:00:00",
]);
$idSemLogin = (int) ($r1['json']['reserva_id'] ?? 0);
if ($idSemLogin) $criados['reservas'][] = $idSemLogin;

$r2 = chamarComEmail('POST', "$base/reservas/criar.php", [
    'nome' => 'Cliente Teste', 'telefone' => '47999990000', 'email' => $emailCliente,
    'quantidade_pessoas' => 4, 'data_reserva' => "$dataBase 20:00:00",
], $tokenCli);
$idComLogin = (int) ($r2['json']['reserva_id'] ?? 0);
if ($idComLogin) $criados['reservas'][] = $idComLogin;

$conta = chamar('GET', "$base/conta/minha_conta.php", null, $tokenCli);
$idsNaConta = array_map(fn($r) => (int) $r['id'], $conta['json']['reservas'] ?? []);

registrar('RF01', 'Reserva sem login', 'Enviar reserva sem token; depois abrir "Minha conta" de um cliente',
    'Reserva criada (201) e NÃO aparece em "Minha conta"',
    $r1['http'] === 201 && $idSemLogin && !in_array($idSemLogin, $idsNaConta, true),
    "HTTP {$r1['http']}; reserva #$idSemLogin " . (in_array($idSemLogin, $idsNaConta, true) ? 'apareceu' : 'não apareceu') . ' em "Minha conta"');

registrar('RF01', 'Reserva com login', 'Enviar reserva com o token do cliente; abrir "Minha conta"',
    'Reserva criada (201) e aparece em "Minha conta"',
    $r2['http'] === 201 && $idComLogin && in_array($idComLogin, $idsNaConta, true),
    "HTTP {$r2['http']}; reserva #$idComLogin " . (in_array($idComLogin, $idsNaConta, true) ? 'apareceu' : 'não apareceu') . ' em "Minha conta"');

// ---- RF01: validações da reserva ----
$rFora = chamar('POST', "$base/reservas/criar.php", [
    'nome' => 'Teste Data', 'telefone' => '47988880002', 'email' => "x_$sufixo@teste.local", 'quantidade_pessoas' => 2,
    'data_reserva' => date('Y-m-d', strtotime('next monday +7 days')) . ' 20:00:00', // segunda: fechado
]);
registrar('RF01', 'Reserva fora do funcionamento', 'Reservar numa segunda-feira (restaurante fechado)',
    'Recusar com erro 400', $rFora['http'] === 400, "HTTP {$rFora['http']}: " . ($rFora['json']['erro'] ?? $rFora['texto']));

$rPassado = chamar('POST', "$base/reservas/criar.php", [
    'nome' => 'Teste Data', 'telefone' => '47988880002', 'email' => "x_$sufixo@teste.local", 'quantidade_pessoas' => 2,
    'data_reserva' => '2020-01-07 20:00:00',
]);
registrar('RF01', 'Reserva no passado', 'Reservar numa data passada', 'Recusar com erro 400',
    $rPassado['http'] === 400, "HTTP {$rPassado['http']}: " . ($rPassado['json']['erro'] ?? $rPassado['texto']));

// ---- RF03: e-mail (recebimento e confirmação) ----
$conf = chamarComEmail('POST', "$base/reservas/atualizar.php", ['id' => $idComLogin, 'status' => 'confirmada'], $tokenAdm);
$st = $pdo->prepare('SELECT status, confirmacao_enviada_em FROM reservas WHERE id = ?');
$st->execute([$idComLogin]);
$linha = $st->fetch() ?: [];
$emailOk = $conf['json']['email_confirmacao_enviado'] ?? null;
registrar('RF03', 'E-mail de confirmação enviado', 'Admin confirma a reserva; o sistema envia o e-mail pelo SMTP de teste',
    'Status vira "confirmada", o e-mail é enviado e confirmacao_enviada_em é preenchida',
    $conf['http'] === 200 && ($linha['status'] ?? '') === 'confirmada' && $emailOk === true && !empty($linha['confirmacao_enviada_em']),
    $emailOk === true
        ? 'Status "confirmada"; e-mail enviado pelo SMTP; confirmacao_enviada_em = ' . ($linha['confirmacao_enviada_em'] ?? 'NULL')
        : 'Status "' . ($linha['status'] ?? '?') . '"; e-mail NÃO enviado (SMTP_* não configurado ou servidor recusou; veja o log de erros do PHP)');

// ---- RF05: reserva cancelada não reabre ----
chamar('POST', "$base/reservas/atualizar.php", ['id' => $idSemLogin, 'status' => 'cancelada'], $tokenAdm);
$reabrir = chamar('POST', "$base/reservas/atualizar.php", ['id' => $idSemLogin, 'status' => 'confirmada'], $tokenAdm);
registrar('RF05', 'Reserva cancelada é definitiva', 'Admin cancela e depois tenta confirmar a mesma reserva',
    'Segunda ação recusada (409)', $reabrir['http'] === 409, "HTTP {$reabrir['http']}: " . ($reabrir['json']['erro'] ?? $reabrir['texto']));

// ---- RF06: compra de cartão (Pix e cartão de crédito) ----
foreach (['pix' => 'Pix', 'cartao' => 'cartão de crédito'] as $forma => $rotulo) {
    $ped = chamar('POST', "$base/pedidos/criar.php", [
        'nome' => 'Comprador Teste', 'email' => "comprador_{$forma}_$sufixo@teste.local",
        'itens' => [['produto_id' => $produtoId, 'quantidade' => 2]],
    ]);
    $pid = (int) ($ped['json']['pedido']['id'] ?? 0);
    $cod = $ped['json']['pedido']['codigo_acesso'] ?? '';
    if ($pid) $criados['pedidos'][] = $pid;

    $pag = chamarComEmail('POST', "$base/pedidos/pagar.php", ['id' => $pid, 'codigo' => $cod, 'forma_pagamento' => $forma]);
    $codigoCartao = $pag['json']['codigo_cartao'] ?? '';
    $cartao = $pag['json']['cartao'] ?? [];
    $okFormato = (bool) preg_match('/^PC-[A-Z2-9]{4}-[A-Z2-9]{4}$/', $codigoCartao);
    $okSaldo = abs(($cartao['saldo'] ?? -1) - 2 * $produtoValor) < 0.001;
    $dias = isset($cartao['validade']) ? (int) round((strtotime($cartao['validade']) - time()) / 86400) : 0;
    $okValidade = $dias >= 175 && $dias <= 190; // ~6 meses

    $st = $pdo->prepare('SELECT forma_pagamento, status FROM pedidos WHERE id = ?');
    $st->execute([$pid]);
    $p = $st->fetch() ?: [];

    registrar('RF06', "Compra com $rotulo", "Criar pedido de 2 cartões (sem login) e pagar com $rotulo",
        'Pedido "pago", forma_pagamento gravada, cartão emitido com código, saldo = total e validade de ~6 meses',
        $pag['http'] === 200 && $okFormato && $okSaldo && $okValidade && ($p['forma_pagamento'] ?? '') === $forma && ($p['status'] ?? '') === 'pago',
        "HTTP {$pag['http']}; status={$p['status']}; forma_pagamento={$p['forma_pagamento']}; código=$codigoCartao; saldo=R$ " . number_format((float) ($cartao['saldo'] ?? 0), 2, ',', '.') . "; validade em $dias dias");

    if ($forma === 'pix') {
        $pagPix = $pag;
        $pedidoPixId = $pid;
        $codigoPixPedido = $cod;
    }
}

registrar('RF03', 'E-mail com o código do cartão', 'Pagar o pedido (Pix) e conferir se o e-mail com o código foi enviado',
    'A resposta de pagamento informa email_enviado = true',
    ($pagPix['json']['email_enviado'] ?? null) === true,
    'email_enviado = ' . var_export($pagPix['json']['email_enviado'] ?? null, true));

// ---- RF06: pagar duas vezes ----
$dup = chamar('POST', "$base/pedidos/pagar.php", ['id' => $pedidoPixId, 'codigo' => $codigoPixPedido, 'forma_pagamento' => 'pix']);
registrar('RF06', 'Pagamento duplicado', 'Tentar pagar de novo um pedido já pago', 'Recusar (409), sem gerar outro cartão',
    $dup['http'] === 409, "HTTP {$dup['http']}: " . ($dup['json']['erro'] ?? $dup['texto']));

// ---- RF06: total calculado no servidor ----
$fraude = chamar('POST', "$base/pedidos/criar.php", [
    'nome' => 'Comprador Teste', 'email' => "fraude_$sufixo@teste.local",
    'itens' => [['produto_id' => $produtoId, 'quantidade' => 1, 'valor_unitario' => 0.01]], 'valor_total' => 0.01,
]);
if (!empty($fraude['json']['pedido']['id'])) $criados['pedidos'][] = (int) $fraude['json']['pedido']['id'];
registrar('RNF05', 'Preço calculado no servidor', 'Enviar pedido com valor_total = R$ 0,01 forjado no corpo da requisição',
    'O servidor ignora o valor enviado e usa o preço do produto',
    $fraude['http'] === 201 && abs(($fraude['json']['pedido']['valor_total'] ?? 0) - $produtoValor) < 0.001,
    'valor_total gravado = R$ ' . number_format((float) ($fraude['json']['pedido']['valor_total'] ?? 0), 2, ',', '.'));

// ---- RF07: "Minha conta" exige login ----
$semLogin = chamar('GET', "$base/conta/minha_conta.php");
registrar('RF07', '"Minha conta" sem login', 'Chamar a API de "Minha conta" sem token', 'Acesso negado (401); o site redireciona para o login',
    $semLogin['http'] === 401, "HTTP {$semLogin['http']}: " . ($semLogin['json']['erro'] ?? $semLogin['texto']));

// ---- RNF: painel administrativo bloqueado para cliente ----
$bloqueios = [];
foreach (['reservas/listar.php', 'cartoes/admin_listar.php', 'relatorios/vendas.php', 'pedidos/admin_listar.php', 'contato/listar.php'] as $rota) {
    $bloqueios[$rota] = chamar('GET', "$base/$rota", null, $tokenCli)['http'];
}
$tudo403 = count(array_filter($bloqueios, fn($c) => $c === 403)) === count($bloqueios);
registrar('RNF03', 'Painel admin x cliente', 'Cliente (sem is_admin) chama 5 rotas do painel',
    'Todas bloqueadas com 403', $tudo403, 'HTTP: ' . implode(', ', array_map(fn($r, $c) => "$r=$c", array_keys($bloqueios), $bloqueios)));

$anon = chamar('GET', "$base/reservas/listar.php");
registrar('RNF03', 'Painel admin sem login', 'Chamar a lista de reservas sem token', 'Bloqueado com 401',
    $anon['http'] === 401, "HTTP {$anon['http']}");

// ---- RF08: admin altera status da reserva (já feito acima; registra explicitamente) ----
registrar('RF08', 'Admin altera status da reserva', 'Admin muda a reserva #' . $idComLogin . ' de "pendente" para "confirmada"',
    'Status gravado no banco como "confirmada"', ($linha['status'] ?? '') === 'confirmada' && $conf['http'] === 200,
    'status no banco = ' . ($linha['status'] ?? '?'));

// ---- RF09: cartão-presente: uso parcial, excesso, desativação do produto ----
$st = $pdo->prepare('SELECT id, saldo FROM cartoes_emitidos WHERE pedido_id = ?');
$st->execute([$pedidoPixId]);
$c = $st->fetch() ?: ['id' => 0, 'saldo' => 0];
$uso1 = chamar('POST', "$base/cartoes/utilizar.php", ['id' => (int) $c['id'], 'valor' => 50, 'observacao' => 'Teste automatizado'], $tokenAdm);
$excesso = chamar('POST', "$base/cartoes/utilizar.php", ['id' => (int) $c['id'], 'valor' => 99999], $tokenAdm);
$st->execute([$pedidoPixId]);
$c2 = $st->fetch() ?: ['saldo' => 0];
registrar('RF09', 'Uso parcial do cartão', 'Admin desconta R$ 50 do cartão e depois tenta descontar R$ 99.999',
    'Primeiro uso aceito (saldo diminui); segundo recusado (409) e saldo não muda',
    $uso1['http'] === 200 && $excesso['http'] === 409 && abs((float) $c2['saldo'] - ((float) $c['saldo'] - 50)) < 0.001,
    "uso=HTTP {$uso1['http']}; excesso=HTTP {$excesso['http']}; saldo " . number_format((float) $c['saldo'], 2, ',', '.') . ' → ' . number_format((float) $c2['saldo'], 2, ',', '.'));

$novo = chamar('POST', "$base/produtos/criar.php", ['nome' => "Cartão Teste $sufixo", 'valor' => 10], $tokenAdm);
$novoId = (int) ($novo['json']['produto']['id'] ?? 0);
if ($novoId) $criados['produtos'][] = $novoId;
$antes = array_column(chamar('GET', "$base/produtos/listar.php")['json'] ?? [], 'id');
chamar('POST', "$base/produtos/deletar.php", ['id' => $novoId], $tokenAdm);
$depois = array_column(chamar('GET', "$base/produtos/listar.php")['json'] ?? [], 'id');
$tentaComprar = chamar('POST', "$base/pedidos/criar.php", ['nome' => 'X', 'email' => "x2_$sufixo@teste.local", 'itens' => [['produto_id' => $novoId, 'quantidade' => 1]]]);
registrar('RF09', 'Desativar cartão-presente', 'Admin cria um produto e o desativa; consultar a loja e tentar comprá-lo',
    'Aparece na loja antes, some depois, e a compra é recusada (404)',
    in_array($novoId, array_map('intval', $antes), true) && !in_array($novoId, array_map('intval', $depois), true) && $tentaComprar['http'] === 404,
    'na loja antes: ' . (in_array($novoId, array_map('intval', $antes)) ? 'sim' : 'não') . '; depois: ' . (in_array($novoId, array_map('intval', $depois)) ? 'sim' : 'não') . "; compra HTTP {$tentaComprar['http']}");

// ---- RF10: relatórios ----
$relRes = chamar('GET', "$base/relatorios/reservas.php", null, $tokenAdm);
$relVen = chamar('GET', "$base/relatorios/vendas.php", null, $tokenAdm);
registrar('RF10', 'Relatórios do administrador', 'Admin abre os relatórios de reservas e de vendas',
    'Os dois respondem 200 com dados em JSON',
    $relRes['http'] === 200 && $relVen['http'] === 200 && is_array($relRes['json']) && is_array($relVen['json']),
    "reservas=HTTP {$relRes['http']}; vendas=HTTP {$relVen['http']}; campos de vendas: " . implode(', ', array_slice(array_keys($relVen['json'] ?? []), 0, 6)));

// ---- RF02: Fale Conosco ----
$vazio = chamar('POST', "$base/contato/criar.php", ['nome' => 'Teste', 'email' => "ct_$sufixo@teste.local", 'mensagem' => '']);
registrar('RF02', 'Fale Conosco com campo vazio', 'Enviar o formulário com a mensagem em branco', 'Recusar com erro 400',
    $vazio['http'] === 400, "HTTP {$vazio['http']}: " . ($vazio['json']['erro'] ?? $vazio['texto']));

$ok = chamar('POST', "$base/contato/criar.php", ['nome' => 'Teste', 'email' => "ct_$sufixo@teste.local", 'mensagem' => 'Mensagem de teste automatizado']);
$st = $pdo->prepare('SELECT id FROM mensagens_contato WHERE email = ?');
$st->execute(["ct_$sufixo@teste.local"]);
foreach ($st->fetchAll() as $m) $criados['mensagens'][] = (int) $m['id'];
registrar('RF02', 'Fale Conosco preenchido', 'Enviar o formulário completo', 'Mensagem gravada (201)',
    $ok['http'] === 201 && count($criados['mensagens']) === 1, "HTTP {$ok['http']}; mensagens gravadas: " . count($criados['mensagens']));

// ---- RF04: cadastro e login ----
$curta = chamar('POST', "$base/auth/cadastro.php", ['nome' => 'Curta', 'email' => "curta_$sufixo@teste.local", 'senha' => '1234']);
registrar('RF04', 'Cadastro com senha curta', 'Cadastrar com senha de 4 caracteres', 'Recusar com erro 400 (mínimo 8)',
    $curta['http'] === 400, "HTTP {$curta['http']}: " . ($curta['json']['erro'] ?? $curta['texto']));

$dupl = chamar('POST', "$base/auth/cadastro.php", ['nome' => 'Dup', 'email' => $emailCliente, 'senha' => $senha]);
registrar('RF04', 'Cadastro com e-mail repetido', 'Cadastrar de novo o mesmo e-mail', 'Recusar com erro 409', $dupl['http'] === 409, "HTTP {$dupl['http']}");

$st = $pdo->prepare('SELECT senha_hash, token_hash FROM usuarios WHERE email = ?');
$st->execute([$emailCliente]);
$u = $st->fetch() ?: [];
registrar('RNF02', 'Senha e token protegidos no banco', 'Ler a linha do usuário no banco',
    'Senha em bcrypt (não em texto puro) e token guardado só como hash SHA-256',
    strpos($u['senha_hash'] ?? '', '$2y$') === 0 && $senha !== ($u['senha_hash'] ?? '') && strlen($u['token_hash'] ?? '') === 64 && ($u['token_hash'] ?? '') !== $tokenCli,
    'senha_hash começa com ' . substr($u['senha_hash'] ?? '', 0, 4) . '; token_hash com ' . strlen($u['token_hash'] ?? '') . ' caracteres (≠ token do navegador)');

$errada = chamar('POST', "$base/auth/login.php", ['email' => $emailCliente, 'senha' => 'senha-errada-xx']);
registrar('RF04', 'Login com senha errada', 'Tentar logar com senha incorreta', 'Recusar com erro 401', $errada['http'] === 401, "HTTP {$errada['http']}");

$logout = chamar('POST', "$base/auth/logout.php", [], $tokenCli);
$depoisLogout = chamar('GET', "$base/conta/minha_conta.php", null, $tokenCli);
registrar('RNF02', 'Logout invalida o token', 'Fazer logout e reutilizar o mesmo token', 'Token deixa de valer (401)',
    $depoisLogout['http'] === 401, "logout HTTP {$logout['http']}; reuso do token HTTP {$depoisLogout['http']}");

// ---- RF04: recuperação de senha (pedir link, usar o link, tentar usar de novo) ----
// O link real chega por e-mail e só o hash do token fica no banco. Para o
// teste automatizado "clicar no link", trocamos o hash gravado pelo hash de um
// token conhecido (é o mesmo que o usuário faria ao abrir o e-mail recebido).
$emailRec = "recup_$sufixo@teste.local";
$senhaNova = 'Nova-senha-456';
chamar('POST', "$base/auth/cadastro.php", ['nome' => 'Recuperação Teste', 'email' => $emailRec, 'telefone' => '47999990002', 'senha' => $senha]);
$criados['usuarios'][] = $emailRec;
$pdo->exec('DELETE FROM limites_requisicao');

$pedido = chamarComEmail('POST', "$base/auth/esqueci_senha.php", ['email' => $emailRec]);
$st = $pdo->prepare('SELECT r.id FROM reset_senha r JOIN usuarios u ON u.id = r.usuario_id WHERE u.email = ? AND r.usado_em IS NULL AND r.expira_em > ?');
$st->execute([$emailRec, date('Y-m-d H:i:s')]);
$linhaReset = $st->fetch();
registrar('RF04', 'Recuperação de senha: pedir o link', 'Informar o e-mail de uma conta em "Esqueci minha senha"',
    'Resposta 200 e um token de uso único (válido por 1 hora) gravado em reset_senha',
    $pedido['http'] === 200 && $linhaReset !== false,
    "HTTP {$pedido['http']}; token pendente em reset_senha: " . ($linhaReset ? 'sim' : 'não'));

$tokenLink = bin2hex(random_bytes(32));
if ($linhaReset) {
    $pdo->prepare('UPDATE reset_senha SET token_hash = ? WHERE id = ?')->execute([hash('sha256', $tokenLink), $linhaReset['id']]);
}
$usa = chamar('POST', "$base/auth/redefinir_senha.php", ['token' => $tokenLink, 'senha' => $senhaNova]);
$loginNova = chamar('POST', "$base/auth/login.php", ['email' => $emailRec, 'senha' => $senhaNova]);
$loginAntiga = chamar('POST', "$base/auth/login.php", ['email' => $emailRec, 'senha' => $senha]);
registrar('RF04', 'Recuperação de senha: usar o link', 'Abrir o link, definir a nova senha e entrar com ela',
    'Senha alterada (200); login com a nova senha funciona (200) e com a antiga é recusado (401)',
    $usa['http'] === 200 && $loginNova['http'] === 200 && $loginAntiga['http'] === 401,
    "redefinir=HTTP {$usa['http']}; login nova senha=HTTP {$loginNova['http']}; login senha antiga=HTTP {$loginAntiga['http']}");

$reusa = chamar('POST', "$base/auth/redefinir_senha.php", ['token' => $tokenLink, 'senha' => 'Outra-senha-789']);
registrar('RF04', 'Recuperação de senha: reutilizar o link', 'Tentar usar o mesmo link uma segunda vez',
    'Recusar com erro 400 (token de uso único)',
    $reusa['http'] === 400, "HTTP {$reusa['http']}: " . ($reusa['json']['erro'] ?? $reusa['texto']));

// ---- RNF02: bloqueio após 5 senhas erradas ----
$emailBloq = "bloq_$sufixo@teste.local";
chamar('POST', "$base/auth/cadastro.php", ['nome' => 'Bloqueio Teste', 'email' => $emailBloq, 'telefone' => '47999990003', 'senha' => $senha]);
$criados['usuarios'][] = $emailBloq;
$pdo->exec('DELETE FROM limites_requisicao');
$codigos = [];
for ($i = 1; $i <= 6; $i++) {
    $codigos[] = chamar('POST', "$base/auth/login.php", ['email' => $emailBloq, 'senha' => "errada-$i"])['http'];
}
$certaBloqueada = chamar('POST', "$base/auth/login.php", ['email' => $emailBloq, 'senha' => $senha]);
$st = $pdo->prepare('SELECT bloqueado_ate FROM usuarios WHERE email = ?');
$st->execute([$emailBloq]);
$ate = $st->fetchColumn();
$minutos = $ate ? (int) round((strtotime($ate) - time()) / 60) : 0;
registrar('RNF02', 'Bloqueio após 5 senhas erradas', 'Fazer 6 tentativas de login com senha errada e, depois, tentar com a senha correta',
    '1ª a 5ª recusadas (401); a 6ª bloqueada (429) por 15 minutos; a senha correta também fica bloqueada (429)',
    array_slice($codigos, 0, 5) === [401, 401, 401, 401, 401] && $codigos[5] === 429 && $certaBloqueada['http'] === 429 && $minutos >= 14 && $minutos <= 15,
    'tentativas 1–6 = HTTP ' . implode(', ', $codigos) . "; senha correta = HTTP {$certaBloqueada['http']}; bloqueado por ~$minutos min");

// ---- RNF06: limite de requisições por IP ----
// O limite (10 por hora) é verificado ANTES da validação, então usamos corpos
// vazios: contam como tentativas, mas não criam reservas nem disparam e-mails.
$pdo->exec('DELETE FROM limites_requisicao');
$codigosIp = [];
for ($i = 1; $i <= 11; $i++) {
    $codigosIp[] = chamar('POST', "$base/reservas/criar.php", [])['http'];
}
registrar('RNF06', 'Limite de reservas por IP', 'Enviar 11 requisições de reserva seguidas do mesmo IP (limite: 10 por hora)',
    'As 10 primeiras são processadas (400, corpo vazio) e a 11ª é recusada com 429 (muitas tentativas)',
    count(array_filter(array_slice($codigosIp, 0, 10), fn($c) => $c === 400)) === 10 && $codigosIp[10] === 429,
    'HTTP das requisições 1–11: ' . implode(', ', $codigosIp));
$pdo->exec('DELETE FROM limites_requisicao');

// ============================================================
// LIMPEZA E RELATÓRIO
// ============================================================

limparDados($pdo, $criados);

$aprovados = count(array_filter($resultados, fn($r) => $r['ok']));
$total = count($resultados);

echo "\n=== RESULTADO DOS TESTES ($aprovados/$total aprovados) ===\n\n";
foreach ($resultados as $r) {
    echo sprintf("%02d [%s] %-5s %s\n     Ação:     %s\n     Esperado: %s\n     Obtido:   %s\n\n",
        $r['n'], $r['ok'] ? 'OK ' : 'FALHOU', $r['req'], $r['func'], $r['acao'], $r['esperado'], $r['obtido']);
}

$md = "# Resultado dos testes\n\nExecutado em " . date('d/m/Y H:i') . " — $aprovados de $total testes aprovados.\n\n"
    . "| Nº | Requisito | Funcionalidade | Ação realizada | Resultado esperado | Resultado obtido | Situação |\n"
    . "|---|---|---|---|---|---|---|\n";
foreach ($resultados as $r) {
    $esc = fn($t) => str_replace(['|', "\n"], ['\\|', ' '], $t);
    $md .= "| {$r['n']} | {$r['req']} | {$esc($r['func'])} | {$esc($r['acao'])} | {$esc($r['esperado'])} | {$esc($r['obtido'])} | " . ($r['ok'] ? 'Aprovado' : 'REPROVADO') . " |\n";
}
file_put_contents(__DIR__ . '/resultado_testes.md', $md);
echo "Quadro salvo em tests/resultado_testes.md\n";

exit($aprovados === $total ? 0 : 1);