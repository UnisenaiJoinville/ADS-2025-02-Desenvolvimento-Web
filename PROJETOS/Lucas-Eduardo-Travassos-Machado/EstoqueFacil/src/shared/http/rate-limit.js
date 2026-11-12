import { rateLimit } from "express-rate-limit";

const handler = (message) => (request, response) =>
  response.status(429).json({ error: message });

// Uma instancia da API, contadores em memoria. Reiniciar zera a janela.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: handler(
    "Muitas tentativas de login. Aguarde 15 minutos e tente de novo",
  ),
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: handler(
    "Muitos cadastros a partir deste endereco. Tente novamente mais tarde",
  ),
});
