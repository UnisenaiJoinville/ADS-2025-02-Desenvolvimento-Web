# Petisqueira do Chicão — correções do backend PHP

Este pacote preserva a estrutura e as tecnologias originais do site: HTML, CSS, JavaScript, PHP, MySQL/SQL e imagens. Nenhum aplicativo externo foi incluído.

## Correções aplicadas

- Pagamento simulado bloqueado por padrão.
- Reservas protegidas contra concorrência e overbooking.
- Validação estrita de quantidades, pessoas e datas inválidas.
- Produtos inativos retirados do fluxo de compra.
- Relatórios filtrados para pedidos pagos.
- Erros de configuração sem exposição de caminhos internos.
- Tokens de recuperação não gravados em logs de debug.
- CORS de produção baseado em origens configuradas.
- Arquivo privado `config.php` não incluído no pacote.

## Instalação

Mantenha a estrutura `frontend/` e `php-backend/`. Configure o ambiente PHP/MySQL a partir de `php-backend/config/config.example.php`, criando o arquivo privado `php-backend/config/config.php` somente no servidor.

A URL da API agora é descoberta pela localização do frontend (`../php-backend`), funcionando quando `frontend/` e `php-backend/` ficam lado a lado no Apache/XAMPP. Em uma hospedagem com estrutura diferente, defina `window.PETISQUEIRA_API_URL` antes de carregar `js/api.js`. Não abra as páginas diretamente com `file://`; use Apache/PHP.

Antes de publicar, faça backup do banco, aplique as migrações necessárias e valide o ambiente Apache/PHP/MySQL. O pagamento real, envio de e-mails e idempotência persistida dos endpoints de criação ainda precisam ser configurados/homologados.

## Melhorias de interface aplicadas

A reserva deixou de usar `alert()` para erros e sucesso. O formulário agora mostra o feedback no próprio fluxo, preserva foco no campo com problema, mostra estado de envio e aplica máscara `(47) 99999-9999` enquanto o telefone é digitado. A validação de autoridade permanece no PHP, que normaliza e valida o telefone no servidor.

A tela de login administrativo recebeu um visual mais leve, com paleta quente discreta, cartão central, tipografia simples e mensagem de erro dentro do formulário. Nenhuma biblioteca nova ou tecnologia adicional foi adicionada.
