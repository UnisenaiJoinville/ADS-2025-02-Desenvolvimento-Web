import * as service from "./auth-service.js";

export async function register(request, response) {
  const result = await service.registerUser(request.body);

  // 201 Created: um recurso novo passou a existir.
  response.status(201).json(result);
}

export async function login(request, response) {
  const result = await service.loginUser(request.body);

  response.json(result);
}

// request.user foi preenchido pelo middleware ensureAuthenticated.
export async function profile(request, response) {
  const user = await service.getProfile(request.user.id);

  response.json(user);
}