<?php
// Testes puros: não conectam ao banco nem alteram dados.

require_once __DIR__ . '/../includes/validation.php';

$falhas = [];

function verificar(string $nome, bool $resultado): void
{
    global $falhas;
    if (!$resultado) {
        $falhas[] = $nome;
    }
}

verificar('inteiro aceita JSON int', inteiroPositivoEstrito(2) === 2);
verificar('inteiro aceita string decimal simples', inteiroPositivoEstrito('20', 20) === 20);
verificar('inteiro rejeita zero', inteiroPositivoEstrito(0) === null);
verificar('inteiro rejeita float 1.0', inteiroPositivoEstrito(1.0) === null);
verificar('inteiro rejeita decimal', inteiroPositivoEstrito('1.5') === null);
verificar('inteiro rejeita expoente', inteiroPositivoEstrito('1e2') === null);
verificar('inteiro rejeita espaços', inteiroPositivoEstrito(' 2') === null);
verificar('inteiro aplica limite', inteiroPositivoEstrito('21', 20) === null);

verificar(
    'data válida com segundos roundtrip',
    dataReservaValida('2030-02-28 19:00:00')?->format('Y-m-d H:i:s') === '2030-02-28 19:00:00'
);
verificar(
    'data válida no formato HTML datetime-local',
    dataReservaValida('2030-02-28T19:00')?->format('Y-m-d H:i:s') === '2030-02-28 19:00:00'
);
verificar('data rejeita dia inexistente', dataReservaValida('2030-02-30 19:00:00') === null);
verificar('data rejeita trailing text', dataReservaValida('2030-02-28 19:00:00abc') === null);
verificar('data rejeita formato parcial', dataReservaValida('2030-02-28') === null);

$total = 13;
$aprovados = $total - count($falhas);
printf("Validações puras: %d/%d aprovadas\n", $aprovados, $total);
if ($falhas) {
    echo "Falhas:\n- " . implode("\n- ", $falhas) . "\n";
    exit(1);
}
