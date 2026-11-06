import rateLimit from "express-rate-limit";
const options = {
  standardHeaders: "draft-7",
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
};
export const loginLimiter = rateLimit({
  ...options,
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  message: {
    error: "Muitas tentativas de login. Aguarde 15 minutos e tente de novo",
  },
});
export const registerLimiter = rateLimit({
  ...options,
  windowMs: 60 * 60 * 1000,
  limit: 20,
  message: { error: "Muitos cadastros. Aguarde uma hora" },
});
export const resetLimiter = rateLimit({
  ...options,
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: { error: "Muitas solicitacoes. Aguarde 15 minutos" },
});
