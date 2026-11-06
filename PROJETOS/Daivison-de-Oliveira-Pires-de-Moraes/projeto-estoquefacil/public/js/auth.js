// Guarda a sessao do usuario no navegador.
// Nenhuma tela mexe no localStorage direto: todo mundo passa por aqui.

const TOKEN_KEY = "estoque-facil:token";
const USER_KEY = "estoque-facil:user";

export const LOGIN_PAGE = "/login.html";
export const HOME_PAGE = "/index.html";

export function saveSession({ token, user, refreshToken }) {
  if (refreshToken) localStorage.setItem("estoque-facil:refresh", refreshToken);
  localStorage.setItem(TOKEN_KEY, token);
  // localStorage so guarda texto: objeto precisa virar JSON.
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    // Se alguem editou o localStorage na mao, nao quebramos a tela.
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem("estoque-facil:refresh");
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated() {
  return Boolean(getToken());
}

// Porteiro das telas internas: sem token, nem carrega a pagina.
// Devolve false para a tela poder parar o que estava fazendo.
export function requireAuth() {
  if (isAuthenticated()) {
    return true;
  }

  window.location.replace(LOGIN_PAGE);

  return false;
}

// O contrario: quem ja esta logado nao precisa ver login/cadastro.
export function redirectIfAuthenticated() {
  if (isAuthenticated()) {
    window.location.replace(HOME_PAGE);

    return true;
  }

  return false;
}

export function logout() {
  const refreshToken = localStorage.getItem("estoque-facil:refresh");
  fetch("/api/auth/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    keepalive: true,
  }).catch(() => {});
  clearSession();
  window.location.replace(LOGIN_PAGE);
}
