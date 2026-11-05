import rateLimit from "express-rate-limit";

// Responde no MESMO formato de todos os erros da API: { "error": "..." }.
// Assim o api.js do front mostra a mensagem sem precisar de nada novo.
function tooManyRequests(message) {
  return (request, response, next, options) => {
    response.status(options.statusCode).json({ error: message });
  };
}

// Login: 5 tentativas ERRADAS a cada 15 minutos, por IP (Aula 67).
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  // Login que deu certo nao gasta tentativa: so os erros contam.
  skipSuccessfulRequests: true,
  // Cabecalhos "RateLimit" padronizados, que dizem quantas restam.
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: tooManyRequests(
    "Muitas tentativas de login. Aguarde 15 minutos e tente de novo"
  ),
});

// Cadastro: 10 contas por hora, por IP. Impede encher o banco de contas falsas.
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: tooManyRequests(
    "Muitos cadastros a partir deste endereco. Tente novamente mais tarde"
  ),
});
