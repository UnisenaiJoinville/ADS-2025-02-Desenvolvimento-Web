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

export async function refresh(req, res) {
  res.json(await service.refreshSession(req.body));
}
export async function logout(req, res) {
  await service.endSession(req.body);
  res.status(204).send();
}
export async function updateProfile(req, res) {
  res.json(await service.updateProfile(req.user.id, req.body));
}
export async function password(req, res) {
  await service.changePassword(req.user.id, req.body);
  res.status(204).send();
}
export async function forgot(req, res) {
  res.json(await service.forgotPassword(req.body));
}
export async function reset(req, res) {
  await service.resetPassword(req.body);
  res.status(204).send();
}
