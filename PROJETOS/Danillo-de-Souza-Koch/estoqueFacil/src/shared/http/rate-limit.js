import rateLimit from "express-rate-limit";

function tooManyRequests(message) {
  return (request, response, next, options) => {
    response.status(options.statusCode).json({ error: message });
  };
}

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: tooManyRequests("Muitas tentativas de login. Aguarde 15 minutos e tente de novo"),
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: tooManyRequests(
    "Muitos cadastros a partir deste endereco. Tente novamente mais tarde"
  ),
});
