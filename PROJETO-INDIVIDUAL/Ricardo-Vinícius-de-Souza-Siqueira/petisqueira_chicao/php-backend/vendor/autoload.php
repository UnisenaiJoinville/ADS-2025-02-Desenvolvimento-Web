<?php
// Autoloader mínimo do PHPMailer (equivale ao que o "composer install" gera).
// Se você rodar `composer install` na pasta php-backend, este arquivo é
// substituído pelo autoload oficial do Composer — tudo continua funcionando.
spl_autoload_register(function ($classe) {
    $prefixo = 'PHPMailer\\PHPMailer\\';
    if (strpos($classe, $prefixo) !== 0) {
        return;
    }
    $arquivo = __DIR__ . '/phpmailer/phpmailer/src/' . str_replace('\\', '/', substr($classe, strlen($prefixo))) . '.php';
    if (is_file($arquivo)) {
        require $arquivo;
    }
});
