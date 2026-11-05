// Guarda a sessao do usuario no navegador.
// Nenhuma tela mexe no localStorage direto: todo mundo passa por aqui.
// Este arquivo nao importa nada de proposito: api.js importa auth.js,
// entao auth.js nao pode importar api.js (ciclo entre modulos).

// O prefixo evita colisao com outros projetos na mesma porta.
const TOKEN_KEY = "estoque-facil:token";
const USER_KEY = "estoque-facil:user";

export const LOGIN_PAGE = "/login.html";
export const HOME_PAGE = "/index.html";

export function saveSession({ token, user }) {
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
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated() {
  return Boolean(getToken());
}

// Porteiro das telas internas: sem token, nem carrega a pagina.
// Devolve false para a tela poder parar o que estava fazendo.
// ATENCAO: isto e conveniencia, nao seguranca. So olha se EXISTE um
// token; quem confere a assinatura e o servidor.
export function requireAuth() {
  if (isAuthenticated()) {
    return true;
  }

  // replace (e nao href): o "voltar" nao devolve o usuario para ca.
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

// Sair = apagar o token. O servidor nao guarda sessao, entao nao ha
// nada para avisar a ele.
export function logout() {
  clearSession();
  window.location.replace(LOGIN_PAGE);
}
