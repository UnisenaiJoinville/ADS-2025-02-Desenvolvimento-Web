import * as service from "./auth-service.js";

export async function register(request, response) {
  const result = await service.register(request.body);

  response.status(201).json(result);
}

export async function login(request, response) {
  const result = await service.login(request.body);

  response.json(result);
}

// Devolve os dados do usuario logado (usa o middleware de autenticacao).
export async function me(request, response) {
  response.json(request.user);
}
