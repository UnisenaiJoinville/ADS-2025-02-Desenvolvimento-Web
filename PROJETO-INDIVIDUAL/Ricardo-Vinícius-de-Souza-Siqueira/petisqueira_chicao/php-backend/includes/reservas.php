<?php
// Serializa operações que alteram a capacidade do mesmo slot de reserva.

function capacidadePorHorario(): int
{
    $capacidade = defined('CAPACIDADE_POR_HORARIO')
        ? (int) CAPACIDADE_POR_HORARIO
        : 50;
    return $capacidade > 0 ? $capacidade : 50;
}

/**
 * Executa uma operação sob lock advisory da conexão MySQL.
 * A callback não deve chamar exit/responderErro: deve retornar um resultado
 * ou lançar; assim o finally sempre consegue liberar o lock.
 */
function executarComLockHorario(PDO $pdo, string $slot, callable $operacao)
{
    $nomeLock = 'petisqueira:reservas:' . $slot;
    $stmtLock = $pdo->prepare('SELECT GET_LOCK(?, 10)');
    $stmtLock->execute([$nomeLock]);

    if ((int) $stmtLock->fetchColumn() !== 1) {
        throw new RuntimeException('Não foi possível obter o lock do horário de reserva.');
    }

    try {
        return $operacao();
    } finally {
        try {
            $stmtRelease = $pdo->prepare('SELECT RELEASE_LOCK(?)');
            $stmtRelease->execute([$nomeLock]);
        } catch (Throwable $erro) {
            // Não substitui o erro original; registra para diagnóstico do servidor.
            error_log('Falha ao liberar lock de reserva: ' . $erro->getMessage());
        }
    }
}
