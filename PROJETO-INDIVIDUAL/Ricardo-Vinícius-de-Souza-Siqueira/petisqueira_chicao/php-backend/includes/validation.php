<?php
// Validações sem dependência de banco, compartilhadas por endpoints e testes.

/**
 * Aceita apenas inteiros positivos reais ou strings decimais sem sinal,
 * ponto, expoente ou espaços. JSON 1.0 (float) é rejeitado de propósito.
 */
function inteiroPositivoEstrito($valor, ?int $maximo = null): ?int
{
    if (is_int($valor)) {
        $inteiro = $valor;
    } elseif (is_string($valor) && preg_match('/^[1-9][0-9]*$/D', $valor)) {
        // Evita conversão silenciosa de strings maiores que PHP_INT_MAX.
        if (strlen($valor) > strlen((string) PHP_INT_MAX)) {
            return null;
        }
        $inteiro = (int) $valor;
        if ((string) $inteiro !== $valor) {
            return null;
        }
    } else {
        return null;
    }

    if ($inteiro < 1 || ($maximo !== null && $inteiro > $maximo)) {
        return null;
    }
    return $inteiro;
}

/**
 * Normaliza telefone brasileiro com DDD para somente dígitos.
 * Aceita 10 dígitos (fixo) ou 11 dígitos (celular) e rejeita números inválidos.
 */
function telefoneNormalizado($valor): ?string
{
    if (!is_string($valor)) {
        return null;
    }
    $digitos = preg_replace('/\D+/', '', $valor);
    return is_string($digitos) && preg_match('/^[1-9][0-9]{9,10}$/D', $digitos)
        ? $digitos
        : null;
}

/**
 * Aceita os dois formatos legados da API e rejeita normalizações silenciosas
 * (por exemplo, 30/02 virar março) usando warnings e round-trip exato.
 */
function dataReservaValida($valor): ?DateTime
{
    if (!is_string($valor)) {
        return null;
    }

    foreach (['Y-m-d H:i:s', 'Y-m-d\\TH:i'] as $formato) {
        $dt = DateTime::createFromFormat($formato, $valor);
        $erros = DateTime::getLastErrors();
        $temErro = is_array($erros)
            && ($erros['warning_count'] > 0 || $erros['error_count'] > 0);

        if ($dt !== false && !$temErro && $dt->format($formato) === $valor) {
            return $dt;
        }
    }

    return null;
}
